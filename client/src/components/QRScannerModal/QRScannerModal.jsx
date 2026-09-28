import React, { useState } from 'react';
import './QRScannerModal.css';
import { FaQrcode, FaTimes, FaCamera } from 'react-icons/fa';

const CAMPUS_QR_PRESETS = [
  {
    tag: 'GIFT-MAB-F2-R204',
    building: 'Main Academic Block (MAB)',
    room: 'Room 204 (Lecture Hall)',
    lat: 20.2195,
    lng: 85.7360,
  },
  {
    tag: 'GIFT-LIB-GF-READ',
    building: 'Central Library Walkway',
    room: 'Ground Floor Reading Hall',
    lat: 20.2193,
    lng: 85.7358,
  },
  {
    tag: 'GIFT-LABS-F1-LAB04',
    building: 'Engineering & Computing Labs',
    room: 'Lab 4 (Cloud & Systems)',
    lat: 20.2198,
    lng: 85.7366,
  },
  {
    tag: 'GIFT-CAFE-OUT-01',
    building: 'Cafeteria & Food Court',
    room: 'Outdoor Dining Deck',
    lat: 20.2190,
    lng: 85.7368,
  },
  {
    tag: 'GIFT-HOSTEL-B-F1',
    building: 'Boys Hostel Complex',
    room: 'Block B - 1st Floor Corridor',
    lat: 20.2188,
    lng: 85.7350,
  },
];

const QRScannerModal = ({ isOpen, onClose, onScanComplete }) => {
  const [selectedTag, setSelectedTag] = useState(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset) => {
    setSelectedTag(preset.tag);
    setTimeout(() => {
      onScanComplete(preset);
      onClose();
    }, 400);
  };

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div className="qr-modal-title">
            <FaQrcode /> QR Location Scanner
          </div>
          <button className="qr-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="scanner-viewfinder">
          <div className="camera-feed-sim">
            <div className="scanner-crosshair-box">
              <div className="scanner-laser-line" />
            </div>
            <div className="scanner-overlay-text">
              <FaCamera /> Point device at Campus Door or Desk QR Code
            </div>
          </div>
        </div>

        <div className="qr-presets-section">
          <div className="presets-title">Tap a Campus QR Code Tag to Auto-Fill:</div>
          <div className="presets-list">
            {CAMPUS_QR_PRESETS.map((preset) => (
              <button
                key={preset.tag}
                className={`preset-qr-chip ${selectedTag === preset.tag ? 'selected' : ''}`}
                onClick={() => handleSelectPreset(preset)}
              >
                <FaQrcode className="chip-icon" />
                <div className="chip-details">
                  <span className="chip-tag">{preset.tag}</span>
                  <span className="chip-loc">{preset.building} • {preset.room}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
