import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { issueAPI } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge/SeverityBadge';
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaThumbsUp,
  FaComment,
  FaCheckCircle,
  FaClock,
  FaTools,
  FaCamera,
  FaPaperPlane,
  FaShareAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaShieldAlt
} from 'react-icons/fa';
import './IssueDetailPage.css';

const TIMELINE_STEPS = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved'
];

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Interaction states
  const [upvoting, setUpvoting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  // Staff / Admin status update panel
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchIssueDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await issueAPI.getById(id);
      setIssue(res.data.issue);
      setNewStatus(res.data.issue.status);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueDetail();
  }, [id]);

  const handleUpvote = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setUpvoting(true);
      const res = await issueAPI.upvote(issue._id);
      setIssue(prev => ({
        ...prev,
        upvotes: res.data.upvotes,
        hasUpvoted: res.data.hasUpvoted
      }));
    } catch (err) {
      console.error('Upvote error:', err);
    } finally {
      setUpvoting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setCommenting(true);
      const res = await issueAPI.addComment(issue._id, commentText.trim());
      setIssue(prev => ({
        ...prev,
        comments: res.data.comments || [...(prev.comments || []), {
          user: { name: user.name, role: user.role },
          text: commentText.trim(),
          createdAt: new Date().toISOString()
        }]
      }));
      setCommentText('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setCommenting(false);
    }
  };

  const handleProofSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      setActionSuccess('');

      const updateData = new FormData();
      updateData.append('status', newStatus);
      if (resolutionNotes) updateData.append('resolutionNotes', resolutionNotes);
      if (proofImage) updateData.append('resolutionProofImage', proofImage);

      const res = await issueAPI.updateStatus(issue._id, updateData);
      setIssue(res.data.issue);
      setActionSuccess(`Ticket status updated to "${newStatus}"!`);
      setProofImage(null);
      setProofPreview(null);
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-state">
        <FaSpinner className="spin loading-icon" />
        <p>Loading issue details...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="detail-error-state">
        <FaExclamationTriangle className="error-icon" />
        <h2>Ticket Not Found</h2>
        <p>{error || 'This issue may have been removed or does not exist.'}</p>
        <button onClick={() => navigate('/issues')} className="back-link-btn">
          <FaArrowLeft /> Back to Issue Tracker
        </button>
      </div>
    );
  }

  const currentStepIdx = TIMELINE_STEPS.indexOf(issue.status);
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';

  return (
    <div className="issue-detail-container">
      {/* Navigation Top */}
      <button className="back-nav-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      {/* Main Ticket Header Card */}
      <div className="ticket-hero-card">
        <div className="ticket-hero-top">
          <div className="ticket-meta-badges">
            <span className="tracking-id-pill">#{issue.trackingId || issue._id.slice(-6).toUpperCase()}</span>
            <span className="category-pill">{issue.category}</span>
            <SeverityBadge severity={issue.severity} />
          </div>
          <button
            className={`upvote-action-btn ${issue.hasUpvoted ? 'active' : ''}`}
            onClick={handleUpvote}
            disabled={upvoting}
          >
            <FaThumbsUp />
            <span>{issue.upvotes?.length || 0} Upvotes</span>
          </button>
        </div>

        <h1 className="ticket-hero-title">{issue.title}</h1>

        <div className="ticket-info-grid">
          <div className="info-item">
            <FaMapMarkerAlt className="info-icon" />
            <div>
              <span className="info-label">Location</span>
              <span className="info-value">{issue.locationName}</span>
              <span className="info-sub">{issue.zone}</span>
            </div>
          </div>

          <div className="info-item">
            <FaCalendarAlt className="info-icon" />
            <div>
              <span className="info-label">Reported On</span>
              <span className="info-value">
                {new Date(issue.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="info-item">
            <FaUser className="info-icon" />
            <div>
              <span className="info-label">Reported By</span>
              <span className="info-value">{issue.reportedBy?.name || 'Campus Student'}</span>
              <span className="info-sub">{issue.reportedBy?.department || 'Student Body'}</span>
            </div>
          </div>

          {issue.assignedTo && (
            <div className="info-item">
              <FaTools className="info-icon" />
              <div>
                <span className="info-label">Assigned Technician</span>
                <span className="info-value">{issue.assignedTo.name}</span>
                <span className="info-sub">{issue.assignedTo.department || 'Maintenance Crew'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SLA / Status Progress Timeline */}
      <div className="timeline-card">
        <h3 className="section-heading">Resolution Progress Timeline</h3>
        <div className="timeline-track">
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = issue.status === step;
            return (
              <div
                key={step}
                className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
              >
                <div className="step-circle">
                  {isCompleted ? <FaCheckCircle /> : idx + 1}
                </div>
                <span className="step-title">{step}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence Photos */}
      <div className="evidence-section-card">
        <h3 className="section-heading">Photo & Media Evidence</h3>
        
        <div className="evidence-photos-grid">
          {issue.imageUrl ? (
            <div className="evidence-photo-box">
              <span className="photo-label before">Initial Report Evidence</span>
              <a href={issue.imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={issue.imageUrl} alt="Issue before" className="evidence-photo" />
              </a>
            </div>
          ) : (
            <div className="no-photo-box">
              <FaCamera className="no-photo-icon" />
              <p>No initial photo provided with report</p>
            </div>
          )}

          {issue.resolutionProofUrl && (
            <div className="evidence-photo-box">
              <span className="photo-label after">Resolved Work Proof</span>
              <a href={issue.resolutionProofUrl} target="_blank" rel="noopener noreferrer">
                <img src={issue.resolutionProofUrl} alt="Issue resolved" className="evidence-photo resolved" />
              </a>
            </div>
          )}
        </div>

        {issue.description && (
          <div className="issue-full-description">
            <h4>Description & Context:</h4>
            <p>{issue.description}</p>
          </div>
        )}

        {issue.resolutionNotes && (
          <div className="resolution-notes-callout">
            <FaCheckCircle className="res-icon" />
            <div>
              <strong>Resolution Notes from Maintenance Staff:</strong>
              <p>{issue.resolutionNotes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Staff & Admin Action Panel */}
      {isStaffOrAdmin && (
        <div className="staff-action-card">
          <div className="staff-action-header">
            <FaShieldAlt className="shield-icon" />
            <div>
              <h3>Maintenance Dispatch Console</h3>
              <p>Authorized {user.role.toUpperCase()} Action Panel</p>
            </div>
          </div>

          {actionSuccess && (
            <div className="action-success-badge">
              <FaCheckCircle /> {actionSuccess}
            </div>
          )}

          <form onSubmit={handleStatusUpdate} className="staff-form">
            <div className="form-group">
              <label>Update Status:</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="form-select"
              >
                <option value="Submitted">Submitted (Pending Review)</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress (Work Underway)</option>
                <option value="Resolved">Resolved (Fixed)</option>
                <option value="Closed">Closed (Verified)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Resolution Notes / Technician Log:</label>
              <textarea
                rows={3}
                placeholder="Detail work performed, parts replaced, or completion notes..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label>Resolution Proof Photo:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProofSelect}
                className="form-file-input"
              />
              {proofPreview && (
                <div className="proof-mini-preview">
                  <img src={proofPreview} alt="Proof preview" />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="update-ticket-btn"
              disabled={updatingStatus}
            >
              {updatingStatus ? <FaSpinner className="spin" /> : <FaTools />} Save Status & Log Update
            </button>
          </form>
        </div>
      )}

      {/* Discussion & Updates Feed */}
      <div className="comments-card">
        <h3 className="section-heading">
          <FaComment /> Campus Discussion ({issue.comments?.length || 0})
        </h3>

        <div className="comments-list">
          {(!issue.comments || issue.comments.length === 0) ? (
            <p className="no-comments-msg">No comments yet. Be the first to leave an update or note!</p>
          ) : (
            issue.comments.map((c, idx) => (
              <div key={idx} className="comment-bubble">
                <div className="comment-header">
                  <span className="comment-author">{c.user?.name || 'Campus Member'}</span>
                  {c.user?.role && (
                    <span className={`comment-role-pill ${c.user.role}`}>
                      {c.user.role}
                    </span>
                  )}
                  <span className="comment-time">
                    {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="comment-body">{c.text}</p>
              </div>
            ))
          )}
        </div>

        {user ? (
          <form onSubmit={handleAddComment} className="comment-input-form">
            <input
              type="text"
              placeholder="Add an update or confirmation comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="comment-text-input"
            />
            <button
              type="submit"
              className="send-comment-btn"
              disabled={commenting || !commentText.trim()}
            >
              {commenting ? <FaSpinner className="spin" /> : <FaPaperPlane />}
            </button>
          </form>
        ) : (
          <p className="login-to-comment">
            Please <a href="/login">log in</a> to comment on this ticket.
          </p>
        )}
      </div>
    </div>
  );
}
