import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ChevronLeft, CheckCircle, AlertCircle, Send } from 'lucide-react';
import api from '../lib/axios';
import { useTranslation } from 'react-i18next';
import { useForgotPassword } from '../hooks/useAuth';
const logoImg = '/app_logo.png';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const navigate = useNavigate();
  const { mutate: forgotPassword, isPending: loading } = useForgotPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    forgotPassword({ email }, {
      onSuccess: (response) => {
        setStatus({ type: 'success', message: response.message || t('forgot_password_success') });
        setTimeout(() => navigate('/reset-password'), 1500);
      },
      onError: (err) => {
        setStatus({ type: 'danger', message: err.response?.data?.detail || t('error_occurred') });
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="w-full max-w-md">
        <div className="glass-panel p-8 md:p-10">

          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-blue-900 to-indigo-700 rounded-2xl p-2 shadow-lg shadow-blue-900/30 inline-block overflow-hidden">
                <img src={logoImg} alt="Internat Mohamed V" className="h-16 w-16 object-cover rounded-xl" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3">{t('forgot_password_title') || 'Mot de passe oublié'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t('forgot_password_subtitle') || 'Entrez votre adresse email pour recevoir un code de réinitialisation.'}
            </p>
          </div>

          {/* Alert */}
          {status.message && (
            <div className={`flex items-start gap-3 p-4 rounded-xl mb-6 text-sm font-medium border ${status.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              }`}>
              {status.type === 'success'
                ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
                : <AlertCircle size={18} className="shrink-0 mt-0.5" />
              }
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="form-label">{t('email') || 'Adresse email'}</label>
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  required
                  className="form-input pl-10"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3.5 text-lg shadow-blue-500/25 group"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('sending') || 'Envoi en cours...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send size={18} />
                  {t('send_link') || 'Envoyer le code'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ChevronLeft size={16} />
                {t('back_to_login') || 'Retour à la connexion'}
              </Link>
            </div>
          </form>
        </div>

        {/* Subtle helper hint */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          Vous n'avez pas de compte ?{' '}
          <Link to="/register" className="text-blue-500 hover:underline font-semibold">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
