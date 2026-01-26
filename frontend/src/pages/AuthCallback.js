import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toaster, toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleLogin } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL fragment
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        toast.error('Invalid authentication response');
        navigate('/login');
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        await googleLogin(sessionId);
        toast.success('Welcome to TATVGYA!');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error(error.message || 'Authentication failed');
        navigate('/login');
      }
    };

    processAuth();
  }, [location.hash, googleLogin, navigate]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <Toaster position="top-center" theme="dark" />
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
