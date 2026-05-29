import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';
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
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8 md:p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">{t("login")}</h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t("no_account_yet") || "Pas encore de compte ?"} <Link to="/register" className="text-blue-600 font-bold hover:underline">{t("create_account")}</Link>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="alert alert-danger animate-in fade-in slide-in-from-top-4">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="form-label">{t("email")}</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  className="form-input pl-10"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="form-label mb-0">{t("password")}</label>
                <Link to="/forgot-password" size="sm" className="text-xs text-blue-600 font-semibold hover:underline">
                  {t("forgot_password")}
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="form-input px-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3.5 text-lg shadow-blue-500/25 group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   {t("loading")}...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t("connect")}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
