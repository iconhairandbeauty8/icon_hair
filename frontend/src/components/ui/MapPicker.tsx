import { useEffect, useRef, useState, useCallback } from 'react';

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  lat: string | number;
  lng: string | number;
  onChange: (lat: number, lng: number, address?: string) => void;
  label?: string;
}

// Default center: Auckland, NZ
const DEFAULT_CENTER: LatLng = { lat: -36.8485, lng: 174.7633 };
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
    _googleMapsLoading: boolean;
    _googleMapsLoaded: boolean;
    _googleMapsCallbacks: (() => void)[];
  }
}

function loadGoogleMaps(callback: () => void) {
  if (window._googleMapsLoaded) { callback(); return; }
  if (!window._googleMapsCallbacks) window._googleMapsCallbacks = [];
  window._googleMapsCallbacks.push(callback);
  if (window._googleMapsLoading) return;

  window._googleMapsLoading = true;
  window.initGoogleMaps = () => {
    window._googleMapsLoaded = true;
    window._googleMapsLoading = false;
    window._googleMapsCallbacks.forEach(cb => cb());
    window._googleMapsCallbacks = [];
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initGoogleMaps`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export default function MapPicker({ lat, lng, onChange, label = 'Location' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<LatLng>({
    lat: lat ? Number(lat) : DEFAULT_CENTER.lat,
    lng: lng ? Number(lng) : DEFAULT_CENTER.lng,
  });

  // Update coords when props change (edit mode)
  useEffect(() => {
    if (lat && lng) {
      setCoords({ lat: Number(lat), lng: Number(lng) });
    }
  }, [lat, lng]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;

    const center = coords.lat && coords.lng ? coords : DEFAULT_CENTER;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: coords.lat && coords.lng ? 15 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });
    mapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      position: center,
      map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#C9A96E',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });
    markerRef.current = marker;

    // Drag end
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      const newLat = parseFloat(pos.lat().toFixed(7));
      const newLng = parseFloat(pos.lng().toFixed(7));
      setCoords({ lat: newLat, lng: newLng });
      onChange(newLat, newLng);
      reverseGeocode(newLat, newLng);
    });

    // Click on map
    map.addListener('click', (e: any) => {
      const newLat = parseFloat(e.latLng.lat().toFixed(7));
      const newLng = parseFloat(e.latLng.lng().toFixed(7));
      marker.setPosition(e.latLng);
      setCoords({ lat: newLat, lng: newLng });
      onChange(newLat, newLng);
      reverseGeocode(newLat, newLng);
    });

    // Places Autocomplete
    if (searchRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchRef.current, {
        componentRestrictions: { country: 'nz' },
        fields: ['geometry', 'formatted_address', 'name'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;
        const newLat = parseFloat(place.geometry.location.lat().toFixed(7));
        const newLng = parseFloat(place.geometry.location.lng().toFixed(7));
        map.setCenter({ lat: newLat, lng: newLng });
        map.setZoom(16);
        marker.setPosition({ lat: newLat, lng: newLng });
        setCoords({ lat: newLat, lng: newLng });
        onChange(newLat, newLng, place.formatted_address);
      });
    }

    setReady(true);
  }, []);

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
      if (status === 'OK' && results[0]) {
        onChange(lat, lng, results[0].formatted_address);
        if (searchRef.current) searchRef.current.value = results[0].formatted_address;
      }
    });
  };

  useEffect(() => {
    loadGoogleMaps(() => {
      initMap();
    });
  }, [initMap]);

  // Update marker if coords change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && coords.lat && coords.lng) {
      const pos = { lat: coords.lat, lng: coords.lng };
      markerRef.current.setPosition(pos);
      mapInstanceRef.current.panTo(pos);
    }
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-onyx-600">{label}</label>

      {/* Search box */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx-400 text-sm">🔍</span>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search for an address in New Zealand..."
          className="input-luxury text-sm py-2 pl-9 w-full"
        />
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 280 }}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Loading state */}
        {!ready && (
          <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-onyx-400">Loading map...</p>
          </div>
        )}

        {/* Instruction overlay */}
        {ready && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-onyx-600 shadow-sm pointer-events-none">
            📍 Click map or drag pin to set location
          </div>
        )}
      </div>

      {/* Coordinate display */}
      {coords.lat && coords.lng ? (
        <div className="flex gap-3">
          <div className="flex-1 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2">
            <p className="text-xs text-onyx-400 mb-0.5">Latitude</p>
            <p className="text-sm font-mono font-medium text-onyx-700">{coords.lat}</p>
          </div>
          <div className="flex-1 bg-gold-50 border border-gold-200 rounded-lg px-3 py-2">
            <p className="text-xs text-onyx-400 mb-0.5">Longitude</p>
            <p className="text-sm font-mono font-medium text-onyx-700">{coords.lng}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-onyx-400 text-center py-1">No location selected — click the map to pin a location</p>
      )}
    </div>
  );
}
