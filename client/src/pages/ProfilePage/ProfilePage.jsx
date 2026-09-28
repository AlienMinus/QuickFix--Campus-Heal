import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { issueAPI, authAPI } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge/SeverityBadge';
import {
  FaSignOutAlt,
  FaCamera,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaUniversity,
  FaEnvelope,
  FaBuilding,
  FaIdBadge,
  FaTicketAlt,
  FaClock,
  FaClipboardList,
  FaFolderOpen,
  FaPlus,
  FaMapMarkerAlt,
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

  // Disregard any legacy random unsplash photo and clean it up automatically
  const displayAvatar =
    user?.avatar && !user.avatar.includes('images.unsplash.com') ? user.avatar : null;

  useEffect(() => {
    if (user?.avatar && user.avatar.includes('images.unsplash.com')) {
      authAPI
        .removeAvatar()
        .then((res) => {
          if (res.data?.success) {
            updateUser(res.data.user);
          }
        })
        .catch(() => {
          updateUser({ avatar: '' });
        });
    }
  }, [user?.avatar]);

  useEffect(() => {
    const fetchUserIssues = async () => {
      try {
        setLoading(true);
        const res = await issueAPI.getAll({ limit: 100 });
        const allIssues = res.data.issues || [];
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

  const handleTriggerUpload = () => {
    setAvatarMessage({ type: '', text: '' });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarMessage({ type: 'error', text: 'Select an image file (JPG, PNG, WebP).' });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'Image size must be less than 8MB.' });
      return;
    }

    try {
      setUploadingAvatar(true);
      setAvatarMessage({ type: '', text: '' });

      const formData = new FormData();
      formData.append('avatar', file);

      const res = await authAPI.updateAvatar(formData);
      if (res.data?.success) {
        updateUser(res.data.user);
        setAvatarMessage({ type: 'success', text: 'Profile picture updated!' });
        setTimeout(() => setAvatarMessage({ type: '', text: '' }), 3000);
      } else {
        setAvatarMessage({ type: 'error', text: res.data?.message || 'Failed to update photo.' });
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setAvatarMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update photo.',
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Remove profile picture and use initials avatar?')) return;

    try {
      setUploadingAvatar(true);
      setAvatarMessage({ type: '', text: '' });

      const res = await authAPI.removeAvatar();
      if (res.data?.success) {
        updateUser(res.data.user);
        setAvatarMessage({ type: 'success', text: 'Profile picture removed.' });
        setTimeout(() => setAvatarMessage({ type: '', text: '' }), 3000);
      } else {
        setAvatarMessage({ type: 'error', text: res.data?.message || 'Failed to remove photo.' });
      }
    } catch (err) {
      console.error('Avatar removal failed:', err);
      setAvatarMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove photo.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [deletingTicketId, setDeletingTicketId] = useState(null);
  const [ticketActionMsg, setTicketActionMsg] = useState({ type: '', text: '' });

  const handleDeleteTicket = async (e, ticketId, ticketTitle) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete Ticket?\n\n"${ticketTitle || 'Untitled Ticket'}"\n\nAre you sure you want to permanently delete this ticket?`
    );
    if (!confirmed) return;

    try {
      setDeletingTicketId(ticketId);
      await issueAPI.delete(ticketId);
      setMyIssues((prev) => prev.filter((t) => (t._id || t.id) !== ticketId));
      setTicketActionMsg({ type: 'success', text: 'Ticket deleted successfully.' });
      setTimeout(() => setTicketActionMsg({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      const msg = err.response?.data?.message || 'Failed to delete ticket. Please check permissions.';
      setTicketActionMsg({ type: 'error', text: msg });
      setTimeout(() => setTicketActionMsg({ type: '', text: '' }), 4000);
    } finally {
      setDeletingTicketId(null);
    }
  };

  const totalCount = myIssues.length;
  const inProgressCount = myIssues.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = myIssues.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="profile-page-container">
      {avatarMessage.text && (
        <div className={`avatar-status-toast ${avatarMessage.type}`}>
          {avatarMessage.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{avatarMessage.text}</span>
          <button
            type="button"
            className="toast-dismiss-btn"
            onClick={() => setAvatarMessage({ type: '', text: '' })}
          >
            ×
          </button>
        </div>
      )}

      {/* Modern Compact Profile Identity Card */}
      <div className="profile-card">
        {/* Top bar with Role on left and sleek Sign Out icon on right */}
        <div className="profile-card-topbar">
          <span className={`profile-role-pill ${user?.role || 'student'}`}>
            {user?.role ? user.role.toUpperCase() : 'STUDENT'}
          </span>

          <button
            className="icon-logout-btn"
            onClick={handleLogout}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <FaSignOutAlt />
          </button>
        </div>

        {/* Center Avatar with Camera / Trash Icon Badges */}
        <div className="profile-avatar-center">
          <div
            className="avatar-wrapper"
            onClick={handleTriggerUpload}
            title="Tap to change photo"
          >
            {uploadingAvatar ? (
              <div className="avatar-loading-overlay">
                <FaSpinner className="avatar-spin" />
              </div>
            ) : displayAvatar ? (
              <img src={displayAvatar} alt={user?.name} className="avatar-img" />
            ) : (
              <div className="avatar-initials">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <button
              type="button"
              className="avatar-badge-btn edit"
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerUpload();
              }}
              title="Change Photo"
              disabled={uploadingAvatar}
            >
              <FaCamera />
            </button>

            {displayAvatar && (
              <button
                type="button"
                className="avatar-badge-btn delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAvatar();
                }}
                title="Remove Photo"
                disabled={uploadingAvatar}
              >
                <FaTrash />
              </button>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarFileSelect}
          />
        </div>

        {/* User Name */}
        <h2 className="profile-name">{user?.name || 'Campus Member'}</h2>

        {/* Clean, Compact Metadata Chips */}
        <div className="profile-chips-wrap">
          {user?.institute && (
            <span className="profile-chip">
              <FaUniversity className="chip-icon" /> {user.institute}
            </span>
          )}
          {user?.email && (
            <span className="profile-chip">
              <FaEnvelope className="chip-icon" /> {user.email}
            </span>
          )}
          {user?.department && (
            <span className="profile-chip">
              <FaBuilding className="chip-icon" /> {user.department}
            </span>
          )}
          {user?.identifier && (
            <span className="profile-chip">
              <FaIdBadge className="chip-icon" /> {user.identifier}
            </span>
          )}
        </div>
      </div>

      {/* Activity Statistics with Icons & Clean Numbers */}
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon total">
            <FaTicketAlt />
          </div>
          <div className="stat-card-data">
            <span className="stat-count">{totalCount}</span>
            <span className="stat-text">Total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon pending">
            <FaClock />
          </div>
          <div className="stat-card-data">
            <span className="stat-count">{inProgressCount}</span>
            <span className="stat-text">Active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon resolved">
            <FaCheckCircle />
          </div>
          <div className="stat-card-data">
            <span className="stat-count">{resolvedCount}</span>
            <span className="stat-text">Solved</span>
          </div>
        </div>
      </div>

      {/* My Campus Tickets Section */}
      <div className="profile-tickets-section">
        <div className="tickets-section-header">
          <div className="header-left">
            <FaClipboardList className="header-icon" />
            <h3>My Tickets</h3>
            <span className="badge-count">{myIssues.length}</span>
          </div>

          <button
            className="icon-report-btn"
            onClick={() => navigate('/report')}
            title="Report New Issue"
          >
            <FaPlus /> <span>New</span>
          </button>
        </div>

        {loading ? (
          <div className="tickets-loading-box">
            <FaSpinner className="loading-spin" />
            <span>Loading tickets...</span>
          </div>
        ) : myIssues.length === 0 ? (
          <div className="empty-tickets-card">
            <FaFolderOpen className="empty-folder-icon" />
            <p>No tickets reported yet</p>
            <button className="report-action-btn" onClick={() => navigate('/report')}>
              <FaPlus /> Report Issue
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
                  <span className="ticket-location">
                    <FaMapMarkerAlt className="loc-pin" />{' '}
                    {issue.locationName || issue.zone || issue.location?.building || 'Campus Area'}
                  </span>
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
