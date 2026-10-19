import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, Filter, Star, MapPin, MessageSquare, Calendar, ChevronRight, 
  Target, Wrench, RefreshCw, Navigation, User, ArrowRight, Cpu, ShieldCheck, 
  Clock, Sparkles, CheckCircle2 
} from 'lucide-react';
import { clientService } from '../services/api.js';
import { extractSpecialties, formatDistance } from '../services/formatters';
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
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/7114/7114757.png',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Helper component to smoothly re-center the map without unmounting MapContainer
const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] != null && coords[1] != null && !isNaN(coords[0]) && !isNaN(coords[1])) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  return null;
};

// Helper component for map click/dblclick events
const MapEvents = ({ onDblClick }) => {
  useMapEvents({
    dblclick(e) {
      if (onDblClick) {
        onDblClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const TechnicianList = ({ userLocation, onLocationUpdate, isStandalone = true }) => {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0);

  const [effectiveLocation, setEffectiveLocation] = useState(() => {
    if (userLocation) return userLocation;
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : { address: 'Lima Centro, Perú', lat: -12.046374, lng: -77.042793 };
  });

  const [mapCenter, setMapCenter] = useState([effectiveLocation.lat, effectiveLocation.lng]);
  const [tempMarker, setTempMarker] = useState([effectiveLocation.lat, effectiveLocation.lng]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (userLocation) {
       setEffectiveLocation(userLocation);
       setMapCenter([userLocation.lat, userLocation.lng]);
       setTempMarker([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  useEffect(() => {
    setMapReady(true);
    const coords = userLocation ? [userLocation.lat, userLocation.lng] : [effectiveLocation.lat, effectiveLocation.lng];
    setMapCenter(coords);
    setTempMarker(coords);
    fetchTechnicians(coords);
  }, []);

  const fetchTechnicians = async (coords = tempMarker) => {
    setLoading(true);
    try {
      const params = coords ? {
        lat: coords[0],
        lng: coords[1],
        radius: 15 // 15km radius
      } : { city: 'Lima' };

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
        address: data?.display_name?.split(',').slice(0, 2).join(',') || 'Ubicación Seleccionada'
      };

      if (onLocationUpdate) onLocationUpdate(newLoc);
      await fetchTechnicians(tempMarker);
    } catch (error) {
      console.error('Manual search failed:', error);
      setIsSearching(false);
      setLoading(false);
    }
  };

  // Filtered technician list
  const filteredTechnicians = technicians.filter(tech => {
    const fullName = `${tech.names || ''} ${tech.surnames || ''} ${tech.company_name || ''}`.toLowerCase();
    const specialties = extractSpecialties(tech).join(' ').toLowerCase();
    const matchesQuery = !searchQuery || fullName.includes(searchQuery.toLowerCase()) || specialties.includes(searchQuery.toLowerCase());
    /* El endpoint /nearby ya filtra por is_available, por eso todo lo listado está disponible */
    const matchesAvailable = !filterAvailableOnly || tech.is_available === undefined || tech.is_available === 1 || tech.is_available === true;
    const matchesRating = !filterMinRating || (parseFloat(tech.rating || 5.0) >= filterMinRating);
    return matchesQuery && matchesAvailable && matchesRating;
  });

  return (
    <div className="space-y-6">
      {isStandalone && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Red Satelital JyP
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <ShieldCheck size={14} className="text-emerald-400" /> Especialistas Verificados
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight font-heading">
              Explorar Técnicos en Lima
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Filtra y visualiza la ubicación de técnicos certificados listos para acudir a domicilio o recibir tu equipo.
            </p>
          </div>
          <button
            onClick={() => navigate('/appointments/schedule')}
            className="btn-primary py-3 px-6 text-xs font-black uppercase tracking-wider self-start sm:self-auto rounded-2xl shadow-xl shadow-blue-600/20"
          >
            <Calendar size={15} /> Agendar Cita
          </button>
        </div>
      )}

      <div 
        className="flex flex-col lg:flex-row gap-6 rounded-3xl min-h-[580px] lg:h-[calc(100vh-230px)] lg:min-h-[620px] font-sans"
      >
        {/* ── Sidebar: Filter & Technician Cards ───────────────── */}
        <div className="w-full lg:w-[420px] flex flex-col gap-3.5 overflow-hidden">
        {/* Search bar */}
        <div className="relative">
          <Search 
            size={16} 
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" 
            style={{ color: 'var(--text-dim)' }} 
          />
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad (laptop, red...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field jyp-form-input"
            style={{ paddingLeft: 44, height: 52, borderRadius: 18 }}
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
              filterAvailableOnly 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            Disponibles Ahora
          </button>
          <button
            type="button"
            onClick={() => setFilterMinRating(filterMinRating === 4.5 ? 0 : 4.5)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 shadow-sm ${
              filterMinRating === 4.5 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Star size={12} fill="currentColor" /> 4.5+ Estrellas
          </button>
          <span className="text-[11px] font-bold text-slate-400 ml-auto">
            {filteredTechnicians.length} resultados
          </span>
        </div>

        {/* Card Scroll Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card p-5 space-y-3" style={{ height: 160 }}>
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl skeleton" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 skeleton rounded" />
                      <div className="h-3 w-1/2 skeleton rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-full skeleton rounded mt-4" />
                </div>
              ))}
            </div>
          ) : !hasSearched ? (
            <div
              className="h-full flex flex-col items-center justify-center p-8 text-center rounded-3xl jyp-empty-state"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
              >
                <Navigation size={28} className="text-blue-500 animate-pulse" />
              </div>
              <h3 className="text-base font-black text-white mb-2 font-heading">
                Explorador de Técnicos
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-4">
                Haz doble clic en el mapa para marcar tu zona y pulsa "Buscar Técnicos aquí".
              </p>
              <button
                onClick={handleManualSearch}
                className="btn-primary py-2.5 px-5 text-xs font-bold"
              >
                <Search size={14} /> Buscar en mi ubicación
              </button>
            </div>
          ) : filteredTechnicians.length > 0 ? (
            filteredTechnicians.map((tech) => {
              /* /nearby ya devuelve únicamente técnicos disponibles */
              const isAvailable = tech.is_available === undefined || tech.is_available === 1 || tech.is_available === true;
              const rating = tech.rating ? parseFloat(tech.rating).toFixed(1) : '5.0';
              const name = `${tech.names || ''} ${tech.surnames || ''}`.trim() || tech.company_name || 'Especialista Técnico';
              const distanceKm = formatDistance(tech.distance_km ?? tech.distance);
              const specialties = extractSpecialties(tech);

              return (
                <div
                  key={tech.id}
                  className="glass-card p-6 rounded-3xl cursor-pointer group hover:border-blue-500/50 transition-all duration-200 shadow-md"
                  onClick={() => {
                    const lat = parseFloat(tech.latitude);
                    const lng = parseFloat(tech.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) setMapCenter([lat, lng]);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Tech Avatar */}
                    <div
                      className="w-13 h-13 rounded-2xl flex items-center justify-center font-black text-white text-base shrink-0 relative shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                      }}
                    >
                      {name[0]?.toUpperCase() || 'T'}
                      {/* Availability status badge */}
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900"
                        style={{
                          background: isAvailable ? 'var(--success)' : '#94A3B8',
                          boxShadow: isAvailable ? '0 0 8px #10B981' : 'none'
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                          {name}
                        </h4>
                        
                        {/* Rating pill */}
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0">
                          <Star size={11} fill="currentColor" />
                          <span className="text-[11px] font-black">{rating}</span>
                        </div>
                      </div>

                      {/* City and distance */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={11} className="text-blue-400" />
                          {tech.city || 'Lima'}
                        </span>
                        {distanceKm && (
                          <span className="text-[11px] font-bold text-cyan-400">
                            · a {distanceKm}
                          </span>
                        )}
                      </div>

                      {/* Specialty tags */}
                      {specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {specialties.slice(0, 3).map((sp, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20"
                            >
                              {sp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {isAvailable ? 'En línea / Disponible' : 'Fuera de turno'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/appointments/schedule?tech=${tech.id}`);
                        }}
                        className="btn-primary py-1.5 px-3.5 text-[11px] font-bold rounded-xl h-8"
                      >
                        <Calendar size={12} /> Agendar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/technician/${tech.id}`);
                        }}
                        className="btn-ghost py-1.5 px-3.5 text-[11px] font-bold rounded-xl h-8"
                      >
                        Perfil
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-card text-center p-8 rounded-3xl space-y-3 border border-white/10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Wrench size={26} />
              </div>
              <h4 className="text-sm font-bold text-white font-heading">No se encontraron especialistas</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Prueba cambiando los filtros o haciendo doble clic en otra zona del mapa para buscar técnicos disponibles.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Map Container ─────────────────────────── */}
      <div 
        className="flex-1 min-h-[380px] lg:min-h-0 relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
      >
        {mapReady && (
          <MapContainer
            center={mapCenter}
            zoom={13}
            doubleClickZoom={false}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <MapEvents onDblClick={(lat, lng) => setTempMarker([lat, lng])} />
            <RecenterMap coords={mapCenter} />

            {tempMarker && (
              <>
                <Circle
                  center={tempMarker}
                  radius={10000}
                  pathOptions={{
                    color: '#2563EB',
                    fillOpacity: 0.08,
                    weight: 1.5,
                    dashArray: '6,10'
                  }}
                />
                <Marker position={tempMarker} icon={userIcon} />
              </>
            )}

            {technicians.map((tech) => {
              const lat = parseFloat(tech.latitude);
              const lng = parseFloat(tech.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              return (
                <Marker key={tech.id} position={[lat, lng]} icon={techIcon}>
                  <Popup>
                      <div className="font-sans text-center p-2">
                        <h4 className="font-black text-sm mb-1 text-slate-100">
                          {tech.names || tech.company_name || 'Técnico Especialista'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mb-2">
                          {tech.city || 'Lima'}
                        </p>
                        <button
                          onClick={() => navigate(`/technician/${tech.id}`)}
                          className="w-full py-2 px-4 rounded border-none text-xs font-bold bg-gradient-to-br from-blue-600 to-cyan-500 text-white cursor-pointer"
                        >
                          Ver Perfil Completo
                        </button>
                      </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Trigger Button: Search around current pin */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            type="button"
            onClick={handleManualSearch}
            disabled={isSearching}
            className="btn-primary shadow-2xl py-3 px-6 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2.5 bg-gradient-to-br from-blue-600 to-cyan-500 shadow-[0_10px_30px_rgba(37,99,235,0.45)]"
          >
            {isSearching ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Escaneando Zona...</span>
              </>
            ) : (
              <>
                <Search size={15} />
                <span>Buscar Técnicos en esta zona</span>
              </>
            )}
          </button>
        </div>

        {/* Zone indicator card in top left */}
        <div
          className="absolute top-5 left-5 z-[1000] flex items-center gap-3 px-4 py-3 rounded-2xl glass-panel"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-400"
            style={{ background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
          >
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Cobertura Activa
            </p>
            <p className="text-xs font-bold text-white max-w-[170px] truncate">
              {userLocation?.address?.split(',')[0] || 'Lima Metropolitana'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default TechnicianList;
