import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/official_logo.png';
import FormError from '../components/FormError';
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
          const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
          if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
            if (payload.role === 'admin') navigate('/admin', { replace: true });
            else navigate('/dashboard', { replace: true });
          }
        }
      } catch { /* invalid token */ }
    }
  }, [navigate]);

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('passwords_dont_match') || 'Les mots de passe ne correspondent pas.');
      return;
    }
    register({ email, password }, {
      onSuccess: () => {
        toast.success(t('success_register') || 'Compte créé avec succès !');
        navigate('/login', { state: { message: t('success_register_login') || 'Inscription réussie ! Veuillez vous connecter.' } });
      },
      onError: (err) => {
        let detail = err.response?.data?.detail;
        if (Array.isArray(detail)) detail = detail[0].msg;
        const errMsg = detail || t('error_register') || "Échec de l'inscription.";
        setError(errMsg);
      }
    });
  };

  const inputStyle = { paddingRight: '3rem' };

  return (
    <div className="flex-1 flex w-full relative overflow-hidden bg-slate-50 min-h-[calc(100vh-64px)]">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] right-[20%] w-[40%] h-[40%] rounded-full bg-sky-400/20 mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[480px] flex rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100"
        >
          {/* Form */}
          <div className="w-full p-8 sm:p-12 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto">
              <div className="flex flex-col items-center text-center mb-8">
                <img src={logoImg} alt="Logo" className="h-12 w-auto mb-4" />
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {t('register_to_einternat') || 'Inscription à e-Internat'}
                </h2>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <FormError error={error} />

                {/* Email */}
                <div className="form-group mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('username') || "Nom d'utilisateur"}</label>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    className="form-input transition-all duration-300"
                    placeholder="etudiant@domaine.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {/* Password */}
                <div className="form-group mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('password') || 'Mot de passe'}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="form-input transition-all duration-300"
                      placeholder="••••••••"
                      style={{ paddingRight: '3rem' }}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
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

                {/* Confirm Password */}
                <div className="form-group mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('confirm_password') || 'Confirmer le mot de passe'}</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="form-input transition-all duration-300"
                      placeholder="••••••••"
                      style={{ paddingRight: '3rem' }}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('loading')}...
                    </span>
                  ) : (
                    t('register') || "S'inscrire"
                  )}
                </button>

                {/* Login link */}
                <p className="text-center mt-6 text-sm text-slate-500">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                    Se connecter
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
