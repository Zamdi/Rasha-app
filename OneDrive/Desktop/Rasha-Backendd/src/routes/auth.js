require('dotenv').config();
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { generateOtp, maskEmail, sendOtpEmail } = require('../utils/email');
const V = require('../utils/validate');

const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS   = 5;

function safe(c) { const { password_hash, reset_token, reset_token_expires, ...rest } = c; return rest; }

function maskPhone(phone) {
  if (phone.length <= 4) return phone;
  const visible = phone.slice(-2);
  const prefix  = phone.slice(0, phone.length > 10 ? 4 : 3);
  const masked  = 'X'.repeat(phone.length - prefix.length - 2);
  return `${prefix}${masked}${visible}`;
}

async function nextCustomerUid(conn) {
  const [[{ maxId }]] = await conn.query('SELECT COALESCE(MAX(id), 0) AS maxId FROM customers');
  return 'RW-' + String(Number(maxId) + 1).padStart(5, '0');
}

// Per-email OTP throttle: max 3 codes per 15 minutes, min 45s between requests.
// IP-based limits alone are bypassable (VPN/mobile IP rotation) and punish shared IPs.
async function assertOtpQuota(conn, email) {
  const [[recent]] = await conn.query(
    `SELECT COUNT(*) AS cnt,
            TIMESTAMPDIFF(SECOND, MAX(created_at), UTC_TIMESTAMP()) AS since_last
     FROM otp_codes
     WHERE email = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL 15 MINUTE)`,
    [email]
  );
  if (recent.since_last !== null && recent.since_last < 45) {
    const wait = 45 - recent.since_last;
    const err = new Error(`Please wait ${wait} second${wait !== 1 ? 's' : ''} before requesting another code.`);
    err.status = 429;
    throw err;
  }
  if (Number(recent.cnt) >= 3) {
    const err = new Error('Too many codes requested. Please try again in 15 minutes.');
    err.status = 429;
    throw err;
  }
}

async function createAndSendOtp(conn, email, purpose) {
  await assertOtpQuota(conn, email);
  const code = generateOtp();
  await conn.query(
    'UPDATE otp_codes SET used = 1 WHERE email = ? AND purpose = ? AND used = 0',
    [email, purpose]
  );
  await conn.query(
    'INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))',
    [email, code, purpose, OTP_EXPIRY_MINUTES]
  );
  await sendOtpEmail(email, code, purpose);
  return { masked: maskEmail(email) };
}

async function verifyOtpCode(conn, email, code, purpose) {
  const [[otp]] = await conn.query(
    'SELECT *, (expires_at < UTC_TIMESTAMP()) AS is_expired FROM otp_codes WHERE email = ? AND purpose = ? AND used = 0 ORDER BY created_at DESC LIMIT 1',
    [email, purpose]
  );
  if (!otp) return { valid: false, error: 'No code found. Please request a new one.' };
  if (otp.is_expired) {
    await conn.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [otp.id]);
    return { valid: false, error: 'Code has expired. Please request a new one.' };
  }
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    await conn.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [otp.id]);
    return { valid: false, error: 'Too many attempts. Please request a new code.' };
  }
  if (String(otp.code) !== String(code)) {
    await conn.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otp.id]);
    const remaining = MAX_OTP_ATTEMPTS - otp.attempts - 1;
    return { valid: false, error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
  }
  await conn.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [otp.id]);
  return { valid: true };
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName || !lastName || !email || !phone || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  const cleanEmail = V.normalizeEmail(email);
  const cleanPhone = V.normalizePhone(phone);
  if (!V.isEmail(cleanEmail))  return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!cleanPhone)             return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (!V.isName(firstName))    return res.status(400).json({ error: 'Please enter a valid first name.' });
  if (!V.isName(lastName))     return res.status(400).json({ error: 'Please enter a valid last name.' });
  const pwIssue = V.passwordIssue(password);
  if (pwIssue) return res.status(400).json({ error: pwIssue });

  const conn = await pool.getConnection();
  try {
    const [[existingEmail]] = await conn.query('SELECT id FROM customers WHERE email = ?', [cleanEmail]);
    if (existingEmail) return res.status(409).json({ error: 'An account with this email already exists.' });
    const [[existingPhone]] = await conn.query('SELECT id FROM customers WHERE phone = ?', [cleanPhone]);
    if (existingPhone) return res.status(409).json({ error: 'An account with this phone number already exists.' });

    const { masked } = await createAndSendOtp(conn, cleanEmail, 'register');
    res.json({ step: 'otp', message: `A verification code was sent to ${masked}`, maskedEmail: masked });
  } catch (err) {
    if (err.status === 429) return res.status(429).json({ error: err.message });
    console.error('[REGISTER]', err.code || '', err.sqlMessage || err.message);
    res.status(500).json({ error: 'Could not send verification code. Please try again.' });
  } finally { conn.release(); }
});

router.post('/verify-register', async (req, res) => {
  const { firstName, lastName, email, phone, password, otp } = req.body;
  if (!firstName || !lastName || !email || !phone || !password || !otp)
    return res.status(400).json({ error: 'All fields are required.' });

  const cleanEmail = V.normalizeEmail(email);
  const cleanPhone = V.normalizePhone(phone);
  const fName = V.clean(firstName, 60);
  const lName = V.clean(lastName, 60);
  if (!V.isEmail(cleanEmail) || !cleanPhone || !V.isName(fName) || !V.isName(lName))
    return res.status(400).json({ error: 'Invalid registration details.' });
  const pwIssue2 = V.passwordIssue(password);
  if (pwIssue2) return res.status(400).json({ error: pwIssue2 });

  const conn = await pool.getConnection();
  try {
    const result = await verifyOtpCode(conn, cleanEmail, String(otp).trim(), 'register');
    if (!result.valid) return res.status(400).json({ error: result.error });

    const hash = await bcrypt.hash(password, 12);
    const uid  = await nextCustomerUid(conn);
    let insertResult;
    try {
      [insertResult] = await conn.query(
        'INSERT INTO customers (customer_uid,first_name,last_name,email,phone,password_hash,is_verified) VALUES (?,?,?,?,?,?,1)',
        [uid, fName, lName, cleanEmail, cleanPhone, hash]
      );
    } catch (e) {
      if (e.sqlMessage && e.sqlMessage.includes('is_verified')) {
        // Column doesn't exist, insert without it
        [insertResult] = await conn.query(
          'INSERT INTO customers (customer_uid,first_name,last_name,email,phone,password_hash) VALUES (?,?,?,?,?,?)',
          [uid, fName, lName, cleanEmail, cleanPhone, hash]
        );
      } else throw e;
    }
    const [[customer]] = await conn.query('SELECT * FROM customers WHERE id = ?', [insertResult.insertId]);
    const token = jwt.sign({ customerId: customer.id, uid: customer.customer_uid }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, customer: safe(customer) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Account already exists.' });
    if (err.status === 429) return res.status(429).json({ error: err.message });
    console.error('[VERIFY-REGISTER]', err.message, err.code, err.sqlMessage);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  } finally { conn.release(); }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password)
    return res.status(400).json({ error: 'Email/phone and password are required.' });

  const conn = await pool.getConnection();
  try {
    const id = identifier.trim().toLowerCase();
    const [[customer]] = await conn.query(
      'SELECT * FROM customers WHERE email = ? OR phone = ? LIMIT 1', [id, id]
    );
    if (!customer) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!customer.is_active) return res.status(403).json({ error: 'Account suspended.' });

    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const { masked } = await createAndSendOtp(conn, customer.email, 'login');
    res.json({
      step: 'otp',
      message: `A verification code was sent to ${masked}`,
      maskedEmail: masked,
      email: customer.email,
    });
  } catch (err) {
    if (err.status === 429) return res.status(429).json({ error: err.message });
    console.error('[LOGIN]', err.code || '', err.sqlMessage || err.message);
    res.status(500).json({ error: 'Could not send verification code. Please try again.' });
  } finally { conn.release(); }
});

router.post('/verify-login', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and code are required.' });

  const conn = await pool.getConnection();
  try {
    const result = await verifyOtpCode(conn, email.trim().toLowerCase(), otp.trim(), 'login');
    if (!result.valid) return res.status(400).json({ error: result.error });

    const [[customer]] = await conn.query('SELECT * FROM customers WHERE email = ? LIMIT 1', [V.normalizeEmail(email)]);
    if (!customer) return res.status(404).json({ error: 'Account not found.' });

    const token = jwt.sign({ customerId: customer.id, uid: customer.customer_uid }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, customer: safe(customer) });
  } catch (err) {
    if (err.status === 429) return res.status(429).json({ error: err.message });
    console.error('[VERIFY-LOGIN]', err.code || '', err.sqlMessage || err.message);
    res.status(500).json({ error: 'Verification failed.' });
  } finally { conn.release(); }
});

// ── RESEND OTP ────────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  const { email, purpose } = req.body;
  if (!email || !purpose) return res.status(400).json({ error: 'Email and purpose required.' });
  if (!['login', 'register'].includes(purpose)) return res.status(400).json({ error: 'Invalid purpose.' });

  const cleanEmail = V.normalizeEmail(email);
  if (!V.isEmail(cleanEmail)) return res.status(400).json({ error: 'Invalid email address.' });

  const conn = await pool.getConnection();
  try {
    // For login resend: the account must already exist. Silently succeed if not
    // so we don't reveal whether an email is registered.
    if (purpose === 'login') {
      const [[customer]] = await conn.query('SELECT id FROM customers WHERE email = ? LIMIT 1', [cleanEmail]);
      if (!customer) {
        return res.json({ message: `A new code was sent to ${maskEmail(cleanEmail)}`, maskedEmail: maskEmail(cleanEmail) });
      }
    }
    const { masked } = await createAndSendOtp(conn, cleanEmail, purpose);
    res.json({ message: `A new code was sent to ${masked}`, maskedEmail: masked });
  } catch (err) {
    if (err.status === 429) return res.status(429).json({ error: err.message });
    console.error('[RESEND-OTP]', err.code || '', err.sqlMessage || err.message);
    res.status(500).json({ error: 'Could not resend code. Please try again.' });
  } finally { conn.release(); }
});

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required.' });
  const conn = await pool.getConnection();
  try {
    const [[customer]] = await conn.query('SELECT id, email FROM customers WHERE email = ? LIMIT 1', [V.normalizeEmail(email)]);
    // Always respond success (don't reveal if email exists)
    if (customer) {
      const token = require('crypto').randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await conn.query('UPDATE customers SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, customer.id]);
      const frontendUrl = process.env.FRONTEND_URL || 'https://rashasd.com';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
      const { sendResetEmail } = require('../utils/email');
      await sendResetEmail(customer.email, resetUrl);
    }
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[FORGOT-PASSWORD]', err.message);
    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } finally { conn.release(); }
});

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required.' });
  const rpIssue = V.passwordIssue(password);
  if (rpIssue) return res.status(400).json({ error: rpIssue });
  const conn = await pool.getConnection();
  try {
    const [[customer]] = await conn.query(
      'SELECT id FROM customers WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1', [token]
    );
    if (!customer) return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    const hash = await bcrypt.hash(password, 12);
    await conn.query('UPDATE customers SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hash, customer.id]);
    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('[RESET-PASSWORD]', err.message);
    res.status(500).json({ error: 'Could not reset password.' });
  } finally { conn.release(); }
});

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required.' });
  const cpIssue = V.passwordIssue(newPassword);
  if (cpIssue) return res.status(400).json({ error: cpIssue });
  const conn = await pool.getConnection();
  try {
    const [[customer]] = await conn.query('SELECT * FROM customers WHERE id = ?', [req.customerId]);
    const valid = await bcrypt.compare(currentPassword, customer.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await conn.query('UPDATE customers SET password_hash = ? WHERE id = ?', [hash, req.customerId]);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[CHANGE-PASSWORD]', err.message);
    res.status(500).json({ error: 'Could not change password.' });
  } finally { conn.release(); }
});

// ── UPDATE PROFILE ─────────────────────────────────────────────────────────
router.patch('/me', authMiddleware, async (req, res) => {
  const { firstName, lastName, phone, avatar } = req.body;
  const conn = await pool.getConnection();
  try {
    const updates = []; const values = [];

    if (firstName !== undefined) {
      if (!V.isName(firstName)) return res.status(400).json({ error: 'Please enter a valid first name.' });
      updates.push('first_name=?'); values.push(V.clean(firstName, 60));
    }
    if (lastName !== undefined) {
      if (!V.isName(lastName)) return res.status(400).json({ error: 'Please enter a valid last name.' });
      updates.push('last_name=?'); values.push(V.clean(lastName, 60));
    }
    if (phone !== undefined) {
      const p = V.normalizePhone(phone);
      if (!p) return res.status(400).json({ error: 'Please enter a valid phone number.' });
      updates.push('phone=?'); values.push(p);
    }
    if (avatar !== undefined) {
      if (avatar !== null && !V.isDataImage(avatar))
        return res.status(400).json({ error: 'Invalid image. Use a JPEG/PNG/WebP under 3MB.' });
      updates.push('avatar_url=?'); values.push(avatar || null);
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
    values.push(req.customerId);
    await conn.query(`UPDATE customers SET ${updates.join(',')} WHERE id=?`, values);
    const [[customer]] = await conn.query('SELECT * FROM customers WHERE id=?', [req.customerId]);
    res.json({ customer: safe(customer) });
  } catch (err) {
    console.error('[UPDATE-PROFILE]', err.message);
    res.status(500).json({ error: 'Could not update profile.' });
  } finally { conn.release(); }
});

// ── DELETE ACCOUNT ─────────────────────────────────────────────────────────
router.delete('/me', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[c]] = await conn.query(
      'SELECT customer_uid, first_name, last_name, email, phone FROM customers WHERE id=?',
      [req.customerId]
    );
    await conn.query('DELETE FROM customers WHERE id=?', [req.customerId]);

    // Record the self-deletion. admin_id=0 is reserved to mean "no staff member
    // performed this" — it was the customer's own action, not an admin's.
    if (c) {
      try {
        await conn.query(
          `INSERT INTO staff_activity_log (admin_id, username, display_name, action, entity, entity_id, detail, ip)
           VALUES (0, ?, ?, 'delete_customer_self', 'customer', ?, ?, ?)`,
          [
            c.email || c.customer_uid,
            `${c.first_name} ${c.last_name} (self)`,
            c.customer_uid,
            `Customer deleted their own account: ${c.first_name} ${c.last_name} (${c.customer_uid}) — ${c.email || 'no email'}, ${c.phone || 'no phone'}`,
            req.ip || null,
          ]
        );
      } catch (logErr) {
        console.error('[activity log — self delete]', logErr.message);
      }
    }

    res.json({ message: 'Account deleted.' });
  } catch (err) {
    console.error('[DELETE-ACCOUNT]', err.message);
    res.status(500).json({ error: 'Could not delete account.' });
  } finally { conn.release(); }
});
router.get('/me', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[customer]] = await conn.query('SELECT * FROM customers WHERE id = ?', [req.customerId]);
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    res.json({ customer: safe(customer) });
  } catch { res.status(500).json({ error: 'Could not fetch profile.' }); }
  finally { conn.release(); }
});

module.exports = router;
