import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, MapPin, Search, Filter, 
  ChevronRight, Phone, Clock, ShoppingCart,
  ArrowRight, X, Zap, Target, Star, ShieldCheck, RefreshCw, Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { storeService, messageService } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

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
    if (coords) map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
};

const StoreList = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

      setUserLocation(newLoc);
      localStorage.setItem('user_location', JSON.stringify(newLoc));
      await fetchStores();
      
    } catch (error) {
      console.error('Manual search failed:', error);
      setIsSearching(false);
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-outfit animate-in fade-in duration-700">
      
      <header className="px-4">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Tiendas <span className="text-primary">Oficiales</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Busca sucursales autorizadas para repuestos y soporte técnico.</p>
      </header>

      <div className="flex flex-col lg:flex-row h-[700px] gap-6 px-4">
        
        <div className="w-full lg:w-[400px] flex flex-col gap-6 overflow-hidden">
          <div className="glass-panel p-4 border-white/5 shadow-xl">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Filtrar tiendas..." 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-4">
            {!hasSearched ? (
               <div className="h-full flex flex-col items-center justify-center p-8 text-center glass-panel border-dashed border-white/10">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
                     <Store size={40} />
                  </div>
                  <h3 className="text-white font-black text-lg mb-2">Explora Sucursales</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                     Marca tu zona en el mapa con doble click y presiona <span className="text-primary font-bold">Buscar</span> para ver las tiendas oficiales cercanas.
                  </p>
               </div>
            ) : loading ? (
               Array(4).fill(0).map((_, i) => (
                  <div key={i} className="glass-panel p-6 animate-pulse h-40" />
               ))
            ) : filteredStores.length > 0 ? (
              filteredStores.map((store) => (
                <div 
                  key={store.id}
                  onClick={() => setMapCenter([store.latitude || -12.04, store.longitude || -77.04])}
                  className="glass-panel p-5 flex flex-col gap-4 cursor-pointer group hover:bg-white/[0.03] hover:border-primary/30 transition-all border border-white/5 shadow-xl animate-in slide-in-from-bottom-4"
                >
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                       <Store size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-white text-base truncate group-hover:text-primary transition-colors">{store.name}</h3>
                      <p className="text-slate-500 text-[10px] font-black uppercase mt-1">
                         <MapPin size={12} className="text-primary inline mr-1" />
                         {store.city || 'Lima'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/store/${store.id}`)}
                    className="w-full bg-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-primary-dark transition-all"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ))
            ) : (
               <div className="glass-panel p-12 text-center text-slate-500 text-sm">
                  No hay sucursales encontradas en esta zona.
               </div>
            )}
          </div>
        </div>

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
                <Circle center={tempMarker} radius={500} pathOptions={{ color: '#3B28FF', fillOpacity: 0.1, weight: 1, dashArray: '5, 10' }} />
                <Marker position={tempMarker} icon={userIcon} />
              </>
            )}

            {hasSearched && filteredStores.map((store) => (
              <Marker key={store.id} position={[store.latitude || -12.04, store.longitude || -77.04]} icon={storeIcon}>
                <Popup className="custom-popup">
                   <div className="p-3 font-outfit text-center">
                      <h4 className="font-black text-sm mb-2">{store.name}</h4>
                      <button onClick={() => navigate(`/store/${store.id}`)} className="bg-primary text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase">Ver Tienda</button>
                   </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* FLOATING BUSCAR BUTTON */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000]">
             <button 
               onClick={handleManualSearch}
               disabled={isSearching}
               className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-[0_15px_35px_rgba(59,40,255,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
             >
               {isSearching ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
               Buscar Sucursales aquí
             </button>
          </div>

          <div className="absolute top-8 left-8 z-[1000] bg-background/80 backdrop-blur-md px-6 py-4 rounded-[24px] border border-white/10 shadow-2xl">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                   <MapPin size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Zona Seleccionada</p>
                   <p className="text-sm font-black text-white leading-tight">
                      {userLocation.address.split(',')[0]}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreList;
