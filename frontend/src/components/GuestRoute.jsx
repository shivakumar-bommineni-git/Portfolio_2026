import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { readAuth } from '../utils/tabSession';

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  // Fast path — localStorage has auth data, redirect instantly with no flicker
  if (readAuth() || user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="full-loader">
        <div className="spinner" style={{ border: '2.5px solid var(--border)', borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  return children;
}
