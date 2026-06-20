import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/axios';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';

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
      setStatus({ type: 'danger', message: err.response?.data?.detail || t('verify_code_error') });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'danger', message: t('passwords_dont_match') });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await api.post('/auth/reset-password', {
        token: code.trim(),
        new_password: newPassword
      });
      setStatus({ type: 'success', message: response.data.message || t('reset_password_success') });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setStatus({ type: 'danger', message: err.response?.data?.detail || t('reset_password_error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-panel auth-card animate-up" style={{ minHeight: '350px' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <h2>{step === 1 ? t('verify_code_title') : t('new_password_title')}</h2>
          <p>
            {step === 1
              ? t('verify_code_subtitle')
              : t('new_password_subtitle')}
          </p>
        </div>

        {status.message && (
          <div className={`alert alert-${status.type}`} style={{ marginBottom: '1.5rem' }}>
            {status.message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleVerifyCode} autoComplete="off">
            <div className="form-group">
              <label className="form-label">{t('verification_code')}</label>
              <input
                type="text"
                required
                className="form-input"
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
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1.5rem', marginTop: '1rem', padding: '0.9rem' }}
            >
              {loading ? t('verifying') : t('continue')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} autoComplete="off">
            <div className="form-group">
              <label className="form-label">{t("new_password")}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("confirm_password")}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1.5rem', marginTop: '1rem', padding: '0.9rem' }}
            >
              {loading ? t('resetting') : t('reset_password_btn')}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <ChevronLeft size={16} /> {t("back_to_login")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
