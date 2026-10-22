const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { SQSClient } = require('@aws-sdk/client-sqs');
const { SESClient } = require('@aws-sdk/client-ses');
const { S3Client } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'us-east-1';

// Determine if AWS credentials are provided
const hasAwsCredentials = Boolean(
  (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
  process.env.USE_AWS === 'true'
);

let dynamoClient = null;
let ddbDocClient = null;
let sqsClient = null;
let sesClient = null;
let s3Client = null;

if (hasAwsCredentials) {
  const clientConfig = {
    region,
    ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    } : {})
  };

  dynamoClient = new DynamoDBClient(clientConfig);
  ddbDocClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: { removeUndefinedValues: true }
  });
  sqsClient = new SQSClient(clientConfig);
  sesClient = new SESClient(clientConfig);
  s3Client = new S3Client(clientConfig);
}

module.exports = {
  hasAwsCredentials,
  region,
  dynamoClient,
  ddbDocClient,
  sqsClient,
  sesClient,
  s3Client,
  tables: {
    events: process.env.DYNAMODB_EVENTS_TABLE || 'serp-events-production',
    registrations: process.env.DYNAMODB_REGISTRATIONS_TABLE || 'serp-registrations-production'
  },
  sqsQueueUrl: process.env.AWS_SQS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/123456789012/serp-ticket-queue-production',
  s3Bucket: process.env.AWS_S3_BUCKET || 'serp-passes-production',
  sesSenderEmail: process.env.AWS_SES_SENDER_EMAIL || 'tickets@serp.cloud'
};
