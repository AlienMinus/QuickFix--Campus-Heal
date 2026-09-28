import React from 'react';
import './BottomNav.css';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome,
  FaMapMarkedAlt,
  FaPlus,
  FaTasks,
  FaUserShield,
  FaUser,
  FaUserCog,
  FaCrown,
} from 'react-icons/fa';

const BottomNav = () => {
  const { user, isAdmin, isStaff } = useAuth();

  const getDashboardLink = () => {
    if (isAdmin || user?.role === 'superadmin') return '/admin';
    if (isStaff) return '/staff';
    return '/profile';
  };

  const getDashboardLabel = () => {
    if (user?.role === 'superadmin') return 'Super';
    if (isAdmin) return 'Admin';
    if (isStaff) return 'Staff';
    return 'Profile';
  };

  const getDashboardIcon = () => {
    if (user?.role === 'superadmin') return <FaCrown />;
    if (isAdmin) return <FaUserShield />;
    if (isStaff) return <FaUserCog />;
    return <FaUser />;
  };

  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
        end
      >
        <FaHome className="nav-tab-icon" />
        <span className="nav-tab-label">Home</span>
      </NavLink>

      <NavLink
        to="/map"
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        <FaMapMarkedAlt className="nav-tab-icon" />
        <span className="nav-tab-label">Live Map</span>
      </NavLink>

      <NavLink
        to="/report"
        className={({ isActive }) => `nav-tab center-action-tab ${isActive ? 'active' : ''}`}
        title="Report New Issue"
      >
        <div className="center-plus-circle">
          <FaPlus />
        </div>
        <span className="nav-tab-label">Report</span>
      </NavLink>

      <NavLink
        to="/track"
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        <FaTasks className="nav-tab-icon" />
        <span className="nav-tab-label">Tracker</span>
      </NavLink>

      <NavLink
        to={getDashboardLink()}
        className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
      >
        {React.cloneElement(getDashboardIcon(), { className: 'nav-tab-icon' })}
        <span className="nav-tab-label">{getDashboardLabel()}</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
