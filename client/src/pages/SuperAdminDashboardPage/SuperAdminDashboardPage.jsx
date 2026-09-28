import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, instituteAPI } from '../../services/api';
import {
  FaCrown,
  FaUniversity,
  FaUserShield,
  FaUsers,
  FaShieldAlt,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaKey,
  FaSync,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaIdBadge,
  FaSpinner,
  FaTimes,
  FaLock,
  FaMapMarkerAlt,
  FaThList,
  FaUserCheck,
  FaCity,
} from 'react-icons/fa';
import './SuperAdminDashboardPage.css';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [institutes, setInstitutes] = useState([]);
  const [unassignedAdmins, setUnassignedAdmins] = useState([]);
  const [adminsList, setAdminsList] = useState([]);
  const [counts, setCounts] = useState({
    totalAdmins: 0,
    totalStaff: 0,
    totalStudents: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Active view tab: 'institutes' | 'directory'
  const [activeTab, setActiveTab] = useState('institutes');
  const [instituteSearch, setInstituteSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  // Modals state
  const [showInstituteModal, setShowInstituteModal] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState(null);
  const [deletingInstitute, setDeletingInstitute] = useState(null);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [instituteForm, setInstituteForm] = useState({
    name: '',
    code: '',
    location: '',
    city: '',
    state: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    institute: '',
    department: 'Campus Administration',
    identifier: '',
    phone: '',
    role: 'admin',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [instRes, adminRes] = await Promise.allSettled([
        instituteAPI.getWithAdmins(),
        adminAPI.getAdmins(),
      ]);

      if (instRes.status === 'fulfilled' && instRes.value.data) {
        setInstitutes(instRes.value.data.institutes || []);
        setUnassignedAdmins(instRes.value.data.unassignedAdmins || []);
      }

      if (adminRes.status === 'fulfilled' && adminRes.value.data) {
        setAdminsList(adminRes.value.data.admins || []);
        if (adminRes.value.data.counts) {
          setCounts(adminRes.value.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load super admin data:', err);
      setError('Failed to load institute and administrator records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [user]);

  // Open Add Institute Modal
  const handleOpenAddInstitute = () => {
    setEditingInstitute(null);
    setInstituteForm({
      name: '',
      code: '',
      location: '',
      city: 'Bhubaneswar',
      state: 'Odisha',
      contactEmail: '',
      contactPhone: '',
    });
    setShowInstituteModal(true);
  };

  // Open Edit Institute Modal
  const handleOpenEditInstitute = (inst) => {
    setEditingInstitute(inst);
    setInstituteForm({
      name: inst.name || '',
      code: inst.code || '',
      location: inst.location || '',
      city: inst.city || '',
      state: inst.state || '',
      contactEmail: inst.contactEmail || '',
      contactPhone: inst.contactPhone || '',
    });
    setShowInstituteModal(true);
  };

  // Submit Institute (Create or Update)
  const handleSubmitInstitute = async (e) => {
    e.preventDefault();
    if (!instituteForm.name || !instituteForm.code) {
      setError('Institute Name and Code are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (editingInstitute) {
        await instituteAPI.update(editingInstitute._id, instituteForm);
        setActionSuccess(`Institute "${instituteForm.name}" updated successfully!`);
      } else {
        await instituteAPI.create(instituteForm);
        setActionSuccess(`Institute "${instituteForm.name}" registered successfully!`);
      }

      setShowInstituteModal(false);
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save institute.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Institute
  const handleDeleteInstitute = async () => {
    if (!deletingInstitute) return;
    try {
      setSubmitting(true);
      setError('');
      await instituteAPI.delete(deletingInstitute._id);
      setActionSuccess(`Institute "${deletingInstitute.name}" removed successfully.`);
      setDeletingInstitute(null);
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete institute.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Add Admin Modal (optionally for a specific institute)
  const handleOpenAddAdmin = (preferredInstituteName = '') => {
    setEditingAdmin(null);
    const defaultInst = preferredInstituteName || (institutes.length > 0 ? institutes[0].name : '');
    setAdminForm({
      name: '',
      email: '',
      password: '',
      institute: defaultInst,
      department: 'Campus Administration',
      identifier: '',
      phone: '',
      role: 'admin',
    });
    setShowAdminModal(true);
  };

  // Open Edit Admin Modal
  const handleOpenEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setAdminForm({
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      institute: admin.institute || (institutes.length > 0 ? institutes[0].name : ''),
      department: admin.department || 'Campus Administration',
      identifier: admin.identifier || '',
      phone: admin.phone || '',
      role: admin.role || 'admin',
    });
    setShowAdminModal(true);
  };

  // Submit Admin (Create or Update)
  const handleSubmitAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.name || !adminForm.email) {
      setError('Name and Email are required.');
      return;
    }
    if (!editingAdmin && !adminForm.password) {
      setError('Initial Password is required for onboarding.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (editingAdmin) {
        const payload = {
          name: adminForm.name,
          department: adminForm.department,
          institute: adminForm.institute,
          identifier: adminForm.identifier,
          phone: adminForm.phone,
          role: adminForm.role,
        };
        if (adminForm.password) {
          payload.password = adminForm.password;
        }
        await adminAPI.updateAdmin(editingAdmin._id, payload);
        setActionSuccess(`Administrator "${adminForm.name}" updated successfully!`);
      } else {
        await adminAPI.createAdmin(adminForm);
        setActionSuccess(`Administrator "${adminForm.name}" onboarded for "${adminForm.institute}"!`);
      }

      setShowAdminModal(false);
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    try {
      setSubmitting(true);
      setError('');
      await adminAPI.deleteAdmin(deletingAdmin._id);
      setActionSuccess(`Administrator "${deletingAdmin.name}" revoked successfully.`);
      setDeletingAdmin(null);
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered institutes based on search
  const filteredInstitutes = institutes.filter((inst) => {
    if (!instituteSearch.trim()) return true;
    const q = instituteSearch.toLowerCase();
    return (
      inst.name?.toLowerCase().includes(q) ||
      inst.code?.toLowerCase().includes(q) ||
      inst.city?.toLowerCase().includes(q) ||
      inst.location?.toLowerCase().includes(q) ||
      inst.admins?.some(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q)
      )
    );
  });

  // Filtered admins list for directory tab
  const filteredAdmins = adminsList.filter((a) => {
    if (!adminSearch.trim()) return true;
    const q = adminSearch.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.institute?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      a.identifier?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="superadmin-container">
      {/* Super Admin Top Header */}
      <div className="superadmin-header">
        <div className="header-title-box">
          <div className="superadmin-crown-badge">
            <FaCrown className="crown-icon" />
            <span>APEX GOVERNANCE</span>
          </div>
          <h1>Super Admin Directorate</h1>
          <p className="superadmin-subtitle">
            Institutes & Respective Administrator Governance • Central Platform Authority
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn-add-institute"
            onClick={handleOpenAddInstitute}
            title="Register a new campus institute"
          >
            <FaPlus /> Register Institute
          </button>
          <button
            className="btn-add-admin"
            onClick={() => handleOpenAddAdmin()}
            title="Onboard a new campus administrator"
          >
            <FaUserShield /> Onboard Admin
          </button>
          <button
            className="btn-refresh"
            onClick={fetchData}
            title="Refresh records"
          >
            <FaSync className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Governance & Privacy Notice */}
      <div className="superadmin-privacy-banner">
        <FaShieldAlt className="shield-icon" />
        <div className="privacy-banner-text">
          <strong>Super Administrator Governance Mandate:</strong>
          <span>
            You hold central authority to manage institutes and their respective administrators. Private student complaints, maintenance chat logs, and campus-specific issues are strictly managed by each respective campus admin.
          </span>
        </div>
      </div>

      {/* Alert Messages */}
      {actionSuccess && (
        <div className="superadmin-alert success">
          <FaCheckCircle /> {actionSuccess}
        </div>
      )}
      {error && (
        <div className="superadmin-alert error">
          <FaExclamationTriangle /> {error}
        </div>
      )}

      {/* Platform High-Level Governance KPIs (Squared Responsive Grid) */}
      <div className="superadmin-kpi-grid">
        <div className="super-kpi-card institutes-card">
          <div className="super-kpi-icon-box">
            <FaUniversity />
          </div>
          <div className="super-kpi-details">
            <span className="super-kpi-number">{institutes.length}</span>
            <span className="super-kpi-label">Institutes</span>
            <span className="super-kpi-sub">Campus Networks</span>
          </div>
        </div>

        <div className="super-kpi-card admins-card">
          <div className="super-kpi-icon-box">
            <FaUserShield />
          </div>
          <div className="super-kpi-details">
            <span className="super-kpi-number">{counts.totalAdmins}</span>
            <span className="super-kpi-label">Admins</span>
            <span className="super-kpi-sub">Directors</span>
          </div>
        </div>

        <div className="super-kpi-card users-card">
          <div className="super-kpi-icon-box">
            <FaUsers />
          </div>
          <div className="super-kpi-details">
            <span className="super-kpi-number">{counts.totalUsers}</span>
            <span className="super-kpi-label">Users</span>
            <span className="super-kpi-sub">Total Accounts</span>
          </div>
        </div>

        <div className="super-kpi-card security-card">
          <div className="super-kpi-icon-box">
            <FaLock />
          </div>
          <div className="super-kpi-details">
            <span className="super-kpi-number active">Active</span>
            <span className="super-kpi-label">Isolation</span>
            <span className="super-kpi-sub">Role Locked</span>
          </div>
        </div>
      </div>

      {/* Section Navigation via Dropdown - Strictly ZERO Horizontal Scrolling */}
      <div className="superadmin-section-navigator">
        <div className="section-nav-inner">
          <span className="section-nav-label">
            <FaThList className="section-nav-icon" /> Switch Console View:
          </span>
          <div className="section-dropdown-wrapper">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="superadmin-section-dropdown"
              aria-label="Super Administrator Section Selection"
            >
              <option value="institutes">🏛️ Campus Institutes & Respective Admins ({institutes.length})</option>
              <option value="directory">👥 All Campus Administrators Directory ({adminsList.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: Institutes & Their Respective Admins */}
      {activeTab === 'institutes' && (
        <div className="institutes-view-section">
          <div className="section-search-row">
            <div className="section-title-wrap">
              <h2>Campus Institutes & Assigned Administrators</h2>
              <p>Manage each institute and appoint, reassign, or oversee its respective campus administrators.</p>
            </div>

            <div className="search-bar-wrap">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search institute name, code, city, admin..."
                value={instituteSearch}
                onChange={(e) => setInstituteSearch(e.target.value)}
                className="admin-search-input"
              />
              {instituteSearch && (
                <button className="clear-search-btn" onClick={() => setInstituteSearch('')}>
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <FaSpinner className="spin loading-spinner" />
              <p>Loading institutes and administrator rosters...</p>
            </div>
          ) : filteredInstitutes.length === 0 ? (
            <div className="empty-state-box">
              <FaUniversity className="empty-icon" />
              <h3>No Institutes Found</h3>
              <p>
                {instituteSearch
                  ? `No institutes match "${instituteSearch}".`
                  : 'No institutes registered. Click "Register Institute" to create one.'}
              </p>
            </div>
          ) : (
            <div className="institutes-cards-list">
              {filteredInstitutes.map((inst) => (
                <div key={inst._id} className="institute-management-card">
                  {/* Institute Header Info */}
                  <div className="institute-card-top">
                    <div className="institute-title-meta">
                      <div className="institute-code-pill">{inst.code}</div>
                      <div>
                        <h3 className="institute-name">{inst.name}</h3>
                        <div className="institute-location-row">
                          <span className="inst-meta-item">
                            <FaMapMarkerAlt /> {inst.location || 'Campus Perimeter'}, {inst.city || 'Odisha'}
                          </span>
                          {inst.contactEmail && (
                            <span className="inst-meta-item">
                              <FaEnvelope /> {inst.contactEmail}
                            </span>
                          )}
                          {inst.contactPhone && (
                            <span className="inst-meta-item">
                              <FaPhone /> {inst.contactPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="institute-header-actions">
                      <button
                        className="btn-onboard-inst-admin"
                        onClick={() => handleOpenAddAdmin(inst.name)}
                        title={`Appoint a new administrator for ${inst.name}`}
                      >
                        <FaPlus /> Appoint Admin
                      </button>
                      <button
                        className="btn-edit-inst"
                        onClick={() => handleOpenEditInstitute(inst)}
                        title="Edit institute details"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="btn-del-inst"
                        onClick={() => setDeletingInstitute(inst)}
                        title="Delete institute"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Respective Admins Section */}
                  <div className="respective-admins-container">
                    <div className="admins-section-header">
                      <span className="admins-section-title">
                        <FaUserShield className="section-shield-icon" />
                        Respective Campus Administrators ({inst.admins?.length || 0})
                      </span>
                    </div>

                    {!inst.admins || inst.admins.length === 0 ? (
                      <div className="unassigned-admin-banner">
                        <div className="unassigned-text">
                          <FaExclamationTriangle className="warn-icon" />
                          <span>No administrator appointed yet for this campus.</span>
                        </div>
                        <button
                          className="btn-appoint-now"
                          onClick={() => handleOpenAddAdmin(inst.name)}
                        >
                          <FaPlus /> Appoint Administrator
                        </button>
                      </div>
                    ) : (
                      <div className="respective-admins-grid">
                        {inst.admins.map((adm) => (
                          <div key={adm._id} className="respective-admin-item">
                            <div className="admin-item-header">
                              <div className="admin-mini-avatar">
                                {adm.name?.charAt(0)?.toUpperCase() || 'A'}
                              </div>
                              <div className="admin-item-info">
                                <strong className="admin-item-name">{adm.name}</strong>
                                <span className="admin-item-dept">
                                  {adm.department || 'Campus Operations'}
                                  {adm.identifier ? ` • ${adm.identifier}` : ''}
                                </span>
                              </div>
                              <span className="admin-active-badge">
                                <FaUserCheck /> ACTIVE
                              </span>
                            </div>

                            <div className="admin-item-contact">
                              <div className="contact-row">
                                <FaEnvelope className="mini-icon" />
                                <span>{adm.email}</span>
                              </div>
                              {adm.phone && (
                                <div className="contact-row">
                                  <FaPhone className="mini-icon" />
                                  <span>{adm.phone}</span>
                                </div>
                              )}
                            </div>

                            <div className="admin-item-actions">
                              <button
                                className="admin-btn-edit"
                                onClick={() => handleOpenEditAdmin(adm)}
                                title="Edit administrator details or password"
                              >
                                <FaEdit /> Edit
                              </button>
                              <button
                                className="admin-btn-delete"
                                onClick={() => setDeletingAdmin(adm)}
                                title="Revoke administrator access"
                              >
                                <FaTrash /> Revoke
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unassigned / Legacy Admins Alert */}
          {unassignedAdmins.length > 0 && (
            <div className="unassigned-admins-section">
              <div className="unassigned-header-box">
                <FaExclamationTriangle className="unassigned-main-icon" />
                <div>
                  <h3>Unassigned Administrators ({unassignedAdmins.length})</h3>
                  <p>These administrators are not currently linked to any registered institute. Please reassign them.</p>
                </div>
              </div>

              <div className="respective-admins-grid">
                {unassignedAdmins.map((adm) => (
                  <div key={adm._id} className="respective-admin-item unassigned">
                    <div className="admin-item-header">
                      <div className="admin-mini-avatar unassigned">
                        {adm.name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      <div className="admin-item-info">
                        <strong className="admin-item-name">{adm.name}</strong>
                        <span className="admin-item-dept text-warning">
                          Institute: {adm.institute || 'Unspecified'}
                        </span>
                      </div>
                    </div>

                    <div className="admin-item-contact">
                      <div className="contact-row">
                        <FaEnvelope className="mini-icon" />
                        <span>{adm.email}</span>
                      </div>
                    </div>

                    <div className="admin-item-actions">
                      <button
                        className="admin-btn-edit primary"
                        onClick={() => handleOpenEditAdmin(adm)}
                        title="Reassign administrator to a registered campus"
                      >
                        <FaEdit /> Reassign to Campus
                      </button>
                      <button
                        className="admin-btn-delete"
                        onClick={() => setDeletingAdmin(adm)}
                        title="Revoke administrator"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: All Administrators Directory */}
      {activeTab === 'directory' && (
        <div className="admins-management-panel">
          <div className="panel-top-row">
            <div className="panel-title-group">
              <h2>Campus Administrator Directory ({filteredAdmins.length})</h2>
              <p>Manage credentials, departmental assignments, and role access for campus administrators across all institutes.</p>
            </div>

            <div className="search-bar-wrap">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search admin name, email, institute..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="admin-search-input"
              />
              {adminSearch && (
                <button className="clear-search-btn" onClick={() => setAdminSearch('')}>
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <FaSpinner className="spin loading-spinner" />
              <p>Loading administrator accounts...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="empty-admins-state">
              <FaUserShield className="empty-icon" />
              <h3>No Administrators Found</h3>
              <p>
                {adminSearch
                  ? `No administrators match "${adminSearch}".`
                  : 'No administrators registered yet. Click "Onboard Admin" to add one.'}
              </p>
            </div>
          ) : (
            <div className="admins-grid">
              {filteredAdmins.map((admin) => (
                <div key={admin._id} className="admin-card">
                  <div className="admin-card-header">
                    <div className="admin-avatar">
                      {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div className="admin-primary-meta">
                      <h3 className="admin-name">{admin.name}</h3>
                      <span className="admin-badge">CAMPUS ADMIN</span>
                    </div>
                  </div>

                  <div className="admin-details-list">
                    <div className="admin-detail-item">
                      <FaEnvelope className="item-icon" />
                      <span className="item-value">{admin.email}</span>
                    </div>

                    <div className="admin-detail-item">
                      <FaUniversity className="item-icon" />
                      <span className="item-value highlight">{admin.institute || 'Unassigned'}</span>
                    </div>

                    <div className="admin-detail-item">
                      <FaIdBadge className="item-icon" />
                      <span className="item-value">
                        {admin.department || 'Campus Operations'}
                        {admin.identifier ? ` • ${admin.identifier}` : ''}
                      </span>
                    </div>

                    {admin.phone && (
                      <div className="admin-detail-item">
                        <FaPhone className="item-icon" />
                        <span className="item-value">{admin.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="admin-card-footer">
                    <span className="created-date">
                      Joined: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Demo Seed'}
                    </span>

                    <div className="admin-action-btns">
                      <button
                        className="btn-edit"
                        onClick={() => handleOpenEditAdmin(admin)}
                        title="Edit administrator details or reset password"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => setDeletingAdmin(admin)}
                        title="Delete administrator account"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Create / Edit Institute */}
      {showInstituteModal && (
        <div className="modal-backdrop">
          <div className="superadmin-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FaUniversity className="modal-icon" />
                <h3>{editingInstitute ? `Edit Institute: ${editingInstitute.name}` : 'Register New Campus Institute'}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowInstituteModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitInstitute} className="superadmin-form">
              <div className="form-group">
                <label>Institute Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Silicon Institute of Technology"
                  value={instituteForm.name}
                  onChange={(e) => setInstituteForm({ ...instituteForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Institute Code / Acronym *</label>
                  <input
                    type="text"
                    placeholder="e.g., SILICON"
                    value={instituteForm.code}
                    onChange={(e) => setInstituteForm({ ...instituteForm, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    placeholder="e.g., Bhubaneswar"
                    value={instituteForm.city}
                    onChange={(e) => setInstituteForm({ ...instituteForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location / Area</label>
                  <input
                    type="text"
                    placeholder="e.g., Silicon Hills, Patia"
                    value={instituteForm.location}
                    onChange={(e) => setInstituteForm({ ...instituteForm, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    placeholder="e.g., Odisha"
                    value={instituteForm.state}
                    onChange={(e) => setInstituteForm({ ...instituteForm, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g., estate@silicon.ac.in"
                    value={instituteForm.contactEmail}
                    onChange={(e) => setInstituteForm({ ...instituteForm, contactEmail: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g., +91 674 272 5448"
                    value={instituteForm.contactPhone}
                    onChange={(e) => setInstituteForm({ ...instituteForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowInstituteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={submitting}
                >
                  {submitting ? <FaSpinner className="spin" /> : <FaCheckCircle />}
                  {editingInstitute ? ' Save Changes' : ' Register Institute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create / Edit Admin */}
      {showAdminModal && (
        <div className="modal-backdrop">
          <div className="superadmin-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FaUserShield className="modal-icon" />
                <h3>{editingAdmin ? `Edit Administrator: ${editingAdmin.name}` : 'Onboard Campus Administrator'}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAdminModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitAdmin} className="superadmin-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Dr. Arvind Sharma"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Official Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g., admin.arvind@campus.ac.in"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                  disabled={Boolean(editingAdmin)}
                />
              </div>

              <div className="form-group">
                <label>
                  {editingAdmin ? 'Reset Password (leave blank to keep current):' : 'Initial Password *'}
                </label>
                <div className="password-input-wrap">
                  <FaKey className="field-icon" />
                  <input
                    type="password"
                    placeholder={editingAdmin ? 'Enter new temporary password' : 'Set login password'}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    required={!editingAdmin}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assigned Campus / Institute *</label>
                  <select
                    value={adminForm.institute}
                    onChange={(e) => setAdminForm({ ...adminForm, institute: e.target.value })}
                    className="role-select"
                    required
                  >
                    <option value="">-- Select Campus --</option>
                    {institutes.map((inst) => (
                      <option key={inst._id} value={inst.name}>
                        {inst.name} ({inst.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Department / Unit</label>
                  <input
                    type="text"
                    placeholder="e.g., Central Operations"
                    value={adminForm.department}
                    onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Admin ID / Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g., ADMIN-004"
                    value={adminForm.identifier}
                    onChange={(e) => setAdminForm({ ...adminForm, identifier: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g., +91 94370 00000"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  />
                </div>
              </div>

              {editingAdmin && (
                <div className="form-group">
                  <label>Role / Access Level</label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                    className="role-select"
                  >
                    <option value="admin">Administrator (Full Campus Access)</option>
                    <option value="staff">Staff (Maintenance Crew)</option>
                    <option value="student">Student (Standard User)</option>
                  </select>
                </div>
              )}

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={submitting}
                >
                  {submitting ? <FaSpinner className="spin" /> : <FaCheckCircle />}
                  {editingAdmin ? ' Save Changes' : ' Register Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Institute Confirmation */}
      {deletingInstitute && (
        <div className="modal-backdrop">
          <div className="superadmin-modal-card delete-modal">
            <div className="modal-header">
              <div className="modal-title-wrap danger">
                <FaExclamationTriangle className="modal-icon danger" />
                <h3>Delete Institute: {deletingInstitute.name}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDeletingInstitute(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="delete-modal-body">
              <p>
                Are you sure you want to permanently delete this campus institute?
              </p>
              <div className="deleting-target-card">
                <strong>{deletingInstitute.name}</strong>
                <span>Code: {deletingInstitute.code}</span>
                <small>{deletingInstitute.location || 'Campus Perimeter'}, {deletingInstitute.city}</small>
              </div>
              <p className="danger-warning">
                Note: Institutes with registered users or administrators cannot be deleted until those users are reassigned or removed first.
              </p>
            </div>

            <div className="modal-footer-btns">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeletingInstitute(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteInstitute}
                disabled={submitting}
              >
                {submitting ? <FaSpinner className="spin" /> : <FaTrash />} Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Admin Confirmation */}
      {deletingAdmin && (
        <div className="modal-backdrop">
          <div className="superadmin-modal-card delete-modal">
            <div className="modal-header">
              <div className="modal-title-wrap danger">
                <FaExclamationTriangle className="modal-icon danger" />
                <h3>Revoke Administrator Account</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDeletingAdmin(null)}>
                <FaTimes />
              </button>
            </div>

            <div className="delete-modal-body">
              <p>
                Are you sure you want to permanently revoke administrator privileges and delete the account for:
              </p>
              <div className="deleting-target-card">
                <strong>{deletingAdmin.name}</strong>
                <span>{deletingAdmin.email}</span>
                <small>{deletingAdmin.institute || 'Unassigned Campus'}</small>
              </div>
              <p className="danger-warning">
                This action cannot be undone. Maintenance tasks and campus data will remain intact in the system.
              </p>
            </div>

            <div className="modal-footer-btns">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeletingAdmin(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteAdmin}
                disabled={submitting}
              >
                {submitting ? <FaSpinner className="spin" /> : <FaTrash />} Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
