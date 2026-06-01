import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCoordinates = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser';
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setError(null);

      const options = {
        enableHighAccuracy: true, // Forces GPS rather than IP triangulation
        timeout: 12000,           // 12 second timeout limit
        maximumAge: 0             // Do not use cached locations
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy // GPS accuracy in meters
          };
          setCoordinates(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let errorMsg = 'Failed to retrieve your physical location';
          if (err.code === 1) {
            errorMsg = 'Location access denied. Please enable GPS permissions for this browser tab.';
          } else if (err.code === 2) {
            errorMsg = 'Location unavailable. Ensure your GPS is enabled and has signal.';
          } else if (err.code === 3) {
            errorMsg = 'Location request timed out. Please try again.';
          }
          setError(errorMsg);
          setLoading(false);
          reject(new Error(errorMsg));
        },
        options
      );
    });
  }, []);

  return {
    coordinates,
    error,
    loading,
    getCoordinates
  };
};
