import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, Filter, Star, MapPin, Phone, MessageSquare, Calendar, ChevronRight, Target, Zap, ShieldCheck, RefreshCw, Navigation, User, ArrowRight } from 'lucide-react';
import { clientService } from '../services/api.js';
import { Link, useNavigate } from 'react-router-dom';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const techIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7114/7114757.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
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

const TechnicianList = ({ userLocation, onLocationUpdate }) => {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({ city: '', minRating: 0 });
  const [mapCenter, setMapCenter] = useState([-12.046374, -77.042793]);
  const [tempMarker, setTempMarker] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (userLocation) {
       setMapCenter([userLocation.lat, userLocation.lng]);
       setTempMarker([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      // Use the nearby endpoint for radius search
      const params = tempMarker ? {
        lat: tempMarker[0],
        lng: tempMarker[1],
        radius: 10 // 10km radius
      } : filters;

      const response = await clientService.getNearbyTechnicians(params);
      if (response.data.exito) {
        setTechnicians(response.data.resultado || []);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const MapEvents = () => {
    useMapEvents({
      dblclick(e) {
        const { lat, lng } = e.latlng;
        setTempMarker([lat, lng]);
      },
    });
    return null;
  };

  const handleManualSearch = async () => {
    if (!tempMarker) return;
    
    setIsSearching(true);
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempMarker[0]}&lon=${tempMarker[1]}`);
      const data = await response.json();
      
      const newLoc = {
        lat: tempMarker[0],
        lng: tempMarker[1],
        address: data.display_name || 'Ubicación Seleccionada'
      };

      if (onLocationUpdate) onLocationUpdate(newLoc);
      await fetchTechnicians();
      
    } catch (error) {
      console.error('Manual search failed:', error);
      setIsSearching(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[700px] gap-6 font-outfit">
      
      {/* Sidebar List */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6 overflow-hidden">
        <div className="glass-panel p-4 border-white/5 shadow-xl">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Filtrar resultados..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4">
          {!hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center glass-panel border-dashed border-white/10">
               <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
                  <Navigation size={40} />
               </div>
               <h3 className="text-white font-black text-lg mb-2">Comienza la búsqueda</h3>
               <p className="text-slate-500 text-sm leading-relaxed">
                  Haz doble click en el mapa para marcar tu zona y presiona el botón <span className="text-primary font-bold">Buscar</span> para ver expertos disponibles.
               </p>
            </div>
          ) : loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="glass-panel p-6 animate-pulse h-40" />
            ))
          ) : technicians.length > 0 ? (
            technicians.map((tech) => (
              <div 
                key={tech.id} 
                className="glass-panel p-5 flex flex-col gap-4 cursor-pointer group hover:bg-white/[0.03] hover:border-primary/30 transition-all border border-white/5 shadow-xl animate-in slide-in-from-bottom-4 duration-500"
                onClick={() => setMapCenter([-12.046374 + (tech.id * 0.005), -77.042793 + (tech.id * 0.005)])}
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                    <User size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-white text-base truncate group-hover:text-primary transition-colors">
                        {tech.names?.[0] || 'Técnico'} {tech.surnames?.[0] || ''}
                      </h3>
                      <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-500 text-[10px] font-black">{tech.rating || '5.0'}</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase mt-1">
                      <MapPin size={12} className="text-primary inline mr-1" />
                      {tech.city || 'Lima'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Experiencia</span>
                      <span className="text-white text-xs font-black">5+ Años</span>
                   </div>
                   <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/technician/${tech.id}`);
                    }}
                    className="bg-white/5 hover:bg-primary text-white p-2.5 rounded-xl transition-all group/btn"
                   >
                     <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel p-12 text-center text-slate-500 text-sm">
               No hay técnicos encontrados en esta zona.
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 min-h-[400px] lg:min-h-0 rounded-[40px] overflow-hidden border border-white/5 relative shadow-3xl bg-slate-900">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          doubleClickZoom={false}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
          <MapEvents />
          <RecenterMap coords={mapCenter} />
          
          {tempMarker && (
            <>
              <Circle 
                center={tempMarker} 
                radius={10000} // 10km circle to match the search radius
                pathOptions={{ color: '#3B28FF', fillOpacity: 0.05, weight: 1, dashArray: '5, 10' }} 
              />
              <Marker position={tempMarker} icon={userIcon} />
            </>
          )}

          {hasSearched && technicians.map((tech) => (
            tech.latitude && tech.longitude && (
              <Marker 
                key={tech.id} 
                position={[tech.latitude, tech.longitude]} 
                icon={techIcon}
              >
                <Popup className="custom-popup">
                  <div className="p-3 font-outfit text-center">
                    <h4 className="font-black text-sm mb-2">{tech.names?.[0]} {tech.surnames?.[0]}</h4>
                    <button 
                      onClick={() => navigate(`/technician/${tech.id}`)}
                      className="bg-primary text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                      Ver Perfil
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
        
        {/* MANUAL SEARCH TRIGGER */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000]">
           <button 
             onClick={handleManualSearch}
             disabled={isSearching}
             className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-[0_15px_35px_rgba(59,40,255,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
           >
             {isSearching ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
             Buscar Técnicos aquí
           </button>
        </div>

        <div className="absolute top-8 left-8 z-[1000] bg-background/80 backdrop-blur-md px-6 py-4 rounded-[24px] border border-white/10 shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                 <MapPin size={20} />
              </div>
              <div className="max-w-[200px]">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Zona Seleccionada</p>
                 <p className="text-sm font-black text-white leading-tight truncate">
                    {userLocation?.address?.split(',')[0]}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianList;
