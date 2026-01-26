import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_80151a13-9706-49c2-8de6-38da4bc2b104/artifacts/j7knm7to_tatvgya%20logo.png";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin, isEducator } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore', path: '/explore' },
    { name: 'About Us', path: '/about' },
    { name: 'Vision', path: '/vision' },
    { name: 'Contact', path: '/contact' },
  ];

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isEducator) return '/educator';
    return '/dashboard';
  };

  return (
    <nav
      data-testid="navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" data-testid="logo-link">
            <img
              src={LOGO_URL}
              alt="TATVGYA"
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1 px-8">
            <div className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`nav-${link.name.toLowerCase().replace(' ', '-')}`}
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  data-testid="user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FFB800] flex items-center justify-center">
                    <User size={16} className="text-black" />
                  </div>
                  <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={16} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 glass-card p-2"
                    >
                      <Link
                        to={getDashboardLink()}
                        data-testid="dashboard-link"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        Dashboard
                      </Link>
                      <button
                        data-testid="logout-btn"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <LogOut size={14} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                data-testid="login-btn"
                className="btn-primary text-sm"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            data-testid="mobile-menu-btn"
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`mobile-nav-${link.name.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-lg ${
                    location.pathname === link.path ? 'text-[#FFB800]' : 'text-white/70'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-white/10">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 text-lg text-white/70"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block py-2 text-lg text-white/70"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-lg text-[#FFB800]"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;
