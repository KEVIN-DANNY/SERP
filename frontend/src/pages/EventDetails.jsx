import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { 
  Calendar, Clock, MapPin, User, CheckCircle, ArrowLeft, 
  AlertCircle, Ticket, Download, X, QrCode, ShieldCheck 
} from 'lucide-react';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmedPass, setConfirmedPass] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await api.getEventById(id);
        setEvent(res.event);
      } catch (err) {
        setErrorMsg('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setBooking(true);
    setErrorMsg(null);

    try {
      const res = await api.bookTicket(id);
      setConfirmedPass(res.registration);
      setShowModal(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Update local seat count immediately
      setEvent(prev => ({
        ...prev,
        available_seats: Math.max(0, prev.available_seats - 1),
        registeredCount: (prev.registeredCount || 0) + 1
      }));
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. The event may be sold out.');
    } finally {
      setBooking(false);
    }
  };

  // Helper to generate and download RFC-5545 .ics Calendar file
  const downloadCalendarInvite = () => {
    if (!event) return;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SERP Cloud Event Platform//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, ' ')}`,
      `LOCATION:${event.location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        Retrieving event details from cloud...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container">
        <Link to="/events" className="btn-secondary"><ArrowLeft size={16} /> Back to Events</Link>
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h2>Event Not Found</h2>
        </div>
      </div>
    );
  }

  const isSoldOut = event.available_seats <= 0;
  const percentBooked = Math.round(((event.total_seats - event.available_seats) / event.total_seats) * 100);

  return (
    <div className="page-container">
      <Link to="/events" className="btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
        <ArrowLeft size={16} /> Back to Events
      </Link>

      <div className="detail-layout">
        <div className="detail-main">
          <img src={event.banner} alt={event.title} className="detail-banner" />
          <span className="badge-seats plenty" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
            {event.category}
          </span>
          <h1>{event.title}</h1>
          <p className="detail-desc">{event.description}</p>

          <div className="speaker-box">
            <h3>Keynote & Host</h3>
            <p className="card-info" style={{ fontSize: '1rem', color: '#0f172a' }}>
              <User size={18} color="#4f46e5" /> {event.speaker}
            </p>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="booking-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Registration Summary</h3>

            <div className="booking-item">
              <Calendar size={18} color="#4f46e5" />
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>Date</small>
                <strong>{event.date}</strong>
              </div>
            </div>

            <div className="booking-item">
              <Clock size={18} color="#4f46e5" />
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>Time</small>
                <strong>{event.time}</strong>
              </div>
            </div>

            <div className="booking-item">
              <MapPin size={18} color="#4f46e5" />
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>Venue</small>
                <strong>{event.location}</strong>
              </div>
            </div>

            <div className="booking-item">
              <Ticket size={18} color="#4f46e5" />
              <div>
                <small style={{ color: '#64748b', display: 'block' }}>Pass Fee</small>
                <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>{event.price}</strong>
              </div>
            </div>

            {/* Live Inventory Status */}
            <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Capacity Filled: {percentBooked}%</span>
                <span style={{ fontWeight: 700, color: isSoldOut ? '#dc2626' : '#4f46e5' }}>
                  {event.available_seats} spots left
                </span>
              </div>
              <div className="booking-seats-progress">
                <div 
                  className="booking-seats-bar" 
                  style={{ 
                    width: `${percentBooked}%`, 
                    backgroundColor: isSoldOut ? '#dc2626' : percentBooked > 85 ? '#f59e0b' : '#4f46e5' 
                  }} 
                />
              </div>
            </div>

            {errorMsg && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSoldOut ? (
              <button className="btn-secondary full-width" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                Sold Out (Zero Capacity)
              </button>
            ) : (
              <button 
                className="btn-primary full-width" 
                onClick={handleRegister} 
                disabled={booking}
                style={{ padding: '0.85rem' }}
              >
                {booking ? 'Locking Seat in Database...' : 'Confirm Registration & Generate Pass'}
              </button>
            )}

            <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
              🔒 Protected by ACID Atomic Locking & Cryptographic Pass Generation
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic QR Ticket Pass Modal */}
      {showModal && confirmedPass && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-pass" onClick={e => e.stopPropagation()}>
            <div className="modal-pass-header">
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
              <ShieldCheck size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Official Digital Event Pass</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>{confirmedPass.eventTitle}</p>
            </div>

            <div className="modal-pass-body">
              <div className="modal-qr-img">
                <img src={confirmedPass.qrImage} alt="Signed Ticket QR Pass" style={{ width: '100%', height: '100%' }} />
              </div>

              <div className="pass-code-tag">
                {confirmedPass.ticketCode}
              </div>

              <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem' }}>
                Attendee: <strong>{user?.name}</strong> • Status: <span style={{ color: '#10b981', fontWeight: 700 }}>Confirmed</span>
              </p>

              {/* SQS message ID tag */}
              <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', marginBottom: '1.25rem' }}>
                ⚡ Cloud Notification Dispatched: <code>{confirmedPass.sqsMessageId}</code>
              </div>

              <div className="modal-pass-actions">
                <button className="btn-secondary" onClick={downloadCalendarInvite}>
                  <Download size={15} /> Add to Calendar (.ics)
                </button>
                <Link to="/dashboard" className="btn-primary">
                  View My Passes →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
