import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import {
  FaSignInAlt,
  FaGoogle,
  FaShieldAlt,
  FaUserGraduate,
  FaTools,
  FaUserShield,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle
} from 'react-icons/fa';
import './LoginPage.css';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
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
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFastDemoLogin = async (demoEmail, demoPassword) => {
    try {
      setLoading(true);
      setError('');
      setEmail(demoEmail);
      setPassword(demoPassword);
      await login(demoEmail, demoPassword);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError('Demo login failed. Ensure database has been seeded.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      await googleLogin(credentialResponse.credential);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError('Google Sign-In failed.');
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
          <h2>QuickFix Campus Portal</h2>
          <p>Sign in to report civic issues & track maintenance dispatch</p>
          <div className="jwt-badge">
            <FaShieldAlt /> 7-Day Persistent JWT Session
          </div>
        </div>

        {error && (
          <div className="login-error-alert">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Google OAuth Section */}
        <div className="oauth-section">
          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google OAuth Login failed.')}
              theme="filled_black"
              shape="pill"
              text="signin_with"
              width="100%"
            />
          </div>
          <div className="divider-row">
            <span>or sign in with email</span>
          </div>
        </div>

        {/* Standard Email/Password Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Campus Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. student@gift.edu.in"
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

          <button
            type="submit"
            className="submit-login-btn"
            disabled={loading}
          >
            {loading ? <FaSpinner className="spin" /> : <FaSignInAlt />} Sign In
          </button>
        </form>

        {/* Fast Evaluation 1-Click Demo Accounts */}
        <div className="demo-accounts-card">
          <span className="demo-title">⚡ 1-Click Evaluator Fast Logins:</span>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-btn student"
              onClick={() => handleFastDemoLogin('student@gift.edu.in', 'student123')}
            >
              <FaUserGraduate /> Demo Student
            </button>
            <button
              type="button"
              className="demo-btn staff"
              onClick={() => handleFastDemoLogin('staff@gift.edu.in', 'staff123')}
            >
              <FaTools /> Demo Staff
            </button>
            <button
              type="button"
              className="demo-btn admin"
              onClick={() => handleFastDemoLogin('admin@gift.edu.in', 'admin123')}
            >
              <FaUserShield /> Demo Admin
            </button>
          </div>
        </div>

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
