import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cloud, Calendar, Ticket, ShieldCheck, Activity, User, LogOut, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, role, logout, switchDemoRole } = useAuth();

  const isActive = (path) => location.pathname === path ? 'active-link' : '';

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand">
          <Cloud className="brand-icon" size={26} />
          <span>SERP<strong>Cloud</strong></span>
          <span className="cloud-badge-tag">Serverless</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/events" className={isActive('/events')}><Calendar size={15} /> Explore Events</Link>
          <Link to="/dashboard" className={isActive('/dashboard')}><Ticket size={15} /> My Passes</Link>
          <Link to="/organizer" className={isActive('/organizer')}><ShieldCheck size={15} /> Organizer & Scanner</Link>
          <Link to="/telemetry" className={isActive('/telemetry')}><Activity size={15} /> Cloud Telemetry</Link>

          {/* Quick Demo Role Switcher */}
          <button 
            className={`role-pill ${role}`}
            title="Click to toggle between Student and Organizer demo roles"
            onClick={() => switchDemoRole(role === 'student' ? 'organizer' : 'student')}
          >
            <span className="dot" />
            <span>Role: <strong>{role === 'organizer' ? 'Organizer' : 'Student'}</strong></span>
            <ArrowRightLeft size={12} style={{ marginLeft: 2 }} />
          </button>

          {user ? (
            <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }} onClick={logout} title="Sign Out">
              <LogOut size={14} /> {user.name.split(' ')[0]}
            </button>
          ) : (
            <Link to="/auth" className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
              <User size={14} /> Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
