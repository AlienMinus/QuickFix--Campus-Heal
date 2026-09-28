import React, { useEffect, useState } from 'react';
import './LiveMap.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
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
      map.flyTo(center, 17, { animate: true, duration: 1 });
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
  height = '100%',
}) => {
  const { position } = useLocation();
  const navigate = useNavigate();

  const [staffLocations, setStaffLocations] = useState([]);
  const [mapCenter, setMapCenter] = useState(() => {
    if (position?.latitude && position?.longitude) {
      return [position.latitude, position.longitude];
    }
    return [20.2195, 85.7360];
  });

  // Automatically center on user's current GPS location as soon as available
  useEffect(() => {
    if (position?.latitude && position?.longitude) {
      setMapCenter([position.latitude, position.longitude]);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.warn('Browser GPS lookup:', err.message),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [position?.latitude, position?.longitude]);

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
        setStaffLocations([]);
      }
    };

    fetchStaff();
    const staffInterval = setInterval(fetchStaff, 8000);
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

  const centerOnUser = () => {
    if (position?.latitude && position?.longitude) {
      setMapCenter([position.latitude, position.longitude]);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  };

  const userLat = position?.latitude || mapCenter[0];
  const userLng = position?.longitude || mapCenter[1];

  return (
    <div className="embedded-live-map-wrapper" style={{ height }}>
      {/* Floating Recenter Button to quickly snap to user's location */}
      <button
        className="recenter-btn-floating"
        onClick={centerOnUser}
        title="Snap map to my live location"
      >
        <FaCrosshairs />
      </button>

      <MapContainer
        center={[userLat, userLng]}
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

        {/* Current User Live Location Marker */}
        {position?.latitude && position?.longitude && (
          <Marker
            position={[position.latitude, position.longitude]}
            icon={userLiveIcon}
          >
            <Popup>
              <div className="map-popup-card user-popup">
                <strong>📍 Your Current Location</strong>
                <p>Telemetry actively synchronized</p>
                <small>Accuracy: ±{Math.round(position.accuracy || 5)}m</small>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Active Staff Patrol Markers */}
        {staffLocations.map((staff) => (
          <Marker
            key={staff._id || staff.userId}
            position={[staff.latitude, staff.longitude]}
            icon={staffLiveIcon}
          >
            <Popup>
              <div className="map-popup-card">
                <strong>👷 {staff.userName || staff.name || 'Maintenance Staff'}</strong>
                <p>Facilities Staff on Patrol</p>
                <small>Zone: {staff.campusZone || 'Campus Facilities'}</small>
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

        {/* Issue Pins */}
        {issues.map((issue) => {
          const lat = issue.location?.latitude || (issue.location && typeof issue.location[1] === 'number' ? issue.location[1] : 20.2195);
          const lng = issue.location?.longitude || (issue.location && typeof issue.location[0] === 'number' ? issue.location[0] : 85.7360);
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
                    <FaMapMarkerAlt /> {issue.location?.building || issue.locationName || 'Campus'} {issue.location?.room ? `(${issue.location.room})` : ''}
                  </p>
                  <button
                    className="popup-view-btn"
                    onClick={() => navigate(`/issues/${issue._id}`)}
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
