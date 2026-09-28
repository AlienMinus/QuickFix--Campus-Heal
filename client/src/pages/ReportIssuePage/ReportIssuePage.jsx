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

  // Active detected tags parsed in real time
  const [detectedCategories, setDetectedCategories] = useState([]);
  const [detectedZones, setDetectedZones] = useState([]);
  const [detectedSeverities, setDetectedSeverities] = useState([]);
  
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

  // Dynamic Instagram-style Autocomplete Dropdown State
  // { type: '@' | '#' | '$', query: string, startIndex: number, endIndex: number, activeIndex: number } | null
  const [autocomplete, setAutocomplete] = useState(null);

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

  // Match category in text (supports full hashtag, clean name, or individual keywords like #Plumbing, #Electrical)
  const matchCategoryInText = (cat, text) => {
    const cleanFull = cat.replace(/[^a-zA-Z0-9]/g, '');
    const escapedFull = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fullRegex = new RegExp(`#${escapedFull}\\b|#${cleanFull}\\b`, 'i');
    const fullMatch = fullRegex.exec(text);
    if (fullMatch) return { index: fullMatch.index, matchText: fullMatch[0] };

    // Match individual significant words (e.g. #Plumbing for Water Leakage & Plumbing)
    const words = cat.split(/[\s&/\\-]+/).filter(w => w.length >= 4);
    for (const word of words) {
      const wordRegex = new RegExp(`#${word}\\b`, 'i');
      const wordMatch = wordRegex.exec(text);
      if (wordMatch) {
        return { index: wordMatch.index, matchText: wordMatch[0] };
      }
    }
    return null;
  };

  // Match zone in text (supports full zone, clean name, or main acronym/keyword)
  const matchZoneInText = (z, text) => {
    const cleanFull = z.replace(/[^a-zA-Z0-9]/g, '');
    const escapedFull = z.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fullRegex = new RegExp(`@${escapedFull}\\b|@${cleanFull}\\b`, 'i');
    const fullMatch = fullRegex.exec(text);
    if (fullMatch) return { index: fullMatch.index, matchText: fullMatch[0] };

    const words = z.split(/[\s&/\\()-]+/).filter(w => w.length >= 3);
    for (const word of words) {
      const wordRegex = new RegExp(`@${word}\\b`, 'i');
      const wordMatch = wordRegex.exec(text);
      if (wordMatch) {
        return { index: wordMatch.index, matchText: wordMatch[0] };
      }
    }
    return null;
  };

  // Match severity in text ($Critical, $High, $Medium, $Low)
  const matchSeverityInText = (sev, text) => {
    const regex = new RegExp(`\\$${sev}\\b`, 'i');
    const match = regex.exec(text);
    if (match) return { index: match.index, matchText: match[0] };
    return null;
  };

  // Intelligent parser: parse @zone, #category, $severity from description text in real time
  // Multiple categories (#) ALLOWED
  // Single zone (@) and Single severity ($) ENFORCED
  const parseTagsFromText = (text) => {
    // 1. Detect Category #... (Multiple allowed)
    const foundCategories = [];
    for (const cat of categoriesList) {
      const match = matchCategoryInText(cat, text);
      if (match) {
        foundCategories.push({ cat, index: match.index });
      }
    }
    foundCategories.sort((a, b) => a.index - b.index);
    const catNames = [...new Set(foundCategories.map(item => item.cat))];
    setDetectedCategories(catNames);
    if (catNames.length > 0) {
      setCategory(prev => (catNames.includes(prev) ? prev : catNames[0]));
    }

    // 2. Detect Severity $... (Only 1 allowed)
    const foundSeverities = [];
    for (const sev of SEVERITIES) {
      const match = matchSeverityInText(sev, text);
      if (match) {
        foundSeverities.push({ sev, index: match.index });
      }
    }
    foundSeverities.sort((a, b) => a.index - b.index);
    const sevNames = [...new Set(foundSeverities.map(item => item.sev))];
    setDetectedSeverities(sevNames);
    if (sevNames.length === 1) {
      setSeverity(sevNames[0]);
    }

    // 3. Detect Zone @... (Only 1 allowed)
    const foundZones = [];
    for (const z of availableZones) {
      const match = matchZoneInText(z, text);
      if (match) {
        foundZones.push({ zone: z, index: match.index });
      }
    }
    foundZones.sort((a, b) => a.index - b.index);
    const zoneNames = [...new Set(foundZones.map(item => item.zone))];
    setDetectedZones(zoneNames);
    if (zoneNames.length === 1) {
      setZone(zoneNames[0]);
    }
  };

  // Calculate pixel coordinates of the caret within the textarea to place top-left corner of dropdown on cursor
  const getCaretCoordinates = (element, position) => {
    if (!element || typeof window === 'undefined') return { top: 34, left: 12 };

    const properties = [
      'direction',
      'boxSizing',
      'width',
      'overflowX',
      'overflowY',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'fontStretch',
      'fontSize',
      'lineHeight',
      'fontFamily',
      'textAlign',
      'textTransform',
      'textIndent',
      'letterSpacing',
      'wordSpacing',
      'tabSize',
    ];

    const div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);

    const style = div.style;
    const computed = window.getComputedStyle(element);

    style.whiteSpace = 'pre-wrap';
    style.wordWrap = 'break-word';
    style.position = 'absolute';
    style.visibility = 'hidden';
    style.top = '0px';
    style.left = '-9999px';

    properties.forEach((prop) => {
      style[prop] = computed[prop];
    });

    // Substring before cursor
    div.textContent = element.value.substring(0, position);

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    const borderLeft = parseInt(computed['borderLeftWidth'] || '0', 10) || 0;
    const borderTop = parseInt(computed['borderTopWidth'] || '0', 10) || 0;
    const lineHeight = parseInt(computed['lineHeight'] || '22', 10) || 22;

    const rawTop = span.offsetTop + borderTop - element.scrollTop;
    const rawLeft = span.offsetLeft + borderLeft - element.scrollLeft;

    document.body.removeChild(div);

    // Position top-left corner of the dropdown directly under the cursor line
    const containerWidth = element.clientWidth || 340;
    const popoverWidth = Math.min(310, containerWidth - 16);

    let boundedLeft = rawLeft;
    if (boundedLeft + popoverWidth > containerWidth) {
      boundedLeft = Math.max(8, containerWidth - popoverWidth - 8);
    } else {
      boundedLeft = Math.max(8, boundedLeft);
    }

    return {
      top: rawTop + lineHeight + 4,
      left: boundedLeft,
    };
  };

  // Detect whether cursor is currently at a special character tag (@, #, $)
  const detectAutocomplete = (text, cursorPos) => {
    if (cursorPos === undefined || cursorPos === null) {
      cursorPos = text.length;
    }
    const textBeforeCursor = text.slice(0, cursorPos);
    // Matches trigger character @, #, or $ preceded by start of string or whitespace, followed by non-space chars
    const match = textBeforeCursor.match(/(?:^|\s)([@#$])([a-zA-Z0-9_\-/]*)$/);

    if (match) {
      const trigger = match[1]; // '@' | '#' | '$'
      const query = match[2] || '';
      const triggerIndex = textBeforeCursor.lastIndexOf(trigger);
      const coords = getCaretCoordinates(textareaRef.current, cursorPos);

      setAutocomplete({
        type: trigger,
        query: query.trim(),
        startIndex: triggerIndex,
        endIndex: cursorPos,
        activeIndex: 0,
        coords,
      });
    } else {
      setAutocomplete(null);
    }
  };

  // Autocomplete Suggestions Filtering
  const filteredZones = useMemo(() => {
    if (!autocomplete || autocomplete.type !== '@') return [];
    const q = autocomplete.query.toLowerCase();
    return availableZones.filter(z => z.toLowerCase().includes(q));
  }, [autocomplete, availableZones]);

  const filteredCategories = useMemo(() => {
    if (!autocomplete || autocomplete.type !== '#') return [];
    const q = autocomplete.query.toLowerCase();
    return categoriesList.filter(c => c.toLowerCase().includes(q));
  }, [autocomplete, categoriesList]);

  const filteredSeverities = useMemo(() => {
    if (!autocomplete || autocomplete.type !== '$') return [];
    const q = autocomplete.query.toLowerCase();
    return SEVERITIES.filter(s => s.toLowerCase().includes(q));
  }, [autocomplete]);

  // Handle selecting a tag suggestion from Instagram-style dropdown
  const handleSelectSuggestion = (value, type) => {
    if (!autocomplete) return;
    const { startIndex, endIndex } = autocomplete;

    const formatted = `${type}${value} `;
    const updated = description.slice(0, startIndex) + formatted + description.slice(endIndex);

    setDescription(updated);
    setAutocomplete(null);

    // Update corresponding form states
    if (type === '@') setZone(value);
    if (type === '#') setCategory(value);
    if (type === '$') setSeverity(value);

    // Refocus textarea and place cursor right after inserted tag
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = startIndex + formatted.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 15);
  };

  // Helper to insert trigger character (@, #, $) at cursor or append
  const insertTriggerChar = (char) => {
    const cursorPos = textareaRef.current?.selectionStart ?? description.length;
    const needsLeadingSpace = cursorPos > 0 && description[cursorPos - 1] !== ' ' && description[cursorPos - 1] !== '\n';
    const prefix = needsLeadingSpace ? ' ' : '';
    const updated = description.slice(0, cursorPos) + prefix + char + description.slice(cursorPos);

    setDescription(updated);
    const newCursor = cursorPos + prefix.length + 1;

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursor, newCursor);
        detectAutocomplete(updated, newCursor);
      }
    }, 15);
  };

  // Keyboard navigation inside autocomplete dropdown (Up/Down arrow, Enter, Escape)
  const handleTextareaKeyDown = (e) => {
    if (!autocomplete) return;

    let items = [];
    if (autocomplete.type === '@') items = filteredZones;
    else if (autocomplete.type === '#') items = filteredCategories;
    else if (autocomplete.type === '$') items = filteredSeverities;

    if (items.length === 0) {
      if (e.key === 'Escape') setAutocomplete(null);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutocomplete(prev => ({
        ...prev,
        activeIndex: (prev.activeIndex + 1) % items.length
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutocomplete(prev => ({
        ...prev,
        activeIndex: (prev.activeIndex - 1 + items.length) % items.length
      }));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (autocomplete.activeIndex >= 0 && autocomplete.activeIndex < items.length) {
        e.preventDefault();
        handleSelectSuggestion(items[autocomplete.activeIndex], autocomplete.type);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setAutocomplete(null);
    }
  };

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    parseTagsFromText(val);
    detectAutocomplete(val, e.target.selectionStart);
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
          {/* 1. UNBOUND DESCRIPTION TEXTAREA WITH INSTAGRAM-STYLE FLOATING AUTOCOMPLETE */}
          <div className="unbound-textarea-section">
            <div className="unbound-textarea-container">
              <textarea
                ref={textareaRef}
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                onKeyDown={handleTextareaKeyDown}
                onClick={(e) => detectAutocomplete(e.target.value, e.target.selectionStart)}
                onKeyUp={(e) => {
                  if (!['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
                    detectAutocomplete(e.target.value, e.target.selectionStart);
                  }
                }}
                placeholder="What needs maintenance or fixing? Describe freely...&#10;Type @ for Campus Zone, # for Category, $ for Severity&#10;e.g. Broken exhaust fan in @Visvesvaraya Labs #Electrical $High"
                className="unbound-description-input"
                autoFocus
                required
              />

              {/* INSTAGRAM-STYLE AUTOCOMPLETE DROPDOWN */}
              {autocomplete && (
                <div
                  className="insta-autocomplete-popover"
                  style={{
                    top: `${autocomplete.coords?.top ?? 34}px`,
                    left: `${autocomplete.coords?.left ?? 10}px`,
                  }}
                >
                  <div className="insta-popover-header">
                    <span className={`popover-trigger-badge trigger-${autocomplete.type === '@' ? 'zone' : autocomplete.type === '#' ? 'category' : 'severity'}`}>
                      {autocomplete.type}
                    </span>
                    <span className="popover-heading">
                      {autocomplete.type === '@' && 'Campus Zones (@)'}
                      {autocomplete.type === '#' && 'Facility Categories (#)'}
                      {autocomplete.type === '$' && 'Urgency Severity ($)'}
                    </span>
                    <span className="popover-hint">↑↓ navigate • ↵ select</span>
                  </div>

                  <div className="insta-popover-list">
                    {autocomplete.type === '@' && (
                      filteredZones.length === 0 ? (
                        <div className="insta-no-match">No zones match "@{autocomplete.query}"</div>
                      ) : (
                        filteredZones.map((z, idx) => (
                          <button
                            key={z}
                            type="button"
                            className={`insta-suggestion-item ${autocomplete.activeIndex === idx ? 'focused' : ''}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSuggestion(z, '@');
                            }}
                          >
                            <div className="item-prefix-icon zone">
                              <FaMapMarkerAlt />
                            </div>
                            <div className="item-text-wrap">
                              <span className="item-main-title">@{z}</span>
                              <span className="item-subtitle">Campus Zone</span>
                            </div>
                          </button>
                        ))
                      )
                    )}

                    {autocomplete.type === '#' && (
                      filteredCategories.length === 0 ? (
                        <div className="insta-no-match">No categories match "#{autocomplete.query}"</div>
                      ) : (
                        filteredCategories.map((c, idx) => (
                          <button
                            key={c}
                            type="button"
                            className={`insta-suggestion-item ${autocomplete.activeIndex === idx ? 'focused' : ''}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSuggestion(c, '#');
                            }}
                          >
                            <div className="item-prefix-icon category">
                              <FaTags />
                            </div>
                            <div className="item-text-wrap">
                              <span className="item-main-title">#{c}</span>
                              <span className="item-subtitle">Facility Category</span>
                            </div>
                          </button>
                        ))
                      )
                    )}

                    {autocomplete.type === '$' && (
                      filteredSeverities.length === 0 ? (
                        <div className="insta-no-match">No severity matches "${autocomplete.query}"</div>
                      ) : (
                        filteredSeverities.map((s, idx) => (
                          <button
                            key={s}
                            type="button"
                            className={`insta-suggestion-item severity-${s.toLowerCase()} ${autocomplete.activeIndex === idx ? 'focused' : ''}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSuggestion(s, '$');
                            }}
                          >
                            <div className={`item-prefix-icon severity ${s.toLowerCase()}`}>
                              <FaExclamationTriangle />
                            </div>
                            <div className="item-text-wrap">
                              <span className="item-main-title">${s}</span>
                              <span className="item-subtitle">
                                {s === 'Critical' && 'Immediate hazard / Total facility shutdown'}
                                {s === 'High' && 'High disruption to classes or hostels'}
                                {s === 'Medium' && 'Standard routine maintenance repair'}
                                {s === 'Low' && 'Minor or informational issue'}
                              </span>
                            </div>
                          </button>
                        ))
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active Recognition Bar (Read-only pills, not dropboxes) */}
            {(zone || category || severity) && (
              <div className="active-detected-tags-strip">
                <span className="strip-title">Recognized:</span>
                <span className="detected-pill zone"><FaMapMarkerAlt className="mini-icon" /> {zone}</span>
                <span className="detected-pill category"><FaTags className="mini-icon" /> {category}</span>
                <span className={`detected-pill severity ${severity.toLowerCase()}`}>
                  <FaExclamationTriangle className="mini-icon" /> {severity}
                </span>
              </div>
            )}

            {/* Quick Insert Trigger Shortcuts (Type @ # $, or tap below - NO permanent dropboxes) */}
            <div className="insta-typing-guide">
              <span className="guide-label">Special characters:</span>
              <button type="button" className="quick-tag-trigger-btn zone" onClick={() => insertTriggerChar('@')}>
                <span className="sym">@</span> Zone
              </button>
              <button type="button" className="quick-tag-trigger-btn category" onClick={() => insertTriggerChar('#')}>
                <span className="sym">#</span> Category
              </button>
              <button type="button" className="quick-tag-trigger-btn severity" onClick={() => insertTriggerChar('$')}>
                <span className="sym">$</span> Severity
              </button>
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
