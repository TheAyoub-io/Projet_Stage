import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, GraduationCap, Menu, X, LayoutDashboard, User, LogIn } from 'lucide-react';
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
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="container mx-auto px-6 h-20 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-blue-600 rounded-lg text-white group-hover:rotate-6 transition-transform">
            <GraduationCap size={24} />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            Internat<span className="text-blue-600">Hub</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-6">
            {navLinks.filter(l => l.show).map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-bold flex items-center gap-2 transition-colors ${
                  location.pathname === link.path
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.icon && <link.icon size={18} />}
                {link.name}
              </Link>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            {token && <NotificationBell />}

            {token ? (
              <button
                onClick={handleLogout}
                className="btn btn-outline border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-100 py-2 px-4 text-xs uppercase tracking-widest"
              >
                <LogOut size={16} className="mr-2" />
                {t('logout')}
              </button>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 px-4 py-2">
                  {t('login')}
                </Link>
                <Link to="/register" className="btn btn-primary py-2 px-5 text-sm shadow-blue-500/20">
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-3 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-90"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
              {navLinks.filter(l => l.show).map(link => (
                <Link key={link.path} to={link.path} className="text-lg font-bold flex items-center gap-3">
                  {link.icon && <link.icon size={20} className="text-blue-600" />}
                  {link.name}
                </Link>
              ))}
              <hr className="border-slate-100 dark:border-slate-800" />
              <div className="flex items-center justify-between">
                 <div className="flex gap-4">
                    <LanguageSwitcher />
                    <ThemeToggle />
                 </div>
                 {token ? (
                    <button onClick={handleLogout} className="text-red-600 font-bold flex items-center gap-2">
                       <LogOut size={20} /> {t('logout')}
                    </button>
                 ) : (
                    <div className="flex gap-4">
                       <Link to="/login" className="font-bold">{t('login')}</Link>
                       <Link to="/register" className="text-blue-600 font-bold">{t('register')}</Link>
                    </div>
                 )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
