import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { useOrg } from '../../context/OrgContext';
import { issueAPI, categoryAPI } from '../../services/api';
import QRScannerModal from '../../components/QRScannerModal/QRScannerModal';
import VoiceReportModal from '../../components/VoiceReportModal/VoiceReportModal';
import {
  FaCamera,
  FaVideo,
  FaQrcode,
  FaMicrophone,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaTimes,
  FaSpinner,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGlobeAmericas,
  FaChevronDown,
  FaTags,
} from 'react-icons/fa';
import './ReportIssuePage.css';

const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Infrastructure',
  'Sanitation',
  'IT/Network',
  'Safety/Security',
  'Academic Facilities',
  'Other'
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

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
  const { orgConfig, zones } = useOrg();
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const availableZones = zones && zones.length > 0 ? zones.map(z => z.name) : CAMPUS_ZONES;

  // Form State
  const [categoriesList, setCategoriesList] = useState(CATEGORIES);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [zone, setZone] = useState(availableZones[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState('Medium');
  const [locationName, setLocationName] = useState('');
  
  // Fetch dynamic categories defined by Super Admin
  useEffect(() => {
    categoryAPI.getAll()
      .then(res => {
        if (res.data?.categories && res.data.categories.length > 0) {
          const activeCats = res.data.categories
            .filter(c => c.status !== 'Inactive')
            .map(c => c.name);
          if (activeCats.length > 0) {
            setCategoriesList(activeCats);
          }
        }
      })
      .catch(() => {
        // Fallback to default initial list
      });
  }, []);

  // Media State
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'

  // Tag helper pickers dropdown states
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);

  // Status & Duplicate states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Hidden file inputs
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Modals
  const [showQRModal, setShowQRModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Auto-resize description textarea like LinkedIn
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(130, textareaRef.current.scrollHeight)}px`;
    }
  }, [description]);

  const handleCancel = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/track');
    }
  };

  // Synchronize URL parameters (e.g. from QR scan link)
  useEffect(() => {
    const params = new URLSearchParams(routerLocation.search);
    const qrLoc = params.get('location');
    const qrCat = params.get('category');
    const qrZone = params.get('zone');
    if (qrLoc) setLocationName(qrLoc);
    if (qrZone && availableZones.includes(qrZone)) setZone(qrZone);
    if (qrCat && categoriesList.includes(qrCat)) setCategory(qrCat);
  }, [routerLocation.search, categoriesList]);

  // Intelligent parser: parse @zone, #category, $severity from description text in real time
  const parseTagsFromText = (text) => {
    // 1. Detect Category #...
    for (const cat of categoriesList) {
      const regex = new RegExp(`#${cat.replace(/[^a-zA-Z0-9]/g, '')}\\b|#${cat.replace('/', '')}\\b`, 'i');
      if (regex.test(text)) {
        setCategory(cat);
        break;
      }
    }

    // 2. Detect Severity $...
    for (const sev of SEVERITIES) {
      const regex = new RegExp(`\\$${sev}\\b`, 'i');
      if (regex.test(text)) {
        setSeverity(sev);
        break;
      }
    }

    // 3. Detect Zone @...
    for (const z of availableZones) {
      // Short key or full name match
      const shortName = z.split(' ')[0];
      const regex = new RegExp(`@${shortName}\\b|@${z.replace(/\s+/g, '')}\\b`, 'i');
      if (regex.test(text)) {
        setZone(z);
        break;
      }
    }
  };

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    parseTagsFromText(val);
  };

  // Helper chip appenders: quickly insert @zone, #category, $severity into description
  const insertTagToText = (tagText) => {
    setDescription(prev => {
      const spacer = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
      return `${prev}${spacer}${tagText} `;
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Check for duplicate issues
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (locationName && category) {
        try {
          setCheckingDuplicates(true);
          const res = await issueAPI.checkDuplicates({
            latitude: location?.latitude || 20.2185,
            longitude: location?.longitude || 85.7368,
            category,
            locationName
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
  }, [locationName, category, location]);

  // Media Handlers
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage('Photo must be less than 15MB.');
        return;
      }
      setMediaFile(file);
      setMediaType('image');
      setMediaPreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage('Video must be less than 50MB.');
        return;
      }
      setMediaFile(file);
      setMediaType('video');
      setMediaPreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleRemoveMedia = () => {
    if (mediaPreview && mediaPreview.startsWith('blob:')) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType('image');
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // QR Scan Success Handler
  const handleQRScanSuccess = (decodedData) => {
    setShowQRModal(false);
    let parsed = typeof decodedData === 'object' && decodedData !== null ? decodedData : null;
    if (!parsed) {
      try {
        parsed = JSON.parse(decodedData);
      } catch {
        parsed = { location: decodedData };
      }
    }

    const locName = parsed.room
      ? `${parsed.building ? parsed.building + ' • ' : ''}${parsed.room}`
      : (parsed.location || parsed.name || '');

    if (locName) setLocationName(locName);
    if (parsed.zone) setZone(parsed.zone);
    if (parsed.category && categoriesList.includes(parsed.category)) setCategory(parsed.category);

    if (parsed.recommendation && !description.includes(parsed.recommendation)) {
      setDescription(prev => prev ? `${prev}\n[Check: ${parsed.recommendation}]` : `[Check: ${parsed.recommendation}]`);
    }
  };

  // Voice Assistant Handler
  const handleVoiceData = (voiceReport) => {
    setShowVoiceModal(false);
    if (voiceReport.description) {
      setDescription(prev => prev ? `${prev}\n${voiceReport.description}` : voiceReport.description);
    }
    if (voiceReport.title && !title) setTitle(voiceReport.title);
    if (voiceReport.category && categoriesList.includes(voiceReport.category)) setCategory(voiceReport.category);
    if (voiceReport.severity && SEVERITIES.includes(voiceReport.severity)) setSeverity(voiceReport.severity);
    if (voiceReport.locationName && !locationName) setLocationName(voiceReport.locationName);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!description.trim()) {
      setErrorMessage('Please describe the problem or issue in the post area.');
      return;
    }
    if (!locationName.trim()) {
      setErrorMessage('Please specify the specific room, lab, or spot.');
      return;
    }

    // Auto-generate title if not manually given
    let finalTitle = title.trim();
    if (!finalTitle) {
      const cleanFirstLine = description
        .split('\n')[0]
        .replace(/[@#$][\w\s-]+/g, '')
        .trim();
      finalTitle = cleanFirstLine.slice(0, 80) || `${category} issue in ${locationName}`;
    }

    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('title', finalTitle);
      submitData.append('description', description.trim());
      submitData.append('category', category);
      submitData.append('severity', severity);
      submitData.append('locationName', locationName.trim());
      submitData.append('zone', zone);
      submitData.append('latitude', location?.latitude || 20.2185);
      submitData.append('longitude', location?.longitude || 85.7368);
      submitData.append('isUrgent', severity === 'Critical');

      if (mediaFile) {
        submitData.append('media', mediaFile);
        submitData.append('image', mediaFile);
        submitData.append('mediaType', mediaType);
      }

      const res = await issueAPI.create(submitData);
      setSuccessMessage('Ticket posted successfully! Campus technicians notified.');
      setTimeout(() => {
        navigate(`/issues/${res.data.issue._id || res.data.issue.id}`);
      }, 1100);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit report. Please check connection.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-page-container">
      {/* LinkedIn Post Modal Card */}
      <div className="linkedin-post-modal-card">
        {/* Modal Top Header */}
        <div className="post-modal-top">
          <div className="modal-author-row">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="modal-user-avatar" />
            ) : (
              <div className="modal-user-avatar-fallback">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="modal-user-details">
              <div className="modal-user-name">{user?.name || 'Campus Reporter'}</div>
              <div className="modal-visibility-pill">
                <FaGlobeAmericas className="globe-icon" />
                <span>{orgConfig.name} Community</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="modal-cancel-btn"
            onClick={handleCancel}
            title="Cancel and close"
            aria-label="Cancel and close"
          >
            <FaTimes className="cancel-icon" />
          </button>
        </div>

        {/* Alerts / Error Messages */}
        {errorMessage && (
          <div className="post-alert-banner error">
            <FaExclamationTriangle />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="post-alert-banner success">
            <FaCheckCircle />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Duplicate Warning Callout */}
        {duplicateWarning && (
          <div className="modal-duplicate-warning">
            <FaInfoCircle className="dup-info-icon" />
            <div className="dup-text">
              <strong>Similar Issue Already Reported:</strong>
              <p>"{duplicateWarning.title}" at {duplicateWarning.locationName} ({duplicateWarning.status})</p>
            </div>
            <button
              type="button"
              className="dup-upvote-link-btn"
              onClick={() => navigate(`/issues/${duplicateWarning._id}`)}
            >
              Upvote Existing
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="post-modal-form">
          {/* 1. UNBOUND DESCRIPTION TEXTAREA FIRST */}
          <div className="unbound-textarea-section">
            <textarea
              ref={textareaRef}
              rows={4}
              value={description}
              onChange={handleDescriptionChange}
              placeholder="What needs maintenance or fixing? Describe freely...&#10;Tip: Use @zone, #category, and $severity in your post!&#10;e.g. Broken exhaust fan in @Visvesvaraya Labs #Electrical $High"
              className="unbound-description-input"
              autoFocus
              required
            />

            {/* Smart Tag Helper Chips Toolbar */}
            <div className="tag-helpers-bar">
              {/* @ Zone Picker Chip */}
              <div className="tag-chip-dropdown-wrapper">
                <button
                  type="button"
                  className="tag-chip-btn zone-chip"
                  onClick={() => setShowZonePicker(!showZonePicker)}
                  title="Select or Insert Campus Zone (@)"
                >
                  <span className="chip-prefix">@</span> {zone.split(' ')[0]} <FaChevronDown className="chip-arrow" />
                </button>
                {showZonePicker && (
                  <div className="chip-dropdown-menu">
                    <div className="dropdown-menu-header">Select Campus Zone (@)</div>
                    {availableZones.map(z => (
                      <button
                        key={z}
                        type="button"
                        className={`dropdown-option ${zone === z ? 'selected' : ''}`}
                        onClick={() => {
                          setZone(z);
                          insertTagToText(`@${z.split(' ')[0]}`);
                          setShowZonePicker(false);
                        }}
                      >
                        @{z}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* # Category Picker Chip */}
              <div className="tag-chip-dropdown-wrapper">
                <button
                  type="button"
                  className="tag-chip-btn category-chip"
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  title="Select or Insert Category (#)"
                >
                  <span className="chip-prefix">#</span> {category} <FaChevronDown className="chip-arrow" />
                </button>
                {showCategoryPicker && (
                  <div className="chip-dropdown-menu">
                    <div className="dropdown-menu-header">Select Category (#)</div>
                    {categoriesList.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`dropdown-option ${category === c ? 'selected' : ''}`}
                        onClick={() => {
                          setCategory(c);
                          insertTagToText(`#${c.replace(/[^a-zA-Z0-9]/g, '')}`);
                          setShowCategoryPicker(false);
                        }}
                      >
                        #{c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* $ Severity Picker Chip */}
              <div className="tag-chip-dropdown-wrapper">
                <button
                  type="button"
                  className={`tag-chip-btn severity-chip ${severity.toLowerCase()}`}
                  onClick={() => setShowSeverityPicker(!showSeverityPicker)}
                  title="Select or Insert Severity ($)"
                >
                  <span className="chip-prefix">$</span> {severity} <FaChevronDown className="chip-arrow" />
                </button>
                {showSeverityPicker && (
                  <div className="chip-dropdown-menu">
                    <div className="dropdown-menu-header">Select Severity ($)</div>
                    {SEVERITIES.map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`dropdown-option severity-${s.toLowerCase()} ${severity === s ? 'selected' : ''}`}
                        onClick={() => {
                          setSeverity(s);
                          insertTagToText(`$${s}`);
                          setShowSeverityPicker(false);
                        }}
                      >
                        ${s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. SPECIFIC ROOM / SPOT INPUT WITH QR CODE CAMERA ICON */}
          <div className="room-input-container">
            <div className="room-input-wrapper">
              <FaMapMarkerAlt className="room-pin-icon" />
              <input
                type="text"
                placeholder="Specific room, lab, floor or landmark (e.g. Room 302, Floor 2)*"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="room-text-input"
                required
              />
              <button
                type="button"
                className="room-qr-autofill-btn"
                onClick={() => setShowQRModal(true)}
                title="Scan QR Code sticker for instant room autofill"
              >
                <FaQrcode className="qr-btn-icon" />
                <span className="qr-btn-text">QR Scan</span>
              </button>
            </div>
          </div>

          {/* 3. MEDIA PREVIEW (Photo / Video) */}
          {mediaPreview && (
            <div className="post-media-preview-box">
              {mediaType === 'video' ? (
                <div className="video-box-relative">
                  <video src={mediaPreview} controls playsInline className="media-preview-element" />
                  <span className="media-type-badge video">
                    <FaVideo /> Video Evidence
                  </span>
                </div>
              ) : (
                <div className="image-box-relative">
                  <img src={mediaPreview} alt="Evidence preview" className="media-preview-element" />
                  <span className="media-type-badge image">
                    <FaCamera /> Photo Evidence
                  </span>
                </div>
              )}
              <button
                type="button"
                className="remove-media-float-btn"
                onClick={handleRemoveMedia}
                title="Remove attachment"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* Hidden File Inputs for Toolbar Icons */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            style={{ display: 'none' }}
          />

          {/* 4. LINKEDIN STYLE BOTTOM ACTION TOOLBAR */}
          <div className="post-modal-bottom-toolbar">
            <div className="toolbar-icons-group">
              <span className="toolbar-hint-label">Add to your report:</span>

              {/* Photo Icon Button */}
              <button
                type="button"
                className="toolbar-icon-btn photo-btn"
                onClick={() => photoInputRef.current?.click()}
                title="Attach Photo"
              >
                <FaCamera />
              </button>

              {/* Video Icon Button */}
              <button
                type="button"
                className="toolbar-icon-btn video-btn"
                onClick={() => videoInputRef.current?.click()}
                title="Attach Video"
              >
                <FaVideo />
              </button>

              {/* Voice Dictation Icon Button */}
              <button
                type="button"
                className="toolbar-icon-btn voice-btn"
                onClick={() => setShowVoiceModal(true)}
                title="Voice Dictation Assistant"
              >
                <FaMicrophone />
              </button>

              {/* QR Scanner Icon Button */}
              <button
                type="button"
                className="toolbar-icon-btn qr-btn"
                onClick={() => setShowQRModal(true)}
                title="Scan QR Code"
              >
                <FaQrcode />
              </button>

              {/* GPS Live Telemetry Pill */}
              <div className="toolbar-gps-indicator" title={`GPS: ${Number(location?.latitude || 20.2185).toFixed(4)}° N, ${Number(location?.longitude || 85.7368).toFixed(4)}° E`}>
                <div className={`gps-dot ${isTracking ? 'live' : ''}`} />
                <span>GPS Locked</span>
              </div>
            </div>

            {/* Right: Actions Group */}
            <div className="post-submit-actions">
              <button
                type="button"
                className="post-cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="post-submit-btn"
                disabled={submitting || !description.trim() || !locationName.trim()}
              >
                {submitting ? (
                  <>
                    <FaSpinner className="spin" /> Posting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Post Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* QR Scanner Camera Modal */}
      <QRScannerModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        onScanComplete={handleQRScanSuccess}
      />

      {/* Voice Report Speech Recognition Modal */}
      <VoiceReportModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onVoiceParsed={handleVoiceData}
      />
    </div>
  );
}
