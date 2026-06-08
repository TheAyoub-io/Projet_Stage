import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import logoImg from '../assets/logo.svg';
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
    { name: t('home'), path: '/', show: !token },
    { name: t('student_space'), path: '/dashboard', show: token && role !== 'admin', icon: LayoutDashboard },
    { name: t('admin'), path: '/admin', show: token && role === 'admin', icon: LayoutDashboard },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 sm:pt-6 pointer-events-none transition-all">
      <nav className="pointer-events-auto w-full max-w-6xl rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-[0_8px_32px_rgba(37,99,235,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 relative">
        {/* Subtle top glare effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent rounded-t-2xl" />

        <div className="px-5 sm:px-6 h-16 flex justify-between items-center relative z-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={logoImg}
              alt="Internat Mohamed V"
              className="h-10 w-auto object-contain transition-transform duration-300 ease-out group-hover:scale-105"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4 lg:gap-6">
            <div className="flex gap-1.5 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              {navLinks.filter(l => l.show).map(link => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300"
                    style={{
                      color: isActive ? 'white' : 'var(--text-muted)',
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav_active_pill"
                        className="absolute inset-0 bg-blue-600 rounded-full -z-10 shadow-lg shadow-blue-600/30"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {link.icon && <link.icon size={16} className={isActive ? "text-white/90" : "text-blue-600 dark:text-blue-400"} />}
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50 mx-1" />

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              {token && <NotificationBell />}

              {token ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-sm text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-red-200/50 dark:border-red-800/30"
                >
                  <LogOut size={15} className="mr-1.5" />
                  {t('logout')}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn btn-sm btn-ghost font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    {t('login')}
                  </Link>
                  <Link to="/register" className="btn btn-sm btn-primary">
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            <motion.div animate={{ rotate: isMenuOpen ? 180 : 0 }}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.div>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="lg:hidden border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl"
            >
              <div className="px-6 py-6 flex flex-col gap-4">
                {navLinks.filter(l => l.show).map(link => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="text-base font-bold flex items-center gap-3 py-2 px-4 rounded-xl transition-colors"
                      style={{
                        color: isActive ? 'var(--primary)' : 'var(--text-main)',
                        background: isActive ? 'var(--primary-light)' : 'transparent'
                      }}
                    >
                      {link.icon && <link.icon size={20} className={isActive ? "" : "text-blue-500"} />}
                      {link.name}
                    </Link>
                  );
                })}
                <div className="w-full h-[1px] bg-slate-200/50 dark:bg-slate-700/50 my-2" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                  {token ? (
                    <button onClick={handleLogout} className="text-red-500 font-bold flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">
                      <LogOut size={18} /> {t('logout')}
                    </button>
                  ) : (
                    <div className="flex gap-3 w-full max-w-[200px]">
                      <Link to="/login" className="btn btn-sm btn-outline flex-1">{t('login')}</Link>
                      <Link to="/register" className="btn btn-sm btn-primary flex-1">{t('register')}</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};

export default Navbar;
