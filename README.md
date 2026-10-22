# ⚡ SERP — Serverless Event Registration Portal
> **High-Throughput, Cloud-Native Event Platform with ACID Concurrency Control, Dynamic QR Gate Check-in & Asynchronous Worker Pipelines.**

[![CI Pipeline](https://github.com/KEVIN-DANNY/SERP/actions/workflows/ci.yml/badge.svg)](https://github.com/KEVIN-DANNY/SERP/actions)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blue)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express%20REST-green)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Storage-ACID%20WAL%20%2F%20DynamoDB%20Compatible-orange)](https://sqlite.org/)
[![Docker](https://img.shields.io/badge/DevOps-Docker%20%26%20Compose-2496ED)](https://docker.com)
[![Terraform](https://img.shields.io/badge/IaC-Terraform%20AWS-7B42BC)](https://terraform.io)

---

## 🏛️ System Architecture

```text
               +-------------------------------------------+
               |        React 18 SPA (Vite / Tailwind)     |
               |  (Attendee Portal, Organizer Gate Scanner)|
               +---------------------+---------------------+
                                     |
                                     | HTTPS / REST
                                     v
               +---------------------+---------------------+
               |       Cloud Edge & API Gateway            |
               | (CORS, JWT Authentication & Rate Limiting)|
               +---------------------+---------------------+
                                     |
                                     |
               +---------------------+---------------------+
               |   Serverless Microservice Engine (Node)   |
               |   - Telemetry & Cold Start Monitoring     |
               |   - Role-Based Access Control (RBAC)      |
               +----------+--------------------+-----------+
                          |                    |
        Atomic Conditional|                    | Asynchronous Event
        Write / Lock      |                    | Decoupling
                          v                    v
+-------------------------+---+        +-------+-------------------------+
|     ACID Persistence        |        | Asynchronous Cloud Queue (SQS)  |
| - SQLite WAL / DynamoDB     |        | - Buffer high-velocity traffic  |
| - Zero-Overbooking Contract |        | - Background Worker Consumer    |
| - Cryptographic QR Passes   |        | - SES Email & Calendar (.ics)   |
+-----------------------------+        +---------------------------------+
```

---

## 🌟 Advanced Features Implemented

### 1. 🛡️ ACID Concurrency Control & Zero-Overbooking Defense
* **Problem**: In popular campus flash-sales, hundreds of students submit registration requests at the same millisecond. Traditional apps suffer race conditions and overbook past room capacity.
* **Solution**: Implements **atomic conditional updates** and database transaction locks (`UPDATE events SET available_seats = available_seats - 1 WHERE id = ? AND available_seats > 0`). If the last seat is claimed by a concurrent worker, subsequent transactions roll back with an immediate `409 Conflict`.
* **Live Demo**: The **Cloud Telemetry** tab has a built-in benchmark runner that spawns 25 concurrent requests hitting 3 remaining seats simultaneously and displays an audit trail proving zero race conditions.

### 2. 📱 Cryptographically Signed QR Code Passes & Venue Gate Scanner
* **Dynamic Generation**: Every confirmed ticket produces a high-resolution QR code encoding a secure, HMAC-SHA256 signed JSON Web Token (JWT).
* **Live Organizer Scanner**: Organizers can activate their device camera or paste ticket tokens at the event check-in gate.
* **Replay Attack Defense**: When scanned, the ticket status changes to `ATTENDED`. Any duplicate scans trigger an immediate security alert (`DUPLICATE ENTRY DETECTED! Pass was already scanned at HH:MM:SS`).

### 3. ⚡ Asynchronous Cloud Worker Pipeline (AWS SQS / SES Simulation)
* Decouples user-facing API responses from heavy background jobs.
* When a registration completes, the event payload is enqueued into an SQS-style queue with a unique tracking message ID (`sqs-msg-xxxx`).
* A background consumer worker picks up the job, generates ticket credentials, logs CloudWatch-compliant structured telemetry, and delivers confirmation.

### 4. 📊 Real-Time Cloud Observability & Telemetry Dashboard
* Live tracking of **P50 and P95 latency**, average response durations, and error rates.
* **Serverless Cold Start Simulation**: Demonstrates cold-start execution delays vs warm-start sub-millisecond execution.
* Real-time monitoring of Node process RSS memory and system uptime.

### 5. 👥 Role-Based Access Control (RBAC) & 1-Click Persona Switcher
* Distinct roles: **Student / Attendee** vs. **Event Organizer / Faculty**.
* Includes a built-in 1-click **Demo Role Switcher** in the top navigation bar to seamlessly present both attendee and organizer perspectives without logging in and out.
* Organizers can create/publish events, view live attendance counters, and export attendee rosters as CSV.

### 6. ☁️ Official AWS SDK v3 Integration & Dual-Mode Execution
* **Amazon DynamoDB (`@aws-sdk/client-dynamodb` & `@aws-sdk/lib-dynamodb`)**: Real DynamoDB Document Client using `UpdateCommand` with `ConditionExpression: "available_seats > :zero"`.
* **Amazon SQS (`@aws-sdk/client-sqs`)**: Dispatches registration messages to an AWS SQS queue with Dead-Letter Queue (DLQ) support.
* **Amazon SES (`@aws-sdk/client-ses`)**: Dispatches HTML ticket confirmation emails.
* **Amazon S3 (`@aws-sdk/client-s3`)**: Stores dynamic pass QR images in cloud object storage.
* **AWS Lambda (`serverless-http`)**: `backend/src/lambda.js` wraps the entire Express engine for AWS Lambda + API Gateway deployment.
* **Dual-Mode Graceful Fallback**: If AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are provided in `.env`, the system interacts directly with live AWS Cloud. If absent, it automatically defaults to zero-cost local simulation mode without throwing runtime errors.
* **AWS SAM & Serverless Framework**: Includes [`template.yaml`](template.yaml) and [`serverless.yml`](serverless.yml) for 1-command deployment to AWS.

### 7. 🚀 DevOps, Dockerization & Infrastructure as Code (IaC)
* **Docker Compose**: Containerized multi-container setup with frontend Nginx proxy and backend service.
* **Terraform (`infrastructure/terraform/main.tf`)**: Complete AWS Infrastructure as Code specification including API Gateway, DynamoDB, SQS queues with DLQs, S3, and CloudFront.
* **GitHub Actions (`.github/workflows/ci.yml`)**: Continuous integration workflow validating builds on push.

---

## 📋 Step-by-Step Viva & Presentation Walkthrough

Here is the recommended script for presenting to your professor:

1. **Step 1: Introduction & Architecture (1 min)**
   - Open the **Cloud Telemetry** page (`/telemetry`).
   - Point out the cloud architecture diagram (Client $\to$ API Gateway $\to$ Serverless Engine $\to$ ACID DB $\to$ SQS Worker).
   - Highlight that the project is built for high availability and concurrency integrity.

2. **Step 2: Attendee Registration & Dynamic Pass (1.5 min)**
   - Click **Explore Events** (`/events`).
   - Select an event (e.g. *AWS Cloud & Serverless Summit*).
   - Click **Confirm Registration**: Confetti triggers, and the **Dynamic QR Pass Modal** pops up.
   - Show the **Pass ID**, the cryptographically signed QR code, and the **Asynchronous SQS Message ID**.
   - Click **Add to Calendar (.ics)** to show standard RFC-5545 calendar sync.

3. **Step 3: Venue Gate Scanner & Replay Attack Defense (2 min)**
   - Switch role to **Organizer** using the toggle pill in the top right.
   - Go to **Organizer & Scanner** (`/organizer`).
   - Paste or scan the newly generated ticket code and click **Check-In**: The green **"Check-in Confirmed"** banner appears!
   - Now click **Check-In again with the same code**: The system flags **"DUPLICATE ENTRY DETECTED"**, preventing double entry.

4. **Step 4: The Concurrency Rush Demo (Grand Finale!) (1.5 min)**
   - Go back to **Cloud Telemetry** (`/telemetry`).
   - Scroll down to the **Live Concurrency Benchmark** section.
   - Configure **25 Simultaneous Requests** against **3 Available Seats**.
   - Click **Launch Flash-Sale Concurrency Test**.
   - Show the professor: Exactly 3 seats are booked, 22 overbooking attempts are cleanly blocked, and the integrity verdict passes with 100% data consistency!

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Option A: Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/KEVIN-DANNY/SERP.git
   cd SERP
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm start
   # Server runs on http://localhost:5001
   ```

3. **Start Frontend** (in a second terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

4. Open your browser at `http://localhost:5173`.

---

### Option B: 1-Command Docker Setup

```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`

---

## 🔑 Pre-Seeded Demo Accounts

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `student@serp.cloud` | `student123` | Book tickets, view dynamic passes, download calendar files |
| **Organizer** | `organizer@serp.cloud` | `organizer123` | Gate QR scanner, create events, export CSV roster |

*(You can also use the 1-click **Role Pill** in the top navigation to switch instantly.)*

---

## 📡 REST API Reference

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Authenticate user & return JWT token |
| `/api/auth/register` | `POST` | Public | Register student or organizer account |
| `/api/events` | `GET` | Public | List all events with real-time seat inventory |
| `/api/events/:id` | `GET` | Public | Fetch single event details & capacity |
| `/api/events` | `POST` | Organizer | Create & publish new cloud event |
| `/api/events/:id` | `DELETE` | Organizer | Delete event and linked registrations |
| `/api/events/:id/export` | `GET` | Organizer | Export attendee roster as CSV |
| `/api/registrations` | `POST` | Student | Atomic seat booking with conditional lock & QR generation |
| `/api/registrations/my` | `GET` | Student | List user's active event passes |
| `/api/registrations/verify`| `POST` | Organizer | Validate QR token / code at venue gate (anti-replay) |
| `/api/registrations/:id` | `DELETE` | Student | Cancel pass & atomically restore seat |
| `/api/metrics` | `GET` | Public | Fetch P95 latency, SQS logs, and cold-start stats |
| `/api/stress-test/run` | `POST` | Public | Run live concurrency benchmark test |

---

## 👨‍💻 Author
**Kevin Danny** — Cloud Systems Engineering  
GitHub: [@KEVIN-DANNY](https://github.com/KEVIN-DANNY)
