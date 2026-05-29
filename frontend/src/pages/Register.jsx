import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(t("passwords_dont_match") || "Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', { email, password });
      toast.success(t("success_register") || "Compte créé avec succès !");
      navigate('/login', { state: { message: t("success_register_login") || 'Inscription réussie ! Veuillez vous connecter.' } });
    } catch (err) {
      const errMsg = err.response?.data?.detail || t("error_register") || 'Échec de l\'inscription.';
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
            <h2 className="text-3xl font-bold mb-3">{t("register")}</h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t("already_have_account") || "Déjà un compte ?"} <Link to="/login" className="text-blue-600 font-bold hover:underline">{t("login")}</Link>
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
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
                  placeholder="etudiant@institution.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="form-label">{t("password")}</label>
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

            <div className="space-y-2">
              <label className="form-label">{t("confirm_password") || "Confirmer le mot de passe"}</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="form-input px-10"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  <UserPlus size={20} />
                  {t("register")}
                  <ArrowRight size={20} className="ml-auto group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
