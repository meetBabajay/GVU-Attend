import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAdmin = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="spinner" />
        <span className="text-xs text-slate-550 mt-3 font-semibold">Validating session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    // Redirect non-admin users to appropriate dashboard
    return <Navigate to={user.role === 'student' ? '/student-dashboard' : '/instructor-dashboard'} replace />;
  }

  return children;
};

export default RequireAdmin;
