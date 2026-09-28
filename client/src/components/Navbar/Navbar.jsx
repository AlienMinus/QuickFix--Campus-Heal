import React, { useState } from 'react';
import './Navbar.css';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell/NotificationBell';
import { FaUserGraduate, FaTools, FaUserShield, FaChevronDown } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, demoLogin } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = (role) => {
    demoLogin(role);
    setRoleDropdownOpen(false);
    if (role === 'admin') navigate('/admin');
    else if (role === 'staff') navigate('/staff');
    else navigate('/');
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <FaUserShield className="role-icon admin" />;
    if (role === 'staff') return <FaTools className="role-icon staff" />;
    return <FaUserGraduate className="role-icon student" />;
  };

  return (
    <header className="campus-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/favicon.svg" alt="QuickFix Logo" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-title">Smart Campus</span>
            <span className="brand-subtitle">QuickFix 2026</span>
          </div>
        </Link>

        <div className="navbar-actions">
          <div className="role-switcher-dropdown">
            <button
              className={`role-badge-btn ${user?.role || 'student'}`}
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              title="Click to switch role (Student / Staff / Admin)"
            >
              {getRoleIcon(user?.role)}
              <span className="role-text">{user?.role ? user.role.toUpperCase() : 'STUDENT'}</span>
              <FaChevronDown className="dropdown-arrow" />
            </button>

            {roleDropdownOpen && (
              <div className="role-dropdown-menu">
                <div className="dropdown-header">Demonstration Roles</div>
                <button
                  className={`dropdown-item ${user?.role === 'student' ? 'active' : ''}`}
                  onClick={() => handleRoleSwitch('student')}
                >
                  <FaUserGraduate className="item-icon student" />
                  <div>
                    <div className="item-title">Student Portal</div>
                    <div className="item-sub">Report & track campus issues</div>
                  </div>
                </button>
                <button
                  className={`dropdown-item ${user?.role === 'staff' ? 'active' : ''}`}
                  onClick={() => handleRoleSwitch('staff')}
                >
                  <FaTools className="item-icon staff" />
                  <div>
                    <div className="item-title">Maintenance Staff</div>
                    <div className="item-sub">Resolve tasks & update status</div>
                  </div>
                </button>
                <button
                  className={`dropdown-item ${user?.role === 'admin' ? 'active' : ''}`}
                  onClick={() => handleRoleSwitch('admin')}
                >
                  <FaUserShield className="item-icon admin" />
                  <div>
                    <div className="item-title">Admin Dashboard</div>
                    <div className="item-sub">Analytics, GPS patrol, assignments</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <NotificationBell />

          <div className="user-profile-btn" onClick={() => navigate('/profile')}>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={user?.name}
              className="user-avatar"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
