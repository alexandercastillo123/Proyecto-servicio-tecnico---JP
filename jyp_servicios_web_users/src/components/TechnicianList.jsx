import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Filter, Star, MapPin, Phone, MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { clientService } from '../services/api.js';
import { Link } from 'react-router-dom';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for Technician
const techIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  return null;
};

const TechnicianList = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', minRating: 0 });
  const [mapCenter, setMapCenter] = useState([-12.046374, -77.042793]); // Lima default

  useEffect(() => {
    fetchTechnicians();
  }, [filters]);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const response = await clientService.getTechnicians(filters);
      setTechnicians(response.data.data.technicians || []);
      
      // If we have technicians, center map on the first one that has coords (mocked for now if not in DB)
      if (response.data.data.technicians?.length > 0) {
        // Since DB user_profiles doesn't have lat/lng yet, we use a mock offset from center for demo
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        // Optionally update filter city if city is in the response
        const address = data[0].display_name;
        console.log('Found location:', address);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] gap-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black gradient-text">Encontrar Técnicos</h1>
          <p className="text-text-secondary text-sm mt-1">Busca expertos cerca de tu ubicación</p>
        </div>
        
        <form onSubmit={handleSearchLocation} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
            <input 
              type="text" 
              placeholder="Ingresa una ubicación (ej. Miraflores, Lima)..." 
              className="input-field w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary py-3">
            Buscar
          </button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden">
        {/* List Section */}
        <div className="w-full lg:w-1/3 overflow-y-auto pr-2 no-scrollbar space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse h-32" />
            ))
          ) : technicians.length > 0 ? (
            technicians.map((tech) => (
              <div 
                key={tech.id} 
                className="glass-card p-4 flex gap-4 cursor-pointer hover:border-primary/50"
                onClick={() => setMapCenter([-12.046374 + (tech.id * 0.01), -77.042793 + (tech.id * 0.01)])}
              >
                <div className="relative">
                  <img 
                    src={tech.profile_image_url || `https://ui-avatars.com/api/?name=${tech.names}+${tech.surnames}&background=3B28FF&color=fff`} 
                    alt={tech.names} 
                    className="w-16 h-16 rounded-xl object-cover border-2 border-primary/20"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-success w-4 h-4 rounded-full border-2 border-background" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white">{tech.names} {tech.surnames}</h3>
                    <div className="flex items-center gap-1 text-warning text-xs font-black">
                      <Star size={12} fill="currentColor" />
                      {tech.rating || 'N/A'}
                    </div>
                  </div>
                  <p className="text-text-dim text-xs mt-1 flex items-center gap-1">
                    <MapPin size={12} /> {tech.city || 'Ubicación no especificada'}
                  </p>
                  
                  <div className="flex gap-2 mt-4">
                    <Link 
                      to={`/technician/${tech.id}`} 
                      className="flex-1 bg-primary/10 text-primary py-2 rounded-lg text-xs font-black text-center hover:bg-primary hover:text-white transition-all"
                    >
                      Ver Perfil
                    </Link>
                    <Link 
                      to={`/chat?user=${tech.id}`}
                      className="bg-surface-lighter p-2 rounded-lg text-text-secondary hover:text-white transition-all border border-white/5"
                    >
                      <MessageSquare size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card p-8 text-center text-text-secondary">
              No se encontraron técnicos en esta zona.
            </div>
          )}
        </div>

        {/* Map Section */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-2xl overflow-hidden border border-white/5 relative">
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            className="z-10"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <RecenterMap coords={mapCenter} />
            
            {technicians.map((tech) => (
              <Marker 
                key={tech.id} 
                position={[-12.046374 + (tech.id * 0.01), -77.042793 + (tech.id * 0.01)]}
                icon={techIcon}
              >
                <Popup>
                  <div className="p-2 min-w-[150px]">
                    <h4 className="font-bold">{tech.names} {tech.surnames}</h4>
                    <p className="text-xs text-text-dim mt-1">{tech.reference_address}</p>
                    <Link 
                      to={`/technician/${tech.id}`}
                      className="mt-2 block text-center bg-primary text-white py-1 rounded-md text-[10px] font-bold"
                    >
                      Ver Perfil
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button className="bg-surface/80 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white hover:bg-primary transition-all shadow-xl">
              <MapPin size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianList;
