import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaChevronRight,
  FaVideo,
  FaWrench,
  FaBolt,
  FaTint,
  FaBroom,
  FaWifi,
  FaLaptop,
  FaShieldAlt,
  FaQuestionCircle
} from 'react-icons/fa';
import { getDeptAcronym } from '../IssueCard/IssueCard';
import './TrackingCard.css';

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

const MILESTONES = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

export default function TrackingCard({ issue }) {
  const navigate = useNavigate();

  const rawMediaUrl = issue.media?.url || issue.imageUrl || '';
  const isVideo =
    issue.media?.mediaType === 'video' ||
    issue.mediaType === 'video' ||
    /\.(mp4|mov|webm|mkv|avi)$/i.test(rawMediaUrl);

  const reporterName = issue.reportedBy?.name || issue.reportedByName || 'Student';
  const deptAcronym = getDeptAcronym(issue.reportedBy?.department || issue.reportedBy?.role || 'STUDENT');
  const zoneName = issue.zone || issue.location?.building || 'Campus';
  const roomName = issue.locationName || issue.location?.room || '';
  const trackingCode = issue.trackingId || issue._id.slice(-6).toUpperCase();

  // Milestone progression index
  const getStepIndex = (status) => {
    switch (status) {
      case 'Closed':
      case 'Resolved': return 3;
      case 'In Progress':
      case 'Assigned': return 2;
      case 'Under Review': return 1;
      case 'Submitted':
      default: return 0;
    }
  };

  const currentStep = getStepIndex(issue.status);

  return (
    <div
      className={`tracking-card ${issue.severity?.toLowerCase() || 'medium'}`}
      onClick={() => navigate(`/issues/${issue._id}`)}
      tabIndex={0}
      role="button"
      aria-label={`Track issue: ${issue.title}`}
    >
      <div className="tracking-card-main">
        {/* Top Meta Row */}
        <div className="track-meta-row">
          <div className="track-badges-group">
            <span className="track-id-pill">#{trackingCode}</span>
            <span className="track-tag-pill zone-pill">@{zoneName.split(' ')[0]}</span>
            <span className="track-tag-pill cat-pill">#{issue.category}</span>
            <span className={`track-tag-pill sev-pill ${issue.severity?.toLowerCase() || 'medium'}`}>
              ${issue.severity || 'Medium'}
            </span>
          </div>

          <span className={`track-status-pill ${issue.status?.toLowerCase().replace(/\s+/g, '-')}`}>
            {issue.status === 'Resolved' || issue.status === 'Closed' ? (
              <FaCheckCircle />
            ) : issue.status === 'In Progress' ? (
              <FaSpinner className="spin" />
            ) : (
              <FaClock />
            )}
            {issue.status}
          </span>
        </div>

        {/* Title & Spot */}
        <h3 className="track-title">{issue.title}</h3>

        <div className="track-location-row">
          <FaMapMarkerAlt className="track-pin-icon" />
          <span className="track-location-text">
            {roomName ? `${roomName} • ` : ''}{zoneName}
          </span>
        </div>

        {/* Bottom Row: Mini Milestone Track & Reporter */}
        <div className="track-bottom-row">
          <div className="track-mini-stepper">
            {MILESTONES.map((step, idx) => {
              const isPassed = currentStep >= idx;
              const isCurrent = currentStep === idx;
              return (
                <div
                  key={step}
                  className={`mini-step-dot ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}
                  title={`${step}${isCurrent ? ' (Current)' : ''}`}
                >
                  <div className="dot-circle" />
                  <span className="mini-step-name">{step.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>

          <div className="track-reporter-meta">
            <span className="reporter-chip">{reporterName}</span>
            <span className="dept-acronym-chip">{deptAcronym}</span>
            <span className="track-time-ago">{getTimeAgo(issue.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Square Thumbnail & Chevron */}
      <div className="tracking-card-right">
        {rawMediaUrl ? (
          <div className="track-thumb-box">
            {isVideo ? (
              <>
                <video src={rawMediaUrl} muted playsInline className="track-thumb-media" />
                <span className="track-thumb-video-icon"><FaVideo /></span>
              </>
            ) : (
              <img src={rawMediaUrl} alt="" className="track-thumb-media" loading="lazy" />
            )}
          </div>
        ) : (
          <div className="track-thumb-placeholder">
            {getCategoryIcon(issue.category)}
          </div>
        )}
        <FaChevronRight className="track-chevron-icon" />
      </div>
    </div>
  );
}
