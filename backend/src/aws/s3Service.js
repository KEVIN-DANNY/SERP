const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, s3Bucket, hasAwsCredentials, region } = require('./awsConfig');

class S3Service {
  /**
   * Uploads ticket QR pass image to AWS S3 bucket
   */
  async uploadTicketPass(ticketCode, base64ImageBuffer) {
    if (!hasAwsCredentials || !s3Client) {
      return { simulated: true, url: null };
    }

    const key = `passes/${ticketCode}.png`;
    const buffer = Buffer.from(base64ImageBuffer.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/png'
    });

    try {
      await s3Client.send(command);
      const publicUrl = `https://${s3Bucket}.s3.${region}.amazonaws.com/${key}`;
      console.log(`[AWS S3] Uploaded ticket pass to ${publicUrl}`);
      return { success: true, url: publicUrl };
    } catch (err) {
      console.error('[AWS S3] Failed to upload pass to S3:', err.message);
      return { error: err.message, simulatedFallback: true };
    }
  }
}

module.exports = new S3Service();
