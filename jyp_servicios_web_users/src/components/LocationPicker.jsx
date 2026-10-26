import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Check, Navigation, Target, Compass } from 'lucide-react';

const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 15);
  }, [coords, map]);
  return null;
};

/* Handler del mapa a nivel de módulo: antes se definía dentro del componente y
   React lo remontaba en cada render, perdiendo el listener de Leaflet. */
const MapClickHandler = ({ onClick }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7114/7114757.png', // Blue dot icon
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const LocationPicker = ({ onLocationSelect, initialLocation = { lat: -12.046374, lng: -77.042793 } }) => {
  const [position, setPosition] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const onSelectRef = useRef(onLocationSelect);

  /* Se guarda la callback en una ref para que el handler del mapa (definido fuera
     del componente) no se vuelva a registrar en cada render de Leaflet. */
  useEffect(() => {
    onSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (initialLocation && !address) {
      reverseGeocode(initialLocation.lat, initialLocation.lng);
    }
  }, [initialLocation?.lat, initialLocation?.lng]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        onSelectRef.current?.({ lat, lng, address: data.display_name });
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  };

  const handleMapClick = useCallback((lat, lng) => {
    setPosition({ lat, lng });
    reverseGeocode(lat, lng);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newPos = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setPosition(newPos);
        setAddress(data[0].display_name);
        onSelectRef.current?.({ ...newPos, address: data[0].display_name });
      }
    } catch (error) {
      console.error('Error in search:', error);
    } finally {
      setSearching(false);
    }
  };

  const detectLocation = () => {
    setDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocalización no soportada por tu navegador");
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);
        reverseGeocode(newPos.lat, newPos.lng);
        setDetecting(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("No se pudo obtener tu ubicación. Por favor, búscala manualmente.");
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Search & Detect Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder="Escribe tu dirección o distrito..." 
              className="w-full rounded-2xl py-3.5 pl-12 pr-4 text-sm placeholder-slate-500 outline-none transition-all shadow-inner jyp-form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="jyp-btn-ghost px-6 rounded-2xl text-xs font-black uppercase tracking-wider"
          >
            <span>{searching ? '...' : 'Buscar'}</span>
          </button>
        </form>
        
        <button 
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all shadow-lg shadow-cyan-500/10 cursor-pointer"
        >
          <span className="shrink-0 inline-flex items-center justify-center">
            <Target size={18} className={detecting ? 'animate-spin' : ''} />
          </span>
          <span>{detecting ? 'Detectando...' : 'Ubicación Real'}</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="h-[350px] rounded-[32px] overflow-hidden border border-white/10 relative shadow-2xl bg-[#080d17]">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler onClick={handleMapClick} />
          <Circle 
            center={position} 
            radius={200} 
            pathOptions={{ color: '#06B6D4', fillColor: '#06B6D4', fillOpacity: 0.08, weight: 1.5, dashArray: '6,10' }} 
          />
          <Marker position={position} icon={userIcon} />
          <RecenterMap coords={position} />
        </MapContainer>
        
        {/* HUD Badge */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0a101b]/90 border border-white/10 backdrop-blur-md shadow-xl">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Marcador Activo</span>
          </div>
        </div>
      </div>

      {/* Selected Address Display */}
      <div className="p-6 rounded-3xl border border-white/10 bg-[#0a101b]/80 backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-2">
          Dirección Seleccionada
        </p>
        {address ? (
           <p className="text-white text-sm leading-relaxed">{address}</p>
        ) : (
           <p className="text-slate-500 text-sm italic">Toca el mapa para establecer tu ubicación exacta...</p>
        )}
      </div>

      {/* Confirmation Chip */}
      {address && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
             <Check size={16} />
          </div>
          <p className="text-xs text-emerald-300 font-black uppercase tracking-widest">Ubicación Confirmada</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
