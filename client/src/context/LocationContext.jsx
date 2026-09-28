import React, { createContext, useContext, useState, useEffect } from 'react';
import locationLogger from '../services/locationLogger';
import { useAuth } from './AuthContext';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [locationState, setLocationState] = useState(locationLogger.getState());

  useEffect(() => {
    const unsubscribe = locationLogger.subscribe((newState) => {
      setLocationState(newState);
    });

    locationLogger.startLogging(user);

    return () => {
      unsubscribe();
      locationLogger.stopLogging();
    };
  }, [user]);

  const toggleTracking = () => {
    if (locationState.isTracking) {
      locationLogger.stopLogging();
    } else {
      locationLogger.startLogging(user);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        ...locationState,
        toggleTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
export const useLocationContext = () => useContext(LocationContext);
export default LocationContext;
