import React from 'react';
import './DeviceFrameToggle.css';
import { FaMobileAlt, FaDesktop } from 'react-icons/fa';

const DeviceFrameToggle = ({ isFrameMode, onToggle }) => {
  return (
    <div className="device-frame-toggle-bar">
      <div className="mode-toggle-pill">
        <button
          className={`toggle-option ${isFrameMode ? 'active' : ''}`}
          onClick={() => onToggle(true)}
          title="Display inside Smartphone Shell"
        >
          <FaMobileAlt /> Mobile Prototype
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
