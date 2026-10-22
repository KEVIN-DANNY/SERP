const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// List events with search and category filters
router.get('/', (req, res) => {
  const { category, search } = req.query;

  let query = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search && search.trim() !== '') {
    query += ' AND (title LIKE ? OR description LIKE ? OR speaker LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY created_at DESC';

  const events = db.prepare(query).all(...params);

  // Add registration stats to each event
  const enriched = events.map(event => {
    const regStats = db.prepare(`
      SELECT 
        COUNT(*) as total_registered,
        SUM(CASE WHEN status = 'ATTENDED' THEN 1 ELSE 0 END) as total_checked_in
      FROM registrations
      WHERE event_id = ? AND status != 'CANCELLED'
    `).get(event.id);

    return {
      ...event,
      registeredCount: regStats.total_registered || 0,
      checkedInCount: regStats.total_checked_in || 0
    };
  });

  res.json({ events: enriched });
});

// Get single event by ID
router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const regStats = db.prepare(`
    SELECT 
      COUNT(*) as total_registered,
      SUM(CASE WHEN status = 'ATTENDED' THEN 1 ELSE 0 END) as total_checked_in
    FROM registrations
    WHERE event_id = ? AND status != 'CANCELLED'
  `).get(event.id);

  res.json({
    event: {
      ...event,
      registeredCount: regStats.total_registered || 0,
      checkedInCount: regStats.total_checked_in || 0
    }
  });
});

// Create new event (Organizer/Admin only)
router.post('/', authenticate, requireRole(['organizer', 'admin']), (req, res) => {
  const {
    title,
    category,
    date,
    time,
    location,
    price = 'Free',
    totalSeats,
    banner,
    description,
    speaker
  } = req.body;

  if (!title || !category || !date || !time || !location || !totalSeats) {
    return res.status(400).json({ error: 'Please provide all required event details' });
  }

  const seats = parseInt(totalSeats, 10);
  if (isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Total seats must be a positive integer' });
  }

  const id = `evt-${uuidv4().slice(0, 8)}`;
  const defaultBanner = banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';

  db.prepare(`
    INSERT INTO events (id, title, category, date, time, location, price, total_seats, available_seats, banner, description, speaker, organizer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title,
    category,
    date,
    time,
    location,
    price,
    seats,
    seats,
    defaultBanner,
    description || 'No description provided.',
    speaker || 'TBA',
    req.user.id
  );

  const created = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.status(201).json({ message: 'Event published to cloud directory successfully', event: created });
});

// Delete event (Organizer/Admin only)
router.delete('/:id', authenticate, requireRole(['organizer', 'admin']), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Delete registrations associated with event
  db.prepare('DELETE FROM registrations WHERE event_id = ?').run(req.params.id);
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

  res.json({ message: 'Event and associated registrations deleted successfully' });
});

// Get attendees for an event (Organizer/Admin only)
router.get('/:id/attendees', authenticate, requireRole(['organizer', 'admin']), (req, res) => {
  const attendees = db.prepare(`
    SELECT r.id, r.ticket_code, r.user_name, r.user_email, r.status, r.registered_at, r.checked_in_at
    FROM registrations r
    WHERE r.event_id = ? AND r.status != 'CANCELLED'
    ORDER BY r.registered_at DESC
  `).all(req.params.id);

  res.json({ attendees });
});

// Export attendee roster as CSV (Organizer/Admin only)
router.get('/:id/export', authenticate, requireRole(['organizer', 'admin']), (req, res) => {
  const event = db.prepare('SELECT title FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).send('Event not found');

  const attendees = db.prepare(`
    SELECT ticket_code, user_name, user_email, status, registered_at, checked_in_at
    FROM registrations
    WHERE event_id = ? AND status != 'CANCELLED'
    ORDER BY registered_at ASC
  `).all(req.params.id);

  let csv = 'Ticket Code,Attendee Name,Attendee Email,Status,Registered At,Checked In At\n';
  attendees.forEach(a => {
    csv += `"${a.ticket_code}","${a.user_name}","${a.user_email}","${a.status}","${a.registered_at}","${a.checked_in_at || 'N/A'}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendees_${req.params.id}.csv`);
  res.status(200).send(csv);
});

module.exports = router;
