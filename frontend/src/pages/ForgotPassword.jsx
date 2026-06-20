import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setStatus({ type: 'success', message: response.data.message || t('forgot_password_success') });
      setTimeout(() => {
        navigate('/reset-password');
      }, 1500);
    } catch (err) {
      setStatus({ type: 'danger', message: err.response?.data?.detail || t('error_occurred') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-panel auth-card animate-up">
        <div className="auth-header">
          <h2>{t("forgot_password_title")}</h2>
          <p>{t("forgot_password_subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          {status.message && (
            <div className={`alert alert-${status.type}`}>
              {status.message}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t("email")}</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? t('sending') : t('send_link')}
          </button>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <ChevronLeft size={16} /> {t("back_to_login")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
