import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Search, Calendar, MapPin, Users, Filter } from 'lucide-react';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'Cloud Computing', 'Hackathon', 'AI & Data', 'DevOps'];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCategory !== 'All') params.category = filterCategory;
      if (searchTerm.trim() !== '') params.search = searchTerm.trim();

      const res = await api.getEvents(params);
      setEvents(res.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEvents();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filterCategory]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>All Upcoming Cloud Events</h1>
        <p>Explore summits, hands-on workshops, and developer hackathons with live cloud seat synchronization.</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by topic, speaker, or keyword..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-chips">
          {categories.map(cat => (
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
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading live cloud registry...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3>No events found</h3>
          <p style={{ color: '#64748b', marginTop: '6px' }}>Try adjusting your search terms or filter.</p>
        </div>
      ) : (
        <div className="event-grid">
          {events.map(event => {
            const seatsClass = event.available_seats === 0 ? 'soldout' : event.available_seats < 5 ? 'urgent' : 'plenty';
            return (
              <div key={event.id} className="event-card">
                <div className="card-img-wrapper">
                  <img src={event.banner} alt={event.title} className="card-img" />
                  <span className="badge-category">{event.category}</span>
                </div>
                <div className="card-body">
                  <h3>{event.title}</h3>
                  <p className="card-desc">{event.description}</p>
                  <p className="card-info"><Calendar size={14} /> {event.date} • {event.time}</p>
                  <p className="card-info"><MapPin size={14} /> {event.location}</p>
                  
                  <div className="card-footer">
                    <div>
                      <span className={`badge-seats ${seatsClass}`}>
                        {event.available_seats === 0 ? 'Sold Out (0)' : `${event.available_seats} / ${event.total_seats} spots left`}
                      </span>
                    </div>
                    <Link to={`/events/${event.id}`} className="btn-sm">
                      {event.available_seats === 0 ? 'Details' : 'Register'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
