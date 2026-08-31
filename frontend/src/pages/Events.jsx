import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { Search, Calendar, MapPin } from 'lucide-react';

export default function Events() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const filtered = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || event.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>All Upcoming Events</h1>
        <p>Find and register for hands-on sessions and conferences.</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by event title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-chips">
          {['All', 'Cloud Computing', 'Hackathon', 'AI & Data'].map(cat => (
            <button 
              key={cat} 
              className={filterCategory === cat ? 'chip active' : 'chip'}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="event-grid">
        {filtered.map(event => (
          <div key={event.id} className="event-card">
            <img src={event.banner} alt={event.title} className="card-img" />
            <div className="card-body">
              <span className="badge">{event.category}</span>
              <h3>{event.title}</h3>
              <p className="card-info"><Calendar size={14} /> {event.date}</p>
              <p className="card-info"><MapPin size={14} /> {event.location}</p>
              <div className="card-footer">
                <span className="badge-seats">{event.seatsLeft} spots left</span>
                <Link to={`/events/${event.id}`} className="btn-sm">Register</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}