import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Eye, EyeOff, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import logoImg from '../assets/official_logo.png';
import { useResetPassword } from '../hooks/useAuth';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { mutate: resetPassword, isPending: resetting } = useResetPassword();

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code) {
      setStatus({ type: 'danger', message: 'Veuillez entrer le code de vérification.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/auth/verify-reset-code', {
        token: code.trim()
      });
      setStatus({ type: 'success', message: t('verify_code_success') });
      setStep(2);
    } catch (err) {
      let detail = err.response?.data?.detail;
      if (Array.isArray(detail)) detail = detail[0].msg;
      setStatus({ type: 'danger', message: detail || t('verify_code_error') });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'danger', message: t('passwords_dont_match') });
      return;
    }

    setStatus({ type: '', message: '' });

    resetPassword({ token: code.trim(), newPassword }, {
      onSuccess: (response) => {
        setStatus({ type: 'success', message: response.message || t('reset_password_success') });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      },
      onError: (err) => {
        let detail = err.response?.data?.detail;
        if (Array.isArray(detail)) detail = detail[0].msg;
        setStatus({ type: 'danger', message: detail || t('reset_password_error') });
      }
    });
  };

  return (
    <div className="flex-1 flex w-full relative overflow-hidden bg-slate-50 min-h-[calc(100vh-64px)] items-center justify-center p-4">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/40 min-h-[460px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center text-center mb-8">
                  <img src={logoImg} alt="Logo" className="h-12 w-auto mb-4" />
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                    {t('verify_code_title')}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    {t('verify_code_subtitle')}
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

                <form onSubmit={handleVerifyCode} autoComplete="off" className="space-y-5">
                  <div className="form-group mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('verification_code')}</label>
                    <input
                      type="text"
                      required
                      className="form-input transition-all duration-300"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={6}
                      style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length < 5}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('verifying')}...
                      </span>
                    ) : (
                      t('continue')
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col items-center text-center mb-8">
                  <img src={logoImg} alt="Logo" className="h-12 w-auto mb-4" />
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                    {t('new_password_title')}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    {t('new_password_subtitle')}
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

                <form onSubmit={handleResetPassword} autoComplete="off" className="space-y-4">
                  <div className="form-group mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('new_password')}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="form-input transition-all duration-300"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={8}
                        autoComplete="new-password"
                        style={{ paddingRight: '3rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('confirm_password')}</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="form-input transition-all duration-300"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        autoComplete="new-password"
                        style={{ paddingRight: '3rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetting || !newPassword || !confirmPassword}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors mt-4"
                  >
                    {resetting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('resetting')}...
                      </span>
                    ) : (
                      t('reset_password_btn')
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ChevronLeft size={16} /> {t('back_to_login')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
