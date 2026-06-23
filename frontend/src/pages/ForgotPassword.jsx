import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ChevronLeft, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/axios';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/official_logo.png';
import { useForgotPassword } from '../hooks/useAuth';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const navigate = useNavigate();
  const { mutate: forgotPassword, isPending: loading } = useForgotPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    forgotPassword(email, {
      onSuccess: (response) => {
        setStatus({ type: 'success', message: response.message || t('forgot_password_success') });
        setTimeout(() => navigate('/reset-password'), 1500);
      },
      onError: (err) => {
        let detail = err.response?.data?.detail;
        if (Array.isArray(detail)) detail = detail[0].msg;
        setStatus({ type: 'danger', message: detail || t('error_occurred') });
      }
    });
  };

  return (
    <div className="flex-1 flex w-full relative overflow-hidden bg-slate-50 min-h-[calc(100vh-64px)] items-center justify-center p-4">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-sky-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/40">
          <div className="flex flex-col items-center text-center mb-8">
            <img src={logoImg} alt="Logo" className="h-12 w-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              {t('forgot_password_title') || 'Mot de passe oublié'}
            </h2>
            <p className="text-slate-500 font-medium">
              {t('forgot_password_subtitle') || 'Entrez votre email pour recevoir un code de réinitialisation.'}
            </p>
          </div>

          {status.message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`alert alert-${status.type === 'success' ? 'success' : 'danger'} mb-6`}
            >
              {status.type === 'success' ? <CheckCircle size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
              <span>{status.message}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            <div className="form-group mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('email') || 'Adresse email'}</label>
              <input
                type="email"
                required
                className="form-input transition-all duration-300"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('sending') || 'Envoi...'}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {t('send_link') || 'Envoyer le code'} <Send size={18} />
                </span>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ChevronLeft size={16} /> {t('back_to_login') || 'Retour à la connexion'}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
