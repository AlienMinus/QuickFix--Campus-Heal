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
  FaHeading,
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
  const [detectedHeading, setDetectedHeading] = useState('');
  
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

  // Extract issue heading from special character syntax: - <Issue Heading>
  // Strictly prevents MAB or parenthesized zone acronyms from becoming the title!
  const extractHeadingFromText = (text, primaryCat = category, loc = locationName, z = zone) => {
    if (!text || !text.trim()) return '';

    // 1. Explicit hyphen (-) heading syntax: - <Heading>
    // e.g. "- Broken fan switchboard @Main Academic Block" or "- Water Leakage"
    // Requires (?:^|\n)\s*-\s+ to ensure it's at start of line and not within a word like Wi-Fi or air-conditioner
    const hyphenMatch = text.match(/(?:^|\n)\s*-\s+([^\n\r@#$]+)/);
    if (hyphenMatch && hyphenMatch[1]) {
      let cleanHyphenHeading = hyphenMatch[1]
        // Strip any embedded bracket notes [Check: ...]
        .replace(/\[[^\]]*\]/g, '')
        // Strip zone with parenthesized acronyms, e.g. @Main Academic Block (MAB)
        .replace(/@[\w\s-]+\s*\([^)]*\)/gi, '')
        .replace(/@[\w\s-]+/gi, '')
        // Strip standalone parenthesized acronyms like (MAB)
        .replace(/\([A-Z0-9\s&-]{2,10}\)/gi, '')
        .replace(/#[a-zA-Z0-9_\-/]+/g, '')
        .replace(/\$[a-zA-Z0-9]+/g, '')
        .replace(/^\s*[-–—:\s]+/, '')
        .replace(/\s*[-–—:\s]+$/, '')
        .trim();

      if (cleanHyphenHeading.length >= 2) {
        return cleanHyphenHeading.slice(0, 80);
      }
    }

    // 2. Fallback: Clean title from first meaningful sentence/line, strictly excluding (MAB) / zone acronyms
    const firstLine = text.split(/[\n\r]+/)[0] || '';
    let cleanLine = firstLine
      // Strip zone tags and their parenthesized acronyms like @Main Academic Block (MAB)
      .replace(/@[\w\s-]+\s*\([^)]*\)/gi, '')
      .replace(/@[\w\s-]+/gi, '')
      // Strip standalone parenthesized acronyms like (MAB) or (HQ)
      .replace(/\([A-Z0-9\s&-]{2,10}\)/gi, '')
      // Strip bracketed inspection or check notes like [Check: ...]
      .replace(/\[[^\]]*\]/g, '')
      // Strip category tags (#Electrical) and severity tags ($High)
      .replace(/#[a-zA-Z0-9_\-/]+/g, '')
      .replace(/\$[a-zA-Z0-9]+/g, '')
      // Strip leading bullet or hyphen markers
      .replace(/^[\s\-–—*•:]+/, '')
      .trim();

    // If cleanLine is substantial (at least 3 characters and not just punctuation or acronyms)
    if (cleanLine && cleanLine.replace(/[^a-zA-Z0-9]/g, '').length >= 3) {
      // Remove trailing prepositions like 'in', 'at', 'near', 'on'
      cleanLine = cleanLine.replace(/\b(in|at|near|on|for|to)\s*$/i, '').trim();
      if (cleanLine.length >= 3) {
        return cleanLine.slice(0, 80);
      }
    }

    // 3. Fallback to descriptive default (NEVER "(MAB)")
    const safeLoc = loc?.trim() || z || 'Campus';
    const safeCat = primaryCat || 'Facility';
    return `${safeCat} issue at ${safeLoc}`;
  };

  // Score how well a text chunk after an '@' tag matches a campus zone name
  // Prevents false positives like '@Main Academic Block' matching 'Campus Main Gate'
  const scoreZoneMatch = (zoneName, chunk) => {
    if (!zoneName || !chunk) return 0;
    const lowerChunk = chunk.trim().toLowerCase();
    const lowerZone = zoneName.trim().toLowerCase();

    // 1. Exact full name match at start of chunk
    // e.g. "@Main Academic Block (MAB)"
    if (lowerChunk.startsWith(lowerZone)) {
      return 1000 + lowerZone.length;
    }

    // 2. Zone without parenthesized part
    // e.g. zone is "Main Academic Block (MAB)", base is "main academic block"
    const baseZone = lowerZone.replace(/\s*\([^)]*\)/g, '').trim();
    if (baseZone.length >= 3 && lowerChunk.startsWith(baseZone)) {
      return 900 + baseZone.length;
    }

    // 3. Clean full name match (ignoring spaces & punctuation)
    // e.g. "@MainAcademicBlock"
    const cleanChunk = lowerChunk.replace(/[^a-z0-9]/g, '');
    const cleanZone = lowerZone.replace(/[^a-z0-9]/g, '');
    if (cleanZone.length >= 3 && cleanChunk.startsWith(cleanZone)) {
      return 850 + cleanZone.length;
    }

    // 4. Parenthesized acronym / alias match
    // e.g. "(MAB)" -> match "@MAB", or "(Bhabha Bhawan)" -> match "@Bhabha Bhawan"
    const parenMatch = zoneName.match(/\(([^)]+)\)/);
    if (parenMatch && parenMatch[1]) {
      const parenContent = parenMatch[1].trim().toLowerCase();
      const parenRegex = new RegExp(`^${parenContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^a-z0-9]|$)`, 'i');
      if (parenRegex.test(lowerChunk)) {
        return 800 + parenContent.length;
      }
    }

    // 5. Acronym formed by capital letters (e.g. "Student Activity Center" -> "SAC")
    const capitalLetters = zoneName.match(/\b[A-Z]/g)?.join('').toLowerCase() || '';
    if (capitalLetters.length >= 2) {
      const capRegex = new RegExp(`^${capitalLetters}(?:[^a-z0-9]|$)`, 'i');
      if (capRegex.test(lowerChunk)) {
        return 750 + capitalLetters.length;
      }
    }

    // 6. Distinctive subparts separated by '&' or '/'
    // e.g. "Campus Main Gate & Security Post" -> ["campus main gate", "security post"]
    const subParts = lowerZone.split(/[\s*&/\s*]+/).map(p => p.trim()).filter(p => p.length >= 4);
    for (const part of subParts) {
      if (lowerChunk.startsWith(part)) {
        return 700 + part.length;
      }
    }

    // 7. Distinctive leading words: exclude common generic stop words
    const ZONE_STOP_WORDS = new Set([
      'main', 'academic', 'block', 'complex', 'hub', 'center', 'centre',
      'gate', 'post', 'hall', 'room', 'hostel', 'labs', 'lab', 'workshop',
      'court', 'food', 'campus', 'digital', 'tech', 'building', 'ground',
      'area', 'and', 'the', 'for', 'sec', 'bhawan'
    ]);

    const zoneWords = lowerZone.split(/[\s&/\\()-]+/).filter(w => w.length >= 2);
    // If first word is NOT a generic stop word (e.g. "visvesvaraya", "aryabhatta", "kalam", "ramanujan")
    if (zoneWords.length > 0 && !ZONE_STOP_WORDS.has(zoneWords[0])) {
      const firstWord = zoneWords[0];
      const wordRegex = new RegExp(`^${firstWord}(?:[^a-z0-9]|$)`, 'i');
      if (wordRegex.test(lowerChunk)) {
        return 600 + firstWord.length;
      }
    }

    // If first 2 words match together (e.g. "main academic" vs "campus main")
    if (zoneWords.length >= 2) {
      const firstTwoWords = `${zoneWords[0]} ${zoneWords[1]}`;
      if (lowerChunk.startsWith(firstTwoWords)) {
        return 550 + firstTwoWords.length;
      }
    }

    return 0;
  };

  // Match category tag word against registered categories
  // Filters out generic hashtags like #urgent, #help, #broken, #1, #test
  const matchCategoryTag = (tagWord, categories) => {
    if (!tagWord || tagWord.length < 2) return null;
    const cleanTag = tagWord.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!cleanTag || cleanTag.length < 2) return null;

    const IGNORED_TAGS = new Set([
      'urgent', 'help', 'fix', 'broken', 'issue', 'ticket', 'problem',
      'test', 'demo', 'today', 'asap', 'hazard', 'danger', 'safe',
      'room', 'floor', 'hall', 'block', 'gate', 'campus', 'zone',
      'heading', 'severity', 'category', 'status', 'title', 'note'
    ]);
    if (IGNORED_TAGS.has(cleanTag)) return null;
    if (/^\d+$/.test(cleanTag)) return null;

    // 1. Exact or clean match
    for (const cat of categories) {
      const cleanCat = cat.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (cleanTag === cleanCat || cat.toLowerCase() === tagWord.toLowerCase()) {
        return cat;
      }
    }

    // 2. Distinctive keyword in category name (>= 4 chars)
    for (const cat of categories) {
      const words = cat.split(/[\s&/\\-]+/).filter(w => w.length >= 4);
      for (const word of words) {
        const cleanWord = word.toLowerCase();
        if (cleanTag === cleanWord || (cleanTag.length >= 4 && cleanWord.startsWith(cleanTag))) {
          return cat;
        }
      }
    }

    return null;
  };

  // Intelligent parser: parse -heading, @zone, #category, $severity from description text in real time
  // Rejects all false positives (emails, currency $100, generic #hashtags, hyphenated words Wi-Fi, etc.)
  // Token count invariant: 1 @ token can NEVER produce >1 zone!
  const parseTagsFromText = (text) => {
    if (!text || typeof text !== 'string') {
      setDetectedHeading('');
      setDetectedCategories([]);
      setDetectedSeverities([]);
      setDetectedZones([]);
      return;
    }

    // 0. Detect Heading (-)
    // Must be at start of a line/string with space: (?:^|\n)\s*-\s+([^\n\r@#$]+)
    const explicitHeadingMatch = text.match(/(?:^|\n)\s*-\s+([^\n\r@#$]+)/);
    if (explicitHeadingMatch) {
      const explicitHeading = extractHeadingFromText(text);
      setDetectedHeading(explicitHeading);
    } else {
      setDetectedHeading('');
    }

    // 1. Detect Category #... (Multiple allowed)
    // Must be preceded by start of string or whitespace/bracket, NOT part of an alphanumeric string or URL
    const catRegex = /(?:^|[\s(\["'])#([a-zA-Z0-9_\-/]+)/g;
    const foundCategories = [];
    let catMatch;
    while ((catMatch = catRegex.exec(text)) !== null) {
      const tagWord = catMatch[1];
      const matchedCat = matchCategoryTag(tagWord, categoriesList);
      if (matchedCat && !foundCategories.includes(matchedCat)) {
        foundCategories.push(matchedCat);
      }
    }
    setDetectedCategories(foundCategories);
    if (foundCategories.length > 0) {
      setCategory(prev => (foundCategories.includes(prev) ? prev : foundCategories[0]));
    }

    // 2. Detect Severity $... (Only 1 allowed)
    // Must be preceded by start of string or whitespace/bracket, followed strictly by letters (never digits like $100)
    const sevRegex = /(?:^|[\s(\["'])\$([a-zA-Z]+)\b/gi;
    const foundSeverities = [];
    let sevMatch;
    while ((sevMatch = sevRegex.exec(text)) !== null) {
      const word = sevMatch[1].toLowerCase();
      const matchedSev = SEVERITIES.find(s => s.toLowerCase() === word);
      if (matchedSev && !foundSeverities.includes(matchedSev)) {
        foundSeverities.push(matchedSev);
      }
    }
    setDetectedSeverities(foundSeverities);
    if (foundSeverities.length === 1) {
      setSeverity(foundSeverities[0]);
    }

    // 3. Detect Zone @... (Only 1 allowed)
    // Must be preceded by start of string or whitespace/bracket (NOT preceded by alphanumeric -> rejects emails like name@domain.com)
    const zoneRegex = /(?:^|[\s(\["'])@/g;
    const foundZones = [];
    let zoneTokenMatch;
    while ((zoneTokenMatch = zoneRegex.exec(text)) !== null) {
      const atCharIndex = zoneTokenMatch.index + zoneTokenMatch[0].indexOf('@');
      const textAfterAt = text.slice(atCharIndex + 1);

      // Score against all available zones
      let bestZone = null;
      let highestScore = 0;
      for (const z of availableZones) {
        const score = scoreZoneMatch(z, textAfterAt);
        if (score > highestScore) {
          highestScore = score;
          bestZone = z;
        }
      }

      if (bestZone && highestScore > 0) {
        if (!foundZones.includes(bestZone)) {
          foundZones.push(bestZone);
        }
      }
    }

    setDetectedZones(foundZones);
    if (foundZones.length === 1) {
      setZone(foundZones[0]);
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

    // Check if dropdown would benefit from flipping above cursor (e.g. typing near bottom of tall input)
    const popoverHeight = 220;
    const spaceBelow = (element.clientHeight || 140) - rawTop;
    let popoverTop = rawTop + lineHeight + 4;
    if (spaceBelow < 50 && rawTop > popoverHeight + 10) {
      popoverTop = Math.max(8, rawTop - popoverHeight - 6);
    }

    return {
      top: popoverTop,
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

    let currentText = description;
    let newStartIndex = startIndex;
    let newEndIndex = endIndex;

    // For single-value tags (@zone and $severity), replace any previously typed tag
    // so using the dropdown naturally maintains a single zone and single severity without duplicate errors!
    if (type === '@') {
      for (const z of availableZones) {
        const cleanZ = z.replace(/[^a-zA-Z0-9]/g, '');
        const escapedZ = z.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(`@${escapedZ}(?:\\s*\\([^)]*\\))?|@${cleanZ}\\b`, 'gi');
        let m;
        while ((m = reg.exec(currentText)) !== null) {
          if (m.index < startIndex || m.index >= endIndex) {
            const matchLen = m[0].length;
            currentText = currentText.slice(0, m.index) + currentText.slice(m.index + matchLen).replace(/^\s+/, ' ');
            if (m.index < startIndex) {
              newStartIndex -= matchLen;
              newEndIndex -= matchLen;
            }
            break;
          }
        }
      }
    } else if (type === '$') {
      for (const s of SEVERITIES) {
        const reg = new RegExp(`\\$${s}\\b`, 'gi');
        let m;
        while ((m = reg.exec(currentText)) !== null) {
          if (m.index < startIndex || m.index >= endIndex) {
            const matchLen = m[0].length;
            currentText = currentText.slice(0, m.index) + currentText.slice(m.index + matchLen).replace(/^\s+/, ' ');
            if (m.index < startIndex) {
              newStartIndex -= matchLen;
              newEndIndex -= matchLen;
            }
            break;
          }
        }
      }
    }

    const formatted = `${type}${value} `;
    const updated = currentText.slice(0, newStartIndex) + formatted + currentText.slice(newEndIndex);

    setDescription(updated);
    setAutocomplete(null);
    parseTagsFromText(updated);

    // Update corresponding form states
    if (type === '@') setZone(value);
    if (type === '#') {
      setCategory(value);
      setDetectedCategories(prev => prev.includes(value) ? prev : [...prev, value]);
    }
    if (type === '$') setSeverity(value);

    // Refocus textarea and place cursor right after inserted tag
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = newStartIndex + formatted.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 15);
  };

  // Helper to insert trigger character (-, @, #, $) at cursor or append
  const insertTriggerChar = (char) => {
    const cursorPos = textareaRef.current?.selectionStart ?? description.length;
    const needsLeadingSpace = cursorPos > 0 && description[cursorPos - 1] !== ' ' && description[cursorPos - 1] !== '\n';
    const prefix = needsLeadingSpace ? ' ' : '';
    const updated = description.slice(0, cursorPos) + prefix + char + description.slice(cursorPos);

    setDescription(updated);
    parseTagsFromText(updated);
    const newCursor = cursorPos + prefix.length + char.length;

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

  // Single-value tag validation flags
  const hasMultipleZones = detectedZones.length > 1;
  const hasMultipleSeverities = detectedSeverities.length > 1;
  const hasMultipleSingleTags = hasMultipleZones || hasMultipleSeverities;
  const hasAnyDetected = Boolean(
    detectedHeading ||
    detectedZones.length > 0 ||
    detectedCategories.length > 0 ||
    detectedSeverities.length > 0
  );

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
    if (hasMultipleZones) {
      setErrorMessage(`Only a single zone is allowed per report. Please keep only one @zone in your description (found: ${detectedZones.map(z => '@' + z).join(', ')}).`);
      return;
    }
    if (hasMultipleSeverities) {
      setErrorMessage(`Only a single severity is allowed per report. Please keep only one $severity in your description (found: ${detectedSeverities.map(s => '$' + s).join(', ')}).`);
      return;
    }

    const activeCategories = detectedCategories.length > 0 ? detectedCategories : [category];
    const primaryCategory = activeCategories[0] || category;
    const finalZone = detectedZones.length === 1 ? detectedZones[0] : zone;
    const finalSeverity = detectedSeverities.length === 1 ? detectedSeverities[0] : severity;

    // Determine issue heading:
    // 1. Explicit hyphen (-) syntax if typed by user (e.g. - Broken fan switchboard)
    // 2. Or fallback to clean title strictly excluding MAB / zone acronyms / bracketed notes
    const finalTitle = title.trim() || detectedHeading || extractHeadingFromText(description, primaryCategory, locationName, finalZone);

    try {
      setSubmitting(true);
      const submitData = new FormData();
      submitData.append('title', finalTitle);
      submitData.append('description', description.trim());
      submitData.append('category', primaryCategory);
      submitData.append('categories', JSON.stringify(activeCategories));
      submitData.append('severity', finalSeverity);
      submitData.append('locationName', locationName.trim());
      submitData.append('zone', finalZone);
      submitData.append('latitude', location?.latitude || 20.2185);
      submitData.append('longitude', location?.longitude || 85.7368);
      submitData.append('isUrgent', finalSeverity === 'Critical');

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
                placeholder="What needs maintenance or fixing? Describe freely...&#10;Type - for Heading, @ for Campus Zone, # for Category, $ for Severity&#10;e.g. - Broken exhaust fan in @Visvesvaraya Labs #Electrical $High"
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
            {/* Active Recognition Bar - Strictly displays tags recognized from text */}
            {hasAnyDetected ? (
              <div className="active-detected-tags-strip">
                <span className="strip-title">Recognized:</span>

                {/* HEADING: Designated by hyphen (-) */}
                {detectedHeading && (
                  <span className="detected-pill heading" title="Designated Issue Heading">
                    <FaHeading className="mini-icon" /> - {detectedHeading}
                  </span>
                )}

                {/* ZONE: Single Zone Allowed */}
                {hasMultipleZones ? (
                  <span className="detected-pill error zone" title="Only 1 zone allowed per report">
                    <FaExclamationTriangle className="mini-icon" /> Multiple Zones ({detectedZones.map(z => '@' + z).join(', ')}) — 1 allowed!
                  </span>
                ) : detectedZones.length === 1 ? (
                  <span className="detected-pill zone" title="Campus Zone">
                    <FaMapMarkerAlt className="mini-icon" /> @{detectedZones[0]}
                  </span>
                ) : null}

                {/* CATEGORIES: Multiple Categories Allowed */}
                {detectedCategories.length > 0 && (
                  detectedCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`detected-pill category clickable-cat-pill ${cat === category ? 'primary' : ''}`}
                      onClick={() => setCategory(cat)}
                      title={cat === category ? 'Primary ticket category' : 'Click to set as primary category'}
                    >
                      <FaTags className="mini-icon" /> #{cat} {detectedCategories.length > 1 && cat === category ? '★ Primary' : ''}
                    </button>
                  ))
                )}

                {/* SEVERITY: Single Severity Allowed */}
                {hasMultipleSeverities ? (
                  <span className="detected-pill error severity" title="Only 1 severity allowed per report">
                    <FaExclamationTriangle className="mini-icon" /> Multiple Severities ({detectedSeverities.map(s => '$' + s).join(', ')}) — 1 allowed!
                  </span>
                ) : detectedSeverities.length === 1 ? (
                  <span className={`detected-pill severity ${detectedSeverities[0].toLowerCase()}`} title="Urgency Severity">
                    <FaExclamationTriangle className="mini-icon" /> ${detectedSeverities[0]}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="active-detected-tags-strip idle-hint">
                <span className="strip-title">Syntax:</span>
                <span className="syntax-hint-tag"><span className="sym">-</span> Heading</span>
                <span className="syntax-hint-tag"><span className="sym">@</span> Zone</span>
                <span className="syntax-hint-tag"><span className="sym">#</span> Category</span>
                <span className="syntax-hint-tag"><span className="sym">$</span> Severity</span>
              </div>
            )}

            {/* Validation Callout if multiple single-value tags detected */}
            {hasMultipleSingleTags && (
              <div className="tag-validation-callout">
                <FaExclamationTriangle className="tag-callout-icon" />
                <div className="tag-callout-text">
                  {hasMultipleZones && (
                    <p>
                      <strong>Multiple zones detected:</strong> Please keep only one <code>@zone</code> (found: {detectedZones.map(z => '@' + z).join(', ')}). Multiple categories (<code>#</code>) are permitted, but a ticket can only be located in one physical zone.
                    </p>
                  )}
                  {hasMultipleSeverities && (
                    <p>
                      <strong>Multiple severities detected:</strong> Please keep only one <code>$severity</code> (found: {detectedSeverities.map(s => '$' + s).join(', ')}).
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Insert Trigger Shortcuts (Type - @ # $, or tap below - NO permanent dropboxes) */}
            <div className="insta-typing-guide">
              <span className="guide-label">Special characters:</span>
              <button
                type="button"
                className="quick-tag-trigger-btn heading"
                onClick={() => insertTriggerChar('- ')}
                title="Designate Issue Heading with hyphen (-)"
              >
                <span className="sym">-</span> Heading
              </button>
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
                disabled={submitting || !description.trim() || !locationName.trim() || hasMultipleSingleTags}
                title={hasMultipleSingleTags ? 'Please keep only a single zone and single severity' : 'Post Ticket'}
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
