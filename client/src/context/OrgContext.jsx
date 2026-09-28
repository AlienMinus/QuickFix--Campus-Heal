import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI, instituteAPI } from '../services/api';

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

const DEFAULT_GLOBAL_CONFIG = {
  name: 'Smart Campus QuickFix',
  subtitle: 'Civic & Facility Operations',
  tagline: 'Rapid Resolution Platform',
  zones: DEFAULT_ZONES,
};

export const OrgProvider = ({ children }) => {
  // 1. Global Header State (Operated exclusively by Super Admin)
  const [globalHeader, setGlobalHeader] = useState(() => {
    try {
      const saved = localStorage.getItem('quickfix_global_header');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved global header:', e);
    }
    return {
      name: DEFAULT_GLOBAL_CONFIG.name,
      subtitle: DEFAULT_GLOBAL_CONFIG.subtitle,
      tagline: DEFAULT_GLOBAL_CONFIG.tagline,
    };
  });

  // 2. Institute Header State (Operated by Normal Admin for their own institute members)
  const [instituteHeader, setInstituteHeader] = useState({
    name: '',
    subtitle: '',
    tagline: '',
  });

  // 3. Registered Zones
  const [zones, setZones] = useState(() => {
    try {
      const saved = localStorage.getItem('quickfix_org_zones');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved zones:', e);
    }
    return DEFAULT_ZONES;
  });

  // Fetch Global Header from backend on mount
  useEffect(() => {
    settingsAPI
      .getGlobalHeader()
      .then((res) => {
        if (res.data?.headerConfig) {
          setGlobalHeader(res.data.headerConfig);
          try {
            localStorage.setItem('quickfix_global_header', JSON.stringify(res.data.headerConfig));
          } catch (e) {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch global header from server, using cached/default:', err);
      });
  }, []);

  // Sync zones to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('quickfix_org_zones', JSON.stringify(zones));
    } catch (e) {
      // ignore
    }
  }, [zones]);

  // Fetch an institute's header config (for members of that institute)
  const fetchInstituteHeader = useCallback(async (instituteName) => {
    if (!instituteName) return;
    try {
      const res = await instituteAPI.getBranchesForInstitute(instituteName);
      if (res.data?.headerConfig) {
        setInstituteHeader({
          name: res.data.headerConfig.name || instituteName,
          subtitle: res.data.headerConfig.subtitle || '',
          tagline: res.data.headerConfig.tagline || '',
        });
      } else {
        setInstituteHeader({
          name: instituteName,
          subtitle: '',
          tagline: '',
        });
      }
    } catch (err) {
      setInstituteHeader({
        name: instituteName,
        subtitle: '',
        tagline: '',
      });
    }
  }, []);

  // Update Global Header (SUPER ADMIN ONLY)
  const updateGlobalHeader = async (newConfig) => {
    const res = await settingsAPI.updateGlobalHeader(newConfig);
    if (res.data?.headerConfig) {
      setGlobalHeader(res.data.headerConfig);
      try {
        localStorage.setItem('quickfix_global_header', JSON.stringify(res.data.headerConfig));
      } catch (e) {}
    }
    return res.data;
  };

  // Update Institute Header (NORMAL ADMIN FOR THEIR OWN INSTITUTE)
  const updateInstituteHeader = async (newConfig) => {
    const res = await instituteAPI.updateMyInstituteHeader(newConfig);
    if (res.data?.headerConfig) {
      setInstituteHeader(res.data.headerConfig);
    }
    return res.data;
  };

  // Zone management
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
    setZones((prev) => [newZone, ...prev]);
    return newZone;
  };

  const updateZone = (id, updatedData) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...updatedData } : z)));
  };

  const deleteZone = (id) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  // Backward compatible orgConfig object
  const orgConfig = {
    name: globalHeader.name || DEFAULT_GLOBAL_CONFIG.name,
    subtitle: globalHeader.subtitle || DEFAULT_GLOBAL_CONFIG.subtitle,
    tagline: globalHeader.tagline || DEFAULT_GLOBAL_CONFIG.tagline,
    zones,
  };

  return (
    <OrgContext.Provider
      value={{
        orgConfig,
        globalHeader,
        instituteHeader,
        fetchInstituteHeader,
        updateGlobalHeader,
        updateInstituteHeader,
        zones,
        addZone,
        updateZone,
        deleteZone,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);
export default OrgContext;
