# 🚀 SERP Backend Service

High-performance Node.js / Express microservice engine for the Serverless Event Registration Portal.

## Features
- **ACID WAL Transactions**: Ensures atomic seat decrements with conditional locking.
- **Cryptographic QR Generator**: Issues HMAC-SHA256 signed JSON Web Tokens for ticket credentials.
- **Asynchronous Queue Simulation**: Models AWS SQS message passing and decoupled background workers.
- **Gate Check-In & Anti-Replay Engine**: Verifies passes and prevents ticket reuse at venue gates.
- **Live Concurrency Benchmark**: Endpoint to test 25+ simultaneous requests against limited seats.

## Quick Start
```bash
npm install
npm start
```
Default port: `http://localhost:5001`.
