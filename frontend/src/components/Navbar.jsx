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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Hamburger (Admin) + Logo */}
          <div className="flex items-center gap-4">
            {location.pathname === '/admin' && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => window.dispatchEvent(new Event('toggleAdminSidebar'))}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Ouvrir le menu"
              >
                <Menu size={20} />
              </motion.button>
            )}
            <Link to="/" className="flex items-center gap-3 no-underline group">
              <img
                src={logoImg}
                alt="e-Internat"
                className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-extrabold text-lg text-slate-800 dark:text-white tracking-tight leading-none">
                e - <span className="text-emerald-600 dark:text-emerald-400 bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Internat</span>
              </span>
            </Link>
          </div>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Nav links */}
            {navLinks.filter(l => l.show).map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold no-underline transition-all duration-300 ${
                    isActive 
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {link.icon && <link.icon size={15} />}
                  {link.name}
                </Link>
              );
            })}

            {/* Divider */}
            {token && <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />}

            {/* Language switcher */}
            <LanguageSwitcher />

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notification bell */}
            {token && <NotificationBell />}

            {/* Auth buttons */}
            {token ? (
              role !== 'admin' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 text-xs font-bold cursor-pointer transition-all hover:bg-red-100 dark:hover:bg-red-950/40"
                >
                  <LogOut size={14} />
                  {t('logout')}
                </motion.button>
              )
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 text-xs font-bold no-underline transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold no-underline transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="border-t border-slate-200/50 dark:border-slate-800/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg overflow-hidden lg:hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {navLinks.filter(l => l.show).map(link => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold no-underline transition-colors ${
                      isActive 
                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600' 
                        : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {link.icon && <link.icon size={18} />}
                    {link.name}
                  </Link>
                );
              })}

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                  {token ? (
                    role !== 'admin' && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 font-bold text-xs cursor-pointer"
                      >
                        <LogOut size={15} /> {t('logout')}
                      </motion.button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      <Link to="/login" className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 text-xs font-bold no-underline">{t('login')}</Link>
                      <Link to="/register" className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold no-underline shadow-sm">{t('register')}</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
