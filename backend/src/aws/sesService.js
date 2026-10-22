const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { sesClient, sesSenderEmail, hasAwsCredentials } = require('./awsConfig');

class SesService {
  /**
   * Dispatches an automated confirmation email using Amazon SES
   */
  async sendTicketEmail({ recipientEmail, attendeeName, eventTitle, ticketCode }) {
    if (!hasAwsCredentials || !sesClient) {
      return { simulated: true };
    }

    const command = new SendEmailCommand({
      Source: sesSenderEmail,
      Destination: {
        ToAddresses: [recipientEmail]
      },
      Message: {
        Subject: {
          Data: `🎟️ Your Pass for ${eventTitle} [${ticketCode}]`,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4f46e5;">Your Event Pass is Confirmed!</h2>
                <p>Hello <strong>${attendeeName}</strong>,</p>
                <p>You are officially registered for <strong>${eventTitle}</strong>.</p>
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 18px; margin: 20px 0;">
                  Pass Code: <strong>${ticketCode}</strong>
                </div>
                <p>Please present your pass at the venue entrance scanner.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <small style="color: #94a3b8;">Dispatched by SERP Serverless Cloud Notification Pipeline (Amazon SES).</small>
              </div>
            `,
            Charset: 'UTF-8'
          }
        }
      }
    });

    try {
      const response = await sesClient.send(command);
      console.log(`[AWS SES] Dispatched email to ${recipientEmail}, MessageId: ${response.MessageId}`);
      return { success: true, messageId: response.MessageId };
    } catch (err) {
      console.error('[AWS SES] Failed to send email:', err.message);
      return { error: err.message, simulatedFallback: true };
    }
  }
}

module.exports = new SesService();
