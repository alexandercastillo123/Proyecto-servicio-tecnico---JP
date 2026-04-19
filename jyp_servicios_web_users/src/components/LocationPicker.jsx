import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Check } from 'lucide-react';

const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 15);
  }, [coords, map]);
  return null;
};

const LocationPicker = ({ onLocationSelect, initialLocation = { lat: -12.046374, lng: -77.042793 } }) => {
  const [position, setPosition] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
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

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
          <input 
            type="text" 
            placeholder="Busca tu dirección..." 
            className="input-field w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" disabled={searching} className="btn-primary">
          {searching ? 'Buscando...' : 'Ir'}
        </button>
      </form>

      <div className="h-[300px] rounded-xl overflow-hidden border border-white/5 relative">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapEvents />
          <Marker position={position} />
          <RecenterMap coords={position} />
        </MapContainer>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-surface/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl flex items-center gap-2 max-w-[90%]">
          <MapPin size={16} className="text-primary shrink-0" />
          <span className="text-[10px] text-white truncate">{address || 'Haz click en el mapa para marcar tu ubicación'}</span>
        </div>
      </div>

      {address && (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl">
          <Check size={16} className="text-success" />
          <p className="text-xs text-success font-medium">Ubicación seleccionada correctamente</p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
