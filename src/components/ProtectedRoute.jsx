import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userData, isAdmin, isMember } = useAuth();

  if (!currentUser) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    // Requires admin but user is not
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'member' && !isMember) {
    // Requires member but user is guest (or lower)
    // Send them to dashboard where they see 'pending' message
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
