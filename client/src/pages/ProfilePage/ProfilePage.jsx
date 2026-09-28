import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { issueAPI, authAPI } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge/SeverityBadge';
import {
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaSignOutAlt,
  FaListAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaPlus,
  FaUniversity,
  FaCamera,
  FaTrash,
  FaSpinner,
} from 'react-icons/fa';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { orgConfig } = useOrg();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUserIssues = async () => {
      try {
        setLoading(true);
        const res = await issueAPI.getAll({ limit: 100 });
        const allIssues = res.data.issues || [];
        // Match user's issues
        const userTickets = allIssues.filter(
          (i) =>
            i.reportedBy?._id === user?._id ||
            i.reportedBy === user?._id ||
            i.reportedBy?.email === user?.email
        );
        setMyIssues(userTickets);
      } catch (err) {
        console.error('Failed to load user issues:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchUserIssues();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalCount = myIssues.length;
  const inProgressCount = myIssues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = myIssues.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="profile-page-container">
      {/* User Identity Card */}
      <div className="profile-hero-card">
        <div className="profile-avatar-wrap">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="user-avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <span className={`role-badge ${user?.role || 'student'}`}>
            {user?.role ? user.role.toUpperCase() : 'STUDENT'}
          </span>
        </div>

        <div className="profile-user-info">
          <h2>{user?.name || 'Campus Member'}</h2>
          <div className="info-meta-row">
            <span className="info-chip">
              <FaUniversity /> {user?.institute || 'BPUT Tech Campus'}
            </span>
            <span className="info-chip">
              <FaEnvelope /> {user?.email}
            </span>
            <span className="info-chip">
              <FaBuilding /> {user?.department || 'General Campus'}
            </span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Sign Out
        </button>
      </div>

      {/* User Quick Activity Summary (No developer technical jargon) */}
      <div className="profile-summary-grid">
        <div className="summary-stat-box">
          <span className="summary-number">{totalCount}</span>
          <span className="summary-label">Tickets Filed</span>
        </div>
        <div className="summary-stat-box active">
          <span className="summary-number">{inProgressCount}</span>
          <span className="summary-label">In Progress</span>
        </div>
        <div className="summary-stat-box resolved">
          <span className="summary-number">{resolvedCount}</span>
          <span className="summary-label">Resolved</span>
        </div>
      </div>

      {/* User's Reported Tickets */}
      <div className="user-tickets-card">
        <div className="tickets-card-header">
          <div className="tickets-title-wrap">
            <FaListAlt />
            <h3>My Filed Campus Tickets ({myIssues.length})</h3>
          </div>
          <button className="file-more-btn" onClick={() => navigate('/report')}>
            <FaPlus /> Report New
          </button>
        </div>

        {loading ? (
          <p className="tickets-loading">Loading your reports...</p>
        ) : myIssues.length === 0 ? (
          <div className="empty-user-tickets">
            <p>You haven't reported any campus issues yet.</p>
            <button className="primary-action-btn" onClick={() => navigate('/report')}>
              Report Your First Problem
            </button>
          </div>
        ) : (
          <div className="user-tickets-list">
            {myIssues.map((issue) => (
              <div
                key={issue._id}
                className="user-ticket-row"
                onClick={() => navigate(`/issues/${issue._id}`)}
              >
                <div className="row-left">
                  <span className="ticket-cat">{issue.category}</span>
                  <span className="ticket-title">{issue.title}</span>
                  <span className="ticket-location">📍 {issue.locationName || issue.zone || 'Campus Area'}</span>
                </div>
                <div className="row-right">
                  <SeverityBadge severity={issue.severity} />
                  <span className={`status-pill ${issue.status.toLowerCase().replace(' ', '-')}`}>
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
