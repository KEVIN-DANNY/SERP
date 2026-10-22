import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, CheckCircle2, Ticket, MapPin, Download, Trash2, 
  ExternalLink, X, ShieldCheck, UserCheck 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchRegistrations = async () => {
    try {
      const res = await api.getMyRegistrations();
      setRegistrations(res.registrations || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [user]);

  const handleCancel = async (regId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to cancel your pass for "${eventTitle}"? This will return your seat to the general pool.`)) {
      return;
    }

    setCancellingId(regId);
    try {
      await api.cancelTicket(regId);
      // Refresh list
      fetchRegistrations();
    } catch (err) {
      alert(err.message || 'Failed to cancel pass');
    } finally {
      setCancellingId(null);
    }
  };

  const downloadTicketSummary = (pass) => {
    const text = `SERP CLOUD DIGITAL EVENT PASS\n==============================\nPass ID: ${pass.ticket_code}\nEvent: ${pass.event_title}\nDate: ${pass.date} (${pass.time})\nVenue: ${pass.location}\nAttendee: ${user?.name} (${user?.email})\nStatus: ${pass.status}\nIssued by SERP Cloud Engine\n==============================`;
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `pass_${pass.ticket_code}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Event Passes & Credentials</h1>
        <p>Manage your registered summits, dynamic QR passes, and venue credentials.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          Loading your passes from cloud database...
        </div>
      ) : registrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <Ticket size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3>No passes found</h3>
          <p style={{ color: '#64748b', marginTop: '6px', marginBottom: '1.5rem' }}>
            You haven't registered for any events yet. Browse upcoming cloud summits to get started.
          </p>
          <Link to="/events" className="btn-primary">Browse All Events</Link>
        </div>
      ) : (
        <div className="ticket-list">
          {registrations.map(item => {
            const isAttended = item.status === 'ATTENDED';
            const isCancelled = item.status === 'CANCELLED';

            return (
              <div key={item.id} className="ticket-card">
                {/* QR preview */}
                <div 
                  className="ticket-qr-preview" 
                  title="Click to enlarge QR pass"
                  onClick={() => setSelectedPass(item)}
                >
                  <img src={item.qr_image} alt="Ticket QR code" />
                </div>

                <div className="ticket-info">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                      {isAttended ? <UserCheck size={13} /> : <CheckCircle2 size={13} />}
                      {item.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Registered on {new Date(item.registered_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3>{item.event_title}</h3>
                  <p className="card-info"><Calendar size={14} /> {item.date} • {item.time}</p>
                  <p className="card-info"><MapPin size={14} /> {item.location}</p>
                  <small style={{ marginTop: '4px', display: 'block', color: '#4f46e5', fontWeight: 600 }}>
                    Pass ID: <code>{item.ticket_code}</code>
                  </small>
                </div>

                <div className="ticket-action">
                  <button 
                    className="btn-primary" 
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
                    onClick={() => setSelectedPass(item)}
                  >
                    View QR Pass
                  </button>

                  {!isAttended && !isCancelled && (
                    <button 
                      className="btn-danger-sm"
                      disabled={cancellingId === item.id}
                      onClick={() => handleCancel(item.id, item.event_title)}
                    >
                      <Trash2 size={13} /> {cancellingId === item.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Pass Enlarged Modal */}
      {selectedPass && (
        <div className="modal-overlay" onClick={() => setSelectedPass(null)}>
          <div className="modal-pass" onClick={e => e.stopPropagation()}>
            <div className="modal-pass-header">
              <button className="modal-close" onClick={() => setSelectedPass(null)}><X size={18} /></button>
              <ShieldCheck size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Venue Admission Pass</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>{selectedPass.event_title}</p>
            </div>

            <div className="modal-pass-body">
              <div className="modal-qr-img">
                <img src={selectedPass.qr_image} alt="Ticket QR code" style={{ width: '100%', height: '100%' }} />
              </div>

              <div className="pass-code-tag">
                {selectedPass.ticket_code}
              </div>

              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Attendee: <strong>{user?.name}</strong>
              </p>
              <p style={{ fontSize: '0.82rem', color: selectedPass.status === 'ATTENDED' ? '#166534' : '#4f46e5', fontWeight: 600, marginTop: '4px' }}>
                Status: {selectedPass.status === 'ATTENDED' ? `Checked-in at venue (${selectedPass.checked_in_at})` : 'Confirmed — Ready for Gate Scan'}
              </p>

              <div className="modal-pass-actions">
                <button className="btn-secondary" onClick={() => downloadTicketSummary(selectedPass)}>
                  <Download size={14} /> Download Pass File
                </button>
                <button className="btn-primary" onClick={() => setSelectedPass(null)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
