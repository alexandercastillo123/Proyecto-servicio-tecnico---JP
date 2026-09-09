import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Check, Navigation, Target } from 'lucide-react';

const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 15);
  }, [coords, map]);
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

  useEffect(() => {
     if (initialLocation && !address) {
        reverseGeocode(initialLocation.lat, initialLocation.lng);
     }
  }, []);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPosition(newPos);
        reverseGeocode(newPos.lat, newPos.lng);
      },
    });
    return null;
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        onLocationSelect({ lat, lng, address: data.display_name });
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  };

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
        onLocationSelect({ ...newPos, address: data[0].display_name });
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
    <div className="flex flex-col gap-5 font-outfit">
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Escribe tu dirección o distrito..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" disabled={searching} className="bg-white/5 px-6 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 border border-white/10 transition-all">
            {searching ? '...' : 'Buscar'}
          </button>
        </form>
        
        <button 
          onClick={detectLocation}
          disabled={detecting}
          className="flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 text-primary px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all shadow-lg"
        >
          <Target size={18} className={detecting ? 'animate-spin' : ''} />
          {detecting ? 'Detectando...' : 'Ubicación Real'}
        </button>
      </div>

      <div className="h-[350px] rounded-[32px] overflow-hidden border border-white/5 relative shadow-2xl">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapEvents />
          <Circle 
            center={position} 
            radius={200} 
            pathOptions={{ color: '#3B28FF', fillColor: '#3B28FF', fillOpacity: 0.1 }} 
          />
          <Marker position={position} icon={userIcon} />
          <RecenterMap coords={position} />
        </MapContainer>
        
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
           <div className="bg-background/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Marcador Activo
           </div>
        </div>
      </div>

      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Dirección Seleccionada</p>
        {address ? (
           <p className="text-white text-sm leading-relaxed">{address}</p>
        ) : (
           <p className="text-slate-500 text-sm italic">Toca el mapa para establecer tu ubicación exacta...</p>
        )}
      </div>

      {address && (
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center text-success">
             <Check size={16} />
          </div>
          <p className="text-xs text-success font-black uppercase tracking-widest">Ubicación Confirmada</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
