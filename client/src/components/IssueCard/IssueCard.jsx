import React, { useState, useEffect } from 'react';
import './IssueCard.css';
import { useNavigate } from 'react-router-dom';
import SeverityBadge from '../SeverityBadge/SeverityBadge';
import {
  FaMapMarkerAlt,
  FaThumbsUp,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaWrench,
  FaBolt,
  FaTint,
  FaBroom,
  FaWifi,
  FaLaptop,
  FaShieldAlt,
  FaQuestionCircle,
  FaPlay,
  FaVideo,
  FaComment,
  FaShareAlt,
  FaGlobeAmericas,
  FaCheck
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const getCategoryIcon = (cat) => {
  switch (cat) {
    case 'Damaged Infrastructure':
    case 'Infrastructure':
      return <FaWrench />;
    case 'Electrical & Lighting':
    case 'Electrical':
      return <FaBolt />;
    case 'Water Leakage & Plumbing':
    case 'Plumbing':
      return <FaTint />;
    case 'Cleanliness & Sanitation':
    case 'Sanitation':
      return <FaBroom />;
    case 'Network & Wi-Fi':
    case 'IT/Network':
      return <FaWifi />;
    case 'Lab & Classroom Equipment':
    case 'Academic Facilities':
      return <FaLaptop />;
    case 'Safety & Security Hazard':
    case 'Safety/Security':
      return <FaShieldAlt />;
    default:
      return <FaQuestionCircle />;
  }
};

const getTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const IssueCard = ({ issue, onUpvoteChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userKey = user?._id || user?.id || 'guest';

  const checkInitialVoted = () => {
    try {
      if (user && issue.upvotes && Array.isArray(issue.upvotes)) {
        const uid = (user._id || user.id)?.toString();
        const found = issue.upvotes.some((id) => (id._id || id).toString() === uid);
        if (found) return true;
      }
      return localStorage.getItem(`quickfix_reacted_${userKey}_${issue._id}`) === 'true';
    } catch {
      return false;
    }
  };

  const [isUpvoted, setIsUpvoted] = useState(checkInitialVoted);
  const [upvotes, setUpvotes] = useState(issue.upvotesCount ?? (issue.upvotes?.length || 0));
  const [upvoting, setUpvoting] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);

  useEffect(() => {
    setIsUpvoted(checkInitialVoted());
    setUpvotes(issue.upvotesCount ?? (issue.upvotes?.length || 0));
  }, [user?._id, user?.id, issue.upvotes, issue.upvotesCount]);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (upvoting) return;
    setUpvoting(true);

    try {
      const res = await api.post(`/issues/${issue._id}/upvote`, {
        userId: user?._id || user?.id
      });
      const newVoted = res.data?.hasUpvoted !== undefined ? res.data.hasUpvoted : !isUpvoted;
      const newCount = res.data?.upvotesCount !== undefined ? res.data.upvotesCount : (newVoted ? upvotes + 1 : Math.max(0, upvotes - 1));

      setIsUpvoted(newVoted);
      setUpvotes(newCount);

      if (newVoted) {
        localStorage.setItem(`quickfix_reacted_${userKey}_${issue._id}`, 'true');
      } else {
        localStorage.removeItem(`quickfix_reacted_${userKey}_${issue._id}`);
      }

      if (onUpvoteChange) {
        onUpvoteChange(issue._id, newCount);
      }
    } catch (err) {
      // Optimistic fallback toggle
      const newVoted = !isUpvoted;
      const newCount = newVoted ? upvotes + 1 : Math.max(0, upvotes - 1);
      setIsUpvoted(newVoted);
      setUpvotes(newCount);
      if (newVoted) {
        localStorage.setItem(`quickfix_reacted_${userKey}_${issue._id}`, 'true');
      } else {
        localStorage.removeItem(`quickfix_reacted_${userKey}_${issue._id}`);
      }
    } finally {
      setUpvoting(false);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/issues/${issue._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Campus Issue: ${issue.title}`,
          text: `Check out this reported campus issue: ${issue.title}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2000);
    } catch (err) {
      console.warn('Clipboard failed');
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return (
          <span className="social-status-pill resolved">
            <FaCheckCircle /> Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="social-status-pill in-progress">
            <FaSpinner className="spin-icon" /> In Progress
          </span>
        );
      case 'Under Review':
      case 'Assigned':
        return (
          <span className="social-status-pill review">
            <FaClock /> {status}
          </span>
        );
      case 'Submitted':
      default:
        return (
          <span className="social-status-pill submitted">
            <FaClock /> Submitted
          </span>
        );
    }
  };

  const rawMediaUrl = issue.media?.url || issue.imageUrl || '';
  const isVideo =
    issue.media?.mediaType === 'video' ||
    issue.mediaType === 'video' ||
    /\.(mp4|mov|webm|mkv|avi)$/i.test(rawMediaUrl);

  const reporterName = issue.reportedBy?.name || issue.reportedByName || 'Campus Member';
  const reporterDept = issue.reportedBy?.department || (issue.reportedBy?.role ? `${issue.reportedBy.role.toUpperCase()}` : 'Campus Student');
  const reporterAvatar = issue.reportedBy?.avatar;
  const zoneName = issue.zone || issue.location?.building || 'Campus';
  const roomName = issue.locationName || issue.location?.room || '';
  const commentsCount = issue.comments?.length || 0;

  return (
    <article
      className="social-post-card"
      onClick={() => navigate(`/issues/${issue._id}`)}
      tabIndex={0}
      role="button"
      aria-label={`View issue: ${issue.title}`}
    >
      {/* 1. LinkedIn Post Header */}
      <div className="post-header">
        <div className="author-info">
          {reporterAvatar ? (
            <img src={reporterAvatar} alt={reporterName} className="author-avatar-img" />
          ) : (
            <div className="author-avatar-fallback">
              {reporterName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="author-text-meta">
            <div className="author-name-row">
              <span className="author-name">{reporterName}</span>
              <span className="author-role-badge">{reporterDept}</span>
            </div>
            <div className="post-timestamp-row">
              <span className="post-time">{getTimeAgo(issue.createdAt)}</span>
              <span className="dot-sep">•</span>
              <span className="public-icon" title="Public Campus Post">
                <FaGlobeAmericas /> Campus
              </span>
            </div>
          </div>
        </div>

        <div className="post-top-right">
          {getStatusPill(issue.status)}
        </div>
      </div>

      {/* 2. Special Character Metadata Chips: @Zone #Category $Severity */}
      <div className="post-tags-row">
        <span className="tag-pill zone-pill" title="Campus Zone">
          @{zoneName}
        </span>
        <span className="tag-pill category-pill" title="Facility Category">
          #{issue.category}
        </span>
        <span className={`tag-pill severity-pill ${issue.severity?.toLowerCase() || 'medium'}`} title="Severity Level">
          ${issue.severity || 'Medium'}
        </span>
        {roomName && (
          <span className="tag-pill location-pill" title="Specific Spot">
            <FaMapMarkerAlt className="pin-icon" /> {roomName}
          </span>
        )}
      </div>

      {/* 3. Post Content */}
      <div className="post-body">
        <h3 className="post-title">{issue.title}</h3>
        {issue.description && (
          <p className="post-description">
            {issue.description.length > 150
              ? `${issue.description.substring(0, 150)}...`
              : issue.description}
          </p>
        )}
      </div>

      {/* 4. Media Showcase */}
      {rawMediaUrl && (
        <div className="post-media-container">
          {isVideo ? (
            <div className="post-video-wrapper">
              <video
                src={rawMediaUrl}
                muted
                playsInline
                preload="metadata"
                className="post-video-element"
              />
              <div className="video-overlay-pill">
                <FaVideo /> Video Proof Attached
              </div>
            </div>
          ) : (
            <div className="post-image-wrapper">
              <img
                src={rawMediaUrl}
                alt={issue.title}
                className="post-image-element"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      {/* 5. Smart Priority Meter Bar */}
      <div className="post-priority-meter">
        <div className="meter-label-row">
          <span className="meter-title">⚡ Smart Priority Score</span>
          <span className="meter-score">{issue.priorityScore || 50}/100</span>
        </div>
        <div className="meter-track">
          <div
            className={`meter-fill ${issue.severity?.toLowerCase() || 'medium'}`}
            style={{ width: `${Math.min(issue.priorityScore || 50, 100)}%` }}
          />
        </div>
      </div>

      {/* 6. LinkedIn Style Interactive Action Bar */}
      <div className="post-action-bar">
        <button
          type="button"
          className={`action-btn upvote-btn ${isUpvoted ? 'reacted' : ''}`}
          onClick={handleUpvote}
          disabled={upvoting}
          title={isUpvoted ? 'Remove your reaction' : 'Upvote / React to this ticket'}
        >
          <FaThumbsUp className={`thumb-icon ${isUpvoted ? 'thumb-active' : ''}`} />
          <span>{isUpvoted ? 'Supported' : 'Support'}</span>
          <span className="reaction-count-pill">{upvotes}</span>
        </button>

        <button
          type="button"
          className="action-btn comment-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/issues/${issue._id}`);
          }}
          title="Open discussion & comment"
        >
          <FaComment />
          <span>Comment</span>
          {commentsCount > 0 && <span className="comment-count-pill">{commentsCount}</span>}
        </button>

        <button
          type="button"
          className="action-btn share-btn"
          onClick={handleShare}
          title="Share ticket link"
        >
          {sharedToast ? <FaCheck className="copied-icon" /> : <FaShareAlt />}
          <span>{sharedToast ? 'Copied!' : 'Share'}</span>
        </button>
      </div>
    </article>
  );
};

export default IssueCard;
