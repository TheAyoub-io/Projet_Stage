import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import FormError from '../components/FormError';
import { motion } from 'framer-motion';
import { useRegister } from '../hooks/useAuth';

const Register = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { mutate: register, isPending: loading } = useRegister();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
          );
          const payload = JSON.parse(jsonPayload);
          if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
            if (payload.role === 'admin') navigate('/admin', { replace: true });
            else navigate('/dashboard', { replace: true });
          }
        }
      } catch (e) {
        // invalid token, ignore
      }
    }
  }, [navigate]);

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t("passwords_dont_match") || "Les mots de passe ne correspondent pas.");
      return;
    }

    register({ email, password }, {
      onSuccess: () => {
        toast.success(t("success_register") || "Compte créé avec succès !");
        navigate('/login', { state: { message: t("success_register_login") || 'Inscription réussie ! Veuillez vous connecter.' } });
      },
      onError: (err) => {
        const errMsg = err.response?.data?.detail || t("error_register") || 'Échec de l\'inscription.';
        setError(errMsg);
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-lighten" />

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
              <UserPlus size={32} className="text-blue-600 dark:text-blue-400" />
            </motion.div>
            <h2 className="text-4xl font-black mb-3">{t("register")}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t("already_have_account") || "Déjà un compte ?"} <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 underline decoration-2 underline-offset-4 transition-colors">{t("login")}</Link>
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6 relative z-10">
            <FormError error={error} />

            <div className="form-group">
              <label className="form-label">{t("email")}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  className="form-input pl-12 shadow-inner"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("password")}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
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

            <div className="form-group">
              <label className="form-label">{t("confirm_password") || "Confirmer le mot de passe"}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="form-input pl-12 pr-12 shadow-inner"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-base mt-2 group"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t("loading")}...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserPlus size={20} />
                  {t("register")}
                  <ArrowRight size={20} className="ml-auto group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
