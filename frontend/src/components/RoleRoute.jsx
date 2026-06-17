import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const roleHome = () => '/dashboard';

export default function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="full-loader">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}
