const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../data/serp.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      price TEXT NOT NULL,
      total_seats INTEGER NOT NULL,
      available_seats INTEGER NOT NULL,
      banner TEXT NOT NULL,
      description TEXT NOT NULL,
      speaker TEXT NOT NULL,
      organizer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(organizer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      ticket_code TEXT UNIQUE NOT NULL,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      qr_token TEXT NOT NULL,
      qr_image TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checked_in_at DATETIME,
      FOREIGN KEY(event_id) REFERENCES events(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      event_id TEXT,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT,
      status TEXT NOT NULL DEFAULT 'QUEUED',
      sqs_message_id TEXT NOT NULL,
      queued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delivered_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS telemetry_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT,
      endpoint TEXT,
      status_code INTEGER,
      duration_ms REAL,
      is_cold_start INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedData();
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const studentPass = bcrypt.hashSync('student123', salt);
    const organizerPass = bcrypt.hashSync('organizer123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('usr-student-1', 'Alex Chen (Student)', 'student@serp.cloud', studentPass, 'student');
    insertUser.run('usr-organizer-1', 'Prof. Sarah Connor (Faculty & Organizer)', 'organizer@serp.cloud', organizerPass, 'organizer');
  }

  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  if (eventCount === 0) {
    const insertEvent = db.prepare(`
      INSERT INTO events (id, title, category, date, time, location, price, total_seats, available_seats, banner, description, speaker, organizer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      'evt-1',
      'AWS Cloud & Serverless Summit 2026',
      'Cloud Computing',
      'October 28, 2026',
      '10:00 AM - 4:00 PM',
      'Tech Auditorium & AWS Stream',
      'Free',
      100,
      42,
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
      'Deep dive into event-driven serverless architectures, AWS Lambda, API Gateways, DynamoDB, and auto-scaling microservices with zero infrastructure overhead.',
      'Dr. Evelyn Reed (AWS Community Hero)',
      'usr-organizer-1'
    );

    insertEvent.run(
      'evt-2',
      'Full-Stack React & Serverless Hackathon',
      'Hackathon',
      'November 05, 2026',
      '09:00 AM - 6:00 PM',
      'Innovation Hub Hall B',
      '$10',
      50,
      18,
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
      'A high-intensity 24-hour sprint building real-world cloud applications with live deployment, mentor office hours, and prize pools for best distributed app.',
      'Tech Incubator Panel',
      'usr-organizer-1'
    );

    insertEvent.run(
      'evt-3',
      'AI & Serverless Microservices Workshop',
      'AI & Data',
      'November 18, 2026',
      '02:00 PM - 5:30 PM',
      'Lab 3 & Online Stream',
      'Free',
      30,
      5,
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
      'Learn how to integrate serverless LLM APIs and high-throughput vector pipelines into lightweight modern web applications with sub-100ms latency.',
      'Marcus Vance (Cloud AI Architect)',
      'usr-organizer-1'
    );

    insertEvent.run(
      'evt-4',
      'Kubernetes, Docker & Cloud-Native Security',
      'DevOps',
      'December 01, 2026',
      '11:00 AM - 3:00 PM',
      'Virtual Arena',
      'Free',
      25,
      2, // Intentionally only 2 seats left for easy concurrency and sold-out demonstration!
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
      'Hands-on masterclass on container orchestration, zero-trust cloud network security, Kubernetes ingress controllers, and automated CI/CD pipelines.',
      'Samantha Torres (DevOps Principal)',
      'usr-organizer-1'
    );

    insertEvent.run(
      'evt-5',
      'High-Performance Cloud Databases & DynamoDB Masterclass',
      'Cloud Computing',
      'December 12, 2026',
      '01:00 PM - 5:00 PM',
      'Computer Science Dept - Seminar Hall',
      'Free',
      60,
      24,
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      'Master NoSQL data modeling, single-table design patterns in DynamoDB, global secondary indexes (GSI), and atomic conditional writes under heavy flash-sale load.',
      'Dr. Arvind Narayanan (Cloud Systems Lead)',
      'usr-organizer-1'
    );

    insertEvent.run(
      'evt-6',
      'Global FinTech & Cloud Computing Hackathon',
      'Hackathon',
      'December 20, 2026',
      '10:00 AM - 8:00 PM',
      'Tech Park Convention Center',
      '$15',
      80,
      0, // Sold out event for presentation screenshots!
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
      'Sold out 48-hour global hackathon testing serverless payment gateways, microservice resilience, and fraud prevention pipelines with $10,000 in cloud prizes.',
      'FinTech Innovation Board',
      'usr-organizer-1'
    );
  }
}

initDb();

module.exports = db;
