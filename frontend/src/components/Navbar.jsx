import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import logoImg from '../assets/official_logo.png';
import { AnimatePresence, motion } from 'framer-motion';
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
    { name: t('student_space'), path: '/dashboard', show: token && role !== 'admin', icon: LayoutDashboard },
    { name: t('admin'), path: '/admin', show: token && role === 'admin', icon: LayoutDashboard },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left side: Hamburger (Admin) + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {location.pathname === '/admin' && (
            <button 
              onClick={() => window.dispatchEvent(new Event('toggleAdminSidebar'))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', borderRadius: '12px',
                border: '1px solid #e2e8f0', background: 'white',
                cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              title="Ouvrir le menu"
            >
              <Menu size={20} color="#334155" />
            </button>
          )}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <img
              src={logoImg}
              alt="e-Internat"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
            <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b', letterSpacing: '-0.01em' }}>
              e - Internat
            </span>
          </Link>
        </div>

        {/* Desktop right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden lg:flex">
          {/* Nav links */}
          {navLinks.filter(l => l.show).map(link => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#059669' : '#64748b',
                  background: isActive ? '#ecfdf5' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {link.icon && <link.icon size={16} />}
                {link.name}
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }} />

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notification bell */}
          {token && <NotificationBell />}

          {/* Auth buttons */}
          {token ? (
            role !== 'admin' && (
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1.5px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <LogOut size={15} />
                {t('logout')}
              </button>
            )
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                to="/login"
                style={{
                  padding: '7px 18px',
                  borderRadius: '20px',
                  border: '1.5px solid #e2e8f0',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                style={{
                  padding: '7px 18px',
                  borderRadius: '20px',
                  border: 'none',
                  background: '#059669',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden"
          style={{
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
          }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navLinks.filter(l => l.show).map(link => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      color: isActive ? '#059669' : '#1e293b',
                      background: isActive ? '#ecfdf5' : 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    {link.icon && <link.icon size={18} />}
                    {link.name}
                  </Link>
                );
              })}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                  {token ? (
                    role !== 'admin' && (
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: 'none',
                          background: '#fef2f2',
                          color: '#dc2626',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        <LogOut size={16} /> {t('logout')}
                      </button>
                    )
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to="/login" style={{ padding: '8px 16px', borderRadius: '20px', border: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none' }}>{t('login')}</Link>
                      <Link to="/register" style={{ padding: '8px 16px', borderRadius: '20px', background: '#059669', color: 'white', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none' }}>{t('register')}</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
