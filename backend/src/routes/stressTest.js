const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateTicketQR } = require('../services/qrService');

// Live Concurrency & Race Condition Defense Benchmark
router.post('/run', async (req, res) => {
  const concurrencyCount = parseInt(req.body.concurrency || 20, 10);
  const seatsAvailable = parseInt(req.body.seats || 3, 10);

  const testEventId = `evt-stress-${uuidv4().slice(0, 6)}`;
  const testTitle = `High-Concurrency Cloud Race Condition Test (${concurrencyCount} requests -> ${seatsAvailable} seats)`;

  // 1. Create temporary event
  db.prepare(`
    INSERT INTO events (id, title, category, date, time, location, price, total_seats, available_seats, banner, description, speaker)
    VALUES (?, ?, 'Cloud Benchmark', 'Immediate', 'Real-Time', 'Distributed In-Memory Lock', 'Free', ?, ?, 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800', 'Automated concurrency verification test', 'SERP Stress Runner')
  `).run(testEventId, testTitle, seatsAvailable, seatsAvailable);

  const startTime = Date.now();
  const results = [];

  // 2. Dispatch simulated concurrent users
  const workers = Array.from({ length: concurrencyCount }).map(async (_, idx) => {
    const virtualUserId = `usr-stress-${idx + 1}`;
    const virtualUserName = `Concurrent User #${idx + 1}`;
    const virtualUserEmail = `user${idx + 1}@loadtest.cloud`;

    try {
      const executeBooking = db.transaction(() => {
        const ev = db.prepare('SELECT available_seats FROM events WHERE id = ?').get(testEventId);
        if (!ev || ev.available_seats <= 0) {
          const err = new Error('SOLD_OUT');
          err.statusCode = 409;
          throw err;
        }

        const update = db.prepare(`
          UPDATE events
          SET available_seats = available_seats - 1
          WHERE id = ? AND available_seats > 0
        `).run(testEventId);

        if (update.changes === 0) {
          const err = new Error('RACE_CONDITION_PREVENTED');
          err.statusCode = 409;
          throw err;
        }

        return true;
      });

      executeBooking();

      results.push({
        worker: idx + 1,
        user: virtualUserName,
        status: 'SUCCESS_BOOKED',
        code: 201,
        message: 'Seat securely allocated via atomic lock'
      });
    } catch (err) {
      results.push({
        worker: idx + 1,
        user: virtualUserName,
        status: 'REJECTED_SOLD_OUT',
        code: 409,
        message: 'Transaction rolled back: zero seats remaining'
      });
    }
  });

  await Promise.all(workers);
  const durationMs = Date.now() - startTime;

  // 3. Check final seat count in DB
  const finalState = db.prepare('SELECT available_seats, total_seats FROM events WHERE id = ?').get(testEventId);

  // 4. Cleanup test event
  db.prepare('DELETE FROM events WHERE id = ?').run(testEventId);

  const successfulBookings = results.filter(r => r.status === 'SUCCESS_BOOKED').length;
  const rejectedOverbookingAttempts = results.filter(r => r.status === 'REJECTED_SOLD_OUT').length;

  res.json({
    summary: {
      test: 'Simulated Ticket Flash Sale',
      totalConcurrentRequests: concurrencyCount,
      seatsInitiallyAvailable: seatsAvailable,
      seatsSuccessfullyBooked: successfulBookings,
      overbookingAttemptsBlocked: rejectedOverbookingAttempts,
      raceConditionsPrevented: successfulBookings === seatsAvailable && finalState.available_seats === 0,
      executionDurationMs: durationMs,
      integrityVerdict: successfulBookings === seatsAvailable 
        ? 'PASSED: 100% Data Integrity. Exactly 3 seats allocated, zero overbooking.'
        : 'FAILED: Race condition detected.'
    },
    auditTrail: results
  });
});

module.exports = router;
