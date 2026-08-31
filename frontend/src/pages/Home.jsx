import React from 'react';
import { Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { ArrowRight, Calendar, MapPin, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge"><Zap size={14} /> Serverless & Instant Confirmation</div>
        <h1>Seamless Event Registration Powered by Cloud</h1>
        <p>Discover tech hackathons, cloud summits, and hands-on workshops with instant real-time registration.</p>
        <div className="hero-actions">
          <Link to="/events" className="btn-primary-large">Browse Events <ArrowRight size={18} /></Link>
          <Link to="/dashboard" className="btn-secondary-large">View My Tickets</Link>
        </div>
      </section>

      {/* Featured Section */}
      <section className="featured-section">
        <h2>Featured Events</h2>
        <div className="event-grid">
          {mockEvents.map(event => (
            <div key={event.id} className="event-card">
              <img src={event.banner} alt={event.title} className="card-img" />
              <div className="card-body">
                <span className="badge">{event.category}</span>
                <h3>{event.title}</h3>
                <p className="card-info"><Calendar size={14} /> {event.date}</p>
                <p className="card-info"><MapPin size={14} /> {event.location}</p>
                <div className="card-footer">
                  <span className="price">{event.price}</span>
                  <Link to={`/events/${event.id}`} className="btn-sm">View Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}