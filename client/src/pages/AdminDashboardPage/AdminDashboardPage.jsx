import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { adminAPI, issueAPI, locationAPI } from '../../services/api';
import SeverityBadge from '../../components/SeverityBadge/SeverityBadge';
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUsers,
  FaFileDownload,
  FaUserShield,
  FaTrash,
  FaSync,
  FaFilter,
  FaSatelliteDish,
  FaSearch,
  FaQrcode,
  FaPlus,
  FaDownload,
  FaPrint,
  FaTimes,
  FaBuilding,
  FaLightbulb,
} from 'react-icons/fa';
import './AdminDashboardPage.css';

const CATEGORIES = [
  'Damaged Infrastructure',
  'Electrical & Lighting',
  'Water Leakage & Plumbing',
  'Cleanliness & Sanitation',
  'Network & Wi-Fi',
  'Lab & Classroom Equipment',
  'Safety & Security Hazard',
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { orgConfig, updateOrgInfo, zones, addZone, deleteZone } = useOrg();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table filters & active tab
  const [tableFilter, setTableFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'zones' | 'users' | 'patrol'

  // Organization branding form state
  const [orgName, setOrgName] = useState(orgConfig.name);
  const [orgSubtitle, setOrgSubtitle] = useState(orgConfig.subtitle);
  const [orgSavedToast, setOrgSavedToast] = useState(false);

  // New Zone Form state
  const [newZoneName, setNewZoneName] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newRecommendation, setNewRecommendation] = useState('');
  const [newLat, setNewLat] = useState('20.2195');
  const [newLng, setNewLng] = useState('85.7360');

  // QR Modal preview state
  const [activeQRZone, setActiveQRZone] = useState(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, issuesRes, usersRes, staffRes] = await Promise.allSettled([
        adminAPI.getStats(),
        issueAPI.getAll({ limit: 100 }),
        adminAPI.getUsers(),
        locationAPI.getActiveStaff(),
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

  const handleSaveOrgInfo = (e) => {
    e.preventDefault();
    updateOrgInfo(orgName.trim(), orgSubtitle.trim());
    setOrgSavedToast(true);
    setTimeout(() => setOrgSavedToast(false), 3000);
  };

  const handleAddZone = (e) => {
    e.preventDefault();
    if (!newZoneName.trim() || !newBuilding.trim()) {
      alert('Please provide Zone Name and Building.');
      return;
    }

    addZone({
      name: newZoneName.trim(),
      building: newBuilding.trim(),
      room: newRoom.trim(),
      category: newCategory,
      recommendation: newRecommendation.trim() || 'Standard facility inspection.',
      lat: parseFloat(newLat) || 20.2195,
      lng: parseFloat(newLng) || 85.7360,
    });

    setNewZoneName('');
    setNewBuilding('');
    setNewRoom('');
    setNewRecommendation('');
  };

  const handleGenerateQR = async (zone) => {
    setActiveQRZone(zone);
    try {
      const payload = JSON.stringify({
        zone: zone.name,
        building: zone.building,
        room: zone.room,
        category: zone.category,
        recommendation: zone.recommendation,
        lat: zone.lat,
        lng: zone.lng,
      });

      const qrUrl = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#140b28',
          light: '#ffffff',
        },
      });

      setGeneratedQRUrl(qrUrl);
    } catch (err) {
      console.error('QR generation failed:', err);
      alert('Failed to generate QR code.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleAssignTechnician = async (issueId, staffId) => {
    try {
      const res = await adminAPI.assignTechnician(issueId, staffId);
      setIssues((prev) =>
        prev.map((i) => (i._id === issueId ? res.data.issue : i))
      );
    } catch (err) {
      alert('Failed to assign technician');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('Are you sure you want to permanently delete this campus ticket?')) return;
    try {
      await adminAPI.deleteIssue(issueId);
      setIssues((prev) => prev.filter((i) => i._id !== issueId));
    } catch (err) {
      alert('Failed to delete issue');
    }
  };

  const handleExportCSV = () => {
    if (!issues.length) return;
    const headers = ['TrackingID', 'Title', 'Category', 'Severity', 'Status', 'Zone', 'Location', 'ReportedBy', 'CreatedAt'];
    const rows = issues.map((i) => [
      i.trackingId || i._id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      i.category,
      i.severity,
      i.status,
      `"${i.zone || ''}"`,
      `"${(i.locationName || '').replace(/"/g, '""')}"`,
      `"${i.reportedBy?.name || 'Anonymous'}"`,
      new Date(i.createdAt).toISOString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${orgConfig.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const staffMembers = usersList.filter((u) => u.role === 'staff' || u.role === 'admin');

  const filteredIssues = issues.filter((issue) => {
    const matchesFilter = tableFilter === 'all' || issue.status === tableFilter;
    const matchesSearch =
      !tableSearch ||
      issue.title?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      issue.locationName?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      issue.category?.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="admin-page-container">
      {/* Top Banner with Generalized Organization Name */}
      <div className="admin-header-row">
        <div>
          <div className="admin-role-badge">
            <FaUserShield /> {orgConfig.name} • Command Center
          </div>
          <h1>Facility & Operations Administration</h1>
        </div>

        <div className="admin-header-actions">
          <button className="csv-export-btn" onClick={handleExportCSV}>
            <FaFileDownload /> Export CSV
          </button>
          <button className="admin-refresh-btn" onClick={fetchAdminData} title="Refresh records">
            <FaSync className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Small Square KPI Cards Grid with Reduced Text Size */}
      <div className="kpi-cards-grid">
        <div className="kpi-card total">
          <div className="kpi-icon-box"><FaChartLine /></div>
          <div className="kpi-details">
            <span className="kpi-number">{stats?.totalIssues ?? issues.length}</span>
            <span className="kpi-label">Total Logged</span>
          </div>
        </div>

        <div className="kpi-card resolved">
          <div className="kpi-icon-box"><FaCheckCircle /></div>
          <div className="kpi-details">
            <span className="kpi-number">
              {stats?.resolutionRate ?? (issues.length ? Math.round((issues.filter((i) => i.status === 'Resolved').length / issues.length) * 100) : 0)}%
            </span>
            <span className="kpi-label">Resolution</span>
          </div>
        </div>

        <div className="kpi-card critical">
          <div className="kpi-icon-box"><FaExclamationTriangle /></div>
          <div className="kpi-details">
            <span className="kpi-number">
              {issues.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved').length}
            </span>
            <span className="kpi-label">Critical Risks</span>
          </div>
        </div>

        <div className="kpi-card staff">
          <div className="kpi-icon-box"><FaUsers /></div>
          <div className="kpi-details">
            <span className="kpi-number">{activeStaff.length}</span>
            <span className="kpi-label">Staff Patrol</span>
          </div>
        </div>
      </div>

      {/* Main Administrative Tabs */}
      <div className="admin-tab-nav">
        <button
          className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Issues Dispatch ({issues.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'zones' ? 'active' : ''}`}
          onClick={() => setActiveTab('zones')}
        >
          <FaQrcode /> Zones & QR Generator ({zones.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUsers /> User Roles ({usersList.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'patrol' ? 'active' : ''}`}
          onClick={() => setActiveTab('patrol')}
        >
          <FaSatelliteDish /> Staff Patrol ({activeStaff.length})
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
                  filteredIssues.map((issue) => (
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
                          {staffMembers.map((staff) => (
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

      {/* Tab 2: Campus Zones & QR Code Generator */}
      {activeTab === 'zones' && (
        <div className="zones-management-container">
          {/* Organization Generalization Settings */}
          <div className="admin-card-section">
            <div className="section-title-wrap">
              <FaBuilding className="sec-icon" />
              <div>
                <h3>Organization / Campus Customization</h3>
                <p>Configure the organization name so the app can be deployed anywhere</p>
              </div>
            </div>

            <form onSubmit={handleSaveOrgInfo} className="org-edit-form">
              <div className="form-row-grid">
                <div className="admin-form-group">
                  <label>Campus / Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Apex University, City Tech Park"
                    className="admin-input"
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={orgSubtitle}
                    onChange={(e) => setOrgSubtitle(e.target.value)}
                    placeholder="e.g. Facility & Operations Portal"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-submit-row">
                <button type="submit" className="save-org-btn">
                  Save Organization Settings
                </button>
                {orgSavedToast && (
                  <span className="saved-toast">
                    <FaCheckCircle /> Organization updated across entire app!
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Add New Zone Form */}
          <div className="admin-card-section">
            <div className="section-title-wrap">
              <FaPlus className="sec-icon" />
              <div>
                <h3>Define New Campus Zone & Inspection Advice</h3>
                <p>Register a building or room to generate its physical QR code</p>
              </div>
            </div>

            <form onSubmit={handleAddZone} className="add-zone-form">
              <div className="form-grid-three">
                <div className="admin-form-group">
                  <label>Zone Name *</label>
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="e.g. Computer Science Lab 3"
                    className="admin-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Building / Block *</label>
                  <input
                    type="text"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                    placeholder="e.g. Tech Block B"
                    className="admin-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Room / Area</label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. Room 204"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-grid-two">
                <div className="admin-form-group">
                  <label>Recommended Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="admin-select"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Admin Recommendation Advice (Auto-fills on scan)</label>
                  <input
                    type="text"
                    value={newRecommendation}
                    onChange={(e) => setNewRecommendation(e.target.value)}
                    placeholder="e.g. Check power sockets, AC cooling, and projectors"
                    className="admin-input"
                  />
                </div>
              </div>

              <button type="submit" className="create-zone-btn">
                <FaPlus /> Add Zone to Campus Registry
              </button>
            </form>
          </div>

          {/* Zones Table with QR Generation */}
          <div className="admin-table-card">
            <div className="patrol-header">
              <h3>Registered Campus Zones ({zones.length})</h3>
              <p>Generate and print QR codes to paste on campus doors, walls, and desks</p>
            </div>

            <div className="responsive-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Location</th>
                    <th>Default Category</th>
                    <th>Recommendation Advice</th>
                    <th>QR Action</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id}>
                      <td>
                        <strong>{zone.name}</strong>
                      </td>
                      <td>
                        <span>{zone.building}</span>
                        {zone.room && <span className="table-sub">{zone.room}</span>}
                      </td>
                      <td>
                        <span className="zone-cat-pill">{zone.category}</span>
                      </td>
                      <td>
                        <span className="advice-text">{zone.recommendation || 'Standard check'}</span>
                      </td>
                      <td>
                        <button
                          className="generate-qr-btn"
                          onClick={() => handleGenerateQR(zone)}
                          title="Generate QR code for this zone"
                        >
                          <FaQrcode /> View QR
                        </button>
                      </td>
                      <td>
                        <button
                          className="delete-icon-btn"
                          onClick={() => deleteZone(zone.id)}
                          title="Delete zone"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: User Role Management */}
      {activeTab === 'users' && (
        <div className="admin-table-card">
          <div className="patrol-header">
            <h3>Registered Users & Access Roles ({usersList.length})</h3>
            <p>Assign administrative and maintenance staff privileges</p>
          </div>

          <div className="responsive-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Department / Roll</th>
                  <th>Current Role</th>
                  <th>Change Permission</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.department || 'General Member'}</td>
                    <td>
                      <span className={`role-badge-cell ${u.role}`}>
                        {u.role ? u.role.toUpperCase() : 'STUDENT'}
                      </span>
                    </td>
                    <td>
                      <select
                        value={u.role || 'student'}
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

      {/* Tab 4: Live 1s Patrol Telemetry */}
      {activeTab === 'patrol' && (
        <div className="admin-table-card">
          <div className="patrol-header">
            <h3>Active Maintenance Staff Geo-Telemetry (MongoDB 1s Stream)</h3>
            <p>Real-time location stream from mobile field personnel</p>
          </div>

          <div className="responsive-table-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Department</th>
                  <th>Current Lat / Lng</th>
                  <th>Accuracy</th>
                  <th>Status</th>
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
                  activeStaff.map((staff) => (
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

      {/* Modal: Generated QR Code for Zone */}
      {activeQRZone && generatedQRUrl && (
        <div className="admin-qr-modal-backdrop" onClick={() => setActiveQRZone(null)}>
          <div className="admin-qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-qr-modal-header">
              <h4>Zone QR Code: {activeQRZone.name}</h4>
              <button
                className="admin-qr-close"
                onClick={() => setActiveQRZone(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="admin-qr-body">
              <div className="qr-image-frame">
                <img src={generatedQRUrl} alt={`QR for ${activeQRZone.name}`} />
              </div>

              <div className="qr-meta-box">
                <p><strong>Building:</strong> {activeQRZone.building} {activeQRZone.room ? `• ${activeQRZone.room}` : ''}</p>
                <p><strong>Recommended Category:</strong> {activeQRZone.category}</p>
                <p><strong>Inspection Advice:</strong> {activeQRZone.recommendation}</p>
              </div>

              <div className="admin-qr-actions">
                <a
                  href={generatedQRUrl}
                  download={`QR_${activeQRZone.name.replace(/\s+/g, '_')}.png`}
                  className="download-qr-btn"
                >
                  <FaDownload /> Download PNG
                </a>
                <button
                  className="print-qr-btn"
                  onClick={() => window.print()}
                >
                  <FaPrint /> Print Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
