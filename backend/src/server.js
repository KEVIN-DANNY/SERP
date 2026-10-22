require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const telemetryService = require('./services/telemetryService');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const metricsRoutes = require('./routes/metrics');
const stressTestRoutes = require('./routes/stressTest');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend Vite dev server and local clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Attach Cloud Telemetry & Observability Middleware
app.use(telemetryService.middleware());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'SERP Microservice Engine',
    timestamp: new Date().toISOString(),
    architecture: 'Cloud-Native Distributed Event Platform'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/stress-test', stressTestRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SERP Serverless Backend running on http://localhost:${PORT}`);
  console.log(`📡 Cloud Telemetry: http://localhost:${PORT}/api/metrics`);
  console.log(`⚡ Concurrency Stress Engine ready`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  console.error(`Failed to start server on port ${PORT}:`, err.message);
});
