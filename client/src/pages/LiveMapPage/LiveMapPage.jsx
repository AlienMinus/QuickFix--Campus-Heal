import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI, locationAPI } from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';
import { useOrg } from '../../context/OrgContext';
import LiveMap from '../../components/LiveMap/LiveMap';
import {
  FaPlus,
  FaUsers,
  FaExclamationCircle,
  FaSatellite,
  FaSyncAlt,
} from 'react-icons/fa';
import './LiveMapPage.css';

export default function LiveMapPage() {
  const navigate = useNavigate();
  const { location } = useLocationContext();
  const { orgConfig } = useOrg();

  const [issues, setIssues] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, staffRes] = await Promise.allSettled([
        issueAPI.getAll({ status: 'Submitted,In Progress,Assigned,Under Review' }),
        locationAPI.getActiveStaff(),
      ]);

      if (issuesRes.status === 'fulfilled') {
        setIssues(issuesRes.value.data.issues || []);
      }
      if (staffRes.status === 'fulfilled') {
        setActiveStaff(staffRes.value.data.activeStaff || []);
      }
    } catch (err) {
      console.error('Map data sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-map-page-container">
      {/* Sleek Map HUD Overlay (No category filters) */}
      <div className="map-hud-overlay">
        <div className="hud-title-row">
          <div className="hud-title-badge">
            <FaSatellite className="satellite-icon pulsing" />
            <span>{orgConfig.name} Live Map</span>
          </div>

          <div className="hud-metrics">
            <span className="metric-pill staff">
              <FaUsers /> {activeStaff.length} Staff
            </span>
            <span className="metric-pill issues">
              <FaExclamationCircle /> {issues.length} Active Pins
            </span>
            <button
              className="hud-refresh-btn"
              onClick={fetchData}
              title="Sync map pins"
            >
              <FaSyncAlt className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Live Leaflet Map centered on Current User Location */}
      <div className="map-wrapper-card">
        <LiveMap
          issues={issues}
          activeStaff={activeStaff}
          userLocation={location}
          onSelectIssue={(issue) => setSelectedIssue(issue)}
        />
      </div>

      {/* Floating Action Button to File Issue */}
      <button
        className="fab-report-issue"
        onClick={() => navigate('/report')}
        title="Report issue at current location"
      >
        <FaPlus />
        <span className="fab-text">Report Here</span>
      </button>

      {/* Selected Issue Preview Drawer */}
      {selectedIssue && (
        <div className="issue-preview-drawer">
          <div className="drawer-header">
            <div className="drawer-title-group">
              <span className="drawer-cat-badge">{selectedIssue.category}</span>
              <h4>{selectedIssue.title}</h4>
            </div>
            <button
              className="drawer-close-btn"
              onClick={() => setSelectedIssue(null)}
            >
              ×
            </button>
          </div>

          <p className="drawer-location">
            📍 {selectedIssue.locationName} • {selectedIssue.zone}
          </p>

          <div className="drawer-actions">
            <button
              className="drawer-view-btn"
              onClick={() => navigate(`/issues/${selectedIssue._id}`)}
            >
              Open Full Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
