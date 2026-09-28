import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueAPI, locationAPI } from '../../services/api';
import { useLocationContext } from '../../context/LocationContext';
import LiveMap from '../../components/LiveMap/LiveMap';
import {
  FaMapMarkedAlt,
  FaPlus,
  FaUsers,
  FaExclamationCircle,
  FaSatellite,
  FaSyncAlt,
  FaFilter
} from 'react-icons/fa';
import './LiveMapPage.css';

const CATEGORIES = [
  'All',
  'Electrical',
  'Plumbing',
  'Infrastructure',
  'Sanitation',
  'IT/Network',
  'Safety/Security'
];

export default function LiveMapPage() {
  const navigate = useNavigate();
  const { location, isTracking } = useLocationContext();
  
  const [issues, setIssues] = useState([]);
  const [activeStaff, setActiveStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, staffRes] = await Promise.allSettled([
        issueAPI.getAll({ status: 'Submitted,In Progress,Assigned,Under Review' }),
        locationAPI.getActiveStaff()
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
    // Poll staff patrol and ticket pins every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredIssues = categoryFilter === 'All'
    ? issues
    : issues.filter(i => i.category === categoryFilter);

  return (
    <div className="live-map-page-container">
      {/* Top Map HUD Overlay */}
      <div className="map-hud-overlay">
        <div className="hud-title-row">
          <div className="hud-title-badge">
            <FaSatellite className="satellite-icon pulsing" />
            <span>Campus Live Radar (GIFT BPUT)</span>
          </div>

          <div className="hud-metrics">
            <span className="metric-pill staff">
              <FaUsers /> {activeStaff.length} Staff On-Patrol
            </span>
            <span className="metric-pill issues">
              <FaExclamationCircle /> {filteredIssues.length} Active Pins
            </span>
            <button
              className="hud-refresh-btn"
              onClick={fetchData}
              title="Sync radar data"
            >
              <FaSyncAlt className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="map-category-chips">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-chip ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Embedded Live Leaflet Map */}
      <div className="map-wrapper-card">
        <LiveMap
          issues={filteredIssues}
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

      {/* Selected Issue Preview Drawer / Card */}
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
