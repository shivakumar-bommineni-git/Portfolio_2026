import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function BlockedTabScreen({ onTakeOver }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', flexDirection: 'column', gap: '1.5rem', padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: 'linear-gradient(135deg,#f59e0b,#d97706)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      <div>
        <div style={{ fontWeight: 900, fontSize: '1.3rem', letterSpacing: '-.4px', marginBottom: '.5rem' }}>
          Session Active in Another Tab
        </div>
        <div style={{ fontSize: '.9rem', color: 'var(--text-muted)', maxWidth: 380, lineHeight: 1.7 }}>
          Your dashboard is already open in another browser tab. Only one tab can access the private workspace at a time.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={onTakeOver}
          style={{
            padding: '.7rem 1.5rem', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff',
            fontWeight: 700, fontSize: '.9rem', fontFamily: 'inherit',
          }}
        >
          Use This Tab Instead
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding: '.7rem 1.5rem', borderRadius: 10, cursor: 'pointer',
            background: 'transparent', border: '1.5px solid var(--border)',
            color: 'var(--text-sec)', fontWeight: 600, fontSize: '.9rem', fontFamily: 'inherit',
          }}
        >
          Close This Tab
        </button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading, blockedTab, claimSession, logout } = useAuth();

  // Push history entry so browser back button stays on protected pages
  useEffect(() => {
    if (!user) return;
    window.history.pushState(null, '', window.location.href);
    const block = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', block);
    return () => window.removeEventListener('popstate', block);
  }, [user]);

  // Claim the session for this tab when the user is authenticated
  useEffect(() => {
    if (user && !loading) claimSession();
  }, [user, loading, claimSession]);

  if (loading) {
    return (
      <div className="full-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (blockedTab) {
    return (
      <BlockedTabScreen
        onTakeOver={() => {
          claimSession();
          window.location.reload();
        }}
      />
    );
  }

  return children;
}
