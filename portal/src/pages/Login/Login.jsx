import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLoginMutation } from '../../services/endpoints/authApi';
import './Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/subscriptions';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await login({ email, password }).unwrap();
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" style={{ display: 'inline-block', marginBottom: '16px', color: 'var(--muted)', fontSize: '13px', textDecoration: 'none' }}>
          ← Back to Brightloop Home
        </Link>

        <div className="auth-header">
          <h1>Customer Portal</h1>
          <p>Sign in to manage your subscriptions and invoices</p>
        </div>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: 'var(--space-4)' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)' }}>Create one</Link>
          <div style={{ marginTop: '10px' }}>
            Looking for Ops Console? <a href="http://localhost:5174/login" style={{ color: 'var(--color-primary)' }}>Sign in to Ops ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
