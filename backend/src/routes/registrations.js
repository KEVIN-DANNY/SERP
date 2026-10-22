const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const { generateTicketQR, verifyTicketQR } = require('../services/qrService');
const queueService = require('../services/queueService');

// Create a new Registration with ACID Atomic Locking
router.post('/', authenticate, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id;
  const userName = req.user.name;
  const userEmail = req.user.email;

  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' });
  }

  try {
    // 1. Transactional Atomic Seat Reservation
    const executeBooking = db.transaction(() => {
      // Step A: Read event with locking in WAL
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
      if (!event) {
        const err = new Error('EVENT_NOT_FOUND');
        err.statusCode = 404;
        throw err;
      }

      if (event.available_seats <= 0) {
        const err = new Error('SOLD_OUT: All seats for this event are fully booked.');
        err.statusCode = 409;
        throw err;
      }

      // Step B: Check duplicate registration
      const existing = db.prepare(`
        SELECT id, ticket_code FROM registrations
        WHERE event_id = ? AND user_id = ? AND status != 'CANCELLED'
      `).get(eventId, userId);

      if (existing) {
        const err = new Error('ALREADY_REGISTERED: You already have an active ticket for this event.');
        err.statusCode = 400;
        err.existingTicket = existing.ticket_code;
        throw err;
      }

      // Step C: Atomic conditional decrement
      const updateResult = db.prepare(`
        UPDATE events 
        SET available_seats = available_seats - 1 
        WHERE id = ? AND available_seats > 0
      `).run(eventId);

      if (updateResult.changes === 0) {
        const err = new Error('RACE_CONDITION_AVOIDED: The last seat was just claimed by a concurrent attendee.');
        err.statusCode = 409;
        throw err;
      }

      return event;
    });

    const event = executeBooking();

    // 2. Generate Ticket Code & Cryptographically Signed QR Pass
    const regId = `reg-${uuidv4().slice(0, 8)}`;
    const ticketCode = `SERP-${Math.floor(1000 + Math.random() * 9000)}-${uuidv4().slice(0, 4).toUpperCase()}`;

    const { qrToken, qrImage } = await generateTicketQR({
      ticketCode,
      eventId: event.id,
      userId,
      userName,
      userEmail
    });

    // 3. Persist registration record
    db.prepare(`
      INSERT INTO registrations (id, ticket_code, event_id, user_id, user_name, user_email, qr_token, qr_image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `).run(regId, ticketCode, event.id, userId, userName, userEmail, qrToken, qrImage);

    // 4. Dispatch to Asynchronous Cloud Queue (SQS / SES worker simulation)
    const queueJob = queueService.enqueueNotification({
      recipientEmail: userEmail,
      eventId: event.id,
      eventTitle: event.title,
      ticketCode,
      attendeeName: userName
    });

    res.status(201).json({
      message: 'Registration confirmed successfully!',
      registration: {
        id: regId,
        ticketCode,
        eventId: event.id,
        eventTitle: event.title,
        date: event.date,
        location: event.location,
        status: 'CONFIRMED',
        qrImage,
        qrToken,
        sqsMessageId: queueJob.sqsMessageId
      }
    });

  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message,
      existingTicket: err.existingTicket || null
    });
  }
});

// Get user's tickets / registrations
router.get('/my', authenticate, (req, res) => {
  const registrations = db.prepare(`
    SELECT 
      r.id, r.ticket_code, r.qr_token, r.qr_image, r.status, r.registered_at, r.checked_in_at,
      e.id as event_id, e.title as event_title, e.category, e.date, e.time, e.location, e.price, e.banner, e.speaker
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ?
    ORDER BY r.registered_at DESC
  `).all(req.user.id);

  res.json({ registrations });
});

// Live Organizer Gate Check-in & QR Verification
router.post('/verify', authenticate, requireRole(['organizer', 'admin']), (req, res) => {
  const { qrToken, ticketCode } = req.body;

  if (!qrToken && !ticketCode) {
    return res.status(400).json({ error: 'Please provide either qrToken or ticketCode' });
  }

  let codeToLookup = ticketCode;

  // If scanning signed QR token, verify cryptographic signature
  if (qrToken) {
    const verification = verifyTicketQR(qrToken);
    if (!verification.valid) {
      return res.status(400).json({
        status: 'INVALID_SIGNATURE',
        valid: false,
        message: 'Cryptographic signature mismatch! Tampered or expired QR ticket.'
      });
    }
    codeToLookup = verification.payload.ticketCode;
  }

  // Lookup registration record in database
  const reg = db.prepare(`
    SELECT 
      r.id, r.ticket_code, r.status, r.registered_at, r.checked_in_at, r.user_name, r.user_email,
      e.id as event_id, e.title as event_title, e.date, e.location
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.ticket_code = ?
  `).get(codeToLookup);

  if (!reg) {
    return res.status(404).json({
      status: 'NOT_FOUND',
      valid: false,
      message: `No ticket found matching code "${codeToLookup}".`
    });
  }

  if (reg.status === 'CANCELLED') {
    return res.status(400).json({
      status: 'CANCELLED',
      valid: false,
      message: `Ticket ${reg.ticket_code} was cancelled by attendee.`
    });
  }

  if (reg.status === 'ATTENDED') {
    return res.status(409).json({
      status: 'ALREADY_USED',
      valid: false,
      message: `DUPLICATE ENTRY DETECTED! Pass was already scanned at ${reg.checked_in_at}.`,
      attendee: {
        name: reg.user_name,
        email: reg.user_email,
        eventTitle: reg.event_title,
        ticketCode: reg.ticket_code,
        checkedInAt: reg.checked_in_at
      }
    });
  }

  // First time entry: Mark as ATTENDED
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE registrations 
    SET status = 'ATTENDED', checked_in_at = ?
    WHERE id = ?
  `).run(now, reg.id);

  res.json({
    status: 'SUCCESS',
    valid: true,
    message: 'Check-in confirmed! Welcome to the event.',
    attendee: {
      name: reg.user_name,
      email: reg.user_email,
      eventTitle: reg.event_title,
      ticketCode: reg.ticket_code,
      checkedInAt: now
    }
  });
});

// Cancel a registration (restores available seats)
router.delete('/:id', authenticate, (req, res) => {
  const regId = req.params.id;

  try {
    const cancelTx = db.transaction(() => {
      const reg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(regId);
      if (!reg) {
        const err = new Error('Registration not found');
        err.statusCode = 404;
        throw err;
      }

      // Check ownership unless admin/organizer
      if (reg.user_id !== req.user.id && !['organizer', 'admin'].includes(req.user.role)) {
        const err = new Error('Unauthorized to cancel this registration');
        err.statusCode = 403;
        throw err;
      }

      if (reg.status === 'CANCELLED') {
        const err = new Error('Ticket is already cancelled');
        err.statusCode = 400;
        throw err;
      }

      // 1. Mark registration as cancelled
      db.prepare(`UPDATE registrations SET status = 'CANCELLED' WHERE id = ?`).run(regId);

      // 2. Increment available seats back on event
      db.prepare(`UPDATE events SET available_seats = available_seats + 1 WHERE id = ?`).run(reg.event_id);

      return reg;
    });

    cancelTx();
    res.json({ message: 'Ticket cancelled successfully and seat restored' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
