import React from 'react';
import './Navbar.css';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import NotificationBell from '../NotificationBell/NotificationBell';
import { FaUserGraduate, FaTools, FaUserShield, FaSignInAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const { orgConfig } = useOrg();
  const navigate = useNavigate();

  const getRoleIcon = (role) => {
    if (role === 'admin') return <FaUserShield className="role-icon admin" />;
    if (role === 'staff') return <FaTools className="role-icon staff" />;
    return <FaUserGraduate className="role-icon student" />;
  };

  return (
    <header className="campus-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/favicon.svg" alt="App Logo" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-title">{orgConfig.name}</span>
            <span className="brand-subtitle">{orgConfig.subtitle || 'Facility QuickFix'}</span>
          </div>
        </Link>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <div
                className={`role-badge-btn ${user?.role || 'student'}`}
                onClick={() => navigate('/profile')}
                title={`Logged in as ${user?.name} (${user?.role})`}
              >
                {getRoleIcon(user?.role)}
                <span className="role-text">{user?.role ? user.role.toUpperCase() : 'USER'}</span>
              </div>

              <NotificationBell />

              <div
                className="user-profile-btn"
                onClick={() => navigate('/profile')}
                title="Account & Settings"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                ) : (
                  <div className="user-avatar-initial">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-nav-buttons">
              <button
                className="nav-login-btn"
                onClick={() => navigate('/login')}
              >
                <FaSignInAlt /> <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
