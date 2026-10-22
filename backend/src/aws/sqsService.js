const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { sqsClient, sqsQueueUrl, hasAwsCredentials } = require('./awsConfig');

class SqsService {
  /**
   * Publishes registration payload to an AWS SQS queue
   */
  async enqueueTicketMessage({ eventId, eventTitle, ticketCode, attendeeName, attendeeEmail }) {
    if (!hasAwsCredentials || !sqsClient) {
      return { simulated: true, messageId: `mock-sqs-${Date.now()}` };
    }

    const payload = {
      eventId,
      eventTitle,
      ticketCode,
      attendeeName,
      attendeeEmail,
      timestamp: new Date().toISOString()
    };

    const command = new SendMessageCommand({
      QueueUrl: sqsQueueUrl,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: {
        EventType: {
          DataType: 'String',
          StringValue: 'TICKET_REGISTRATION_CONFIRMED'
        },
        TicketCode: {
          DataType: 'String',
          StringValue: ticketCode
        }
      }
    });

    try {
      const response = await sqsClient.send(command);
      console.log(`[AWS SQS] Enqueued message ${response.MessageId} to ${sqsQueueUrl}`);
      return { success: true, messageId: response.MessageId };
    } catch (err) {
      console.error('[AWS SQS] Failed to publish message:', err.message);
      return { error: err.message, simulatedFallback: true };
    }
  }
}

module.exports = new SqsService();
