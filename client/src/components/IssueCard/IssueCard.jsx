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
  const [upvotes, setUpvotes] = useState(issue.upvotesCount || 0);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (upvoting) return;
    setUpvoting(true);

    try {
      const res = await api.post(`/issues/${issue._id}/upvote`);
      if (res.data && res.data.upvotesCount !== undefined) {
        setUpvotes(res.data.upvotesCount);
        setIsUpvoted(!isUpvoted);
        if (onUpvoteChange) onUpvoteChange(issue._id, res.data.upvotesCount);
      }
    } catch (err) {
      setUpvotes((prev) => (isUpvoted ? prev - 1 : prev + 1));
      setIsUpvoted(!isUpvoted);
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
            className={`upvote-action-btn ${isUpvoted ? 'active' : ''}`}
            onClick={handleUpvote}
            title="Upvote issue priority / I experience this too"
          >
            <FaThumbsUp />
            <span>{upvotes}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
