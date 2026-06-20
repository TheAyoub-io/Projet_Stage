import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
      const errMsg = err.response?.data?.detail || t("error_login");
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-panel auth-card animate-up">
        <div className="auth-header">
          <h2>{t("login")}</h2>
          <p>{t("home")} <Link to="/register" className="auth-link">{t("create_account")}</Link></p>
        </div>
        <form onSubmit={handleLogin} autoComplete="off">
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="form-group">
            <label className="form-label">{t("email")}</label>
            <input type="email" required className="form-input" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">{t("password")}</label>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>{t("forgot_password")}</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? "text" : "password"} required className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: 0, paddingRight: '2.5rem' }} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? t("loading") : t("connect")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
