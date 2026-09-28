import React, { useEffect, useState } from 'react';
import './LiveMap.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { useLocation } from '../../context/LocationContext';
import { useNavigate } from 'react-router-dom';
import SeverityBadge from '../SeverityBadge/SeverityBadge';
import {
  FaMapMarkerAlt,
  FaCrosshairs,
} from 'react-icons/fa';
import api from '../../services/api';

const GIFT_COORDS = [20.2195, 85.7360];

const createCustomIcon = (color, symbol) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="marker-pin-outer" style="background-color: ${color};">
        <span class="marker-symbol">${symbol}</span>
      </div>
      <div class="marker-pulse" style="border-color: ${color};"></div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -36],
  });
};

const userLiveIcon = L.divIcon({
  className: 'live-user-marker',
  html: `
    <div class="user-radar-ring"></div>
    <div class="user-live-center"></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const staffLiveIcon = L.divIcon({
  className: 'staff-live-marker',
  html: `
    <div class="staff-pin">
      <span>👷</span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1 });
    }
  }, [center, map]);
  return null;
};

const LocationSelector = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    },
  });
  return null;
};

const LiveMap = ({
  issues = [],
  selectable = false,
  selectedLocation = null,
  onLocationSelect = null,
  height = '480px',
  showFilters = true,
}) => {
  const { position } = useLocation();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('All');
  const [staffLocations, setStaffLocations] = useState([]);
  const [mapCenter, setMapCenter] = useState(GIFT_COORDS);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/location/latest');
        if (res.data && res.data.locations) {
          const staff = res.data.locations.filter(
            (loc) => loc.userRole === 'staff' || loc.userRole === 'admin'
          );
          setStaffLocations(staff);
        }
      } catch (err) {
        setStaffLocations([
          {
            _id: 'demo-staff-pos',
            userName: 'Bikash Mohapatra (Staff Patrol)',
            latitude: 20.2198,
            longitude: 85.7364,
            campusZone: 'Main Academic Walkway',
          },
        ]);
      }
    };

    fetchStaff();
    const staffInterval = setInterval(fetchStaff, 5000);
    return () => clearInterval(staffInterval);
  }, []);

  const getMarkerColor = (severity, status) => {
    if (status === 'Resolved') return '#10b981';
    switch (severity?.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'low': return '#06b6d4';
      case 'medium':
      default: return '#3b82f6';
    }
  };

  const filteredIssues = issues.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Critical') return item.severity === 'Critical';
    if (activeFilter === 'In Progress') return item.status === 'In Progress';
    if (activeFilter === 'Resolved') return item.status === 'Resolved';
    if (activeFilter === 'Submitted') return item.status === 'Submitted';
    return true;
  });

  const centerOnUser = () => {
    if (position.latitude && position.longitude) {
      setMapCenter([position.latitude, position.longitude]);
    }
  };

  return (
    <div className="embedded-live-map-wrapper" style={{ height }}>
      {showFilters && (
        <div className="map-controls-overlay">
          <div className="filter-chips">
            {['All', 'Critical', 'Submitted', 'In Progress', 'Resolved'].map((filter) => (
              <button
                key={filter}
                className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            className="recenter-btn"
            onClick={centerOnUser}
            title="Recenter map to my 1s GPS location"
          >
            <FaCrosshairs />
          </button>
        </div>
      )}

      <MapContainer
        center={GIFT_COORDS}
        zoom={17}
        scrollWheelZoom={true}
        className="leaflet-map-element"
      >
        <MapController center={mapCenter} />
        {selectable && <LocationSelector onSelect={onLocationSelect} />}

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={GIFT_COORDS}
          radius={220}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: '6 6',
          }}
        />

        {position.latitude && position.longitude && (
          <Marker
            position={[position.latitude, position.longitude]}
            icon={userLiveIcon}
          >
            <Popup>
              <div className="map-popup-card user-popup">
                <strong>📍 You are here (Live 1s GPS)</strong>
                <p>Telemetry syncing directly to MongoDB Atlas</p>
                <small>Accuracy: ±{position.accuracy || 5}m | Speed: {position.speed || 0} m/s</small>
              </div>
            </Popup>
          </Marker>
        )}

        {staffLocations.map((staff) => (
          <Marker
            key={staff._id}
            position={[staff.latitude, staff.longitude]}
            icon={staffLiveIcon}
          >
            <Popup>
              <div className="map-popup-card">
                <strong>👷 {staff.userName}</strong>
                <p>Campus Facilities Staff on Patrol</p>
                <small>Zone: {staff.campusZone || 'GIFT Campus'}</small>
              </div>
            </Popup>
          </Marker>
        ))}

        {selectable && selectedLocation && selectedLocation.latitude && (
          <Marker
            position={[selectedLocation.latitude, selectedLocation.longitude]}
            icon={createCustomIcon('#10b981', '📍')}
          >
            <Popup>
              <div className="map-popup-card">
                <strong>Selected Issue Location</strong>
                <p>Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {filteredIssues.map((issue) => {
          const lat = issue.location?.latitude || GIFT_COORDS[0];
          const lng = issue.location?.longitude || GIFT_COORDS[1];
          const color = getMarkerColor(issue.severity, issue.status);
          const symbol = issue.status === 'Resolved' ? '✓' : '!';

          return (
            <Marker
              key={issue._id}
              position={[lat, lng]}
              icon={createCustomIcon(color, symbol)}
            >
              <Popup>
                <div className="map-popup-card">
                  {issue.media?.url && (
                    <img
                      src={issue.media.url}
                      alt={issue.title}
                      className="popup-thumb"
                    />
                  )}
                  <div className="popup-header">
                    <SeverityBadge severity={issue.severity} size="small" />
                    <span className={`popup-status ${issue.status.toLowerCase().replace(' ', '-')}`}>
                      {issue.status}
                    </span>
                  </div>
                  <h4 className="popup-title">{issue.title}</h4>
                  <p className="popup-category">{issue.category}</p>
                  <p className="popup-loc">
                    <FaMapMarkerAlt /> {issue.location?.building} {issue.location?.room ? `(${issue.location.room})` : ''}
                  </p>
                  <button
                    className="popup-view-btn"
                    onClick={() => navigate(`/issue/${issue._id}`)}
                  >
                    View Issue Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
