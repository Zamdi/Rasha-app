require('dotenv').config();
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const V = require('../utils/validate');
const pool   = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

// Generate slots from 11:00 AM to 11:30 PM in 30-minute steps
const ALL_SLOTS = [];
for (let h = 11; h <= 23; h++) {
  for (const m of [0, 30]) {
    if (h === 23 && m === 30) break; // stop at 11:30 PM
    const hour12 = h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const minStr = m === 0 ? '00' : '30';
    ALL_SLOTS.push(`${hour12}:${minStr} ${ampm}`);
  }
}
// ALL_SLOTS: ['11:00 AM','11:30 AM','12:00 PM','12:30 PM',...,'11:00 PM','11:30 PM']

/** Parse a slot string like "2:30 PM" into minutes since midnight. */
function slotToMinutes(slot) {
  const m = slot.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const pm = m[3].toUpperCase() === 'PM';
  if (pm && h !== 12) h += 12;
  if (!pm && h === 12) h = 0;
  return h * 60 + min;
}

async function nextBookingUid(conn) {
  const [[{ maxId }]] = await conn.query('SELECT COALESCE(MAX(id), 0) AS maxId FROM bookings');
  return 'BK-' + String(Number(maxId) + 1).padStart(5, '0');
}

router.get('/slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date is required.' });
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT booking_time FROM bookings WHERE booking_date = ? AND status != 'cancelled'", [date]);
    const booked = rows.map(r => r.booking_time);

    const nowKhartoum = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const todayKhartoum = nowKhartoum.toISOString().slice(0, 10); // YYYY-MM-DD
    const nowMinutes = nowKhartoum.getUTCHours() * 60 + nowKhartoum.getUTCMinutes() + 30;

    // A date already in the past has no bookable slots at all.
    if (date < todayKhartoum) {
      return res.json({ date, booked, available: [], past: true });
    }

    // For today, drop slots that have already passed (30-min preparation buffer).
    const available = ALL_SLOTS.filter(slot => {
      if (booked.includes(slot)) return false;
      if (date === todayKhartoum && slotToMinutes(slot) <= nowMinutes) return false;
      return true;
    });

    res.json({ date, booked, available });
  } catch (err) {
    console.error('[SLOTS]', err.message);
    res.status(500).json({ error: 'Could not fetch slots.' });
  } finally { conn.release(); }
});

const SERVICE_PRICES = { full: 8500, outside: 5000 }

router.post('/', async (req, res) => {
  const { name, phone, email, vehicle, service, date, time, payFromWallet } = req.body;
  if (!name || !phone || !service || !date || !time)
    return res.status(400).json({ error: 'name, phone, service, date and time are required.' });
  if (!['full','outside'].includes(service))
    return res.status(400).json({ error: 'Invalid service type.' });
  if (!ALL_SLOTS.includes(time))
    return res.status(400).json({ error: 'Invalid time slot.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))
    return res.status(400).json({ error: 'Invalid date.' });

  // Reject bookings in the past. /slots only filters what is *displayed* —
  // this is the check that actually enforces it, since a client can post
  // any date/time directly.
  const nowKhartoum   = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const todayKhartoum = nowKhartoum.toISOString().slice(0, 10);
  if (date < todayKhartoum)
    return res.status(400).json({ error: 'Cannot book a date in the past.' });
  if (date === todayKhartoum) {
    const nowMinutes = nowKhartoum.getUTCHours() * 60 + nowKhartoum.getUTCMinutes() + 30;
    if (slotToMinutes(time) <= nowMinutes)
      return res.status(400).json({ error: 'That time slot has already passed. Please choose a later time.' });
  }

  // Sanitize everything that will be written to the DB / shown to staff.
  const cleanName    = V.clean(name, 120);
  const cleanPhone   = V.normalizePhone(phone);
  const cleanEmail   = email ? V.normalizeEmail(email) : null;
  const cleanVehicle = vehicle ? V.clean(vehicle, 120) : null;
  if (!cleanName)  return res.status(400).json({ error: 'Please enter a valid name.' });
  if (!cleanPhone) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (cleanEmail && !V.isEmail(cleanEmail))
    return res.status(400).json({ error: 'Please enter a valid email address.' });

  let customerId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try { const d = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET); customerId = d.customerId; } catch (_) {}
  }

  const conn = await pool.getConnection();
  try {
    // Everything below is one transaction: either the slot is reserved AND the
    // wallet is charged, or nothing happens at all.
    await conn.beginTransaction();

    const price = SERVICE_PRICES[service] || 0;

    const [[taken]] = await conn.query(
      "SELECT id FROM bookings WHERE booking_date=? AND booking_time=? AND status!='cancelled' FOR UPDATE",
      [date, time]);
    if (taken) {
      await conn.rollback();
      return res.status(409).json({ error: 'This time slot has already been booked.' });
    }

    if (payFromWallet) {
      if (!customerId) {
        await conn.rollback();
        return res.status(401).json({ error: 'Sign in to pay from wallet.' });
      }
      // Lock the customer row so two concurrent bookings can't both pass the check.
      const [[cust]] = await conn.query(
        'SELECT wallet_balance FROM customers WHERE id=? FOR UPDATE', [customerId]);
      const balance = Number(cust?.wallet_balance || 0);
      if (balance < price) {
        await conn.rollback();
        return res.status(402).json({
          error: `Wallet balance insufficient. Your balance is ${balance.toLocaleString()} SDG, required: ${price.toLocaleString()} SDG.`,
          code: 'INSUFFICIENT_WALLET',
          balance, required: price
        });
      }
    }

    const uid = await nextBookingUid(conn);
    const [result] = await conn.query(
      'INSERT INTO bookings (booking_uid,customer_id,guest_name,guest_phone,guest_email,service_type,booking_date,booking_time,vehicle_info,payment_method) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [uid, customerId || null, cleanName, cleanPhone, cleanEmail, service, date, time, cleanVehicle, payFromWallet ? 'wallet' : 'cash']);

    let newBalance = null;
    if (payFromWallet && customerId) {
      // Guarded update: the WHERE clause re-checks the balance, so even in the
      // impossible case of a concurrent drain the balance can never go negative.
      const [upd] = await conn.query(
        'UPDATE customers SET wallet_balance = wallet_balance - ? WHERE id=? AND wallet_balance >= ?',
        [price, customerId, price]);
      if (upd.affectedRows !== 1) {
        await conn.rollback();
        return res.status(402).json({ error: 'Wallet balance insufficient.', code: 'INSUFFICIENT_WALLET' });
      }
      const [[cust2]] = await conn.query('SELECT wallet_balance FROM customers WHERE id=?', [customerId]);
      newBalance = Number(cust2?.wallet_balance || 0);

      // Append to the ledger (table created by db/evolve.js). Non-fatal if absent.
      try {
        await conn.query(
          `INSERT INTO wallet_transactions (customer_id, type, amount, balance_after, status, reference, note)
           VALUES (?, 'payment', ?, ?, 'completed', ?, ?)`,
          [customerId, -price, newBalance, `BOOKING-${uid}`, service === 'full' ? 'Full Wash' : 'Exterior Wash']);
      } catch (ledgerErr) {
        console.warn('[BOOKING] ledger write skipped:', ledgerErr.message);
      }
    }

    const [[booking]] = await conn.query('SELECT * FROM bookings WHERE id=?', [result.insertId]);
    await conn.commit();

    res.status(201).json({ booking, walletBalance: newBalance });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slot already taken.' });
    console.error('[BOOKING]', err.message);
    res.status(500).json({ error: 'Booking failed.' });
  } finally { conn.release(); }
});

router.get('/my', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [bookings] = await conn.query(
      `SELECT * FROM bookings WHERE customer_id=?
       ORDER BY booking_date ASC, booking_time ASC`, [req.customerId]);
    res.json({ bookings });
  } catch { res.status(500).json({ error: 'Could not fetch bookings.' }); }
  finally { conn.release(); }
});

module.exports = router;
