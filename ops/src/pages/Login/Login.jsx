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
  const from = location.state?.from?.pathname || '/';

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
        <a
          href="http://localhost:5173/"
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            color: 'var(--muted, #6f6e68)',
            fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          ← Back to Brightloop Home
        </a>

        <div className="auth-header">
          <h1>Brightloop Ops</h1>
          <p>Sign in to manage subscriptions, billing & operations</p>
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

          <div className="form-actions">
            <Link to="/forgot-password" style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-primary)' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--color-text-muted)' }}>
          Are you a customer?{' '}
          <a href="http://localhost:5173/login" style={{ color: 'var(--color-primary)' }}>
            Customer Portal ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
