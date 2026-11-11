import { useState, useCallback } from 'react';

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

export function useGeolocation(onLocationResolved?: (coords: GpsCoordinates) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [coords, setCoords] = useState<GpsCoordinates | null>(null);

  const requestGps = useCallback(
    (customCallback?: (coords: GpsCoordinates) => void) => {
      if (!navigator.geolocation) {
        setGeoError('Tarayıcınız konum servisini desteklemiyor. Lütfen listeden semt seçin.');
        return;
      }

      setIsLoading(true);
      setGeoError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoading(false);
          const resolved: GpsCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(resolved);

          if (customCallback) {
            customCallback(resolved);
          } else if (onLocationResolved) {
            onLocationResolved(resolved);
          }
        },
        (error) => {
          setIsLoading(false);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setGeoError('Konum izni verilmedi. Lütfen listeden semt seçin.');
              break;
            case error.POSITION_UNAVAILABLE:
              setGeoError('Konum bilgisine ulaşılamadı. Lütfen listeden semt seçin.');
              break;
            case error.TIMEOUT:
              setGeoError('Konum isteği zaman aşımına uğradı (8s). Lütfen listeden semt seçin.');
              break;
            default:
              setGeoError('Konum alınırken bir hata oluştu. Lütfen listeden semt seçin.');
              break;
          }
        },
        {
          enableHighAccuracy: true,  // Requests precise Wi-Fi/GPS triangulation instead of rough IP
          timeout: 8000,             // 8s timeout prevents hanging
          maximumAge: 30000,         // Cache location for up to 30 seconds
        }
      );
    },
    [onLocationResolved]
  );

  const clearError = useCallback(() => {
    setGeoError(null);
  }, []);

  return {
    requestGps,
    isLoading,
    geoError,
    coords,
    clearError,
  };
}
