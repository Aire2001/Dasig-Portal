import { useState, useEffect } from 'react';
import { api } from '../api';

export default function ColdStartBanner() {
  const [waking, setWaking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer = setTimeout(() => {
      // If health check hasn't responded within 1.5s, the free Render node is likely cold-starting
      if (mounted) setWaking(true);
    }, 1500);

    api.health()
      .then(() => {
        clearTimeout(timer);
        if (mounted) setWaking(false);
      })
      .catch(() => {
        // Render node is booting or offline
      });

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (!waking || dismissed) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #1e3a8a, #0f172a)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.4)',
      padding: '8px 16px',
      fontSize: 12,
      color: '#bfdbfe',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          display: 'inline-block',
          width: 8, height: 8,
          borderRadius: '50%',
          background: '#38bdf8',
          animation: 'pulse 1.5s infinite',
        }} />
        <span>
          <strong>⚡ Central Visayas Cloud API initializing:</strong> Resuming secure cloud node from idle standby. Live data will connect shortly.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14,
          cursor: 'pointer',
          padding: '2px 6px',
        }}
        title="Dismiss notice"
      >
        ✕
      </button>
    </div>
  );
}

