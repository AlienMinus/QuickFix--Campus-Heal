import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { useOrg } from '../../context/OrgContext';
import { issueAPI } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge/SeverityBadge';
import {
  FaTools,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSatelliteDish,
  FaMapMarkerAlt,
  FaCamera,
  FaClock,
  FaArrowRight,
  FaSpinner,
  FaCheck,
  FaVideo,
} from 'react-icons/fa';
import './StaffDashboardPage.css';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { isTracking, location } = useLocationContext();
  const { orgConfig } = useOrg();
  const navigate = useNavigate();

  const [assignedIssues, setAssignedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Resolution quick-modal state
  const [resolvingIssue, setResolvingIssue] = useState(null);
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofType, setProofType] = useState('image');
  const [submittingProof, setSubmittingProof] = useState(false);

  const fetchAssignedTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await issueAPI.getAll({ limit: 50 });
      // Filter issues assigned to current staff user or in need of technician
      const staffTasks = res.data.issues.filter(
        i => (i.assignedTo?._id === user?._id || i.assignedTo === user?._id) ||
             (i.status === 'Submitted' && i.severity === 'Critical')
      );
      setAssignedIssues(staffTasks);
    } catch (err) {
      setError('Failed to fetch assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTasks();
  }, [user]);

  const handleStartWork = async (issueId) => {
    try {
      const res = await issueAPI.updateStatus(issueId, { status: 'In Progress' });
      const updated = res.data?.issue;
      setAssignedIssues(prev =>
        prev.map(i => (i._id === issueId ? (updated || { ...i, status: 'In Progress' }) : i))
      );
    } catch (err) {
      console.error('Failed to start work:', err);
      setAssignedIssues(prev =>
        prev.map(i => (i._id === issueId ? { ...i, status: 'In Progress' } : i))
      );
    }
  };

  const handleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVid = file.type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(file.name);
      setProofFile(file);
      setProofType(isVid ? 'video' : 'image');
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setProofFile(null);
      setProofPreview(null);
      setProofType('image');
    }
  };

  const resetModal = () => {
    setResolvingIssue(null);
    setNotes('');
    setProofFile(null);
    setProofPreview(null);
    setProofType('image');
  };

  const handleCompleteWork = async (e) => {
    e.preventDefault();
    if (!resolvingIssue) return;

    try {
      setSubmittingProof(true);
      const formData = new FormData();
      formData.append('status', 'Resolved');
      formData.append('resolutionNotes', notes || 'Issue resolved by staff.');
      formData.append('remarks', notes || 'Issue resolved by staff.');
      if (proofFile) {
        const isVid = proofFile.type?.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(proofFile.name);
        formData.append('resolutionMedia', proofFile);
        formData.append('resolutionProofImage', proofFile);
        if (isVid) {
          formData.append('resolutionVideo', proofFile);
        }
      }

      const res = await issueAPI.updateStatus(resolvingIssue._id, formData);
      const updated = res.data?.issue;
      setAssignedIssues(prev =>
        prev.map(i => (i._id === resolvingIssue._id ? (updated || { ...i, status: 'Resolved' }) : i))
      );
      resetModal();
    } catch (err) {
      console.error('Failed to submit resolution proof:', err);
      setAssignedIssues(prev =>
        prev.map(i => (i._id === resolvingIssue._id ? { ...i, status: 'Resolved' } : i))
      );
      resetModal();
    } finally {
      setSubmittingProof(false);
    }
  };

  const pendingCount = assignedIssues.filter(i => i.status !== 'Resolved').length;
  const inProgressCount = assignedIssues.filter(i => i.status === 'In Progress').length;
  const resolvedCount = assignedIssues.filter(i => i.status === 'Resolved').length;

  return (
    <div className="staff-dashboard-container">
      {/* Staff Header with Patrol Telemetry Banner */}
      <div className="staff-hero-header">
        <div className="staff-title-group">
          <span className="staff-badge">
            <FaTools /> On-Duty Field Technician Console
          </span>
          <h1>Welcome, {user?.name || 'Technician'}</h1>
          <p>{user?.department || 'Maintenance & Operations'} • {orgConfig.name}</p>
        </div>

        <div className="patrol-status-pill">
          <div className={`patrol-indicator ${isTracking ? 'active' : ''}`} />
          <div className="patrol-info">
            <span className="patrol-label">Patrol Telemetry</span>
            <span className="patrol-state">
              {isTracking ? 'Streaming GPS to Dispatcher' : 'GPS Passive'}
            </span>
          </div>
          <FaSatelliteDish className="satellite-icon" />
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="staff-metrics-grid">
        <div className="staff-metric-card active">
          <span className="metric-number">{inProgressCount}</span>
          <span className="metric-title">In Progress Now</span>
        </div>
        <div className="staff-metric-card pending">
          <span className="metric-number">{pendingCount}</span>
          <span className="metric-title">Tasks Pending</span>
        </div>
        <div className="staff-metric-card done">
          <span className="metric-number">{resolvedCount}</span>
          <span className="metric-title">Resolved Today</span>
        </div>
      </div>

      {/* Task Queue List */}
      <div className="tasks-section">
        <div className="tasks-header">
          <h3>Assigned Work Queue</h3>
          <button className="refresh-tasks-btn" onClick={fetchAssignedTasks}>
            Refresh Tasks
          </button>
        </div>

        {loading ? (
          <div className="staff-loading">
            <FaSpinner className="spin" />
            <p>Syncing maintenance assignments...</p>
          </div>
        ) : assignedIssues.length === 0 ? (
          <div className="staff-empty-tasks">
            <FaCheckCircle className="check-all-icon" />
            <h4>No Active Work Orders Assigned</h4>
            <p>You have resolved all assigned maintenance tasks. Great job keeping {orgConfig.name} in pristine condition!</p>
          </div>
        ) : (
          <div className="task-cards-list">
            {assignedIssues.map(task => (
              <div key={task._id} className="task-card">
                <div className="task-card-header">
                  <div className="task-meta">
                    <span className="task-cat">{task.category}</span>
                    <SeverityBadge severity={task.severity} />
                  </div>
                  <span className={`task-status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                    {task.status}
                  </span>
                </div>

                <h4 className="task-title" onClick={() => navigate(`/issues/${task._id}`)}>
                  {task.title}
                </h4>

                <div className="task-location">
                  <FaMapMarkerAlt />
                  <span>{task.locationName} ({task.zone})</span>
                </div>

                {(() => {
                  const mediaUrl = task.media?.url || task.imageUrl;
                  if (!mediaUrl) return null;
                  const isTaskVid =
                    task.media?.mediaType === 'video' ||
                    task.mediaType === 'video' ||
                    /\.(mp4|mov|webm|mkv|avi)$/i.test(mediaUrl);
                  return (
                    <div className="task-thumb-wrap">
                      {isTaskVid ? (
                        <div className="task-thumb-video-box">
                          <video src={mediaUrl} muted playsInline className="task-thumb" />
                          <span className="task-video-pill">
                            <FaVideo /> Video
                          </span>
                        </div>
                      ) : (
                        <img src={mediaUrl} alt="Issue thumbnail" className="task-thumb" />
                      )}
                    </div>
                  );
                })()}

                <div className="task-actions-row">
                  {task.status !== 'In Progress' && task.status !== 'Resolved' && (
                    <button
                      className="start-task-btn"
                      onClick={() => handleStartWork(task._id)}
                    >
                      <FaTools /> Start Work
                    </button>
                  )}

                  {task.status !== 'Resolved' && (
                    <button
                      className="complete-task-btn"
                      onClick={() => setResolvingIssue(task)}
                    >
                      <FaCheck /> Mark Resolved & Upload Proof
                    </button>
                  )}

                  <button
                    className="view-details-btn"
                    onClick={() => navigate(`/issues/${task._id}`)}
                  >
                    View Ticket <FaArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Proof Upload Modal */}
      {resolvingIssue && (
        <div className="modal-backdrop">
          <div className="proof-modal-card">
            <div className="modal-top">
              <h3>Resolve Ticket: {resolvingIssue.title}</h3>
              <button className="close-btn" onClick={resetModal}>×</button>
            </div>

            <form onSubmit={handleCompleteWork}>
              <div className="form-group">
                <label>Resolution Notes / Actions Performed *</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Replaced fan capacitor, cleared plumbing block, rewired socket..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="modal-textarea"
                  required
                />
              </div>

              <div className="form-group">
                <label>Resolution Proof Photo or Video (optional):</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleProofChange}
                  className="modal-file-input"
                />
                {proofPreview && (
                  <div className="staff-proof-preview">
                    {proofType === 'video' ? (
                      <video src={proofPreview} controls playsInline className="proof-preview-media" />
                    ) : (
                      <img src={proofPreview} alt="Resolution proof preview" className="proof-preview-media" />
                    )}
                    <span className="proof-file-name">{proofFile?.name}</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="confirm-resolve-btn"
                  disabled={submittingProof}
                >
                  {submittingProof ? <FaSpinner className="spin" /> : <FaCheckCircle />} Confirm & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
