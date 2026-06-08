import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import FormError from '../components/FormError';
import { motion } from 'framer-motion';

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

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      toast.success(t("success_login") || "Connexion réussie !");

      const payload = parseJwt(token);
      if (payload?.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.detail || t("error_login") || "Échec de la connexion";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-lighten" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bento-card p-8 md:p-12">

          <div className="text-center mb-10 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            >
              <Lock size={32} className="text-blue-600 dark:text-blue-400" />
            </motion.div>
            <h2 className="text-4xl font-black mb-3">{t("login")}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t("no_account_yet") || "Pas encore de compte ?"} <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 underline decoration-2 underline-offset-4 transition-colors">{t("create_account")}</Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <FormError error={error} />

            <div className="form-group">
              <label className="form-label">{t("email")}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="form-input pl-12 shadow-inner"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0">{t("password")}</label>
                <Link to="/forgot-password" size="sm" className="text-xs text-blue-600 font-bold hover:underline underline-offset-2">
                  {t("forgot_password")}
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="form-input pl-12 pr-12 shadow-inner"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-base mt-4 group"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t("loading")}...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t("connect")}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
