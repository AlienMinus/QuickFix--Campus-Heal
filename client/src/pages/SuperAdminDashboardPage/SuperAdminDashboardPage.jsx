import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import {
  FaCrown,
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
} from 'react-icons/fa';
import './SuperAdminDashboardPage.css';

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [counts, setCounts] = useState({
    totalAdmins: 0,
    totalStaff: 0,
    totalStudents: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Admin Form State
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    institute: 'BPUT Tech Campus',
    department: 'Central Campus Administration',
    identifier: '',
    phone: '',
  });

  // Edit Admin Form State
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    institute: '',
    identifier: '',
    phone: '',
    role: 'admin',
    newPassword: '',
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminAPI.getAdmins();
      if (res.data) {
        setAdmins(res.data.admins || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
      setError(err.response?.data?.message || 'Failed to load administrator accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only superadmin can access this console
    if (user && user.role !== 'superadmin') {
      navigate('/admin');
      return;
    }
    fetchAdmins();
  }, [user]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      setError('Name, email, and password are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await adminAPI.createAdmin(newAdmin);
      setActionSuccess(`New campus admin "${newAdmin.name}" onboarded successfully!`);
      setShowAddModal(false);
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        institute: 'BPUT Tech Campus',
        department: 'Central Campus Administration',
        identifier: '',
        phone: '',
      });
      fetchAdmins();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create administrator account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (admin) => {
    setEditingAdmin(admin);
    setEditForm({
      name: admin.name || '',
      department: admin.department || '',
      institute: admin.institute || '',
      identifier: admin.identifier || '',
      phone: admin.phone || '',
      role: admin.role || 'admin',
      newPassword: '',
    });
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    try {
      setSubmitting(true);
      setError('');
      const payload = {
        name: editForm.name,
        department: editForm.department,
        institute: editForm.institute,
        identifier: editForm.identifier,
        phone: editForm.phone,
        role: editForm.role,
      };
      if (editForm.newPassword) {
        payload.password = editForm.newPassword;
      }

      await adminAPI.updateAdmin(editingAdmin._id, payload);
      setActionSuccess(`Administrator "${editForm.name}" updated successfully!`);
      setEditingAdmin(null);
      fetchAdmins();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;

    try {
      setSubmitting(true);
      setError('');
      await adminAPI.deleteAdmin(deletingAdmin._id);
      setActionSuccess(`Administrator "${deletingAdmin.name}" removed successfully.`);
      setDeletingAdmin(null);
      fetchAdmins();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.department?.toLowerCase().includes(q) ||
      a.institute?.toLowerCase().includes(q) ||
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
            Campus Administrator Governance & Role Authority • Multi-Institute Platform
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn-add-admin"
            onClick={() => setShowAddModal(true)}
            title="Onboard a new campus administrator"
          >
            <FaPlus /> Onboard Campus Admin
          </button>
          <button
            className="btn-refresh"
            onClick={fetchAdmins}
            title="Refresh administrator list"
          >
            <FaSync className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Privacy & Safeguard Callout */}
      <div className="superadmin-privacy-banner">
        <FaShieldAlt className="shield-icon" />
        <div className="privacy-banner-text">
          <strong>Administrative Governance Mandate:</strong>
          <span>
            Super Administrator authority is focused on managing normal campus administrators and platform-level infrastructure.
            To protect campus resident privacy, private student complaint logs, chat messages, and personal evidence are isolated at the campus level.
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

      {/* High-Level Governance KPIs */}
      <div className="superadmin-kpis">
        <div className="super-kpi-card admins-card">
          <div className="kpi-icon">
            <FaUserShield />
          </div>
          <div className="kpi-data">
            <span className="kpi-count">{counts.totalAdmins}</span>
            <span className="kpi-name">Campus Admins</span>
            <span className="kpi-sub">Authorized Directors</span>
          </div>
        </div>

        <div className="super-kpi-card users-card">
          <div className="kpi-icon">
            <FaUsers />
          </div>
          <div className="kpi-data">
            <span className="kpi-count">{counts.totalUsers}</span>
            <span className="kpi-name">Total Platform Users</span>
            <span className="kpi-sub">Aggregated System Count</span>
          </div>
        </div>

        <div className="super-kpi-card staff-card">
          <div className="kpi-icon">
            <FaBuilding />
          </div>
          <div className="kpi-data">
            <span className="kpi-count">{counts.totalStaff}</span>
            <span className="kpi-name">Field Staff Personnel</span>
            <span className="kpi-sub">Maintenance Technicians</span>
          </div>
        </div>

        <div className="super-kpi-card security-card">
          <div className="kpi-icon">
            <FaLock />
          </div>
          <div className="kpi-data">
            <span className="kpi-count active">Enforced</span>
            <span className="kpi-name">Security Governance</span>
            <span className="kpi-sub">RBAC Isolation Active</span>
          </div>
        </div>
      </div>

      {/* Normal Admin Management Section */}
      <div className="admins-management-panel">
        <div className="panel-top-row">
          <div className="panel-title-group">
            <h2>Campus Administrator Directory ({filteredAdmins.length})</h2>
            <p>Manage credentials, departmental assignments, and role access for normal administrators.</p>
          </div>

          <div className="search-bar-wrap">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search admin name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
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
              {searchQuery
                ? `No administrators match "${searchQuery}".`
                : 'No campus administrators registered yet. Click "Onboard Campus Admin" to add one.'}
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
                    <FaBuilding className="item-icon" />
                    <span className="item-value">{admin.institute || 'BPUT Tech Campus'}</span>
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
                    Added: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Demo Seed'}
                  </span>

                  <div className="admin-action-btns">
                    <button
                      className="btn-edit"
                      onClick={() => handleOpenEdit(admin)}
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

      {/* Modal 1: Onboard New Admin */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="superadmin-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FaUserShield className="modal-icon" />
                <h3>Onboard New Campus Administrator</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="superadmin-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Dr. Arvind Sharma"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Official Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g., admin.arvind@gift.ac.in"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Password *</label>
                <input
                  type="password"
                  placeholder="Set temporary login password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assigned Campus / Institute</label>
                  <input
                    type="text"
                    placeholder="e.g., GIFT Autonomous College"
                    value={newAdmin.institute}
                    onChange={(e) => setNewAdmin({ ...newAdmin, institute: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Department / Unit</label>
                  <input
                    type="text"
                    placeholder="e.g., Central Campus Administration"
                    value={newAdmin.department}
                    onChange={(e) => setNewAdmin({ ...newAdmin, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Admin ID / Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g., ADMIN-004"
                    value={newAdmin.identifier}
                    onChange={(e) => setNewAdmin({ ...newAdmin, identifier: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g., +91 94370 00000"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={submitting}
                >
                  {submitting ? <FaSpinner className="spin" /> : <FaCheckCircle />} Register Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Admin */}
      {editingAdmin && (
        <div className="modal-backdrop">
          <div className="superadmin-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FaEdit className="modal-icon" />
                <h3>Edit Administrator: {editingAdmin.name}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setEditingAdmin(null)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="superadmin-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assigned Campus / Institute</label>
                  <input
                    type="text"
                    value={editForm.institute}
                    onChange={(e) => setEditForm({ ...editForm, institute: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Department / Unit</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID / Identifier</label>
                  <input
                    type="text"
                    value={editForm.identifier}
                    onChange={(e) => setEditForm({ ...editForm, identifier: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Change Role / Access Level</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="role-select"
                >
                  <option value="admin">Administrator (Full Campus Access)</option>
                  <option value="staff">Staff (Maintenance Crew)</option>
                  <option value="student">Student (Standard User)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reset Password (leave blank to keep current):</label>
                <div className="password-input-wrap">
                  <FaKey className="field-icon" />
                  <input
                    type="password"
                    placeholder="Enter new temporary password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-btns">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingAdmin(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm"
                  disabled={submitting}
                >
                  {submitting ? <FaSpinner className="spin" /> : <FaCheckCircle />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete Confirmation */}
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
                <small>{deletingAdmin.institute || 'BPUT Tech Campus'}</small>
              </div>
              <p className="danger-warning">
                This action cannot be undone. Any tasks currently supervised by this administrator will remain preserved in the system.
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
