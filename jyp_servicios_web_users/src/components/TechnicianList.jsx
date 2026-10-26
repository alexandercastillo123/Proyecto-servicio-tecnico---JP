import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Search, Filter, Star, MapPin, MessageSquare, Calendar, ChevronRight,
  Target, Wrench, RefreshCw, Navigation, User, ArrowRight, Cpu, ShieldCheck,
  Clock, Sparkles, CheckCircle2, Radar, Compass
} from "lucide-react";
import { clientService } from "../services/api.js";
import { extractSpecialties, formatDistance } from "../services/formatters";
import { Link, useNavigate } from "react-router-dom";

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const techIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/7114/7114757.png",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] != null && coords[1] != null && !isNaN(coords[0]) && !isNaN(coords[1])) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  return null;
};

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);
  const [filterMinRating, setFilterMinRating] = useState(0);

  const [effectiveLocation, setEffectiveLocation] = useState(() => {
    if (userLocation) return userLocation;
    const saved = localStorage.getItem("user_location");
    return saved ? JSON.parse(saved) : { address: "Lima Centro, Perú", lat: -12.046374, lng: -77.042793 };
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
      const params = coords
        ? {
            lat: coords[0],
            lng: coords[1],
            radius: 15,
          }
        : { city: "Lima" };

      const response = await clientService.getNearbyTechnicians(params);
      if (response.data.exito) {
        setTechnicians(response.data.resultado || []);
        setHasSearched(true);
      }
    } catch (error) {
      console.error("Error fetching technicians:", error);
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempMarker[0]}&lon=${tempMarker[1]}`
      );
      const data = await response.json();

      const newLoc = {
        lat: tempMarker[0],
        lng: tempMarker[1],
        address: data?.display_name?.split(",").slice(0, 2).join(",") || "Ubicación Seleccionada",
      };

      if (onLocationUpdate) onLocationUpdate(newLoc);
      await fetchTechnicians(tempMarker);
    } catch (error) {
      console.error("Manual search failed:", error);
      setIsSearching(false);
      setLoading(false);
    }
  };

  const filteredTechnicians = technicians.filter((tech) => {
    const fullName = `${tech.names || ""} ${tech.surnames || ""} ${tech.company_name || ""}`.toLowerCase();
    const specialties = extractSpecialties(tech).join(" ").toLowerCase();
    const matchesQuery =
      !searchQuery || fullName.includes(searchQuery.toLowerCase()) || specialties.includes(searchQuery.toLowerCase());
    const matchesAvailable =
      !filterAvailableOnly || tech.is_available === undefined || tech.is_available === 1 || tech.is_available === true;
    const matchesRating = !filterMinRating || parseFloat(tech.rating || 5.0) >= filterMinRating;
    return matchesQuery && matchesAvailable && matchesRating;
  });

  return (
    <div className="space-y-6 pb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {isStandalone && (
        <div className="relative overflow-hidden rounded-[32px] p-8 border border-white/10 bg-gradient-to-br from-[#0c1322] via-[#080d17] to-[#0a1829] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25">
              <Radar size={13} className="text-cyan-400 animate-pulse" />
              <span>Red Satelital JyP · Cobertura Metropolitana</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Explorar Especialistas Técnicos
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Localiza técnicos certificados en tiempo real listos para atención presencial o en laboratorio.
            </p>
          </div>

          <button
            onClick={() => navigate("/appointments/schedule")}
            className="jyp-btn-primary py-3.5 px-6 text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Calendar size={15} />
            <span>Agendar Cita Directa</span>
          </button>
        </div>
      )}

      {/* Main Split Layout: Sidebar list + Interactive Map */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[620px] lg:h-[calc(100vh-250px)]">
        {/* Left Side: Search & Cards List */}
        <div className="w-full lg:w-[440px] flex flex-col gap-4 overflow-hidden">
          {/* Search Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por especialista o fallo (laptop, red, placa...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b121e]/90 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                filterAvailableOnly
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/10"
                  : "bg-white/[0.03] text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              Disponibles Ahora
            </button>
            <button
              type="button"
              onClick={() => setFilterMinRating(filterMinRating === 4.5 ? 0 : 4.5)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 whitespace-nowrap ${
                filterMinRating === 4.5
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/10"
                  : "bg-white/[0.03] text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              <Star size={12} fill="currentColor" /> 4.5+ Estrellas
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-400 ml-auto whitespace-nowrap">
              {filteredTechnicians.length} resultados
            </span>
          </div>

          {/* Card Scroll Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pr-1">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-5 rounded-3xl border border-white/5 bg-[#0a101b]/60 animate-pulse space-y-3">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-white/5" />
                        <div className="h-3 w-1/2 rounded bg-white/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasSearched ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-white/10 bg-[#0a101b]/80 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400">
                  <Navigation size={28} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-white font-black text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Radar de Proximidad
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Haz doble clic en el mapa para marcar una zona o pulsa el botón para buscar técnicos cercanos.
                  </p>
                </div>
                <button onClick={handleManualSearch} className="jyp-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl">
                  <Search size={14} /> Buscar en mi ubicación
                </button>
              </div>
            ) : filteredTechnicians.length > 0 ? (
              filteredTechnicians.map((tech) => {
                const isAvailable = tech.is_available === undefined || tech.is_available === 1 || tech.is_available === true;
                const rating = tech.rating ? parseFloat(tech.rating).toFixed(1) : "5.0";
                const name = `${tech.names || ""} ${tech.surnames || ""}`.trim() || tech.company_name || "Especialista Técnico";
                const distanceKm = formatDistance(tech.distance_km ?? tech.distance);
                const specialties = extractSpecialties(tech);

                return (
                  <div
                    key={tech.id}
                    onClick={() => {
                      const lat = parseFloat(tech.latitude);
                      const lng = parseFloat(tech.longitude);
                      if (!isNaN(lat) && !isNaN(lng)) setMapCenter([lat, lng]);
                    }}
                    className="p-5 rounded-3xl border border-white/10 bg-[#0a101b]/90 hover:bg-[#0c1424] hover:border-cyan-500/40 transition-all duration-200 cursor-pointer shadow-lg group space-y-3"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div
                        className="w-13 h-13 rounded-2xl flex items-center justify-center font-black text-white text-base shrink-0 relative shadow-md"
                        style={{ background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)" }}
                      >
                        {name[0]?.toUpperCase() || "T"}
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a101b] ${
                            isAvailable ? "bg-emerald-400 shadow-[0_0_8px_#10b981]" : "bg-slate-500"
                          }`}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors truncate">
                            {name}
                          </h4>
                          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 font-mono text-[11px] font-black">
                            <Star size={11} fill="currentColor" />
                            <span>{rating}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={11} className="text-blue-400" />
                            {tech.city || "Lima Metropolitana"}
                          </span>
                          {distanceKm && (
                            <span className="font-mono text-cyan-400 text-[11px] font-bold">
                              · {distanceKm}
                            </span>
                          )}
                        </div>

                        {/* Specialties Chips */}
                        {specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {specialties.slice(0, 3).map((sp, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-cyan-300 border border-white/5"
                              >
                                {sp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${isAvailable ? "text-emerald-400" : "text-slate-400"}`}>
                        {isAvailable ? "En Línea / Activo" : "Fuera de turno"}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/appointments/schedule?tech=${tech.id}`);
                          }}
                          className="jyp-btn-primary py-1.5 px-3.5 text-[11px] font-black uppercase tracking-wider rounded-xl"
                        >
                          <Calendar size={12} /> Agendar
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/technician/${tech.id}`);
                          }}
                          className="px-3.5 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                          Perfil
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-8 rounded-3xl border border-white/10 bg-[#0a101b]/80 space-y-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-blue-500/10 border border-blue-500/20 text-cyan-400">
                  <Wrench size={24} />
                </div>
                <h4 className="text-sm font-bold text-white">Sin técnicos en el radio de cobertura</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Ajusta los filtros o haz doble clic sobre otra área del mapa interactivo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="flex-1 min-h-[420px] lg:min-h-0 relative overflow-hidden rounded-[32px] border border-white/10 shadow-2xl bg-[#080d17]">
          {mapReady && (
            <MapContainer
              center={mapCenter}
              zoom={13}
              doubleClickZoom={false}
              style={{ height: "100%", width: "100%" }}
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
                      color: "#06B6D4",
                      fillOpacity: 0.08,
                      weight: 1.5,
                      dashArray: "6,10",
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
                      <div className="font-sans text-center p-3 space-y-2 bg-[#090f1a] text-white rounded-xl">
                        <h4 className="font-black text-sm text-cyan-300">
                          {tech.names || tech.company_name || "Técnico Especialista"}
                        </h4>
                        <p className="text-[11px] text-slate-300">
                          {tech.city || "Lima"} · Calificación: ⭐ {tech.rating || "5.0"}
                        </p>
                        <button
                          onClick={() => navigate(`/technician/${tech.id}`)}
                          className="w-full py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md"
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

          {/* Trigger Pin Search Button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={isSearching}
              className="jyp-btn-primary shadow-2xl py-3 px-6 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2.5 shadow-cyan-500/30"
            >
              {isSearching ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-cyan-300" />
                  <span>Escaneando Zona...</span>
                </>
              ) : (
                <>
                  <Search size={15} />
                  <span>Escanear Técnicos en esta zona</span>
                </>
              )}
            </button>
          </div>

          {/* Zone indicator HUD badge top-left */}
          <div className="absolute top-5 left-5 z-[1000] flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0a101b]/90 border border-white/10 backdrop-blur-md shadow-xl">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
              <Compass size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Zona de Cobertura
              </span>
              <p className="text-xs font-bold text-white max-w-[180px] truncate">
                {userLocation?.address?.split(",")[0] || "Lima Metropolitana"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianList;
