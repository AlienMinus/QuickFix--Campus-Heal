import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { adminAPI, issueAPI, locationAPI, instituteAPI } from '../../services/api';
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
  FaThList,
  FaCrown,
  FaUniversity,
  FaEye,
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

const getCategoryShortTag = (category) => {
  switch (category) {
    case 'Electrical & Lighting':
      return '⚡ Light';
    case 'Water Leakage & Plumbing':
      return '💧 Plumb';
    case 'Cleanliness & Sanitation':
      return '🧹 Clean';
    case 'Network & Wi-Fi':
      return '📶 Wi-Fi';
    case 'Damaged Infrastructure':
      return '🛠️ Infra';
    case 'Safety & Security Hazard':
      return '🛡️ Hazard';
    case 'Lab & Classroom Equipment':
      return '🔬 Lab';
    default:
      return '📌 Facility';
  }
};

export default function AdminDashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const { orgConfig, updateOrgInfo, zones, addZone, deleteZone } = useOrg();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [institutesList, setInstitutesList] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('All');
  const [superOverview, setSuperOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table filters & active section dropdown state (issues | zones | users | patrol | institutes)
  const [tableFilter, setTableFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [activeTab, setActiveTab] = useState('issues');

  // Form Modals Visibility
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showAddInstituteModal, setShowAddInstituteModal] = useState(false);

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

  // New Institute Form state (Super Admin)
  const [newInstName, setNewInstName] = useState('');
  const [newInstCode, setNewInstCode] = useState('');
  const [newInstCity, setNewInstCity] = useState('');
  const [newInstLocation, setNewInstLocation] = useState('');
  const [newInstEmail, setNewInstEmail] = useState('');

  // QR Modal preview state
  const [activeQRZone, setActiveQRZone] = useState(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState('');

  const fetchAdminData = async (instFilter = selectedInstitute) => {
    try {
      setLoading(true);
      setError('');

      const queryParams = instFilter && instFilter !== 'All' ? { institute: instFilter } : {};

      const calls = [
        adminAPI.getStats(queryParams),
        issueAPI.getAll({ ...queryParams, limit: 100 }),
        adminAPI.getUsers(queryParams),
        locationAPI.getActiveStaff(),
        instituteAPI.getAll(),
      ];

      if (isSuperAdmin) {
        calls.push(instituteAPI.getSuperAdminOverview());
      }

      const results = await Promise.allSettled(calls);

      if (results[0].status === 'fulfilled') setStats(results[0].value.data.stats);
      if (results[1].status === 'fulfilled') setIssues(results[1].value.data.issues || []);
      if (results[2].status === 'fulfilled') setUsersList(results[2].value.data.users || []);
      if (results[3].status === 'fulfilled') setActiveStaff(results[3].value.data.activeStaff || []);
      if (results[4].status === 'fulfilled') setInstitutesList(results[4].value.data.institutes || []);
      if (isSuperAdmin && results[5]?.status === 'fulfilled') {
        setSuperOverview(results[5].value.data.stats);
      }
    } catch (err) {
      setError('Could not load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(selectedInstitute);
  }, [selectedInstitute]);

  const handleInstituteChange = (instName) => {
    setSelectedInstitute(instName);
  };

  const handleSaveOrgInfo = (e) => {
    e.preventDefault();
    updateOrgInfo(orgName.trim(), orgSubtitle.trim());
    setOrgSavedToast(true);
    setTimeout(() => setOrgSavedToast(false), 3500);
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
    setShowAddZoneModal(false);
  };

  const handleCreateInstitute = async (e) => {
    e.preventDefault();
    if (!newInstName.trim() || !newInstCode.trim()) {
      alert('Institute Name and Code are required.');
      return;
    }

    try {
      await instituteAPI.create({
        name: newInstName.trim(),
        code: newInstCode.trim().toUpperCase(),
        city: newInstCity.trim() || 'Bhubaneswar',
        location: newInstLocation.trim() || 'Campus Area',
        contactEmail: newInstEmail.trim(),
      });

      alert(`Institute ${newInstName} created successfully!`);
      setShowAddInstituteModal(false);
      setNewInstName('');
      setNewInstCode('');
      setNewInstCity('');
      setNewInstLocation('');
      setNewInstEmail('');
      fetchAdminData(selectedInstitute);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create institute');
    }
  };

  const handleDeleteInstitute = async (instId, instName) => {
    if (!window.confirm(`Are you sure you want to delete institute ${instName}?`)) return;
    try {
      await instituteAPI.delete(instId);
      alert(`Institute ${instName} deleted`);
      fetchAdminData(selectedInstitute);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete institute');
    }
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
      const res = await adminAPI.updateUserRole(userId, { role: newRole });
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleUserInstituteReassign = async (userId, newInst) => {
    try {
      await adminAPI.updateUserRole(userId, { institute: newInst });
      setUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, institute: newInst } : u))
      );
      alert(`User assigned to ${newInst}`);
    } catch (err) {
      alert('Failed to reassign user institute');
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
    const headers = ['TrackingID', 'Title', 'Institute', 'Category', 'Severity', 'Status', 'Zone', 'Location', 'ReportedBy', 'CreatedAt'];
    const rows = issues.map((i) => [
      i.trackingId || i._id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      `"${i.institute || 'Default'}"`,
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
      {/* Top Banner with Super Admin Mode or Institute Command Center */}
      <div className="admin-header-row">
        <div>
          <div className={`admin-role-badge ${isSuperAdmin ? 'super' : ''}`}>
            {isSuperAdmin ? (
              <>
                <FaCrown /> Multi-Institute Governance • Super Admin HQ
              </>
            ) : (
              <>
                <FaUserShield /> {user?.institute || orgConfig.name} • Command Center
              </>
            )}
          </div>
          <h1>Facility & Operations Administration</h1>
        </div>

        <div className="admin-header-actions">
          {/* Super Admin Institute Filter Dropdown */}
          {isSuperAdmin && (
            <div className="superadmin-filter-bar">
              <FaUniversity className="inst-filter-icon" />
              <select
                value={selectedInstitute}
                onChange={(e) => handleInstituteChange(e.target.value)}
                className="institute-quick-switch-select"
                title="Filter views by institute"
              >
                <option value="All">All Institutes ({institutesList.length})</option>
                {institutesList.map((inst) => (
                  <option key={inst._id || inst.name} value={inst.name}>
                    {inst.name} ({inst.city || inst.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="csv-export-btn" onClick={handleExportCSV}>
            <FaFileDownload /> CSV
          </button>
          <button className="admin-refresh-btn" onClick={() => fetchAdminData(selectedInstitute)} title="Refresh records">
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
            <span className="kpi-label">Tickets</span>
          </div>
        </div>

        <div className="kpi-card resolved">
          <div className="kpi-icon-box"><FaCheckCircle /></div>
          <div className="kpi-details">
            <span className="kpi-number">
              {stats?.resolutionRate ?? (issues.length ? Math.round((issues.filter((i) => i.status === 'Resolved').length / issues.length) * 100) : 0)}%
            </span>
            <span className="kpi-label">Resolved</span>
          </div>
        </div>

        <div className="kpi-card critical">
          <div className="kpi-icon-box"><FaExclamationTriangle /></div>
          <div className="kpi-details">
            <span className="kpi-number">
              {issues.filter((i) => i.severity === 'Critical' && i.status !== 'Resolved').length}
            </span>
            <span className="kpi-label">Critical</span>
          </div>
        </div>

        <div className="kpi-card staff">
          <div className="kpi-icon-box"><FaUsers /></div>
          <div className="kpi-details">
            <span className="kpi-number">{activeStaff.length}</span>
            <span className="kpi-label">Staff</span>
          </div>
        </div>
      </div>

      {/* Section Navigation via Dropdown - Strictly ZERO Horizontal Scrolling */}
      <div className="admin-section-navigator">
        <div className="section-nav-inner">
          <span className="section-nav-label">
            <FaThList className="section-nav-icon" /> Switch Section:
          </span>
          <div className="section-dropdown-wrapper">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="admin-section-dropdown"
              aria-label="Administrative Section Selection"
            >
              <option value="issues">📋 Issues Dispatch ({issues.length} Tickets)</option>
              <option value="zones">🏷️ Campus Zones & QR Generator ({zones.length} Zones)</option>
              <option value="users">👥 User Roles & Access ({usersList.length} Accounts)</option>
              <option value="patrol">📡 Maintenance Staff Patrol ({activeStaff.length} Active)</option>
              {isSuperAdmin && (
                <option value="institutes">🏛️ Institutes Governance ({institutesList.length} Campuses)</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Global Toast when Org Info is updated */}
      {orgSavedToast && (
        <div className="admin-global-toast">
          <FaCheckCircle /> Campus & organization details saved across the entire application!
        </div>
      )}

      {/* Section 1: Issues Management Table */}
      {activeTab === 'issues' && (
        <div className="admin-table-card">
          <div className="table-controls">
            <div className="table-search-wrap">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Filter title, room, category..."
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
            <table className="admin-data-table issues-table">
              <thead>
                <tr>
                  <th style={{ width: '48%' }}>Ticket Info</th>
                  <th style={{ width: '16%' }}>Severity</th>
                  <th style={{ width: '18%' }}>Status</th>
                  <th style={{ width: '18%' }}>Assign / Del</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-table-msg">No tickets match criteria.</td>
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
                        <div className="table-meta-line">
                          <span className="table-sub">#{issue.trackingId || issue._id.slice(-6)}</span>
                          <span className="table-zone-sub">📍 {issue.locationName || issue.zone || 'Campus'}</span>
                          {isSuperAdmin && issue.institute && (
                            <span className="table-inst-pill">🏛️ {issue.institute}</span>
                          )}
                        </div>
                        <span className="table-cat-tag">{issue.category}</span>
                      </td>
                      <td>
                        <SeverityBadge severity={issue.severity} compact />
                      </td>
                      <td>
                        <span className={`table-status-pill ${issue.status.toLowerCase().replace(' ', '-')}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-action-cell">
                          <select
                            value={issue.assignedTo?._id || issue.assignedTo || ''}
                            onChange={(e) => handleAssignTechnician(issue._id, e.target.value)}
                            className="staff-assign-select"
                            title="Assign staff technician"
                          >
                            <option value="">Unassigned</option>
                            {staffMembers.map((staff) => (
                              <option key={staff._id} value={staff._id}>
                                {staff.name}
                              </option>
                            ))}
                          </select>
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

      {/* Section 2: Campus Zones & QR Code Generator - Overlapping Fixed with Clean Responsive Layout */}
      {activeTab === 'zones' && (
        <div className="zones-management-container">
          <div className="zones-header-actions-card">
            <div className="zones-header-info">
              <h3>Campus Zones & QR Generator ({zones.length})</h3>
              <p>Create facility spots, generate scannable QR codes, and customize organization details</p>
            </div>
            <div className="zones-action-buttons">
              <button
                type="button"
                className="open-modal-action-btn primary"
                onClick={() => setShowAddZoneModal(true)}
              >
                <FaPlus /> Add Zone
              </button>
              <button
                type="button"
                className="open-modal-action-btn secondary"
                onClick={() => setShowOrgModal(true)}
              >
                <FaBuilding /> Customize
              </button>
            </div>
          </div>

          <div className="admin-table-card">
            <div className="responsive-table-wrapper">
              <table className="admin-data-table zones-table">
                <thead>
                  <tr>
                    <th style={{ width: '74%' }}>Zone & Facility Details</th>
                    <th style={{ width: '26%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id}>
                      <td>
                        <strong className="table-highlight-name">{zone.name}</strong>
                        <div className="table-sub-row">
                          <span className="table-sub">🏢 {zone.building} {zone.room ? `• ${zone.room}` : ''}</span>
                          <span className="zone-cat-tag">{getCategoryShortTag(zone.category)}</span>
                        </div>
                        {zone.recommendation && (
                          <span className="table-advice-sub">💡 {zone.recommendation}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="zone-action-btn-group">
                          <button
                            className="generate-qr-btn icon-only"
                            onClick={() => handleGenerateQR(zone)}
                            title={`Generate QR for ${zone.name}`}
                          >
                            <FaQrcode /> QR
                          </button>
                          <button
                            className="delete-icon-btn"
                            onClick={() => deleteZone(zone.id)}
                            title="Delete zone"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: User Role Management */}
      {activeTab === 'users' && (
        <div className="admin-table-card">
          <div className="patrol-header">
            <h3>Registered User Accounts & Access Roles ({usersList.length})</h3>
            <p>
              {isSuperAdmin
                ? 'Super Admin Directory: Manage roles and assign institutes across all colleges'
                : `Users belonging to ${user?.institute || 'your institute'} (No data mixup)`}
            </p>
          </div>

          <div className="responsive-table-wrapper">
            <table className="admin-data-table users-table">
              <thead>
                <tr>
                  <th style={{ width: '42%' }}>User & Institute</th>
                  <th style={{ width: '22%' }}>Role</th>
                  <th style={{ width: '36%' }}>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <strong className="table-highlight-name">{u.name}</strong>
                      <span className="table-sub">{u.email}</span>
                      <span className="user-inst-badge">🏛️ {u.institute || 'BPUT Tech Campus'}</span>
                    </td>
                    <td>
                      <span className={`role-badge-cell ${u.role}`}>
                        {u.role ? u.role.toUpperCase() : 'STUDENT'}
                      </span>
                    </td>
                    <td>
                      <div className="user-role-actions-cell">
                        <select
                          value={u.role || 'student'}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="role-change-select"
                        >
                          <option value="student">Student</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                          {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                        </select>

                        {isSuperAdmin && (
                          <select
                            value={u.institute || 'BPUT Tech Campus'}
                            onChange={(e) => handleUserInstituteReassign(u._id, e.target.value)}
                            className="role-change-select inst-switch"
                            title="Reassign Institute"
                          >
                            {institutesList.map((inst) => (
                              <option key={inst._id || inst.name} value={inst.name}>
                                {inst.code || inst.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 4: Live 1s Patrol Telemetry */}
      {activeTab === 'patrol' && (
        <div className="admin-table-card">
          <div className="patrol-header">
            <h3>Active Maintenance Staff Geo-Telemetry (Live Radar)</h3>
            <p>Real-time location stream from mobile personnel</p>
          </div>

          <div className="responsive-table-wrapper">
            <table className="admin-data-table patrol-table">
              <thead>
                <tr>
                  <th style={{ width: '44%' }}>Staff Member</th>
                  <th style={{ width: '36%' }}>Coordinates</th>
                  <th style={{ width: '20%' }}>Map</th>
                </tr>
              </thead>
              <tbody>
                {activeStaff.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-table-msg">
                      No staff location updates received in past 15 min.
                    </td>
                  </tr>
                ) : (
                  activeStaff.map((staff, idx) => (
                    <tr key={staff._id || idx}>
                      <td>
                        <strong className="table-highlight-name">{staff.userName}</strong>
                        <span className="live-ping-indicator">
                          <span className="dot pulse" /> Active Now
                        </span>
                      </td>
                      <td>
                        <span className="coords-mono">
                          {staff.lat?.toFixed(4)}, {staff.lng?.toFixed(4)}
                        </span>
                        <span className="table-sub">{staff.lastZone || 'Campus Perimeter'}</span>
                      </td>
                      <td>
                        <button
                          className="map-focus-btn"
                          onClick={() => navigate('/map')}
                          title="Locate on Campus Map"
                        >
                          Locate
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

      {/* Section 5: Super Admin Multi-Institute Governance */}
      {isSuperAdmin && activeTab === 'institutes' && (
        <div className="superadmin-institutes-container">
          <div className="zones-header-actions-card">
            <div className="zones-header-info">
              <h3>Higher Education Multi-Campus Governance</h3>
              <p>Configure distinct institutions, manage cross-campus administrator delegations and prevent data pollution</p>
            </div>
            <div className="zones-action-buttons">
              <button
                type="button"
                className="open-modal-action-btn primary"
                onClick={() => setShowAddInstituteModal(true)}
              >
                <FaPlus /> Register Institute
              </button>
            </div>
          </div>

          {/* Super Admin Global Metrics */}
          {superOverview && (
            <div className="super-kpi-grid">
              <div className="super-kpi-card">
                <span className="super-kpi-val">{superOverview.totalInstitutes}</span>
                <span className="super-kpi-sub">Total Campuses</span>
              </div>
              <div className="super-kpi-card">
                <span className="super-kpi-val">{superOverview.totalUsers}</span>
                <span className="super-kpi-sub">Total Members</span>
              </div>
              <div className="super-kpi-card">
                <span className="super-kpi-val">{superOverview.issuesSummary?.total || 0}</span>
                <span className="super-kpi-sub">Total Tickets</span>
              </div>
              <div className="super-kpi-card highlight">
                <span className="super-kpi-val">{superOverview.issuesSummary?.overallResolutionRate || 0}%</span>
                <span className="super-kpi-sub">System Resolution</span>
              </div>
            </div>
          )}

          {/* Institutes Directory */}
          <div className="admin-table-card">
            <div className="responsive-table-wrapper">
              <table className="admin-data-table institutes-table">
                <thead>
                  <tr>
                    <th style={{ width: '46%' }}>Institute & Campus</th>
                    <th style={{ width: '22%' }}>Personnel</th>
                    <th style={{ width: '18%' }}>Issues</th>
                    <th style={{ width: '14%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {institutesList.map((inst) => {
                    const statsForInst = superOverview?.institutes?.find((s) => s.name === inst.name);
                    return (
                      <tr key={inst._id || inst.code}>
                        <td>
                          <strong className="table-highlight-name">{inst.name}</strong>
                          <span className="table-sub">Code: {inst.code} • {inst.city || inst.location}</span>
                          {inst.contactEmail && (
                            <span className="table-advice-sub">✉️ {inst.contactEmail}</span>
                          )}
                        </td>
                        <td>
                          <span className="inst-stat-pill admin">
                            🛡️ {statsForInst?.adminsCount ?? '-'} Admin
                          </span>
                          <span className="inst-stat-pill staff">
                            🛠️ {statsForInst?.staffCount ?? '-'} Staff
                          </span>
                          <span className="inst-stat-pill student">
                            🎓 {statsForInst?.studentsCount ?? '-'} Students
                          </span>
                        </td>
                        <td>
                          <span className="inst-stat-pill issues">
                            🎫 {statsForInst?.totalIssues ?? 0} Tickets
                          </span>
                          <span className="inst-stat-pill resolved">
                            ✅ {statsForInst?.resolutionRate ?? 0}% Done
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="inst-action-btns">
                            <button
                              className="focus-inst-btn"
                              onClick={() => {
                                setSelectedInstitute(inst.name);
                                setActiveTab('issues');
                              }}
                              title={`Focus on ${inst.name}`}
                            >
                              <FaEye /> View
                            </button>
                            <button
                              className="delete-icon-btn"
                              onClick={() => handleDeleteInstitute(inst._id, inst.name)}
                              title="Delete Institute"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL 1: Add New Zone */}
      {showAddZoneModal && (
        <div className="admin-form-modal-backdrop" onClick={() => setShowAddZoneModal(false)}>
          <div className="admin-form-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-form-modal-header">
              <div className="admin-modal-title">
                <FaQrcode className="modal-title-icon" />
                <h4>Register New Campus Zone</h4>
              </div>
              <button
                type="button"
                className="admin-form-modal-close"
                onClick={() => setShowAddZoneModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddZone} className="admin-modal-form-content">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Zone / Location Spot Name *</label>
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="e.g. Science Block C Corridor"
                    className="admin-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Building / Complex *</label>
                  <input
                    type="text"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                    placeholder="e.g. Academic Block 1"
                    className="admin-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Room / Landmark</label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. 2nd Floor Near Lift"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Service Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="admin-select"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group full-width">
                  <label>Admin Recommendation Advice (Auto-fills on QR scan)</label>
                  <input
                    type="text"
                    value={newRecommendation}
                    onChange={(e) => setNewRecommendation(e.target.value)}
                    placeholder="e.g. Check power sockets, AC cooling, and projectors"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="admin-form-modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowAddZoneModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  <FaPlus /> Add Zone to Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL 2: Organization / Campus Customization */}
      {showOrgModal && (
        <div className="admin-form-modal-backdrop" onClick={() => setShowOrgModal(false)}>
          <div className="admin-form-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-form-modal-header">
              <div className="admin-modal-title">
                <FaBuilding className="modal-title-icon" />
                <h4>Organization / Campus Customization</h4>
              </div>
              <button
                type="button"
                className="admin-form-modal-close"
                onClick={() => setShowOrgModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                handleSaveOrgInfo(e);
                setShowOrgModal(false);
              }}
              className="admin-modal-form-content"
            >
              <p className="modal-intro-text">
                Generalize the application so that any college, university, or corporate facility can use this portal.
              </p>

              <div className="admin-form-group">
                <label>Campus / Organization Name *</label>
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

              <div className="admin-form-modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowOrgModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  <FaCheckCircle /> Save Organization Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL 3: Super Admin Register New Institute */}
      {showAddInstituteModal && (
        <div className="admin-form-modal-backdrop" onClick={() => setShowAddInstituteModal(false)}>
          <div className="admin-form-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-form-modal-header">
              <div className="admin-modal-title">
                <FaUniversity className="modal-title-icon" />
                <h4>Register New Educational Institute</h4>
              </div>
              <button
                type="button"
                className="admin-form-modal-close"
                onClick={() => setShowAddInstituteModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateInstitute} className="admin-modal-form-content">
              <p className="modal-intro-text">
                Instantly provision a distinct organization namespace with segregated issues, zones, and personnel data.
              </p>

              <div className="admin-form-grid">
                <div className="admin-form-group full-width">
                  <label>Full Institute Name *</label>
                  <input
                    type="text"
                    value={newInstName}
                    onChange={(e) => setNewInstName(e.target.value)}
                    placeholder="e.g. National Institute of Technology, Rourkela"
                    className="admin-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Short Code (Unique) *</label>
                  <input
                    type="text"
                    value={newInstCode}
                    onChange={(e) => setNewInstCode(e.target.value)}
                    placeholder="e.g. NITR"
                    className="admin-input"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>City / Campus Location</label>
                  <input
                    type="text"
                    value={newInstCity}
                    onChange={(e) => setNewInstCity(e.target.value)}
                    placeholder="e.g. Rourkela"
                    className="admin-input"
                  />
                </div>

                <div className="admin-form-group full-width">
                  <label>Official Admin Email</label>
                  <input
                    type="email"
                    value={newInstEmail}
                    onChange={(e) => setNewInstEmail(e.target.value)}
                    placeholder="e.g. registrar@institute.edu"
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="admin-form-modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowAddInstituteModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  <FaUniversity /> Provision Institute
                </button>
              </div>
            </form>
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
