import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, issueAPI, locationAPI } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge/SeverityBadge';
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUsers,
  FaClock,
  FaFileDownload,
  FaUserShield,
  FaTrash,
  FaTools,
  FaSync,
  FaFilter,
  FaSatelliteDish,
  FaSearch
} from 'react-icons/fa';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Table filters
  const [tableFilter, setTableFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'users' | 'patrol'

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, issuesRes, usersRes, staffRes] = await Promise.allSettled([
        adminAPI.getStats(),
        issueAPI.getAll({ limit: 100 }),
        adminAPI.getUsers(),
        locationAPI.getActiveStaff()
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.stats);
      if (issuesRes.status === 'fulfilled') setIssues(issuesRes.value.data.issues || []);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data.users || []);
      if (staffRes.status === 'fulfilled') setActiveStaff(staffRes.value.data.activeStaff || []);
    } catch (err) {
      setError('Could not load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsersList(prev =>
        prev.map(u => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleAssignTechnician = async (issueId, staffId) => {
    try {
      const res = await adminAPI.assignTechnician(issueId, staffId);
      setIssues(prev =>
        prev.map(i => (i._id === issueId ? res.data.issue : i))
      );
    } catch (err) {
      alert('Failed to assign technician');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('Are you sure you want to permanently delete this campus ticket?')) return;
    try {
      await adminAPI.deleteIssue(issueId);
      setIssues(prev => prev.filter(i => i._id !== issueId));
    } catch (err) {
      alert('Failed to delete issue');
    }
  };

  const handleExportCSV = () => {
    if (!issues.length) return;
    const headers = ['TrackingID', 'Title', 'Category', 'Severity', 'Status', 'Zone', 'Location', 'ReportedBy', 'CreatedAt'];
    const rows = issues.map(i => [
      i.trackingId || i._id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      i.category,
      i.severity,
      i.status,
      `"${i.zone || ''}"`,
      `"${(i.locationName || '').replace(/"/g, '""')}"`,
      `"${i.reportedBy?.name || 'Anonymous'}"`,
      new Date(i.createdAt).toISOString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Campus_QuickFix_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const staffMembers = usersList.filter(u => u.role === 'staff' || u.role === 'admin');

  const filteredIssues = issues.filter(issue => {
    const matchesFilter = tableFilter === 'all' || issue.status === tableFilter;
    const matchesSearch = !tableSearch || 
      issue.title?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      issue.locationName?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      issue.category?.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="admin-page-container">
      {/* Top Banner */}
      <div className="admin-header-row">
        <div>
          <div className="admin-role-badge">
            <FaUserShield /> GIFT Autonomous • Campus Command Center
          </div>
          <h1>Operations & Facility Administration</h1>
        </div>

        <div className="admin-header-actions">
          <button className="csv-export-btn" onClick={handleExportCSV}>
            <FaFileDownload /> Export CSV Data
          </button>
          <button className="admin-refresh-btn" onClick={fetchAdminData} title="Refresh records">
            <FaSync className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-cards-grid">
        <div className="kpi-card total">
          <div className="kpi-icon-box"><FaChartLine /></div>
          <div className="kpi-details">
            <span className="kpi-number">{stats?.totalIssues ?? issues.length}</span>
            <span className="kpi-label">Total Tickets Logged</span>
          </div>
        </div>

        <div className="kpi-card resolved">
          <div className="kpi-icon-box"><FaCheckCircle /></div>
          <div className="kpi-details">
            <span className="kpi-number">
              {stats?.resolutionRate ?? (issues.length ? Math.round((issues.filter(i => i.status === 'Resolved').length / issues.length) * 100) : 0)}%
            </span>
            <span className="kpi-label">Resolution Rate</span>
          </div>
        </div>

        <div className="kpi-card critical">
          <div className="kpi-icon-box"><FaExclamationTriangle /></div>
          <div className="kpi-details">
            <span className="kpi-number">
              {issues.filter(i => i.severity === 'Critical' && i.status !== 'Resolved').length}
            </span>
            <span className="kpi-label">Critical Active Risks</span>
          </div>
        </div>

        <div className="kpi-card staff">
          <div className="kpi-icon-box"><FaUsers /></div>
          <div className="kpi-details">
            <span className="kpi-number">{activeStaff.length}</span>
            <span className="kpi-label">Staff On-Patrol (1s GPS)</span>
          </div>
        </div>
      </div>

      {/* Main Administrative Tabs */}
      <div className="admin-tab-nav">
        <button
          className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Campus Issues Dispatch ({issues.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'patrol' ? 'active' : ''}`}
          onClick={() => setActiveTab('patrol')}
        >
          <FaSatelliteDish /> 1-Sec Staff Patrol Telemetry ({activeStaff.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Roles & Access Control ({usersList.length})
        </button>
      </div>

      {/* Tab 1: Issues Management Table */}
      {activeTab === 'issues' && (
        <div className="admin-table-card">
          <div className="table-controls">
            <div className="table-search-wrap">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Filter by title, room or category..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="table-search-input"
              />
            </div>

            <div className="table-filter-group">
              <FaFilter />
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="table-select"
              >
                <option value="all">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="responsive-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Zone / Spot</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-table-msg">No tickets match criteria.</td>
                  </tr>
                ) : (
                  filteredIssues.map(issue => (
                    <tr key={issue._id}>
                      <td>
                        <strong
                          className="table-link"
                          onClick={() => navigate(`/issues/${issue._id}`)}
                        >
                          {issue.title}
                        </strong>
                        <span className="table-sub">#{issue.trackingId || issue._id.slice(-6)}</span>
                      </td>
                      <td>{issue.category}</td>
                      <td><SeverityBadge severity={issue.severity} /></td>
                      <td>
                        <span>{issue.locationName}</span>
                        <span className="table-sub">{issue.zone}</span>
                      </td>
                      <td>
                        <span className={`table-status-pill ${issue.status.toLowerCase().replace(' ', '-')}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td>
                        <select
                          value={issue.assignedTo?._id || issue.assignedTo || ''}
                          onChange={(e) => handleAssignTechnician(issue._id, e.target.value)}
                          className="staff-assign-select"
                        >
                          <option value="">Unassigned</option>
                          {staffMembers.map(staff => (
                            <option key={staff._id} value={staff._id}>
                              {staff.name} ({staff.department || 'Staff'})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="table-action-btns">
                          <button
                            className="delete-icon-btn"
                            onClick={() => handleDeleteIssue(issue._id)}
                            title="Delete ticket"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Live 1s Patrol Telemetry */}
      {activeTab === 'patrol' && (
        <div className="admin-table-card">
          <div className="patrol-header">
            <h3>Active Maintenance Staff Geo-Telemetry (MongoDB 1s Stream)</h3>
            <p>Monitors high-frequency updates from mobile field technicians</p>
          </div>

          <div className="responsive-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Department</th>
                  <th>Current Lat / Lng</th>
                  <th>Accuracy</th>
                  <th>Last Ping</th>
                  <th>Live Map</th>
                </tr>
              </thead>
              <tbody>
                {activeStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-table-msg">
                      No maintenance personnel currently broadcasting 1s GPS signals.
                    </td>
                  </tr>
                ) : (
                  activeStaff.map(staff => (
                    <tr key={staff.userId || staff._id}>
                      <td>
                        <strong>{staff.name}</strong>
                        <span className="table-sub">{staff.email}</span>
                      </td>
                      <td>{staff.department || 'Maintenance'}</td>
                      <td>
                        <span className="coords-mono">
                          {Number(staff.location?.latitude).toFixed(5)}°, {Number(staff.location?.longitude).toFixed(5)}°
                        </span>
                      </td>
                      <td>±{Math.round(staff.location?.accuracy || 5)}m</td>
                      <td>
                        <span className="live-ping-indicator">
                          <span className="dot pulse" /> Live
                        </span>
                      </td>
                      <td>
                        <button
                          className="map-focus-btn"
                          onClick={() => navigate('/map')}
                        >
                          View Radar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: User Role Management */}
      {activeTab === 'users' && (
        <div className="admin-table-card">
          <div className="patrol-header">
            <h3>Registered Campus Users & Permissions</h3>
            <p>Elevate students to maintenance staff or campus administrators</p>
          </div>

          <div className="responsive-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Department / Roll</th>
                  <th>Current Role</th>
                  <th>Elevate Permission</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.department || 'General'}</td>
                    <td>
                      <span className={`role-badge-cell ${u.role}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="role-change-select"
                      >
                        <option value="student">Student</option>
                        <option value="staff">Maintenance Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
