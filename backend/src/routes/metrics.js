const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');
const queueService = require('../services/queueService');
const { hasAwsCredentials, region, tables, sqsQueueUrl } = require('../aws/awsConfig');

// Telemetry & Cloud Observability Endpoint
router.get('/', (req, res) => {
  const telemetry = telemetryService.getMetrics();
  const queueStats = queueService.getStats();
  const recentQueueLogs = queueService.getRecentLogs(10);

  res.json({
    telemetry,
    cloudQueue: {
      stats: queueStats,
      recentJobs: recentQueueLogs
    },
    awsIntegration: {
      sdkVersion: '@aws-sdk/v3',
      connected: hasAwsCredentials,
      region,
      services: {
        dynamoDb: {
          status: hasAwsCredentials ? 'CONNECTED' : 'STANDBY_SIMULATION',
          table: tables.events,
          lockingMechanism: 'ConditionExpression: available_seats > :zero'
        },
        sqsQueue: {
          status: hasAwsCredentials ? 'CONNECTED' : 'STANDBY_SIMULATION',
          queueUrl: sqsQueueUrl,
          pattern: 'Decoupled Worker Queue'
        },
        sesEmail: {
          status: hasAwsCredentials ? 'CONNECTED' : 'STANDBY_SIMULATION',
          action: 'SendEmailCommand'
        },
        s3Storage: {
          status: hasAwsCredentials ? 'CONNECTED' : 'STANDBY_SIMULATION',
          action: 'PutObjectCommand (Pass QR Images)'
        },
        lambdaCompute: {
          status: 'DEPLOYMENT_READY',
          handler: 'backend/src/lambda.handler'
        }
      }
    }
  });
});

module.exports = router;
