import React from 'react';
import { Cloud, ShieldCheck, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content" style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.4rem' }}>
          Serverless Event Registration Portal (SERP) — Cloud Systems Project
        </p>
        <p style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Zap size={14} color="#6366f1" /> ACID Atomic Seat Locking</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} color="#10b981" /> Cryptographic QR Gate Check-in</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Cloud size={14} color="#3b82f6" /> Asynchronous Cloud Queue (SQS/SES Simulator)</span>
        </p>
        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          Designed for high availability, zero overbooking concurrency guarantees, and sub-10ms response latencies.
        </p>
      </div>
    </footer>
  );
}
