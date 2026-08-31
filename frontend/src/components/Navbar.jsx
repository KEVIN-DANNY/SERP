import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, User, Zap } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand">
          <Zap className="brand-icon" size={24} />
          <span>Serverless<strong>Portal</strong></span>
        </Link>
        <nav className="nav-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/events" className={isActive('/events')}>Explore Events</Link>
          <Link to="/dashboard" className={isActive('/dashboard')}>My Registrations</Link>
          <Link to="/auth" className="btn-primary">Sign In</Link>
        </nav>
      </div>
    </header>
  );
}