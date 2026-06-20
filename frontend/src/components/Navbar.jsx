import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, GraduationCap, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const role = useMemo(() => {
    if (!token) return null;
    const payload = parseJwt(token);
    return payload?.role || null;
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navLinks = [
    { name: t('home'), path: '/', show: !token },
    { name: t('student_space'), path: '/dashboard', show: token && role !== 'admin' },
    { name: t('admin'), path: '/admin', show: token && role === 'admin' },
  ];

  return (
    <nav className="navbar" style={{ padding: '0.85rem 0' }}>
      <div className="container nav-content">
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <GraduationCap size={32} />
            <span style={{ fontSize: '1.4rem', letterSpacing: '-0.02em', fontWeight: '900' }}>
              Internat<span style={{ color: 'var(--primary)', WebkitTextFillColor: 'initial' }}>Hub</span>
            </span>
          </motion.div>
        </Link>

        {/* Desktop Menu */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', marginRight: '1rem' }} className="hidden-mobile">
            {navLinks.filter(l => l.show).map(link => (
              <Link
                key={link.path}
                to={link.path}
                className="nav-link"
                style={{
                  position: 'relative',
                  color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'color 0.3s'
                }}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="activeNav"
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'var(--primary)',
                      borderRadius: '2px'
                    }}
                  />
                )}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LanguageSwitcher />
            {token && <NotificationBell />}
            <ThemeToggle />

            {!token ? (
              <div style={{ display: 'flex', gap: '0.75rem' }} className="hidden-mobile">
                <Link to="/login" className="btn btn-text" style={{ fontSize: '0.95rem' }}>{t('login')}</Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '10px' }}>{t('register')}</Link>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="btn btn-outline hidden-mobile"
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem', borderRadius: '10px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                <LogOut size={16} />
                {t('logout')}
              </button>
            )}

            <button
              className="mobile-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ display: 'none', padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-main)' }}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'var(--card-bg)', backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--card-border)', zIndex: 90,
              overflow: 'hidden'
            }}
          >
            <div className="container" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {navLinks.filter(l => l.show).map(link => (
                <Link key={link.path} to={link.path} style={{ fontSize: '1.1rem', fontWeight: '600' }} className="nav-link">
                  {link.name}
                </Link>
              ))}
              <hr style={{ opacity: 0.1 }} />
              {token ? (
                <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', color: 'var(--danger)' }}>
                  <LogOut size={18} /> {t('logout')}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Link to="/login" className="btn btn-outline" style={{ width: '100%' }}>{t('login')}</Link>
                  <Link to="/register" className="btn btn-primary" style={{ width: '100%' }}>{t('register')}</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
