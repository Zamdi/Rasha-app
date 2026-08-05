require('dotenv').config();
const router = require('express').Router();
const { logActivity } = require('../utils/activity');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db/pool');
const { adminMiddleware, superAdminMiddleware, requirePermission } = require('../middleware/auth');

// ── POST /api/admin/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
  const conn = await pool.getConnection();
  try {
    const [[admin]] = await conn.query(
      'SELECT * FROM admins WHERE username=? AND is_active=1', [username.trim().toLowerCase()]
    );
    if (!admin) return res.status(401).json({ error: 'Invalid credentials.' });
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    let permissions = {};
    try { permissions = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : (admin.permissions || {}); } catch {}

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: 'admin', adminRole: admin.role, permissions },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({ token, username: admin.username, role: admin.role, displayName: admin.display_name || admin.username, permissions });
  } catch (err) { res.status(500).json({ error: 'Login failed.' }); }
  finally { conn.release(); }
});

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[{ totalCustomers }]] = await conn.query('SELECT COUNT(*) AS totalCustomers FROM customers');
    const [[{ totalBookings  }]] = await conn.query("SELECT COUNT(*) AS totalBookings FROM bookings WHERE status!='cancelled'");
    const [[{ totalStamps    }]] = await conn.query('SELECT COALESCE(SUM(total_washes),0) AS totalStamps FROM customers');
    const [[{ freeWashesUsed }]] = await conn.query('SELECT COALESCE(SUM(free_washes_used),0) AS freeWashesUsed FROM customers');
    const [recentBookings] = await conn.query(
      "SELECT b.booking_uid,b.service_type,b.booking_date,b.booking_time,b.status,COALESCE(b.guest_name,CONCAT(c.first_name,' ',c.last_name)) AS guest_name FROM bookings b LEFT JOIN customers c ON b.customer_id=c.id ORDER BY b.created_at DESC LIMIT 5");
    res.json({ totalCustomers, totalBookings, totalStamps, freeWashesUsed, recentBookings });
  } catch (err) { res.status(500).json({ error: 'Could not fetch stats.' }); }
  finally { conn.release(); }
});

// ── GET /api/admin/customers ──────────────────────────────────
router.get('/customers', adminMiddleware, requirePermission('view_customers'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { search } = req.query;
    let rows;
    if (search) {
      const like = `%${search}%`;
      [rows] = await conn.query(
        "SELECT c.*,(SELECT COUNT(*) FROM bookings b WHERE b.customer_id=c.id) AS booking_count FROM customers c WHERE c.customer_uid LIKE ? OR CONCAT(c.first_name,' ',c.last_name) LIKE ? OR c.phone LIKE ? OR c.email LIKE ? ORDER BY c.created_at DESC",
        [like, like, like, like]);
    } else {
      [rows] = await conn.query(
        'SELECT c.*,(SELECT COUNT(*) FROM bookings b WHERE b.customer_id=c.id) AS booking_count FROM customers c ORDER BY c.created_at DESC');
    }
    res.json({ customers: rows.map(({ password_hash, ...c }) => c) });
  } catch { res.status(500).json({ error: 'Could not fetch customers.' }); }
  finally { conn.release(); }
});

// ── GET /api/admin/customers/:uid ────────────────────────────
router.get('/customers/:uid', adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[c]] = await conn.query(
      'SELECT c.*,(SELECT COUNT(*) FROM bookings b WHERE b.customer_id=c.id) AS booking_count FROM customers c WHERE c.customer_uid=?',
      [req.params.uid.toUpperCase().trim()]);
    if (!c) return res.status(404).json({ error: 'Customer not found.' });
    const { password_hash, ...customer } = c;
    res.json({ customer });
  } catch { res.status(500).json({ error: 'Could not fetch customer.' }); }
  finally { conn.release(); }
});

// ── POST /api/admin/customers ─────────────────────────────────
router.post('/customers', adminMiddleware, requirePermission('edit_customers'), async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName || !lastName || !email || !phone || !password)
    return res.status(400).json({ error: 'All fields required.' });

  const V = require('../utils/validate');
  const cleanEmail = V.normalizeEmail(email);
  const cleanPhone = V.normalizePhone(phone);
  const fName = V.clean(firstName, 60);
  const lName = V.clean(lastName, 60);
  if (!V.isEmail(cleanEmail))  return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!cleanPhone)             return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (!V.isName(fName))        return res.status(400).json({ error: 'Please enter a valid first name.' });
  if (!V.isName(lName))        return res.status(400).json({ error: 'Please enter a valid last name.' });
  const pwIssue = V.passwordIssue(password);
  if (pwIssue) return res.status(400).json({ error: pwIssue });

  const conn = await pool.getConnection();
  try {
    const [[{ maxUid }]] = await conn.query("SELECT COALESCE(MAX(CAST(SUBSTRING(customer_uid,4) AS UNSIGNED)),0) AS maxUid FROM customers");
    const uid = 'RW-' + String(maxUid + 1).padStart(5, '0');
    const hash = await bcrypt.hash(password, 10);
    await conn.query(
      'INSERT INTO customers (customer_uid,first_name,last_name,email,phone,password_hash) VALUES (?,?,?,?,?,?)',
      [uid, fName, lName, cleanEmail, cleanPhone, hash]
    );
    const [[c]] = await conn.query('SELECT * FROM customers WHERE customer_uid=?', [uid]);
    const { password_hash, ...customer } = c;
    res.status(201).json({ customer });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered.' });
    res.status(500).json({ error: 'Could not create customer.' });
  } finally { conn.release(); }
});

// ── PATCH /api/admin/customers/:uid ──────────────────────────
router.patch('/customers/:uid', adminMiddleware, requirePermission('edit_customers'), async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  const V = require('../utils/validate');
  const conn = await pool.getConnection();
  try {
    const [[c]] = await conn.query('SELECT id FROM customers WHERE customer_uid=?', [req.params.uid.toUpperCase().trim()]);
    if (!c) return res.status(404).json({ error: 'Customer not found.' });
    const updates = []; const values = [];
    if (firstName !== undefined) {
      const fName = V.clean(firstName, 60);
      if (!V.isName(fName)) return res.status(400).json({ error: 'Please enter a valid first name.' });
      updates.push('first_name=?'); values.push(fName);
    }
    if (lastName !== undefined) {
      const lName = V.clean(lastName, 60);
      if (!V.isName(lName)) return res.status(400).json({ error: 'Please enter a valid last name.' });
      updates.push('last_name=?'); values.push(lName);
    }
    if (email !== undefined) {
      const cleanEmail = V.normalizeEmail(email);
      if (!V.isEmail(cleanEmail)) return res.status(400).json({ error: 'Please enter a valid email address.' });
      updates.push('email=?'); values.push(cleanEmail);
    }
    if (phone !== undefined) {
      const cleanPhone = V.normalizePhone(phone);
      if (!cleanPhone) return res.status(400).json({ error: 'Please enter a valid phone number.' });
      updates.push('phone=?'); values.push(cleanPhone);
    }
    if (password) {
      const pwIssue = V.passwordIssue(password);
      if (pwIssue) return res.status(400).json({ error: pwIssue });
      updates.push('password_hash=?'); values.push(await bcrypt.hash(password, 10));
    }
    if (updates.length) { values.push(c.id); await conn.query(`UPDATE customers SET ${updates.join(',')} WHERE id=?`, values); }
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already in use.' });
    res.status(500).json({ error: 'Could not update customer.' });
  } finally { conn.release(); }
});

// ── DELETE /api/admin/customers/:uid ─────────────────────────
router.delete('/customers/:uid', adminMiddleware, requirePermission('delete_customers'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[c]] = await conn.query('SELECT id,first_name,last_name,email,phone FROM customers WHERE customer_uid=?', [req.params.uid.toUpperCase().trim()]);
    if (!c) return res.status(404).json({ error: 'Customer not found.' });
    await conn.query('DELETE FROM customers WHERE id=?', [c.id]);
    // Log before responding — this is the only remaining record once the row is gone.
    await logActivity(req, 'delete_customer', 'customer', req.params.uid.toUpperCase().trim(),
      `Deleted customer ${c.first_name} ${c.last_name} (${req.params.uid.toUpperCase().trim()}) — ${c.email || 'no email'}, ${c.phone || 'no phone'}`);
    res.json({ success: true, message: `${c.first_name} has been removed.` });
  } catch (err) {
    console.error('[DELETE-CUSTOMER]', err.message);
    res.status(500).json({ error: 'Could not delete customer.' });
  } finally { conn.release(); }
});

// ── POST /api/admin/customers/:uid/mark-wash ─────────────────
router.post('/customers/:uid/mark-wash', adminMiddleware, requirePermission('mark_wash'), async (req, res) => {
  const { forceRescan } = req.body; // super_admin can force rescan
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[c]] = await conn.query('SELECT * FROM customers WHERE customer_uid=? FOR UPDATE', [req.params.uid.toUpperCase().trim()]);
    if (!c) { await conn.rollback(); return res.status(404).json({ error: 'Customer not found.' }); }
    if (!c.is_active) { await conn.rollback(); return res.status(403).json({ error: 'Account suspended.' }); }

    // ── QR Scan cooldown check (24h) ─────────────────────────
    if (c.last_scanned_at) {
      const lastScan  = new Date(c.last_scanned_at);
      const hoursSince = (Date.now() - lastScan.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        if (!forceRescan || req.adminRole !== 'super_admin') {
          await conn.rollback();
          const nextScan = new Date(lastScan.getTime() + 24 * 60 * 60 * 1000);
          return res.status(429).json({
            error: `QR already used. Next scan available at ${nextScan.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} today.`,
            nextScanAt: nextScan.toISOString(),
            hoursSince: Math.round(hoursSince),
            canForce: req.adminRole === 'super_admin',
          });
        }
      }
    }

    const stampsBefore = c.stamps;
    let stampsAfter, earnedFree, isFreeWash;
    if (c.stamps >= 5) {
      isFreeWash = true; earnedFree = false; stampsAfter = 0;
    } else {
      isFreeWash = false; stampsAfter = c.stamps + 1; earnedFree = stampsAfter >= 5;
    }
    const newTotal = c.total_washes + 1;

    await conn.query(
      'UPDATE customers SET stamps=?,total_washes=?,last_scanned_at=NOW() WHERE id=?',
      [stampsAfter, newTotal, c.id]
    );
    if (isFreeWash) await conn.query('UPDATE customers SET free_washes_used=free_washes_used+1 WHERE id=?', [c.id]);
    await conn.query(
      'INSERT INTO wash_visits (customer_id,stamps_before,stamps_after,is_free_wash,marked_by) VALUES (?,?,?,?,?)',
      [c.id, stampsBefore, stampsAfter, isFreeWash ? 1 : 0, req.adminUsername || 'admin']
    );
    await conn.commit();

    let message;
    if (isFreeWash)    message = `Free wash used for ${c.first_name}. Stamps reset to 0.`;
    else if (earnedFree) message = `${c.first_name} has earned a FREE wash! Mark wash again to redeem.`;
    else               message = `Wash marked for ${c.first_name}. Stamps: ${stampsAfter}/5`;

    res.json({ success: true, stampsNow: stampsAfter, totalWashes: newTotal, earnedFreeWash: earnedFree, usedFreeWash: isFreeWash, message });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Could not mark wash visit.' });
  } finally { conn.release(); }
});

// ── PATCH /api/admin/customers/:uid/stamps ───────────────────
router.patch('/customers/:uid/stamps', adminMiddleware, async (req, res) => {
  const { newValue, reason } = req.body;
  if (typeof newValue !== 'number' || newValue < 0 || newValue > 99)
    return res.status(400).json({ error: 'newValue must be 0-99.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[c]] = await conn.query('SELECT * FROM customers WHERE customer_uid=? FOR UPDATE', [req.params.uid.toUpperCase().trim()]);
    if (!c) { await conn.rollback(); return res.status(404).json({ error: 'Customer not found.' }); }
    await conn.query('UPDATE customers SET stamps=? WHERE id=?', [newValue, c.id]);
    await conn.query('INSERT INTO stamp_adjustments (customer_id,old_value,new_value,adjusted_by,reason) VALUES (?,?,?,?,?)',
      [c.id, c.stamps, newValue, req.adminUsername || 'admin', reason || null]);
    await conn.commit();
    res.json({ success: true, stampsNow: newValue });
  } catch { await conn.rollback(); res.status(500).json({ error: 'Could not adjust stamps.' }); }
  finally { conn.release(); }
});

// ── PATCH /api/admin/customers/:uid/toggle-access ────────────
router.patch('/customers/:uid/toggle-access', adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('UPDATE customers SET is_active=NOT is_active WHERE customer_uid=?', [req.params.uid.toUpperCase().trim()]);
    const [[c]] = await conn.query('SELECT customer_uid,first_name,is_active FROM customers WHERE customer_uid=?', [req.params.uid.toUpperCase().trim()]);
    if (!c) return res.status(404).json({ error: 'Customer not found.' });
    await logActivity(req, c.is_active ? 'restore_customer' : 'suspend_customer', 'customer', c.customer_uid, `${c.is_active ? 'Restored' : 'Suspended'} account for ${c.first_name} ${c.last_name} (${c.customer_uid})`);
    res.json({ customerId: c.customer_uid, isActive: !!c.is_active, message: `${c.first_name}'s account has been ${c.is_active ? 'restored' : 'suspended'}.` });
  } catch { res.status(500).json({ error: 'Could not update account.' }); }
  finally { conn.release(); }
});

// ── PATCH /api/admin/customers/:uid/reset-scan ───────────────
// Super admin only — force reset the 24h cooldown
router.patch('/customers/:uid/reset-scan', superAdminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('UPDATE customers SET last_scanned_at=NULL WHERE customer_uid=?', [req.params.uid.toUpperCase().trim()]);
    res.json({ success: true, message: 'Scan cooldown reset. Customer can be scanned immediately.' });
  } catch { res.status(500).json({ error: 'Could not reset scan.' }); }
  finally { conn.release(); }
});

// ── GET /api/admin/bookings ───────────────────────────────────
router.get('/bookings', adminMiddleware, requirePermission('view_bookings'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [bookings] = await conn.query(
      "SELECT b.*,COALESCE(b.guest_name,CONCAT(c.first_name,' ',c.last_name)) AS customer_name,COALESCE(b.guest_phone,c.phone) AS customer_phone,c.customer_uid FROM bookings b LEFT JOIN customers c ON b.customer_id=c.id ORDER BY b.booking_date DESC,b.booking_time");
    res.json({ bookings });
  } catch { res.status(500).json({ error: 'Could not fetch bookings.' }); }
  finally { conn.release(); }
});

// ── PATCH /api/admin/bookings/:id/cancel ─────────────────────
router.patch('/bookings/:id/cancel', adminMiddleware, requirePermission('cancel_bookings'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.query("UPDATE bookings SET status='cancelled' WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Could not cancel booking.' }); }
  finally { conn.release(); }
});

// ── GET /api/admin/customers/:uid/cars ───────────────────────
router.get('/customers/:uid/cars', adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[customer]] = await conn.query('SELECT id FROM customers WHERE customer_uid=?', [req.params.uid.toUpperCase().trim()]);
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });
    const [cars] = await conn.query('SELECT * FROM customer_cars WHERE customer_id=? ORDER BY created_at ASC', [customer.id]);
    res.json({ cars });
  } catch { res.status(500).json({ error: 'Could not fetch cars.' }); }
  finally { conn.release(); }
});

// ── PATCH /api/admin/cars/:id/verify ─────────────────────────
router.patch('/cars/:id/verify', adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('UPDATE customer_cars SET is_verified=1 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Could not verify car.' }); }
  finally { conn.release(); }
});

// ════════════════════════════════════════════════════════════
// STAFF MANAGEMENT (super_admin only)
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/staff/me ────────────────────────────────────
router.get('/staff/me', adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [[admin]] = await conn.query('SELECT id,username,display_name,role,permissions FROM admins WHERE id=?', [req.adminId]);
    if (!admin) return res.status(404).json({ error: 'Not found.' });
    let permissions = {};
    try { permissions = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions||'{}') : (admin.permissions||{}) } catch {}
    res.json({ role: admin.role, displayName: admin.display_name, permissions });
  } catch { res.status(500).json({ error: 'Server error.' }); }
  finally { conn.release(); }
});

// ── GET /api/admin/staff ──────────────────────────────────────
router.get('/staff', superAdminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT id,username,display_name,role,permissions,is_active,created_at FROM admins ORDER BY role DESC,created_at ASC"
    );
    // Mark the original admin (lowest id among super_admins) as protected
    const superAdmins = rows.filter(r => r.role === 'super_admin')
    const originalId = superAdmins.length > 0 ? Math.min(...superAdmins.map(r => r.id)) : null
    const enriched = rows.map(r => ({ ...r, is_original: r.id === originalId }))
    res.json({ staff: enriched });
  } catch { res.status(500).json({ error: 'Could not fetch staff.' }); }
  finally { conn.release(); }
});

// ── POST /api/admin/staff ─────────────────────────────────────
router.post('/staff', superAdminMiddleware, async (req, res) => {
  const { username, password, displayName, role = 'staff', permissions } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
  const allowedRoles = ['staff', 'super_admin'];
  if (!allowedRoles.includes(role)) return res.status(400).json({ error: 'Invalid role.' });
  const conn = await pool.getConnection();
  try {
    const hash = await bcrypt.hash(password, 10);
    // super_admin gets all permissions (empty object = all via isSuperAdmin check)
    const perms = role === 'super_admin' ? {} : (permissions || {});
    await conn.query(
      'INSERT INTO admins (username,password_hash,role,display_name,permissions) VALUES (?,?,?,?,?)',
      [username.trim().toLowerCase(), hash, role, displayName || username, JSON.stringify(perms)]
    );
    res.status(201).json({ success: true, message: `${role === 'super_admin' ? 'Super admin' : 'Staff member'} ${username} created.` });
    await logActivity(req, 'create_staff', 'staff', username, `Created ${role} account: ${displayName || username}`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username already taken.' });
    res.status(500).json({ error: 'Could not create staff member.' });
  } finally { conn.release(); }
});

// ── PATCH /api/admin/staff/:id ────────────────────────────────
router.patch('/staff/:id', superAdminMiddleware, async (req, res) => {
  const { displayName, password, permissions, isActive, role } = req.body;
  const conn = await pool.getConnection();
  try {
    // Find the target admin
    const [[target]] = await conn.query('SELECT id,role FROM admins WHERE id=?', [req.params.id]);
    if (!target) return res.status(404).json({ error: 'Admin not found.' });

    // Find the original super_admin (lowest id among super_admins)
    const [[{ minId }]] = await conn.query("SELECT MIN(id) AS minId FROM admins WHERE role='super_admin'");
    const isOriginal = target.id === minId;

    // Original super_admin cannot be demoted or have role changed
    if (isOriginal && role && role !== 'super_admin') {
      return res.status(403).json({ error: 'Cannot change the role of the original super admin.' });
    }

    // The requester's id — non-original super_admin cannot edit another super_admin
    const requesterId = req.adminId;
    if (target.role === 'super_admin' && requesterId !== minId && target.id !== requesterId) {
      return res.status(403).json({ error: 'Only the original super admin can edit other super admins.' });
    }

    const updates = []; const values = [];
    if (displayName !== undefined)  { updates.push('display_name=?');  values.push(displayName); }
    if (password)                   { updates.push('password_hash=?'); values.push(await bcrypt.hash(password, 10)); }
    if (permissions !== undefined && role !== 'super_admin')  { updates.push('permissions=?'); values.push(JSON.stringify(permissions)); }
    if (isActive !== undefined)     { updates.push('is_active=?');     values.push(isActive ? 1 : 0); }
    if (role !== undefined && !isOriginal) { updates.push('role=?');   values.push(role); }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });
    values.push(req.params.id);
    await conn.query(`UPDATE admins SET ${updates.join(',')} WHERE id=?`, values);
    await logActivity(req, 'edit_staff', 'staff', req.params.id, `Updated staff #${req.params.id}`);
    res.json({ success: true });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    res.status(500).json({ error: 'Could not update staff member.' });
  }
  finally { conn.release(); }
});

// ── DELETE /api/admin/staff/:id ───────────────────────────────
router.delete('/staff/:id', superAdminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // Find target
    const [[target]] = await conn.query('SELECT id,role FROM admins WHERE id=?', [req.params.id]);
    if (!target) return res.status(404).json({ error: 'Admin not found.' });

    // Find original super_admin (lowest id)
    const [[{ minId }]] = await conn.query("SELECT MIN(id) AS minId FROM admins WHERE role='super_admin'");

    // Nobody can delete the original super_admin
    if (target.id === minId) {
      return res.status(403).json({ error: 'The original super admin cannot be deleted.' });
    }

    // Only the original super_admin can delete another super_admin
    const requesterId = req.adminId;
    if (target.role === 'super_admin' && requesterId !== minId) {
      return res.status(403).json({ error: 'Only the original super admin can remove other super admins.' });
    }

    await conn.query('DELETE FROM admins WHERE id=?', [req.params.id]);
    await logActivity(req, 'delete_staff', 'staff', req.params.id, `Deleted staff #${req.params.id}`);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Could not delete staff member.' }); }
  finally { conn.release(); }
});

module.exports = router;
