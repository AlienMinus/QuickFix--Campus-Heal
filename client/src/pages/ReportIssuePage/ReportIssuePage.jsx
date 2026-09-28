import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { issueAPI } from '../../services/api';
import QRScannerModal from '../../components/QRScannerModal/QRScannerModal';
import VoiceReportModal from '../../components/VoiceReportModal/VoiceReportModal';
import {
  FaCamera,
  FaQrcode,
  FaMicrophone,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaPaperPlane,
  FaTrash,
  FaSpinner,
  FaInfoCircle,
  FaCheckCircle,
  FaShieldAlt
} from 'react-icons/fa';
import './ReportIssuePage.css';

const CATEGORIES = [
  { value: 'Electrical', label: 'Electrical (Lights, Fans, Sockets, Wiring)' },
  { value: 'Plumbing', label: 'Plumbing (Leaks, Taps, Drainage, Restrooms)' },
  { value: 'Infrastructure', label: 'Infrastructure (Desks, Windows, Doors, Walls)' },
  { value: 'Sanitation', label: 'Sanitation & Cleanliness (Garbage, Hygiene)' },
  { value: 'IT/Network', label: 'IT & Wi-Fi Network (Routers, Projectors, Labs)' },
  { value: 'Safety/Security', label: 'Safety & Security (Fire Extinguishers, Hazards)' },
  { value: 'Academic Facilities', label: 'Academic Facilities (Smart Boards, Podium)' },
  { value: 'Other', label: 'Other Campus Maintenance' }
];

const SEVERITIES = [
  { value: 'Low', label: 'Low', desc: 'Cosmetic or minor inconvenience' },
  { value: 'Medium', label: 'Medium', desc: 'Standard repair, affects few' },
  { value: 'High', label: 'High', desc: 'Disrupts class or daily routine' },
  { value: 'Critical', label: 'Critical', desc: 'Hazardous / immediate campus danger' }
];

const CAMPUS_ZONES = [
  'Aryabhatta Academic Block',
  'Kalam Innovation & Tech Block',
  'Visvesvaraya Workshop & Labs',
  'Ramanujan Mathematics Complex',
  'Central Library & Digital Hub',
  'Student Activity Center & Gym',
  'Boys Hostel A (Bhabha Bhawan)',
  'Boys Hostel B (Sarabhai Bhawan)',
  'Girls Hostel (Kalpana Chawla Hall)',
  'Campus Cafeteria & Food Court',
  'Main Administrative Block',
  'Sports Arena & Cricket Ground',
  'Main Campus Gate & Security Post'
];

export default function ReportIssuePage() {
  const { user } = useAuth();
  const { location, locationError, isTracking } = useLocationContext();
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electrical',
    severity: 'Medium',
    locationName: '',
    zone: CAMPUS_ZONES[0],
    latitude: location?.latitude || 20.2185,
    longitude: location?.longitude || 85.7368,
    isUrgent: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Modals
  const [showQRModal, setShowQRModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Sync GPS updates
  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    }
  }, [location]);

  // Check URL query parameters (e.g. from QR scan link)
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const qrLoc = params.get('location');
    const qrCat = params.get('category');
    if (qrLoc) {
      setFormData(prev => ({ ...prev, locationName: qrLoc }));
    }
    if (qrCat && CATEGORIES.some(c => c.value === qrCat)) {
      setFormData(prev => ({ ...prev, category: qrCat }));
    }
  }, [routerLocation.search]);

  // Check for duplicate issues when locationName and category change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.locationName && formData.category) {
        try {
          setCheckingDuplicates(true);
          const res = await issueAPI.checkDuplicates({
            latitude: formData.latitude,
            longitude: formData.longitude,
            category: formData.category,
            locationName: formData.locationName
          });
          if (res.data?.hasDuplicates && res.data.duplicates.length > 0) {
            setDuplicateWarning(res.data.duplicates[0]);
          } else {
            setDuplicateWarning(null);
          }
        } catch {
          // Non-blocking
        } finally {
          setCheckingDuplicates(false);
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [formData.locationName, formData.category, formData.latitude, formData.longitude]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 8MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrorMessage('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleQRScanSuccess = (decodedData) => {
    setShowQRModal(false);
    // Parse QR payload (supports JSON or string format)
    try {
      const parsed = JSON.parse(decodedData);
      setFormData(prev => ({
        ...prev,
        locationName: parsed.location || parsed.room || decodedData,
        category: parsed.category || prev.category,
        zone: parsed.zone || prev.zone
      }));
    } catch {
      setFormData(prev => ({
        ...prev,
        locationName: decodedData
      }));
    }
  };

  const handleVoiceData = (voiceReport) => {
    setShowVoiceModal(false);
    setFormData(prev => ({
      ...prev,
      title: voiceReport.title || prev.title,
      description: voiceReport.description || prev.description,
      category: voiceReport.category || prev.category,
      severity: voiceReport.severity || prev.severity,
      locationName: voiceReport.locationName || prev.locationName
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.title.trim()) {
      setErrorMessage('Please provide a brief issue title.');
      return;
    }
    if (!formData.locationName.trim()) {
      setErrorMessage('Please specify the exact room, lab or landmark.');
      return;
    }

    try {
      setSubmitting(true);

      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('category', formData.category);
      submitData.append('severity', formData.severity);
      submitData.append('locationName', formData.locationName.trim());
      submitData.append('zone', formData.zone);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('isUrgent', formData.isUrgent);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const res = await issueAPI.create(submitData);

      setSuccessMessage('Ticket filed successfully! Maintenance crew notified.');
      setTimeout(() => {
        navigate(`/issues/${res.data.issue._id || res.data.issue.id}`);
      }, 1200);

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit report. Please check connection.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-page-container">
      <div className="report-header-banner">
        <div className="header-text-group">
          <h1>Report Campus Problem</h1>
          <p>QuickFix Smart Dispatch • Auto Geo-Tagged to BPUT GIFT Campus</p>
        </div>
        <div className="quick-actions-bar">
          <button
            type="button"
            className="action-pill-btn qr-btn"
            onClick={() => setShowQRModal(true)}
            title="Scan Campus Location QR"
          >
            <FaQrcode /> Scan QR Code
          </button>
          <button
            type="button"
            className="action-pill-btn voice-btn"
            onClick={() => setShowVoiceModal(true)}
            title="Dictate with AI Voice Assistant"
          >
            <FaMicrophone /> Voice Dictation
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert-banner error-banner">
          <FaExclamationTriangle />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert-banner success-banner">
          <FaCheckCircle />
          <span>{successMessage}</span>
        </div>
      )}

      {duplicateWarning && (
        <div className="duplicate-alert-card">
          <div className="dup-icon"><FaInfoCircle /></div>
          <div className="dup-body">
            <strong>Possible Existing Ticket Detected!</strong>
            <p>
              An issue matching <em>"{duplicateWarning.title}"</em> in <em>"{duplicateWarning.locationName}"</em> was already reported ({duplicateWarning.status}).
            </p>
            <button
              type="button"
              className="dup-view-btn"
              onClick={() => navigate(`/issues/${duplicateWarning._id}`)}
            >
              View Existing Ticket & Upvote Instead
            </button>
          </div>
        </div>
      )}

      <form className="report-form-card" onSubmit={handleSubmit}>
        {/* Step 1: Evidence Photo Upload (Cloudinary) */}
        <div className="form-section">
          <label className="section-title">
            <FaCamera /> Photo Evidence (Cloudinary Auto-Upload)
          </label>
          <div className="photo-upload-zone">
            {imagePreview ? (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Evidence preview" className="evidence-img" />
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={handleRemoveImage}
                  title="Remove photo"
                >
                  <FaTrash /> Remove
                </button>
              </div>
            ) : (
              <label className="upload-placeholder">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden-file-input"
                />
                <FaCamera className="placeholder-icon" />
                <span className="placeholder-title">Tap to Take or Upload Photo</span>
                <span className="placeholder-hint">Supports Camera, JPG, PNG (Max 8MB)</span>
              </label>
            )}
          </div>
        </div>

        {/* Step 2: Location & GPS Geo-Logging */}
        <div className="form-section">
          <label className="section-title">
            <FaMapMarkerAlt /> Precise Campus Location
          </label>
          
          <div className="gps-live-telemetry">
            <div className={`gps-indicator-dot ${isTracking ? 'pulsing' : ''}`} />
            <div className="gps-telemetry-text">
              <span className="gps-status-label">
                {isTracking ? '1-Sec GeoLocation Stream Active' : 'GPS Coordinates Locked'}
              </span>
              <span className="coords-code">
                {Number(formData.latitude).toFixed(5)}° N, {Number(formData.longitude).toFixed(5)}° E
              </span>
            </div>
            {locationError && <span className="gps-warn-badge">Mock GPS</span>}
          </div>

          <div className="form-group">
            <label htmlFor="zone">Campus Zone / Block *</label>
            <select
              id="zone"
              name="zone"
              value={formData.zone}
              onChange={handleChange}
              className="form-select"
            >
              {CAMPUS_ZONES.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="locationName">Specific Room, Lab or Spot *</label>
            <div className="input-with-button">
              <input
                id="locationName"
                type="text"
                name="locationName"
                placeholder="e.g., Computer Lab 3, 2nd Floor Staircase, Room 302"
                value={formData.locationName}
                onChange={handleChange}
                className="form-input"
                required
              />
              <button
                type="button"
                className="input-qr-trigger"
                onClick={() => setShowQRModal(true)}
                title="Scan Room QR Code"
              >
                <FaQrcode />
              </button>
            </div>
            <span className="input-help">Use QR code sticker on the door for instant autofill</span>
          </div>
        </div>

        {/* Step 3: Issue Details */}
        <div className="form-section">
          <label className="section-title">
            <FaExclamationTriangle /> Issue Classification
          </label>

          <div className="form-group">
            <label htmlFor="title">Issue Summary Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              placeholder="e.g., Broken ceiling fan speed regulator or water seepage"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              maxLength={120}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="severity">Severity Level *</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className={`form-select severity-select-${formData.severity.toLowerCase()}`}
              >
                {SEVERITIES.map(sev => (
                  <option key={sev.value} value={sev.value}>{sev.label} — {sev.desc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Provide extra details (e.g. spark seen, leaking for 2 hours, hazardous wire exposed)..."
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>

          <div className="urgent-toggle-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="isUrgent"
                checked={formData.isUrgent}
                onChange={handleChange}
              />
              <span className="checkbox-custom" />
              <span className="checkbox-label">
                <strong>Mark as Campus Emergency / Immediate Risk</strong>
                <span className="checkbox-sub">Triggers high-priority push notification to active on-duty staff</span>
              </span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="submit-report-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <FaSpinner className="spin" /> Dispatching to Cloudinary & Atlas...
              </>
            ) : (
              <>
                <FaPaperPlane /> Submit Ticket & Dispatch Staff
              </>
            )}
          </button>
        </div>
      </form>

      {/* QR Scanner Modal */}
      {showQRModal && (
        <QRScannerModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      )}

      {/* Voice Assistant Modal */}
      {showVoiceModal && (
        <VoiceReportModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          onTranscribeComplete={handleVoiceData}
        />
      )}
    </div>
  );
}
