import { useState, useEffect } from 'react';

export default function NetworkStatusToast() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('online'); // 'online' | 'offline'

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setToastType('online');
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 3500);
      return () => clearTimeout(t);
    }

    function handleOffline() {
      setIsOnline(false);
      setToastType('offline');
      setShowToast(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showToast && isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 14,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      pointerEvents: 'none',
      animation: 'slideDown .25s ease both',
    }}>
      <div style={{
        background: toastType === 'online'
          ? 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))'
          : 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))',
        color: '#fff',
        padding: '8px 18px',
        borderRadius: 24,
        fontSize: 12.5,
        fontWeight: 800,
        letterSpacing: '0.3px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: toastType === 'online'
          ? '0 8px 24px rgba(16,185,129,0.45)'
          : '0 8px 24px rgba(239,68,68,0.45)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.25)',
      }}>
        <span style={{ fontSize: 14 }}>
          {toastType === 'online' ? '🟢' : '📡'}
        </span>
        <span>
          {toastType === 'online'
            ? 'Back Online — Reconnected to DASIG Regional Cloud'
            : 'Offline Mode Active — Cached credentials & schedules available'}
        </span>
      </div>
    </div>
  );
}
