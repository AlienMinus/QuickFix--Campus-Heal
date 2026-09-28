import React, { createContext, useContext, useState, useEffect } from 'react';

const OrgContext = createContext();

const DEFAULT_ZONES = [
  {
    id: 'zone-1',
    name: 'Main Academic Block (MAB)',
    building: 'Academic Block A',
    room: 'Room 204 (Lecture Hall)',
    category: 'Electrical & Lighting',
    recommendation: 'Inspect electrical fixtures, switchboards, and air conditioning.',
    lat: 20.2195,
    lng: 85.7360,
  },
  {
    id: 'zone-2',
    name: 'Central Library Walkway',
    building: 'Central Library',
    room: 'Ground Floor Reading Hall',
    category: 'Cleanliness & Sanitation',
    recommendation: 'Check sanitation, garbage bins, and quiet study equipment.',
    lat: 20.2193,
    lng: 85.7358,
  },
  {
    id: 'zone-3',
    name: 'Engineering & Computing Labs',
    building: 'Tech Block B',
    room: 'Lab 4 (Cloud & Systems)',
    category: 'Network & Wi-Fi',
    recommendation: 'Verify LAN connections, power sockets, and projector display.',
    lat: 20.2198,
    lng: 85.7366,
  },
  {
    id: 'zone-4',
    name: 'Cafeteria & Food Court',
    building: 'Student Amenity Complex',
    room: 'Dining Hall & Outdoor Deck',
    category: 'Water Leakage & Plumbing',
    recommendation: 'Inspect water dispensers, sink drainage, and dining furniture.',
    lat: 20.2190,
    lng: 85.7368,
  },
  {
    id: 'zone-5',
    name: 'Hostel Complex Block A',
    building: 'Student Residence 1',
    room: 'Corridor & Washrooms',
    category: 'Damaged Infrastructure',
    recommendation: 'Report door locks, plumbing issues, or lighting problems.',
    lat: 20.2188,
    lng: 85.7350,
  },
  {
    id: 'zone-6',
    name: 'Campus Main Gate & Security Post',
    building: 'Security Command Center',
    room: 'Visitor Entrance & Boom Barrier',
    category: 'Safety & Security Hazard',
    recommendation: 'Report safety hazards, perimeter lighting, or barrier issues.',
    lat: 20.2182,
    lng: 85.7372,
  },
];

const DEFAULT_CONFIG = {
  name: 'Smart Campus QuickFix',
  subtitle: 'Civic & Facility Operations',
  tagline: 'Rapid Resolution Platform',
  zones: DEFAULT_ZONES,
};

export const OrgProvider = ({ children }) => {
  const [orgConfig, setOrgConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('quickfix_org_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved org config:', e);
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('quickfix_org_config', JSON.stringify(orgConfig));
      document.title = `${orgConfig.name} | ${orgConfig.subtitle}`;
    } catch (e) {
      console.error('Error saving org config:', e);
    }
  }, [orgConfig]);

  const updateOrgInfo = (name, subtitle, tagline) => {
    setOrgConfig((prev) => ({
      ...prev,
      name: name || prev.name,
      subtitle: subtitle || prev.subtitle,
      tagline: tagline || prev.tagline,
    }));
  };

  const addZone = (zone) => {
    const newZone = {
      id: `zone-${Date.now()}`,
      name: zone.name || 'New Campus Zone',
      building: zone.building || 'Main Facility',
      room: zone.room || '',
      category: zone.category || 'Electrical & Lighting',
      recommendation: zone.recommendation || 'Standard facility inspection.',
      lat: Number(zone.lat) || 20.2195,
      lng: Number(zone.lng) || 85.7360,
    };

    setOrgConfig((prev) => ({
      ...prev,
      zones: [newZone, ...prev.zones],
    }));
    return newZone;
  };

  const updateZone = (id, updatedData) => {
    setOrgConfig((prev) => ({
      ...prev,
      zones: prev.zones.map((z) => (z.id === id ? { ...z, ...updatedData } : z)),
    }));
  };

  const deleteZone = (id) => {
    setOrgConfig((prev) => ({
      ...prev,
      zones: prev.zones.filter((z) => z.id !== id),
    }));
  };

  return (
    <OrgContext.Provider
      value={{
        orgConfig,
        updateOrgInfo,
        addZone,
        updateZone,
        deleteZone,
        zones: orgConfig.zones || DEFAULT_ZONES,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);
export default OrgContext;
