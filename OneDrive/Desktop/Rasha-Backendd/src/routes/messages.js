const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const jwt     = require('jsonwebtoken');
const { adminMiddleware } = require('../middleware/auth');
const V = require('../utils/validate');
const rateLimit = require('express-rate-limit');

// Contact form abuse guard: 5 messages / hour / IP
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { error: 'Too many messages sent. Please try again later.' }
});

// POST /api/messages — customer submits a support message
router.post('/', contactLimiter, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }

    const cleanName    = V.clean(name, 100);
    const cleanEmail   = V.normalizeEmail(email);
    const cleanSubject = V.clean(subject || 'General Inquiry', 120);
    const cleanMessage = V.cleanMultiline(message, 2000);

    if (!cleanName)              return res.status(400).json({ error: 'Please enter a valid name.' });
    if (!V.isEmail(cleanEmail))  return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (cleanMessage.length < 5) return res.status(400).json({ error: 'Message is too short.' });

    // Check if the sender is a logged-in customer (optional JWT)
    let isLoggedIn = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        if (decoded.customerId) isLoggedIn = true;
      } catch (_) {}
    }

    // Reference only for logged-in customers submitting a Booking Issue
    const isBookingIssue = cleanSubject.toLowerCase().includes('booking');
    const shouldGenerateRef = isLoggedIn && isBookingIssue;

    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        `INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
        [cleanName, cleanEmail, cleanSubject, cleanMessage]
      );
      const messageId = result.insertId;

      // Format: #RSH-000042 — matches [#RSH-n] token in reply email subjects
      const reference = shouldGenerateRef
        ? `#RSH-${String(messageId).padStart(6, '0')}`
        : null;

      if (reference) {
        await conn.execute('UPDATE messages SET reference = ? WHERE id = ?', [reference, messageId]);
      }

      res.status(201).json({ success: true, reference });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('[messages POST]', err.message);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

// GET /api/messages — staff retrieves all messages (admin only)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    let rows = [];
    try {
      [rows] = await conn.execute(
        `SELECT id, name, email, subject, message, is_read, created_at,
                reply_body, replied_at, replied_by, reference
         FROM messages
         ORDER BY created_at DESC
         LIMIT 100`
      );

      if (rows.length) {
        const ids = rows.map(r => r.id);
        const [items] = await conn.query(
          `SELECT id, message_id, direction, body, author, is_read, created_at
           FROM message_thread_items
           WHERE message_id IN (?)
           ORDER BY created_at ASC`, [ids]
        );
        const byMessage = new Map();
        for (const it of items) {
          if (!byMessage.has(it.message_id)) byMessage.set(it.message_id, []);
          byMessage.get(it.message_id).push(it);
        }
        rows = rows.map(r => {
          const thread = byMessage.get(r.id) || [];
          const unreadInbound = thread.filter(i => i.direction === 'inbound' && !i.is_read).length;
          const last = thread[thread.length - 1];
          return {
            ...r,
            thread,
            replyCount: thread.length,
            unreadInbound,
            // A thread needs attention if the original is unread, or the
            // customer has written back since we last replied.
            needsAttention: (!r.is_read) || unreadInbound > 0,
            lastDirection: last ? last.direction : null,
            lastActivity: last ? last.created_at : r.created_at,
          };
        });
      }
    } finally {
      conn.release();
    }
    res.json({ messages: rows });
  } catch (err) {
    console.error('[messages GET]', err.message);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// PATCH /api/messages/:id/read — mark message as read
router.patch('/:id/read', adminMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.execute(`UPDATE messages SET is_read = 1 WHERE id = ?`, [req.params.id]);
    } finally {
      conn.release();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message.' });
  }
});


// POST /api/messages/:id/reply — email the customer and append to the thread
router.post('/:id/reply', adminMiddleware, async (req, res) => {
  const body = V.cleanMultiline(req.body?.body, 4000);
  if (!body || body.length < 2) {
    return res.status(400).json({ error: 'Reply cannot be empty.' });
  }

  const conn = await pool.getConnection();
  try {
    const [[msg]] = await conn.query(
      'SELECT id, name, email, subject, message FROM messages WHERE id = ?', [req.params.id]
    );
    if (!msg) return res.status(404).json({ error: 'Message not found.' });
    if (!V.isEmail(msg.email)) {
      return res.status(400).json({ error: 'This message has no valid email address to reply to.' });
    }

    // Strip any existing token so subjects don't accumulate them across replies.
    const baseSubject = String(msg.subject || 'Your message to Rasha').replace(/\s*\[#RSH-\d+\]\s*$/i, '');

    // Send first — only record the reply if the email actually went out, so the
    // portal never shows a reply that failed to leave.
    const { sendReplyEmail } = require('../utils/email');
    await sendReplyEmail({
      to: msg.email,
      customerName: msg.name,
      originalMessage: msg.message,
      replyBody: body,
      subject: `Re: ${baseSubject} [#RSH-${msg.id}]`,
    });

    await conn.query(
      `INSERT INTO message_thread_items (message_id, direction, body, author)
       VALUES (?, 'outbound', ?, ?)`,
      [msg.id, body, req.adminUsername || 'staff']
    );

    // Replying implies you've read the thread.
    await conn.query('UPDATE messages SET is_read = 1 WHERE id = ?', [msg.id]);
    await conn.query(
      "UPDATE message_thread_items SET is_read = 1 WHERE message_id = ? AND direction = 'inbound'",
      [msg.id]
    );

    const thread = await loadThread(conn, msg.id);
    // Log the reply action
    try {
      const { logActivity } = require('../utils/activity');
      await logActivity(req, 'reply_message', 'message', msg.id, `Replied to message from ${msg.name} (${msg.email})`);
    } catch (_) {}
    res.json({ success: true, message: { ...msg, is_read: 1, thread, unreadInbound: 0, needsAttention: false } });
  } catch (err) {
    console.error('[messages REPLY]', err.message);
    res.status(500).json({ error: 'Could not send the reply. Please try again.' });
  } finally { conn.release(); }
});

// PATCH /api/messages/:id/thread-read — mark inbound items in a thread as read
router.patch('/:id/thread-read', adminMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('UPDATE messages SET is_read = 1 WHERE id = ?', [req.params.id]);
    await conn.query(
      "UPDATE message_thread_items SET is_read = 1 WHERE message_id = ? AND direction = 'inbound'",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[messages THREAD-READ]', err.message);
    res.status(500).json({ error: 'Failed to update message.' });
  } finally { conn.release(); }
});

async function loadThread(conn, messageId) {
  const [items] = await conn.query(
    `SELECT id, message_id, direction, body, author, is_read, created_at
     FROM message_thread_items WHERE message_id = ? ORDER BY created_at ASC`, [messageId]
  );
  return items;
}

module.exports = router;
