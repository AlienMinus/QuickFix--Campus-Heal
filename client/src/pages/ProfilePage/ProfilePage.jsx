import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { useOrg } from '../../context/OrgContext';
import { issueAPI } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge/SeverityBadge';
import {
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaShieldAlt,
  FaSatellite,
  FaSignOutAlt,
  FaListAlt,
  FaThumbsUp,
  FaClock,
  FaCheckCircle,
  FaDatabase
} from 'react-icons/fa';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout, token } = useAuth();
  const { location, isTracking } = useLocationContext();
  const { orgConfig } = useOrg();
  const navigate = useNavigate();

  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserIssues = async () => {
      try {
        setLoading(true);
        const res = await issueAPI.getAll({ reportedBy: user?._id || 'me' });
        // Match user's issues
        const userTickets = res.data.issues.filter(
          i => i.reportedBy?._id === user?._id || i.reportedBy === user?._id || i.reportedBy?.email === user?.email
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
            {user?.role?.toUpperCase() || 'STUDENT'}
          </span>
        </div>

        <div className="profile-user-info">
          <h2>{user?.name || 'Campus Member'}</h2>
          <div className="info-meta-row">
            <span className="info-chip">
              <FaEnvelope /> {user?.email}
            </span>
            <span className="info-chip">
              <FaBuilding /> {user?.department || orgConfig.name}
            </span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Sign Out
        </button>
      </div>

      {/* Security & Telemetry Specs Grid */}
      <div className="specs-two-col-grid">
        {/* Card 1: JWT Session Validity */}
        <div className="spec-card">
          <div className="spec-card-header">
            <FaShieldAlt className="spec-icon jwt" />
            <div>
              <h4>7-Day Persistent JWT Session</h4>
              <p>Cryptographically signed HMAC-SHA256 bearer token</p>
            </div>
          </div>
          <div className="spec-card-body">
            <div className="spec-item">
              <span className="spec-k">Session Token</span>
              <span className="spec-v monospace">
                {token ? `${token.slice(0, 16)}...${token.slice(-10)}` : 'Active'}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-k">Validity Period</span>
              <span className="spec-v highlight-green">7 Days (168 Hours)</span>
            </div>
            <div className="spec-item">
              <span className="spec-k">Role Clearance</span>
              <span className="spec-v">{user?.role?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Card 2: 1-Second GeoLocation Stream */}
        <div className="spec-card">
          <div className="spec-card-header">
            <FaSatellite className={`spec-icon gps ${isTracking ? 'pulsing' : ''}`} />
            <div>
              <h4>1-Sec Live GeoLocation API</h4>
              <p>Direct MongoDB logging & campus radar telemetry</p>
            </div>
          </div>
          <div className="spec-card-body">
            <div className="spec-item">
              <span className="spec-k">Streaming Status</span>
              <span className="spec-v">
                {isTracking ? (
                  <span className="badge-active">
                    <span className="dot pulse" /> 1s Active
                  </span>
                ) : (
                  <span className="badge-idle">Idle</span>
                )}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-k">Live Coordinates</span>
              <span className="spec-v monospace">
                {location?.latitude?.toFixed(5) || '20.21850'}° N,{' '}
                {location?.longitude?.toFixed(5) || '85.73680'}° E
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-k">Storage Target</span>
              <span className="spec-v">
                <FaDatabase /> MongoDB Atlas `locationlogs`
              </span>
            </div>
          </div>
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
            + Report New
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
            {myIssues.map(issue => (
              <div
                key={issue._id}
                className="user-ticket-row"
                onClick={() => navigate(`/issues/${issue._id}`)}
              >
                <div className="row-left">
                  <span className="ticket-cat">{issue.category}</span>
                  <span className="ticket-title">{issue.title}</span>
                  <span className="ticket-location">📍 {issue.locationName}</span>
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
