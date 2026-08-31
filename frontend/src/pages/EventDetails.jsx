import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { Calendar, Clock, MapPin, User, CheckCircle, ArrowLeft } from 'lucide-react';

export default function EventDetails() {
  const { id } = useParams();
  const event = mockEvents.find(item => item.id === id) || mockEvents[0];
  const [registered, setRegistered] = useState(false);

  return (
    <div className="page-container detail-page">
      <Link to="/events" className="back-link"><ArrowLeft size={16} /> Back to Events</Link>
      
      <div className="detail-layout">
        <div className="detail-main">
          <img src={event.banner} alt={event.title} className="detail-banner" />
          <span className="badge">{event.category}</span>
          <h1>{event.title}</h1>
          <p className="detail-desc">{event.description}</p>
          
          <h3>Keynote & Host</h3>
          <p className="card-info"><User size={16} /> {event.speaker}</p>
        </div>

        <div className="detail-sidebar">
          <div className="booking-card">
            <h3>Event Summary</h3>
            <div className="booking-item"><Calendar size={16} /> <strong>Date:</strong> {event.date}</div>
            <div className="booking-item"><Clock size={16} /> <strong>Time:</strong> {event.time}</div>
            <div className="booking-item"><MapPin size={16} /> <strong>Venue:</strong> {event.location}</div>
            <div className="booking-item"><strong>Price:</strong> {event.price}</div>
            
            {registered ? (
              <div className="success-banner">
                <CheckCircle size={20} color="#10b981" />
                <span>You are registered! Ticket sent to email.</span>
              </div>
            ) : (
              <button className="btn-primary full-width" onClick={() => setRegistered(true)}>
                Confirm Registration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}