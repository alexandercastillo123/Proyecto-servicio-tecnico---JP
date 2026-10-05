import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Filter, Star, MapPin, MessageSquare, Calendar, ChevronRight, Target, Wrench, RefreshCw, Navigation, User, ArrowRight, Cpu, Shield, Clock } from 'lucide-react';
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
  const [filters, setFilters] = useState({ city: '', minRating: 0 });
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
  }, []);

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
        address: data.display_name || 'UbicaciÃ³n Seleccionada'
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
    <div className="flex flex-col lg:flex-row gap-6" style={{ height: 680, fontFamily: "'Inter',sans-serif" }}>
      
      {/* â”€â”€ Sidebar: Tech Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="w-full lg:w-[380px] flex flex-col gap-4 overflow-hidden">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Filtrar tÃ©cnicos..."
            className="input-field"
            style={{ paddingLeft: 40, height: 44 }}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
          {!hasSearched ? (
            <div
              className="h-full flex flex-col items-center justify-center p-8 text-center rounded-2xl"
              style={{ border: '2px dashed var(--border)', background: 'var(--bg-input)' }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(45,107,255,0.1)', border: '1px solid rgba(45,107,255,0.2)' }}
              >
                <Navigation size={28} style={{ color: 'var(--primary)', animation: 'pulse 2s infinite' }} />
              </div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                Comienza la bÃºsqueda
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Haz doble click en el mapa para marcar tu zona y presiona{' '}
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Buscar</span>{' '}
                para ver expertos disponibles.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 130, borderRadius: 16 }} />
              ))}
            </div>
          ) : technicians.length > 0 ? (
            technicians.map((tech, idx) => (
              <div
                key={tech.id}
                className="glass-card p-4 cursor-pointer group"
                style={{ animation: `slide-up 0.4s ${idx * 0.06}s both` }}
                onClick={() => {
                  const lat = parseFloat(tech.latitude);
                  const lng = parseFloat(tech.longitude);
                  if (!isNaN(lat) && !isNaN(lng)) setMapCenter([lat, lng]);
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="shrink-0 flex items-center justify-center font-black text-white text-lg rounded-2xl"
                    style={{
                      width: 52, height: 52,
                      background: 'linear-gradient(135deg, var(--primary), var(--tertiary))',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      position: 'relative',
                    }}
                  >
                    {tech.names?.[0]?.[0]?.toUpperCase() || 'T'}
                    {/* Availability dot */}
                    {tech.is_available === 1 && (
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full"
                        style={{ background: 'var(--success)', border: '2px solid var(--bg)', boxShadow: '0 0 8px var(--secondary-glow)' }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className="truncate text-sm font-bold group-hover:text-blue-400 transition-colors"
                        style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: 'var(--text-primary)' }}
                      >
                        {tech.names?.[0] || 'TÃ©cnico'} {tech.surnames?.[0] || ''}
                      </h3>
                      {/* Rating */}
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg shrink-0"
                        style={{ background: 'rgba(255,176,32,0.12)', border: '1px solid rgba(255,176,32,0.2)' }}
                      >
                        <Star size={10} style={{ color: '#FFB020', fill: '#FFB020' }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#FFB020' }}>
                          {tech.rating ? parseFloat(tech.rating).toFixed(1) : '5.0'}
                        </span>
                      </div>
                    </div>

                    {/* Location & specialty */}
                    <div className="flex items-center gap-1 mt-1" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      <MapPin size={10} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span className="truncate">{tech.city || 'Lima'}</span>
                    </div>

                    {/* Skills tags */}
                    {tech.specialties && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {String(tech.specialties).split(',').slice(0, 2).map((sp, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: 'rgba(45,107,255,0.1)', color: 'var(--info)', border: '1px solid rgba(45,107,255,0.15)' }}
                          >
                            {sp.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between mt-3 pt-3"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    {tech.is_available === 1 ? (
                      <span className="status-badge status-completed">Disponible</span>
                    ) : (
                      <span className="status-badge status-expired">No disponible</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> 5+ aÃ±os
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/technician/${tech.id}`); }}
                    className="btn-primary btn-sm"
                    style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                  >
                    Ver Perfil <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-10">
              <Wrench size={28} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Sin tÃ©cnicos en esta zona</p>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Prueba ampliar el radio de bÃºsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="flex-1 min-h-[380px] lg:min-h-0 relative overflow-hidden"
        style={{ borderRadius: 24, border: '1px solid var(--border)' }}
      >
        {mapReady && (
          <MapContainer
            center={mapCenter}
            zoom={13}
            doubleClickZoom={false}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
            <MapEvents onDblClick={(lat, lng) => setTempMarker([lat, lng])} />
            <RecenterMap coords={mapCenter} />

            {tempMarker && (
              <>
                <Circle
                  center={tempMarker}
                  radius={10000}
                  pathOptions={{ color: '#2D6BFF', fillOpacity: 0.05, weight: 1.5, dashArray: '6,10' }}
                />
                <Marker position={tempMarker} icon={userIcon} />
              </>
            )}

            {hasSearched && technicians.map((tech) => {
              const lat = parseFloat(tech.latitude);
              const lng = parseFloat(tech.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              return (
                <Marker key={tech.id} position={[lat, lng]} icon={techIcon}>
                  <Popup>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: 'center', padding: 8 }}>
                      <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
                        {tech.names?.[0] || 'TÃ©cnico'} {tech.surnames?.[0] || ''}
                      </h4>
                      <button
                        onClick={() => navigate(`/technician/${tech.id}`)}
                        style={{ background: '#2D6BFF', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Ver Perfil
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Search trigger button */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            type="button"
            onClick={handleManualSearch}
            disabled={isSearching}
            className="flex items-center gap-2.5 btn-primary"
            style={{
              height: 48, padding: '0 24px', borderRadius: 999,
              fontSize: 13, letterSpacing: '0.04em', fontWeight: 700,
              boxShadow: '0 16px 40px rgba(45,107,255,0.4)',
            }}
          >
            {isSearching
              ? <><RefreshCw size={16} style={{ animation: 'spin-loader 0.75s linear infinite' }} /> Buscando...</>
              : <><Search size={16} /> Buscar TÃ©cnicos aquÃ­</>
            }
          </button>
        </div>

        {/* Location overlay */}
        <div
          className="absolute top-5 left-5 z-[1000] flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(5,7,15,0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(45,107,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MapPin size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 2 }}>
              Zona seleccionada
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', maxWidth: 180, fontFamily: "'Plus Jakarta Sans',sans-serif" }} className="truncate">
              {userLocation?.address?.split(',')[0] || 'Lima'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianList;

