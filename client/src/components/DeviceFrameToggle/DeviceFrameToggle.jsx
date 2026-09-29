import React from 'react';
import './DeviceFrameToggle.css';
import { FaMobileAlt, FaDesktop } from 'react-icons/fa';

const DeviceFrameToggle = ({ isFrameMode, onToggle, scale }) => {
  const scalePercent = scale ? Math.round(scale * 100) : 100;

  return (
    <div className="device-frame-toggle-bar">
      <div className="mode-toggle-pill">
        <button
          className={`toggle-option ${isFrameMode ? 'active' : ''}`}
          onClick={() => onToggle(true)}
          title="Display inside Smartphone Shell"
        >
          <FaMobileAlt /> Mobile Prototype
          {isFrameMode && scalePercent < 100 && (
            <span className="scale-indicator-badge">{scalePercent}%</span>
          )}
        </button>
        <button
          className={`toggle-option ${!isFrameMode ? 'active' : ''}`}
          onClick={() => onToggle(false)}
          title="Display Fullscreen Responsive"
        >
          <FaDesktop /> Fullscreen Web
        </button>
      </div>
    </div>
  );
};

export default DeviceFrameToggle;
