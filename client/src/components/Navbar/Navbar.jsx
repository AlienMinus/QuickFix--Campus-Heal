import React, { useEffect } from 'react';
import './Navbar.css';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import NotificationBell from '../NotificationBell/NotificationBell';
import { FaUserGraduate, FaTools, FaUserShield, FaSignInAlt, FaCrown } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const { globalHeader, instituteHeader, fetchInstituteHeader } = useOrg();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.institute) {
      fetchInstituteHeader(user.institute);
    }
  }, [user?.institute, fetchInstituteHeader]);

  // Logged-in institute members (students, staff, normal admin) see their institute's customized header.
  // Super admin and unauthenticated guests see the Global Platform Header (managed solely by Super Admin).
  const isInstituteMember = Boolean(isAuthenticated && user?.role !== 'superadmin' && user?.institute);

  const brandTitle = isInstituteMember
    ? (instituteHeader?.name || user.institute)
    : (globalHeader?.name || 'Smart Campus QuickFix');

  const brandSubtitle = isInstituteMember
    ? (instituteHeader?.subtitle || 'Campus Facility QuickFix')
    : (globalHeader?.subtitle || 'Civic & Facility Operations');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${brandTitle} | ${brandSubtitle}`;
    }
  }, [brandTitle, brandSubtitle]);

  const getRoleIcon = (role) => {
    if (role === 'superadmin') return <FaCrown className="role-icon superadmin" />;
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
            <span className="brand-title">{brandTitle}</span>
            <span className="brand-subtitle">{brandSubtitle}</span>
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
