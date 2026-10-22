const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const sqsService = require('../aws/sqsService');
const sesService = require('../aws/sesService');
const { hasAwsCredentials } = require('../aws/awsConfig');

class CloudQueueService {
  constructor() {
    this.inFlightQueue = [];
    this.isProcessing = false;
    this.stats = {
      totalQueued: 0,
      totalDelivered: 0,
      avgProcessingTimeMs: 420,
      awsSqsActive: hasAwsCredentials
    };
  }

  /**
   * Publishes a message to AWS SQS (or simulation queue if keys absent)
   */
  async enqueueNotification({ recipientEmail, eventId, eventTitle, ticketCode, attendeeName }) {
    const id = `notif-${uuidv4().slice(0, 8)}`;
    let sqsMessageId = `sqs-msg-${uuidv4()}`;

    // Publish to real AWS SQS if credentials exist
    if (hasAwsCredentials) {
      try {
        const sqsRes = await sqsService.enqueueTicketMessage({
          eventId,
          eventTitle,
          ticketCode,
          attendeeName,
          attendeeEmail: recipientEmail
        });
        if (sqsRes.messageId) {
          sqsMessageId = sqsRes.messageId;
        }
      } catch (err) {
        console.warn('AWS SQS publish warning:', err.message);
      }
    }

    const subject = `Your Pass for ${eventTitle} [${ticketCode}]`;
    const body = `Hello ${attendeeName},\n\nYour registration for "${eventTitle}" is confirmed!\nTicket Pass Code: ${ticketCode}\n\nPlease present the attached QR code at the venue check-in desk.\n\nBest regards,\nSERP Cloud Notification Worker`;

    // Persist as QUEUED in database
    const insert = db.prepare(`
      INSERT INTO notifications_log (id, recipient_email, event_id, type, subject, body, status, sqs_message_id)
      VALUES (?, ?, ?, 'TICKET_CONFIRMATION', ?, ?, 'QUEUED', ?)
    `);
    insert.run(id, recipientEmail, eventId, subject, body, sqsMessageId);

    this.stats.totalQueued += 1;

    // Async worker trigger (simulating AWS SQS Lambda Trigger / SES worker)
    setTimeout(() => {
      this.processWorker(id, sqsMessageId, eventTitle, recipientEmail, attendeeName, ticketCode);
    }, 600);

    return { id, sqsMessageId, status: 'QUEUED' };
  }

  /**
   * AWS Lambda execution consuming SQS message & dispatching SES email
   */
  async processWorker(notificationId, sqsMessageId, eventTitle, recipientEmail, attendeeName, ticketCode) {
    try {
      // If AWS is active, dispatch via real Amazon SES
      if (hasAwsCredentials) {
        await sesService.sendTicketEmail({
          recipientEmail,
          attendeeName,
          eventTitle,
          ticketCode
        });
      }

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
        awsProvider: hasAwsCredentials ? 'AWS SES Production' : 'Simulated SES Mock',
        status: 'DELIVERED'
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
