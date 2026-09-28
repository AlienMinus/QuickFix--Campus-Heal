import React, { useState } from 'react';
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
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const getCategoryIcon = (cat) => {
  switch (cat) {
    case 'Damaged Infrastructure': return <FaWrench />;
    case 'Electrical & Lighting': return <FaBolt />;
    case 'Water Leakage & Plumbing': return <FaTint />;
    case 'Cleanliness & Sanitation': return <FaBroom />;
    case 'Network & Wi-Fi': return <FaWifi />;
    case 'Lab & Classroom Equipment': return <FaLaptop />;
    case 'Safety & Security Hazard': return <FaShieldAlt />;
    default: return <FaQuestionCircle />;
  }
};

const IssueCard = ({ issue, onUpvoteChange }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(issue.upvotesCount || 0);
  
  const checkInitialVoted = () => {
    try {
      const localVoted = localStorage.getItem(`quickfix_reacted_${issue._id}`);
      if (localVoted === 'true') return true;
      if (user && issue.upvotes && Array.isArray(issue.upvotes)) {
        return issue.upvotes.some(id => (id._id || id).toString() === (user._id || user.id)?.toString());
      }
    } catch {
      // fallback
    }
    return false;
  };

  const [isUpvoted, setIsUpvoted] = useState(checkInitialVoted);
  const [upvoting, setUpvoting] = useState(false);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    // Allow reacting ONLY ONCE
    if (isUpvoted || upvoting) return;
    setUpvoting(true);

    try {
      const res = await api.post(`/issues/${issue._id}/upvote`);
      setIsUpvoted(true);
      try {
        localStorage.setItem(`quickfix_reacted_${issue._id}`, 'true');
      } catch {}
      if (res.data && res.data.upvotesCount !== undefined) {
        setUpvotes(res.data.upvotesCount);
        if (onUpvoteChange) onUpvoteChange(issue._id, res.data.upvotesCount);
      } else {
        setUpvotes((prev) => prev + 1);
      }
    } catch (err) {
      setIsUpvoted(true);
      try {
        localStorage.setItem(`quickfix_reacted_${issue._id}`, 'true');
      } catch {}
      setUpvotes((prev) => prev + 1);
    } finally {
      setUpvoting(false);
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="status-pill resolved">
            <FaCheckCircle /> Resolved
          </span>
        );
      case 'In Progress':
        return (
          <span className="status-pill in-progress">
            <FaSpinner className="spin-icon" /> In Progress
          </span>
        );
      case 'Submitted':
      default:
        return (
          <span className="status-pill submitted">
            <FaClock /> Submitted
          </span>
        );
    }
  };

  const mediaUrl =
    issue.media?.url ||
    'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80';

  return (
    <div
      className={`issue-card ${issue.severity?.toLowerCase() || 'medium'}`}
      onClick={() => navigate(`/issue/${issue._id}`)}
    >
      <div className="card-media-wrapper">
        <img
          src={mediaUrl}
          alt={issue.title}
          className="card-media-img"
          loading="lazy"
        />
        <div className="card-media-overlay">
          <div className="category-tag">
            {getCategoryIcon(issue.category)}
            <span>{issue.category}</span>
          </div>
          {getStatusPill(issue.status)}
        </div>
      </div>

      <div className="card-body">
        <div className="card-top-row">
          <SeverityBadge severity={issue.severity} size="small" />
          <div className="priority-meter" title={`Smart Priority Score: ${issue.priorityScore || 50}/100`}>
            <span className="priority-text">Priority {issue.priorityScore || 50}</span>
            <div className="priority-bar-bg">
              <div
                className="priority-bar-fill"
                style={{ width: `${Math.min(issue.priorityScore || 50, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <h3 className="card-title">{issue.title}</h3>
        <p className="card-desc">
          {issue.description?.length > 100
            ? `${issue.description.substring(0, 100)}...`
            : issue.description}
        </p>

        <div className="card-location">
          <FaMapMarkerAlt className="location-pin-icon" />
          <span className="location-name">
            {issue.location?.building || 'Campus'}
            {issue.location?.room ? ` • ${issue.location.room}` : ''}
          </span>
        </div>

        <div className="card-footer">
          <div className="reporter-meta">
            <span className="reporter-name">{issue.reportedByName || 'Student'}</span>
            <span className="report-time">
              {new Date(issue.createdAt || Date.now()).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <button
            className={`upvote-action-btn ${isUpvoted ? 'active reacted' : ''}`}
            onClick={handleUpvote}
            disabled={isUpvoted}
            title={isUpvoted ? 'You have already reacted to this issue' : 'Upvote issue priority / I experience this too'}
          >
            <FaThumbsUp />
            <span>{upvotes}</span>
            {isUpvoted && <span className="reacted-badge">Reacted</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
