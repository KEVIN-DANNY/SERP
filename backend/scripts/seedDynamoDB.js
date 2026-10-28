require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { ddbDocClient, tables, hasAwsCredentials, region } = require('../src/aws/awsConfig');

const dummyEvents = [
  {
    id: "evt-1",
    title: "AWS Cloud & Serverless Summit 2026",
    category: "Cloud Computing",
    date: "October 28, 2026",
    time: "10:00 AM - 4:00 PM",
    location: "Tech Auditorium & AWS Live Stream",
    price: "Free",
    total_seats: 100,
    available_seats: 42,
    banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
    description: "Deep dive into event-driven serverless architectures, AWS Lambda, API Gateways, DynamoDB, and auto-scaling microservices with zero infrastructure overhead.",
    speaker: "Dr. Evelyn Reed (AWS Community Hero)"
  },
  {
    id: "evt-2",
    title: "Full-Stack React & Serverless Hackathon",
    category: "Hackathon",
    date: "November 05, 2026",
    time: "09:00 AM - 6:00 PM",
    location: "Innovation Hub Hall B",
    price: "$10",
    total_seats: 50,
    available_seats: 18,
    banner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    description: "A high-intensity 24-hour sprint building real-world cloud applications with live deployment, mentor office hours, and prize pools for best distributed app.",
    speaker: "Tech Incubator Panel"
  },
  {
    id: "evt-3",
    title: "AI & Serverless Microservices Workshop",
    category: "AI & Data",
    date: "November 18, 2026",
    time: "02:00 PM - 5:30 PM",
    location: "Cloud Computing Lab 3 & Online",
    price: "Free",
    total_seats: 30,
    available_seats: 5,
    banner: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
    description: "Learn how to integrate serverless LLM APIs and high-throughput vector pipelines into lightweight modern web applications with sub-100ms latency.",
    speaker: "Marcus Vance (Cloud AI Architect)"
  },
  {
    id: "evt-4",
    title: "Kubernetes, Docker & Cloud-Native Security",
    category: "DevOps",
    date: "December 01, 2026",
    time: "11:00 AM - 3:00 PM",
    location: "Virtual Cloud Arena",
    price: "Free",
    total_seats: 25,
    available_seats: 2,
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    description: "Hands-on masterclass on container orchestration, zero-trust cloud network security, Kubernetes ingress controllers, and automated CI/CD pipelines.",
    speaker: "Samantha Torres (DevOps Principal)"
  },
  {
    id: "evt-5",
    title: "High-Performance Cloud Databases & DynamoDB Masterclass",
    category: "Cloud Computing",
    date: "December 12, 2026",
    time: "01:00 PM - 5:00 PM",
    location: "Computer Science Dept - Seminar Hall",
    price: "Free",
    total_seats: 60,
    available_seats: 24,
    banner: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    description: "Master NoSQL data modeling, single-table design patterns in DynamoDB, global secondary indexes (GSI), and atomic conditional writes under heavy flash-sale load.",
    speaker: "Dr. Arvind Narayanan (Cloud Systems Lead)"
  },
  {
    id: "evt-6",
    title: "Global FinTech & Cloud Computing Hackathon",
    category: "Hackathon",
    date: "December 20, 2026",
    time: "10:00 AM - 8:00 PM",
    location: "Tech Park Convention Center",
    price: "$15",
    total_seats: 80,
    available_seats: 0,
    banner: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80",
    description: "Sold out 48-hour global hackathon testing serverless payment gateways, microservice resilience, and fraud prevention pipelines with $10,000 in cloud prizes.",
    speaker: "FinTech Innovation Board"
  }
];

async function seed() {
  console.log(`Starting DynamoDB seed into table: ${tables.events} (Region: ${region})...`);

  if (!ddbDocClient) {
    console.error('Error: AWS DynamoDB client not configured. Set AWS credentials in .env.');
    process.exit(1);
  }

  for (const event of dummyEvents) {
    try {
      await ddbDocClient.send(new PutCommand({
        TableName: tables.events,
        Item: {
          ...event,
          createdAt: new Date().toISOString()
        }
      }));
      console.log(`✅ Seeded event: [${event.id}] ${event.title}`);
    } catch (err) {
      console.error(`❌ Failed to seed [${event.id}]:`, err.message);
    }
  }

  console.log('Finished seeding DynamoDB events table successfully!');
}

seed();
