import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { District, RoomLocation, PRESET_DISTRICTS } from '../types.js';
import { useGeolocation, GpsCoordinates } from '../hooks/useGeolocation.js';

interface DistrictSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDistrictId?: string;
  onSelectDistrict: (districtId: string) => void;
  onSelectGpsCoords: (coords: GpsCoordinates) => void;
  onSelectLocation?: (location: RoomLocation) => void;
  initialDistricts?: District[];
}

export const DistrictSelector: React.FC<DistrictSelectorProps> = ({
  isOpen,
  onClose,
  selectedDistrictId,
  onSelectDistrict,
  onSelectGpsCoords,
  onSelectLocation,
  initialDistricts = PRESET_DISTRICTS,
}) => {
  const [districts, setDistricts] = useState<District[]>(initialDistricts);
  const { requestGps, isLoading: isGpsLoading, geoError, clearError } = useGeolocation();

  // Optionally fetch fresh districts from backend REST endpoint
  useEffect(() => {
    let isMounted = true;
    fetch('/api/districts')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load districts');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.districts && Array.isArray(data.districts) && data.districts.length > 0) {
          setDistricts(data.districts);
        }
      })
      .catch(() => {
        // Silently keep PRESET_DISTRICTS on fetch failure
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isOpen) return null;

  const handleGpsClick = () => {
    clearError();
    requestGps(async (resolvedCoords) => {
      onSelectGpsCoords(resolvedCoords);
      // Fetch resolved district and friendly label from server
      try {
        const res = await fetch(`/api/locations/resolve?lat=${resolvedCoords.lat}&lng=${resolvedCoords.lng}`);
        if (res.ok) {
          const data = await res.json();
          if (data.location && onSelectLocation) {
            onSelectLocation(data.location);
          }
        }
      } catch (err) {
        console.error('Failed to resolve GPS location details:', err);
      }
      onClose();
    });
  };

  const handleDistrictClick = (districtId: string) => {
    onSelectDistrict(districtId);
    const targetDistrict = districts.find((d) => d.id === districtId);
    if (targetDistrict && onSelectLocation) {
      onSelectLocation({
        districtId: targetDistrict.id,
        label: targetDistrict.name,
        coords: targetDistrict.center,
        isGps: false,
      });
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="district-selector-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Card */}
      <div className="relative w-full max-w-md bg-[#FBF9F5] rounded-t-3xl sm:rounded-2xl border border-[#E7E2D9] p-6 shadow-xs space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FDF2F0] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#D9381E]" />
            </div>
            <div>
              <h3 id="district-selector-title" className="font-display font-bold text-lg text-[#1C1917] leading-none">
                Bölge / Semt Seç
              </h3>
              <p className="text-[11px] text-[#78716C] mt-0.5">Ortak yemek destinasyonunuzu belirleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Quick Action Button */}
        <div>
          <button
            type="button"
            onClick={handleGpsClick}
            disabled={isGpsLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:border-[#D9381E] text-[#1C1917] font-semibold text-sm transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            {isGpsLoading ? (
              <Loader2 className="w-4 h-4 text-[#D9381E] animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-[#D9381E]" />
            )}
            <span>{isGpsLoading ? 'Konum Alınıyor (maks 8s)...' : 'Mevcut Konumumu Kullan (GPS)'}</span>
          </button>

          {/* GPS Error Callout */}
          {geoError && (
            <div className="mt-2 p-3 rounded-lg bg-[#FFF3E0] border border-[#FFE0B2] text-[#E65100] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E65100]" />
              <div className="flex-1">
                <p className="font-semibold">{geoError}</p>
                <p className="text-[11px] text-[#B26A00] mt-0.5">
                  Aşağıdaki popüler semtlerden birini seçerek hemen devam edebilirsiniz.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Preset Districts List */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] px-1">
            Popüler Yeme-İçme Semtleri
          </p>

          <div className="space-y-2">
            {districts.map((d) => {
              const isSelected = selectedDistrictId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDistrictClick(d.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#FDF2F0] border-[#D9381E] shadow-2xs'
                      : 'bg-white border-[#E7E2D9] hover:bg-[#FAF7F2] hover:border-[#D0C9BD]'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-bold text-sm ${isSelected ? 'text-[#D9381E]' : 'text-[#1C1917]'}`}>
                        {d.name}
                      </p>
                      {isSelected && (
                        <span className="text-[10px] font-semibold bg-[#D9381E] text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#78716C] truncate mt-0.5">
                      {d.city}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-[#D9381E] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-[#E7E2D9] flex items-center justify-center group-hover:border-[#78716C]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-[#78716C]">
            Seçtiğiniz semtteki 15 popüler mekan her iki tarafın telefonunda anında güncellenir.
          </p>
        </div>
      </div>
    </div>
  );
};
