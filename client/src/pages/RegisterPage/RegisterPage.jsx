import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { instituteAPI } from '../../services/api';
import {
  FaUserPlus,
  FaShieldAlt,
  FaBuilding,
  FaUniversity,
  FaIdCard,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
} from 'react-icons/fa';
import './RegisterPage.css';

const DEFAULT_INSTITUTES = [
  { name: 'BPUT Tech Campus', code: 'BPUT', city: 'Rourkela' },
  { name: 'GIFT Autonomous College', code: 'GIFT', city: 'Bhubaneswar' },
  { name: 'Silicon Institute of Technology', code: 'SILICON', city: 'Bhubaneswar' },
  { name: 'NIT Rourkela', code: 'NITR', city: 'Rourkela' },
  { name: 'CV Raman Global University', code: 'CVRGU', city: 'Bhubaneswar' },
  { name: 'IIT Bhubaneswar', code: 'IITBBS', city: 'Bhubaneswar' },
];

const DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Artificial Intelligence & Data Science (AI&DS)',
  'Mechanical Engineering (ME)',
  'Electrical & Electronics Engineering (EEE)',
  'Electronics & Comm Engineering (ECE)',
  'Civil Engineering (CE)',
  'Master of Computer Applications (MCA)',
  'MBA / Management Studies',
  'Campus Estate & Facility Maintenance',
  'Hostel Administration & Mess',
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { orgConfig } = useOrg();
  const navigate = useNavigate();

  const [institutes, setInstitutes] = useState(DEFAULT_INSTITUTES);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    institute: DEFAULT_INSTITUTES[0].name,
    department: DEPARTMENTS[0],
    studentOrStaffId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstitutesList = async () => {
      try {
        const res = await instituteAPI.getAll();
        if (res.data && res.data.institutes && res.data.institutes.length > 0) {
          setInstitutes(res.data.institutes);
          // Set first institute if available
          setFormData((prev) => ({
            ...prev,
            institute: prev.institute || res.data.institutes[0].name,
          }));
        }
      } catch (e) {
        console.warn('Could not load live institutes list, fallback to defaults');
      }
    };
    fetchInstitutesList();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.institute) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await register({
        ...formData,
        identifier: formData.studentOrStaffId,
      });
      if (res && !res.success) {
        setError(res.message || 'Registration failed. Try a different email.');
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-card">
        <div className="register-header">
          <div className="brand-icon-circle">
            <FaUserPlus />
          </div>
          <h2>Create Account</h2>
          <p>Join the Multi-Institute Facility Network</p>
          <div className="secure-badge">
            <FaShieldAlt /> Verified Account Access
          </div>
        </div>

        {error && (
          <div className="register-error-alert">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          {/* Institute Selection Section */}
          <div className="form-group institute-form-group">
            <label htmlFor="institute" className="institute-field-label">
              <FaUniversity className="institute-label-icon" /> Select Your Institute / College *
            </label>
            <select
              id="institute"
              name="institute"
              value={formData.institute}
              onChange={handleChange}
              className="register-select institute-select-highlight"
              required
            >
              {institutes.map((inst) => (
                <option key={inst._id || inst.code || inst.name} value={inst.name}>
                  {inst.name} {inst.city ? `(${inst.city})` : ''}
                </option>
              ))}
            </select>
            <span className="institute-help-text">
              <FaCheckCircle /> Data is segregated per institute — your account, reports, and zones remain dedicated to your campus.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g. Subrat Pradhan"
              value={formData.name}
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Campus Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="e.g. member@domain.com"
              value={formData.email}
              onChange={handleChange}
              className="register-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (Min 6 characters) *</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="register-input"
              minLength={6}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="role">Account Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="register-select"
              >
                <option value="student">Student</option>
                <option value="staff">Maintenance Staff</option>
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="studentOrStaffId">
                {formData.role === 'staff' ? 'Staff ID' : 'Reg / Roll No.'}
              </label>
              <input
                id="studentOrStaffId"
                type="text"
                name="studentOrStaffId"
                placeholder={formData.role === 'staff' ? 'EMP-2026-X' : '2201289xxx'}
                value={formData.studentOrStaffId}
                onChange={handleChange}
                className="register-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="department">Department / Branch</label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="register-select"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="submit-register-btn"
            disabled={loading}
          >
            {loading ? <FaSpinner className="spin" /> : <FaUserPlus />} Register Account
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
