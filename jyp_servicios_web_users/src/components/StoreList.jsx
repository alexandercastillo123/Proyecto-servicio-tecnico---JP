import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Store, MapPin, Search, ChevronRight, Phone, Clock, ShoppingCart, ArrowRight, X, Zap, Target, Star, ShieldCheck, RefreshCw, Navigation } from 'lucide-react';
import { storeService } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const storeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png',
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
  const { isDark } = useTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : {
      address: 'Lima Centro',
      lat: -12.046374,
      lng: -77.042793
    };
  });

  const [mapCenter, setMapCenter] = useState([userLocation.lat, userLocation.lng]);
  const [tempMarker, setTempMarker] = useState([userLocation.lat, userLocation.lng]);

  useEffect(() => {
    setMapReady(true);
  }, []);

  const filteredStores = stores.filter(s =>
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = {
        lat: tempMarker[0],
        lng: tempMarker[1],
        radius: 10
      };
      const resp = await storeService.getNearbyBranches(params);
      if (resp.data.exito) {
        setStores(resp.data.resultado || []);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
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
        address: data.display_name || 'Ubicación Seleccionada'
      };

      setUserLocation(newLoc);
      localStorage.setItem('user_location', JSON.stringify(newLoc));
      await fetchStores();

    } catch (error) {
      console.error('Manual search failed:', error);
      setIsSearching(false);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <header className="px-2">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Tiendas y <span style={{ color: 'var(--primary)' }}>Sucursales Oficiales</span>
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Busca locales autorizados para repuestos certificados, diagnóstico presencial y soporte técnico.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row h-[700px] gap-6">
        <div className="w-full lg:w-[380px] flex flex-col gap-4 overflow-hidden">
          <div 
            className="p-3.5 rounded-2xl border shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={17} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filtrar por nombre o dirección..."
                className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none border transition-all"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {!hasSearched ? (
              <div 
                className="h-full flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse"
                  style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
                >
                  <Store size={32} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>Explora Sucursales</h3>
                <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                  Haz doble clic en el mapa para marcar tu zona y pulsa <span className="font-bold" style={{ color: 'var(--primary)' }}>Buscar Sucursales</span>.
                </p>
              </div>
            ) : loading ? (
              Array(3).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className="p-5 rounded-2xl border animate-pulse h-32"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                />
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
                  className="p-4 rounded-2xl border shadow-sm transition-all hover:border-primary/40 cursor-pointer group"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex gap-3.5 items-start">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
                    >
                      <Store size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {store.name}
                      </h3>
                      <p className="text-[11px] font-semibold mt-1 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <MapPin size={12} style={{ color: 'var(--primary)' }} />
                        <span className="truncate">{store.address || store.city || 'Trujillo'}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/store/${store.id}`);
                    }}
                    className="btn-primary w-full mt-3 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Ver Catálogo y Servicios</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div 
                className="p-8 text-center rounded-2xl border text-xs"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                No se encontraron sucursales en esta zona geográfica.
              </div>
            )}
          </div>
        </div>

        <div 
          className="flex-1 min-h-[400px] lg:min-h-0 rounded-3xl overflow-hidden border relative shadow-xl"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
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
                url={isDark 
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                } 
                attribution="&copy; CARTO" 
              />
              <MapEvents onDblClick={(lat, lng) => setTempMarker([lat, lng])} />
              <RecenterMap coords={mapCenter} />
              
              {tempMarker && (
                <>
                  <Circle 
                    center={tempMarker} 
                    radius={10000} 
                    pathOptions={{ color: '#2D6BFF', fillOpacity: 0.08, weight: 1, dashArray: '5, 10' }} 
                  />
                  <Marker position={tempMarker} icon={userIcon} />
                </>
              )}

              {hasSearched && filteredStores.map((store) => {
                const lat = parseFloat(store.latitude);
                const lng = parseFloat(store.longitude);
                if (isNaN(lat) || isNaN(lng)) return null;
                return (
                  <Marker 
                    key={store.id} 
                    position={[lat, lng]} 
                    icon={storeIcon}
                  >
                    <Popup className="custom-popup">
                      <div className="p-3 text-center">
                        <h4 className="font-bold text-sm mb-2">{store.name}</h4>
                        <button 
                          onClick={() => navigate(`/store/${store.id}`)} 
                          className="btn-primary px-3.5 py-1 text-xs font-bold rounded-lg"
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

          {/* FLOATING SEARCH BUTTON */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
            <button
              type="button"
              onClick={handleManualSearch}
              disabled={isSearching}
              className="btn-primary px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 shadow-2xl transition-transform hover:scale-105"
            >
              {isSearching ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
              <span>{isSearching ? 'Buscando locales...' : 'Buscar Sucursales Aquí'}</span>
            </button>
          </div>

          <div 
            className="absolute top-6 left-6 z-[1000] p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-center gap-3"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border)' 
            }}
          >
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
            >
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Zona Seleccionada
              </p>
              <p className="text-xs font-bold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                {userLocation.address ? userLocation.address.split(',')[0] : 'Trujillo'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreList;
