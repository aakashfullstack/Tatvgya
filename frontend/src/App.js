import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Article from './pages/Article';
import EducatorProfile from './pages/EducatorProfile';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Contact from './pages/Contact';
import About from './pages/About';
import Vision from './pages/Vision';
import StudentDashboard from './pages/StudentDashboard';
import EducatorDashboard from './pages/EducatorDashboard';
import ArticleEditor from './pages/ArticleEditor';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Router with Auth Callback Detection
const AppRouter = () => {
  const location = useLocation();
  
  // Check URL fragment for session_id (Emergent Auth callback)
  // This check must happen synchronously during render, NOT in useEffect
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/article/:id" element={<Article />} />
      <Route path="/educator/:id" element={<EducatorProfile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />
      <Route path="/vision" element={<Vision />} />

      {/* Student Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Educator Routes */}
      <Route
        path="/educator"
        element={
          <ProtectedRoute allowedRoles={['educator', 'admin']}>
            <EducatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/educator/create"
        element={
          <ProtectedRoute allowedRoles={['educator', 'admin']}>
            <ArticleEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/educator/edit/:id"
        element={
          <ProtectedRoute allowedRoles={['educator', 'admin']}>
            <ArticleEditor />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
