import React, { useState, useEffect, useRef } from 'react';
import './QRScannerModal.css';
import jsQR from 'jsqr';
import { useOrg } from '../../context/OrgContext';
import {
  FaQrcode,
  FaTimes,
  FaCamera,
  FaUpload,
  FaCheckCircle,
  FaLightbulb,
  FaMapMarkerAlt,
  FaRedo,
} from 'react-icons/fa';

const QRScannerModal = ({ isOpen, onClose, onScanComplete }) => {
  const { zones } = useOrg();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'zones'

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setCameraError('');
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported on this browser/device.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera access warning:', err.message);
      setCameraError('Camera access unavailable. You can upload a QR image or pick a zone below.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Continuous frame analysis loop
  useEffect(() => {
    let animId = null;

    const tick = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        !scannedResult
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleDecodedPayload(code.data);
            return;
          }
        }
      }
      animId = requestAnimationFrame(tick);
    };

    if (isOpen && stream && !scannedResult) {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isOpen, stream, scannedResult]);

  const handleDecodedPayload = (rawData) => {
    try {
      if (navigator.vibrate) navigator.vibrate([70]);
    } catch {}

    let parsed = null;
    try {
      parsed = JSON.parse(rawData);
    } catch {
      // Check if rawData matches any existing zone name or tag
      const matched = zones.find(
        (z) => z.id === rawData || z.name.toLowerCase() === rawData.toLowerCase()
      );
      if (matched) {
        parsed = matched;
      } else {
        parsed = {
          location: rawData,
          zone: rawData,
          category: 'Electrical & Lighting',
          recommendation: 'Standard zone inspection.',
        };
      }
    }

    setScannedResult(parsed);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleDecodedPayload(code.data);
        } else {
          alert('No readable QR code found in this image. Please try another.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmScan = () => {
    if (scannedResult) {
      stopCamera();
      onScanComplete(scannedResult);
      onClose();
    }
  };

  const handleSelectZone = (zone) => {
    handleDecodedPayload(JSON.stringify(zone));
  };

  if (!isOpen) return null;

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div className="qr-modal-title">
            <FaQrcode /> QR Location & Zone Scanner
          </div>
          <button className="qr-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="qr-modal-tabs">
          <button
            className={`qr-tab ${activeTab === 'camera' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('camera');
              if (!stream) startCamera();
            }}
          >
            <FaCamera /> Live Camera
          </button>
          <button
            className={`qr-tab ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            <FaMapMarkerAlt /> Campus Zones ({zones.length})
          </button>
        </div>

        {scannedResult ? (
          /* Scanned Result / Recommendation Confirmation */
          <div className="scanned-result-view">
            <div className="result-success-icon">
              <FaCheckCircle />
            </div>
            <h3>QR Code Verified!</h3>

            <div className="result-card">
              <div className="result-row">
                <span className="res-k">Zone / Facility:</span>
                <span className="res-v bold">{scannedResult.name || scannedResult.zone || 'Campus Zone'}</span>
              </div>
              <div className="result-row">
                <span className="res-k">Location:</span>
                <span className="res-v">
                  {scannedResult.building ? `${scannedResult.building} • ` : ''}
                  {scannedResult.room || scannedResult.location || ''}
                </span>
              </div>
              <div className="result-row">
                <span className="res-k">Recommended Category:</span>
                <span className="res-v highlight-cat">
                  {scannedResult.category || 'General Maintenance'}
                </span>
              </div>

              {scannedResult.recommendation && (
                <div className="recommendation-box">
                  <FaLightbulb className="rec-icon" />
                  <div>
                    <strong>Admin Recommendation:</strong>
                    <p>{scannedResult.recommendation}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="result-actions">
              <button
                className="confirm-scan-btn"
                onClick={handleConfirmScan}
              >
                Auto-Fill Issue Report
              </button>
              <button
                className="rescan-btn"
                onClick={() => {
                  setScannedResult(null);
                  startCamera();
                }}
              >
                <FaRedo /> Scan Another
              </button>
            </div>
          </div>
        ) : activeTab === 'camera' ? (
          /* Large Camera Viewfinder */
          <div className="scanner-viewfinder-large">
            <div className="camera-feed-container">
              <video
                ref={videoRef}
                className="camera-video-stream"
                playsInline
                autoPlay
                muted
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Large Scanning Reticle */}
              <div className="scanner-target-reticle">
                <div className="scanner-laser-sweep" />
                <div className="reticle-corner top-left" />
                <div className="reticle-corner top-right" />
                <div className="reticle-corner bottom-left" />
                <div className="reticle-corner bottom-right" />
              </div>

              <div className="scanner-instruction-banner">
                <FaCamera /> Align QR Code within the square
              </div>
            </div>

            {cameraError && (
              <div className="camera-error-message">
                <span>{cameraError}</span>
              </div>
            )}

            <div className="scanner-bottom-actions">
              <button
                className="upload-qr-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaUpload /> Upload QR Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        ) : (
          /* Campus Zones Preset Picker */
          <div className="qr-zones-picker">
            <div className="zones-header-text">
              Select any registered campus zone to auto-fill location & recommendations:
            </div>
            <div className="zones-picker-list">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  className="zone-picker-card"
                  onClick={() => handleSelectZone(zone)}
                >
                  <div className="zone-picker-icon">
                    <FaQrcode />
                  </div>
                  <div className="zone-picker-info">
                    <span className="zone-title">{zone.name}</span>
                    <span className="zone-subtitle">
                      {zone.building} {zone.room ? `• ${zone.room}` : ''}
                    </span>
                    <span className="zone-cat-tag">Category: {zone.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScannerModal;
