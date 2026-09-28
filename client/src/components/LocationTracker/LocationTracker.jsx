import React, { useState } from 'react';
import './LocationTracker.css';
import { useLocation } from '../../context/LocationContext';
import {
  FaCompass,
  FaSatelliteDish,
  FaMapMarkerAlt,
  FaPlay,
  FaPause,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

const LocationTracker = () => {
  const {
    isTracking,
    position,
    loggedCount,
    lastZone,
    toggleTracking,
  } = useLocation();

  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`location-tracker-card ${isTracking ? 'tracking-on' : 'tracking-off'}`}>
      <div className="tracker-summary-bar" onClick={() => setExpanded(!expanded)}>
        <div className="tracker-status-indicator">
          <span className={`live-pulse-dot ${isTracking ? 'pulse' : 'off'}`} />
          <div className="status-meta">
            <span className="status-title">
              {isTracking ? '1s GPS MongoDB Logging Active' : 'GPS Tracking Paused'}
            </span>
            <span className="status-zone">
              <FaMapMarkerAlt className="mini-icon" /> {lastZone || 'GIFT Autonomous Campus'}
            </span>
          </div>
        </div>

        <div className="tracker-actions">
          <div className="logged-counter" title="Total coordinates logged directly to MongoDB">
            <span className="counter-val">{loggedCount}</span>
            <span className="counter-label">logs</span>
          </div>

          <button
            className={`toggle-tracking-btn ${isTracking ? 'pause' : 'resume'}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTracking();
            }}
            title={isTracking ? 'Pause 1s logging' : 'Resume 1s logging'}
          >
            {isTracking ? <FaPause /> : <FaPlay />}
          </button>

          <button className="expand-btn">
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="tracker-details-tray">
          <div className="telemetry-grid">
            <div className="telemetry-item">
              <span className="item-label">Latitude</span>
              <span className="item-val">{position.latitude?.toFixed(6) || '20.219500'}° N</span>
            </div>
            <div className="telemetry-item">
              <span className="item-label">Longitude</span>
              <span className="item-val">{position.longitude?.toFixed(6) || '85.736000'}° E</span>
            </div>
            <div className="telemetry-item">
              <span className="item-label">Speed</span>
              <span className="item-val">{position.speed || '0.0'} m/s</span>
            </div>
            <div className="telemetry-item">
              <span className="item-label">Accuracy</span>
              <span className="item-val">±{position.accuracy || '5'} m</span>
            </div>
          </div>

          <div className="sync-info-footer">
            <FaSatelliteDish className="footer-icon" />
            <span>Updating to MongoDB Atlas every 1,000ms (1 second)</span>
            <span className="sync-status-badge">
              <FaCheckCircle /> Direct Stream
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTracker;
