import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, Filter, Star, MapPin, MessageSquare, Calendar, ChevronRight, 
  Target, Wrench, RefreshCw, Navigation, User, ArrowRight, Cpu, ShieldCheck, 
  Clock, Sparkles, CheckCircle2 
} from 'lucide-react';
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

const TechnicianList = ({ userLocation, onLocationUpdate }) => {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [mapCenter, setMapCenter] = useState([-12.046374, -77.042793]);
  const [tempMarker, setTempMarker] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (userLocation) {
       setMapCenter([userLocation.lat, userLocation.lng]);
       setTempMarker([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  useEffect(() => {
    setMapReady(true);
    // Auto fetch technicians on mount if user location exists
    if (userLocation?.lat && userLocation?.lng) {
      fetchTechnicians([userLocation.lat, userLocation.lng]);
    }
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
    const specialties = (tech.specialties || '').toLowerCase();
    const matchesQuery = !searchQuery || fullName.includes(searchQuery.toLowerCase()) || specialties.includes(searchQuery.toLowerCase());
    const matchesAvailable = !filterAvailableOnly || tech.is_available === 1;
    const matchesRating = !filterMinRating || (parseFloat(tech.rating || 5.0) >= filterMinRating);
    return matchesQuery && matchesAvailable && matchesRating;
  });

  return (
    <div 
      className="flex flex-col lg:flex-row gap-6 rounded-3xl" 
      style={{ height: 720, fontFamily: "'Inter', sans-serif" }}
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
            className="input-field"
            style={{ paddingLeft: 42, height: 46, borderRadius: 14 }}
          />
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
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
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
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
              className="h-full flex flex-col items-center justify-center p-8 text-center rounded-3xl"
              style={{ border: '2px dashed var(--border)', background: 'var(--bg-input)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
              >
                <Navigation size={28} className="text-blue-500 animate-pulse" />
              </div>
              <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
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
              const isAvailable = tech.is_available === 1;
              const rating = tech.rating ? parseFloat(tech.rating).toFixed(1) : '5.0';
              const name = `${tech.names || ''} ${tech.surnames || ''}`.trim() || tech.company_name || 'Especialista Técnico';
              const distanceKm = tech.distance ? `${parseFloat(tech.distance).toFixed(1)} km` : null;

              return (
                <div
                  key={tech.id}
                  className="glass-card p-4 rounded-2xl cursor-pointer group hover:border-blue-500/50 transition-all duration-200"
                  onClick={() => {
                    const lat = parseFloat(tech.latitude);
                    const lng = parseFloat(tech.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) setMapCenter([lat, lng]);
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Tech Avatar */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shrink-0 relative shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                      }}
                    >
                      {name[0]?.toUpperCase() || 'T'}
                      {/* Availability status badge */}
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2"
                        style={{
                          borderColor: 'var(--bg)',
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
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0">
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
                      {tech.specialties && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {String(tech.specialties).split(',').slice(0, 2).map((sp, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20"
                            >
                              {sp.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-white/5">
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
                        className="btn-primary py-1.5 px-3 text-[11px] font-bold"
                        style={{ height: 32, borderRadius: 10 }}
                      >
                        <Calendar size={12} /> Agendar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/technician/${tech.id}`);
                        }}
                        className="btn-ghost py-1.5 px-3 text-[11px] font-bold"
                        style={{ height: 32, borderRadius: 10 }}
                      >
                        Perfil
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-card text-center p-8 rounded-2xl space-y-3">
              <Wrench size={32} className="text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">No se encontraron especialistas</h4>
              <p className="text-xs text-slate-400">
                Prueba cambiando los filtros o desplazando el mapa hacia otra zona de Lima.
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
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; CARTO"
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
                    <div style={{ fontFamily: "'Inter',sans-serif", textAlign: 'center', padding: '6px 4px' }}>
                      <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>
                        {tech.names || tech.company_name || 'Técnico Especialista'}
                      </h4>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        {tech.city || 'Lima'}
                      </p>
                      <button
                        onClick={() => navigate(`/technician/${tech.id}`)}
                        style={{
                          background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                          color: 'white',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          width: '100%'
                        }}
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
            className="btn-primary shadow-2xl py-3 px-6 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2.5"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.45)',
            }}
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
  );
};

export default TechnicianList;
