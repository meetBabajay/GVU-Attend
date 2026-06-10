import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="spinner"></div>
        <span className="text-xs text-slate-550 mt-3 font-semibold">Validating session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user.role === 'lecturer') return <Navigate to="/instructor-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user.role === 'lecturer') return <Navigate to="/instructor-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/instructor-dashboard" element={
          <ProtectedRoute allowedRole="lecturer">
            <InstructorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
