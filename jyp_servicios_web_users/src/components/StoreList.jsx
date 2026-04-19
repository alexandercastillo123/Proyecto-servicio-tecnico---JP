import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, MapPin, Search, Filter, 
  ChevronRight, Phone, Clock, ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { storeService } from '../services/api';
import { Link } from 'react-router-dom';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const resp = await storeService.getBranches();
      if (resp.data.success) {
        setStores(resp.data.data);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black gradient-text">Tiendas y Sucursales</h1>
          <p className="text-text-secondary text-sm">Encuentra repuestos y accesorios originales cerca de ti.</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-dim hover:text-white'}`}
          >
            Lista
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-primary text-white' : 'text-text-dim hover:text-white'}`}
          >
            Mapa
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o ciudad..." 
            className="input-field w-full pl-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-white transition-all">
          <Filter size={20} />
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             Array(6).fill(0).map((_, i) => (
                <div key={i} className="glass-card h-64 animate-pulse rounded-[32px]" />
             ))
          ) : filteredStores.length > 0 ? (
            filteredStores.map((store) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={store.id}
                className="glass-card p-6 flex flex-col group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-tr from-primary/50 to-primary rounded-2xl flex items-center justify-center text-white">
                    <Store size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors">{store.name}</h3>
                    <div className="flex items-center gap-1.5 text-text-dim text-[10px] font-black uppercase tracking-widest">
                       <MapPin size={12} className="text-primary" />
                       {store.city}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                   <p className="text-text-secondary text-xs leading-relaxed line-clamp-3">
                     {store.description || 'Tienda autorizada de repuestos J&P. Contamos con especialistas para asesorarte.'}
                   </p>
                   <div className="flex items-center gap-2 text-text-dim text-xs">
                     <Clock size={14} className="text-primary" />
                     Abierto: 09:00 AM - 07:00 PM
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-surface bg-slate-800" />
                         ))}
                      </div>
                      <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">+15 prod.</span>
                   </div>
                   <Link 
                     to={`/store/${store.id}`}
                     className="bg-primary/10 text-primary p-3 rounded-xl hover:bg-primary hover:text-white transition-all"
                   >
                     <ArrowRight size={18} />
                   </Link>
                </div>
              </motion.div>
            ))
          ) : (
             <div className="col-span-full py-20 glass-panel text-center">
                <Store size={48} className="mx-auto text-text-dim mb-4" />
                <h3 className="text-xl font-black text-white">No se encontraron tiendas</h3>
                <p className="text-text-dim">Intenta con otro término de búsqueda.</p>
             </div>
          )}
        </div>
      ) : (
        <div className="h-[600px] rounded-[32px] overflow-hidden border border-white/5 shadow-2xl relative">
          <MapContainer 
            center={[-12.046374, -77.042793]} 
            zoom={12} 
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {filteredStores.map((store) => (
              <Marker 
                key={store.id} 
                position={[store.latitude || -12.04, store.longitude || -77.04]}
              >
                <Popup className="custom-popup">
                   <div className="p-2 min-w-[150px]">
                      <h4 className="font-black text-primary text-sm mb-1">{store.name}</h4>
                      <p className="text-[10px] text-slate-500 mb-3">{store.address}</p>
                      <Link 
                        to={`/store/${store.id}`}
                        className="block w-full text-center bg-primary text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest"
                      >
                        Ver Catálogo
                      </Link>
                   </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className="absolute top-6 left-6 z-[1000] bg-background/80 backdrop-blur-md p-4 rounded-2xl border border-white/10">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-black text-white uppercase tracking-widest">
                  {filteredStores.length} Sucursales Encontradas
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreList;
