import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container auth-wrapper">
      <div className="auth-card">
        <h2>{isLogin ? 'Sign In to SERP Cloud' : 'Create an Account'}</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
          {isLogin ? 'Access your cloud passes & credentials' : 'Register to reserve limited event seats'}
        </p>

        {errorMsg && (
          <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Alex Chen" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Account Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="student">Student / Attendee</option>
                  <option value="organizer">Event Organizer / Faculty</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="user@domain.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-primary full-width" disabled={loading} style={{ padding: '0.75rem' }}>
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* 1-Click Demo Accounts Box for Presentation */}
        <div className="demo-accounts-box">
          <p><KeyRound size={13} style={{ display: 'inline', marginRight: 4 }} /> 1-Click Demo Accounts for Viva / Review:</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className="demo-acc-btn"
              onClick={() => handleQuickLogin('student@serp.cloud', 'student123')}
            >
              👤 Student (Alex)
            </button>
            <button 
              type="button"
              className="demo-acc-btn"
              onClick={() => handleQuickLogin('organizer@serp.cloud', 'organizer123')}
            >
              🛡️ Organizer (Prof. Sarah)
            </button>
          </div>
        </div>

        <p className="auth-toggle">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
