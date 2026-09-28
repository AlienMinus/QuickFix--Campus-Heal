import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
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
  FaCheck
} from 'react-icons/fa';
import './StaffDashboardPage.css';

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const { isTracking, location } = useLocationContext();
  const navigate = useNavigate();

  const [assignedIssues, setAssignedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Resolution quick-modal state
  const [resolvingIssue, setResolvingIssue] = useState(null);
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
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
      const formData = new FormData();
      formData.append('status', 'In Progress');
      const res = await issueAPI.updateStatus(issueId, formData);
      setAssignedIssues(prev =>
        prev.map(i => (i._id === issueId ? res.data.issue : i))
      );
    } catch (err) {
      alert('Could not update status.');
    }
  };

  const handleCompleteWork = async (e) => {
    e.preventDefault();
    if (!resolvingIssue) return;

    try {
      setSubmittingProof(true);
      const formData = new FormData();
      formData.append('status', 'Resolved');
      formData.append('resolutionNotes', notes);
      if (proofFile) formData.append('resolutionProofImage', proofFile);

      const res = await issueAPI.updateStatus(resolvingIssue._id, formData);
      setAssignedIssues(prev =>
        prev.map(i => (i._id === resolvingIssue._id ? res.data.issue : i))
      );
      setResolvingIssue(null);
      setNotes('');
      setProofFile(null);
    } catch (err) {
      alert('Failed to submit resolution proof.');
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
          <p>{user?.department || 'Maintenance & Operations Department'} • BPUT GIFT Campus</p>
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
            <p>You have resolved all assigned maintenance tasks. Great job keeping GIFT Campus pristine!</p>
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

                {task.imageUrl && (
                  <div className="task-thumb-wrap">
                    <img src={task.imageUrl} alt="Issue thumbnail" className="task-thumb" />
                  </div>
                )}

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
              <button className="close-btn" onClick={() => setResolvingIssue(null)}>×</button>
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
                <label>Resolution Proof Photo (Cloudinary upload):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0])}
                  className="modal-file-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setResolvingIssue(null)}
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
