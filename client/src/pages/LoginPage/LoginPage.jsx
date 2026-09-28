import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import {
  FaSignInAlt,
  FaShieldAlt,
  FaSpinner,
  FaExclamationCircle,
} from 'react-icons/fa';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const { orgConfig } = useOrg();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await login(email.trim(), password);
      if (res && !res.success) {
        setError(res.message || 'Login failed. Please check credentials.');
        return;
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="brand-logo-circle">
            <span className="logo-spark">⚡</span>
          </div>
          <h2>{orgConfig.name} Portal</h2>
          <p>Sign in to report civic issues & track maintenance dispatch</p>
          <div className="secure-badge">
            <FaShieldAlt /> Secure Account Access
          </div>
        </div>

        {error && (
          <div className="login-error-alert">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Email/Password Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. member@organization.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>

          {/* Quick Demo Credential Autofill Chips */}
          <div className="demo-credentials-wrap">
            <span className="demo-chips-label">Quick Fill Roles:</span>
            <div className="demo-chips-row">
              <button
                type="button"
                className="demo-chip-btn super"
                onClick={() => {
                  setEmail('superadmin@quickfix.org');
                  setPassword('quickfix2026');
                }}
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                className="demo-chip-btn admin"
                onClick={() => {
                  setEmail('admin.campus@gift.ac.in');
                  setPassword('quickfix2026');
                }}
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                className="demo-chip-btn staff"
                onClick={() => {
                  setEmail('maintenance.staff@gift.ac.in');
                  setPassword('quickfix2026');
                }}
              >
                🛠️ Staff
              </button>
              <button
                type="button"
                className="demo-chip-btn student"
                onClick={() => {
                  setEmail('student.demo@gift.ac.in');
                  setPassword('quickfix2026');
                }}
              >
                🎓 Student
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-login-btn"
            disabled={loading}
          >
            {loading ? <FaSpinner className="spin" /> : <FaSignInAlt />} Sign In
          </button>
        </form>

        {/* Footer Link */}
        <div className="login-footer">
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="register-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
