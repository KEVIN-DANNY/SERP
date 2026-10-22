const { v4: uuidv4 } = require('uuid');
const db = require('../db');

class CloudQueueService {
  constructor() {
    this.inFlightQueue = [];
    this.isProcessing = false;
    this.stats = {
      totalQueued: 0,
      totalDelivered: 0,
      avgProcessingTimeMs: 420
    };
  }

  /**
   * Simulates publishing a message to an AWS SQS Dead-Letter-capable queue
   */
  enqueueNotification({ recipientEmail, eventId, eventTitle, ticketCode, attendeeName }) {
    const id = `notif-${uuidv4().slice(0, 8)}`;
    const sqsMessageId = `sqs-msg-${uuidv4()}`;

    const subject = `Your Pass for ${eventTitle} [${ticketCode}]`;
    const body = `Hello ${attendeeName},\n\nYour registration for "${eventTitle}" is confirmed!\nTicket Pass Code: ${ticketCode}\n\nPlease present the attached QR code at the venue check-in desk.\n\nBest regards,\nSERP Cloud Notification Worker`;

    // Persist as QUEUED in database
    const insert = db.prepare(`
      INSERT INTO notifications_log (id, recipient_email, event_id, type, subject, body, status, sqs_message_id)
      VALUES (?, ?, ?, 'TICKET_CONFIRMATION', ?, ?, 'QUEUED', ?)
    `);
    insert.run(id, recipientEmail, eventId, subject, body, sqsMessageId);

    this.stats.totalQueued += 1;

    // Simulate async SQS worker trigger (EventBridge / Lambda trigger)
    setTimeout(() => {
      this.processWorker(id, sqsMessageId, eventTitle, recipientEmail);
    }, 600);

    return { id, sqsMessageId, status: 'QUEUED' };
  }

  /**
   * Simulates AWS Lambda execution consuming SQS message
   */
  processWorker(notificationId, sqsMessageId, eventTitle, recipientEmail) {
    try {
      const update = db.prepare(`
        UPDATE notifications_log
        SET status = 'DELIVERED', delivered_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      update.run(notificationId);
      this.stats.totalDelivered += 1;

      // CloudWatch formatted structured log
      console.log(JSON.stringify({
        level: 'INFO',
        service: 'SERP-Worker-Lambda',
        source: 'aws.sqs',
        messageId: sqsMessageId,
        event: 'EMAIL_DISPATCHED',
        recipient: recipientEmail,
        title: eventTitle,
        simulatedSESResponse: '250 Ok: Message delivered'
      }));
    } catch (err) {
      console.error('Queue processing error:', err.message);
    }
  }

  getRecentLogs(limit = 20) {
    return db.prepare(`
      SELECT n.*, e.title as event_title
      FROM notifications_log n
      LEFT JOIN events e ON n.event_id = e.id
      ORDER BY n.queued_at DESC
      LIMIT ?
    `).all(limit);
  }

  getStats() {
    return this.stats;
  }
}

const queueService = new CloudQueueService();

module.exports = queueService;
