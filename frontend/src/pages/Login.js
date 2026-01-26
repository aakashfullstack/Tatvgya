import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Toaster, toast } from 'sonner';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_80151a13-9706-49c2-8de6-38da4bc2b104/artifacts/j7knm7to_tatvgya%20logo.png";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { login, register, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      } else {
        await register(formData.name, formData.email, formData.password);
        setEmail(formData.email);
        setShowOtp(true);
        toast.success('OTP sent to your email');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await verifyOtp(email, otp);
      toast.success('Email verified! Welcome to TATVGYA');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <Toaster position="top-center" theme="dark" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex justify-center mb-8">
          <img src={LOGO_URL} alt="TATVGYA" className="h-16" />
        </Link>

        {showOtp ? (
          /* OTP Verification */
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Verify Your Email
            </h2>
            <p className="text-white/60 text-center mb-8">
              Enter the OTP sent to {email}
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label className="block text-white/60 text-sm mb-2">OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  data-testid="otp-input"
                  className="input-field text-center text-2xl tracking-[0.5em]"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="verify-otp-btn"
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <span>Verify Email</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => setShowOtp(false)}
              className="w-full text-center text-white/60 hover:text-white mt-4 text-sm"
            >
              Back to signup
            </button>
          </div>
        ) : (
          /* Login / Signup Form */
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-white/60 text-center mb-8">
              {isLogin
                ? 'Login to continue your learning journey'
                : 'Join thousands of learners on TATVGYA'}
            </p>

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleLogin}
              data-testid="google-login-btn"
              className="w-full btn-secondary flex items-center justify-center space-x-3 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0A0A0A] text-white/40">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-white/60 text-sm mb-2">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      data-testid="name-input"
                      className="input-field pl-12"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white/60 text-sm mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    data-testid="email-input"
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    data-testid="password-input"
                    className="input-field pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="submit-btn"
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>{isLogin ? 'Logging in...' : 'Creating account...'}</span>
                ) : (
                  <>
                    <span>{isLogin ? 'Login' : 'Create Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-white/60 mt-6">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                data-testid="toggle-auth-mode"
                className="text-[#FFB800] hover:underline font-medium"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        )}

        <p className="text-center text-white/40 text-sm mt-8">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-white/60 hover:text-white">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-white/60 hover:text-white">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
