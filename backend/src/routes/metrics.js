const express = require('express');
const router = express.Router();
const telemetryService = require('../services/telemetryService');
const queueService = require('../services/queueService');

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
    }
  });
});

module.exports = router;
