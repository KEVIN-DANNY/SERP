import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Ticket } from 'lucide-react';

export default function Dashboard() {
  const userBookings = [
    {
      id: "REG-9482",
      title: "AWS Cloud & Serverless Summit 2026",
      date: "October 15, 2026",
      status: "Confirmed",
      qrText: "VALID_TOKEN_9482"
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>User Dashboard</h1>
        <p>Manage your registrations, badges, and event passes.</p>
      </div>

      <div className="ticket-list">
        {userBookings.map(item => (
          <div key={item.id} className="ticket-card">
            <div className="ticket-icon"><Ticket size={32} /></div>
            <div className="ticket-info">
              <span className="status-badge"><CheckCircle2 size={14} /> {item.status}</span>
              <h3>{item.title}</h3>
              <p className="card-info"><Calendar size={14} /> {item.date}</p>
              <small>Pass ID: <strong>{item.id}</strong></small>
            </div>
            <div className="ticket-action">
              <button className="btn-secondary" onClick={() => alert(`Showing Pass QR: ${item.qrText}`)}>View Pass</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}