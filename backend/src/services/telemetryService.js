const db = require('../db');

class TelemetryService {
  constructor() {
    this.bootTime = Date.now();
    this.coldStartObserved = false;
    this.requestBuffer = [];
    this.maxBufferSize = 200;
  }

  middleware() {
    return (req, res, next) => {
      const start = process.hrtime();
      const isColdStart = !this.coldStartObserved;
      if (isColdStart) {
        this.coldStartObserved = true;
      }

      res.on('finish', () => {
        const diff = process.hrtime(start);
        const durationMs = Number(((diff[0] * 1e3) + (diff[1] * 1e-6)).toFixed(2));

        // Skip recording metrics API itself to avoid circular stats noise
        if (req.originalUrl.includes('/api/metrics')) return;

        const logEntry = {
          method: req.method,
          endpoint: req.originalUrl.split('?')[0],
          statusCode: res.statusCode,
          durationMs,
          isColdStart: isColdStart ? 1 : 0,
          timestamp: new Date().toISOString()
        };

        this.requestBuffer.unshift(logEntry);
        if (this.requestBuffer.length > this.maxBufferSize) {
          this.requestBuffer.pop();
        }

        try {
          db.prepare(`
            INSERT INTO telemetry_logs (method, endpoint, status_code, duration_ms, is_cold_start)
            VALUES (?, ?, ?, ?, ?)
          `).run(logEntry.method, logEntry.endpoint, logEntry.statusCode, logEntry.durationMs, logEntry.isColdStart);
        } catch (e) {
          // ignore telemetry write error
        }
      });

      next();
    };
  }

  getMetrics() {
    const memory = process.memoryUsage();
    const durations = this.requestBuffer.map(r => r.durationMs).sort((a, b) => a - b);

    const totalRequests = this.requestBuffer.length;
    const errorCount = this.requestBuffer.filter(r => r.statusCode >= 400).length;

    const p50 = durations.length ? durations[Math.floor(durations.length * 0.5)] : 0;
    const p95 = durations.length ? durations[Math.floor(durations.length * 0.95)] : 0;
    const avgLatency = durations.length
      ? Number((durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(2))
      : 0;

    return {
      serverlessEngine: 'Node.js / Express Microservice Architecture',
      cloudRuntime: 'Containerized (Docker / AWS ECS / Lambda compatible)',
      uptimeSeconds: Math.floor((Date.now() - this.bootTime) / 1000),
      memoryUsageMB: {
        rss: (memory.rss / (1024 * 1024)).toFixed(1),
        heapUsed: (memory.heapUsed / (1024 * 1024)).toFixed(1)
      },
      requests: {
        totalRecorded: totalRequests,
        errorCount,
        successRate: totalRequests > 0 ? Number((((totalRequests - errorCount) / totalRequests) * 100).toFixed(1)) : 100
      },
      latency: {
        avgMs: avgLatency,
        p50Ms: p50,
        p95Ms: p95,
        coldStartDemoMs: 185.4
      },
      recentTraces: this.requestBuffer.slice(0, 15)
    };
  }
}

const telemetryService = new TelemetryService();
module.exports = telemetryService;
