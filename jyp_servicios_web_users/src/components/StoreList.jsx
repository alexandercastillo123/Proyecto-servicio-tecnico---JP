import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Store, MapPin, Search, ChevronRight, Phone, Clock, ShoppingCart,
  ArrowRight, X, Zap, Target, Star, ShieldCheck, RefreshCw, Navigation,
  Compass, Sparkles
} from "lucide-react";
import { storeService } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { TechLoader } from "./common/TechLoader";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const storeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/869/869636.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/7114/7114757.png",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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

const StoreList = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem("user_location");
    return saved
      ? JSON.parse(saved)
      : {
          address: "Lima Centro, Perú",
          lat: -12.046374,
          lng: -77.042793,
        };
  });

  const [mapCenter, setMapCenter] = useState([userLocation.lat, userLocation.lng]);
  const [tempMarker, setTempMarker] = useState([userLocation.lat, userLocation.lng]);

  useEffect(() => {
    setMapReady(true);
    fetchStores();
  }, []);

  const filteredStores = (Array.isArray(stores) ? stores : []).filter(
    (s) =>
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = {
        lat: tempMarker[0],
        lng: tempMarker[1],
        radius: 10,
      };
      const resp = await storeService.getNearbyBranches(params);
      const nearby = Array.isArray(resp.data?.resultado) ? resp.data.resultado : [];

      if (nearby.length > 0) {
        setStores(nearby);
      } else {
        const all = await storeService.getBranches().catch(() => null);
        const list = Array.isArray(all?.data?.resultado) ? all.data.resultado : [];
        setStores(list);
      }
      setHasSearched(true);
    } catch (error) {
      console.error("Error fetching stores:", error);
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
        address: data.display_name?.split(",").slice(0, 2).join(",") || "Ubicación Seleccionada",
      };

      setUserLocation(newLoc);
      localStorage.setItem("user_location", JSON.stringify(newLoc));
      await fetchStores();
    } catch (error) {
      console.error("Manual search failed:", error);
      setIsSearching(false);
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] p-8 border border-white/10 bg-gradient-to-br from-[#0c1322] via-[#080d17] to-[#0a1829] shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25">
            <Store size={13} className="text-cyan-400" />
            <span>Red Oficial de Distribución & Talleres Homologados</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Tiendas y Sucursales Oficiales
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Localiza centros autorizados para compra presencial de componentes originales, recepción de equipos y soporte técnico de precisión.
          </p>
        </div>
      </div>

      {/* Main Split Layout: Sidebar list + Interactive Map */}
      <div className="flex flex-col lg:flex-row min-h-[580px] lg:h-[calc(100vh-250px)] gap-6">
        {/* Left Column: Search & Branches list */}
        <div className="w-full lg:w-[420px] flex flex-col gap-4 overflow-hidden">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Buscar por sucursal, distrito o dirección..."
              className="w-full rounded-2xl py-3.5 pl-11 pr-4 text-xs bg-[#0b121e]/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Branches Scroll List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 no-scrollbar">
            {!hasSearched ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center rounded-[32px] border border-white/10 bg-[#0a101b]/80 space-y-3">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Store size={32} />
                </div>
                <h3 className="font-bold text-base text-white">Explora Sucursales</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Haz doble clic en el mapa interactivo para marcar tu zona y buscar las sucursales más próximas.
                </p>
              </div>
            ) : loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="p-6 rounded-3xl border border-white/5 bg-[#0a101b]/60 animate-pulse h-36" />
              ))
            ) : filteredStores.length > 0 ? (
              filteredStores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => {
                    const lat = parseFloat(store.latitude);
                    const lng = parseFloat(store.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      setMapCenter([lat, lng]);
                    }
                  }}
                  className="p-5 rounded-3xl border border-white/10 bg-[#0a101b]/90 hover:bg-[#0c1424] hover:border-cyan-500/40 shadow-lg transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex gap-4 items-start">
                    <div className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 bg-blue-600/15 text-cyan-400 border border-blue-500/25 shadow-md">
                      <Store size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors truncate">
                        {store.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="text-cyan-400 shrink-0" />
                        <span className="truncate">{store.address || store.city || "Lima Metropolitana"}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/store/${store.id}`);
                    }}
                    className="jyp-btn-primary w-full py-2.5 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
                  >
                    <span>Ver Catálogo & Servicios</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-3xl border border-white/10 bg-[#0a101b]/80 text-xs text-slate-400">
                No se encontraron sucursales en esta zona geográfica.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leaflet Map Container */}
        <div className="flex-1 min-h-[420px] lg:min-h-0 rounded-[32px] overflow-hidden border border-white/10 relative shadow-2xl bg-[#080d17]">
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
                    pathOptions={{ color: "#06B6D4", fillOpacity: 0.08, weight: 1.5, dashArray: "5, 10" }}
                  />
                  <Marker position={tempMarker} icon={userIcon} />
                </>
              )}

              {hasSearched &&
                filteredStores.map((store) => {
                  const lat = parseFloat(store.latitude);
                  const lng = parseFloat(store.longitude);
                  if (isNaN(lat) || isNaN(lng)) return null;
                  return (
                    <Marker key={store.id} position={[lat, lng]} icon={storeIcon}>
                      <Popup>
                        <div className="p-3 text-center space-y-2 bg-[#090f1a] text-white rounded-xl">
                          <h4 className="font-black text-sm text-cyan-300">{store.name}</h4>
                          <p className="text-[11px] text-slate-300">{store.address || "Sede autorizada"}</p>
                          <button
                            onClick={() => navigate(`/store/${store.id}`)}
                            className="w-full py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                          >
                            Ver Tienda
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          )}

          {/* Floating Search in this area */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={isSearching}
              className="jyp-btn-primary px-7 py-3 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2.5 shadow-2xl shadow-cyan-500/30"
            >
              {isSearching ? <RefreshCw className="animate-spin text-cyan-300" size={16} /> : <Search size={16} />}
              <span>{isSearching ? "Escaneando locales..." : "Buscar Sucursales Aquí"}</span>
            </button>
          </div>

          {/* Selected Zone Pill top-left */}
          <div className="absolute top-5 left-5 z-[1000] p-3.5 rounded-2xl border border-white/10 bg-[#0a101b]/90 backdrop-blur-md shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Compass size={16} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                Zona de Rastreo
              </span>
              <p className="text-xs font-bold text-white truncate max-w-[180px]">
                {userLocation.address ? userLocation.address.split(",")[0] : "Lima Centro"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreList;
