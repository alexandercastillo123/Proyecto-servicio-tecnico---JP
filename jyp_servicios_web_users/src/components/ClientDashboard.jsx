import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Calendar, ArrowRight, ShieldCheck, Zap, X, Filter } from 'lucide-react';
import { clientService } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ClientDashboard = () => {
  const [technicians, setTechnicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const response = await clientService.getTechnicians();
      if (response.success) {
        setTechnicians(response.data);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTechs = technicians.filter(tech => 
    (tech.names + ' ' + tech.surnames).toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.profession?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 font-outfit pb-20">
      {/* Hero Section */}
      <section className="relative h-[450px] rounded-[40px] overflow-hidden flex items-center px-8 md:px-16 group">
        <img 
          src="/assets/hero_client.png" 
          alt="Technical Service" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05060A] via-[#05060A]/60 to-transparent" />
        
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B28FF]/20 border border-[#3B28FF]/30 rounded-full text-[#3B28FF] text-xs font-black uppercase tracking-widest mb-6">
              <Zap size={14} fill="currentColor" />
              Soporte Inmediato
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              Expertos a un <span className="gradient-text">click</span> de distancia.
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Encuentra los técnicos más calificados en tu zona, verificados por nuestra comunidad.
            </p>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text"
                  placeholder="¿Qué servicio necesitas?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B28FF]/50 transition-all"
                />
              </div>
              <button className="bg-[#3B28FF] hover:bg-[#1E0ED6] text-white px-10 py-5 rounded-2xl font-black shadow-[0_8px_30px_rgb(59,40,255,0.3)] transition-all flex items-center justify-center gap-2">
                Buscar Ahora
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Especialistas Destacados</h2>
            <p className="text-slate-400">Resultados encontrados: {filteredTechs.length}</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl gap-1 border border-white/5">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-[#3B28FF] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Lista
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-[#3B28FF] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Mapa
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <div key={i} className="glass-card h-80 animate-pulse bg-white/5" />
                ))
              ) : (
                filteredTechs.map((tech) => (
                  <motion.div 
                    key={tech.id}
                    layoutId={`tech-${tech.id}`}
                    onClick={() => setSelectedTech(tech)}
                    className="glass-card p-6 flex flex-col cursor-pointer group"
                  >
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-tr from-[#3B28FF] to-[#6E5FFF] rounded-[24px] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                        {tech.names?.[0]}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#05060A] shadow-sm" title="Disponible" />
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#3B28FF] transition-colors">
                      {tech.names} {tech.surnames}
                    </h3>
                    <p className="text-blue-400 text-sm font-medium mb-4 flex items-center gap-1.5">
                      <Zap size={14} fill="currentColor" />
                      {tech.profession || 'Técnico General'}
                    </p>

                    <div className="flex gap-4 mb-6">
                      <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">
                        <Star size={14} fill="currentColor" />
                        <span className="text-xs font-black">4.8</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 bg-white/5 px-2 py-1 rounded-lg">
                        <MapPin size={14} />
                        <span className="text-xs font-bold">{tech.city || 'Ciudad'}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Desde $25.00</span>
                      <div className="bg-[#3B28FF]/10 text-[#3B28FF] p-2 rounded-xl group-hover:bg-[#3B28FF] group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-[600px] rounded-[40px] overflow-hidden border border-white/10 relative"
            >
              <MapContainer center={[-12.0463, -77.0427]} zoom={13} style={{ height: '100%', width: '100%', background: '#05060A' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {filteredTechs.map(tech => (
                  <Marker 
                    key={tech.id} 
                    position={[tech.latitude || -12.0463, tech.longitude || -77.0427]}
                    eventHandlers={{
                      click: () => setSelectedTech(tech),
                    }}
                  >
                    <Popup>
                      <div className="p-2 font-outfit">
                        <h4 className="font-black text-slate-900">{tech.names}</h4>
                        <p className="text-xs text-slate-600">{tech.profession}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tech Details Modal */}
      <AnimatePresence>
        {selectedTech && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#05060A]/90 backdrop-blur-sm"
          >
            <motion.div 
              layoutId={`tech-${selectedTech.id}`}
              className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto relative no-scrollbar"
            >
              <button 
                onClick={() => setSelectedTech(null)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all z-10"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 p-10 bg-gradient-to-b from-white/5 to-transparent">
                  <div className="w-32 h-32 bg-[#3B28FF] rounded-[32px] flex items-center justify-center text-white text-5xl font-black mb-6 shadow-[0_20px_40px_rgba(59,40,255,0.4)]">
                    {selectedTech.names?.[0]}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">{selectedTech.names} {selectedTech.surnames}</h3>
                  <div className="flex items-center gap-2 text-[#3B28FF] font-black uppercase tracking-widest text-xs mb-8">
                    <Zap size={16} fill="currentColor" />
                    {selectedTech.profession || 'Especialista'}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                      <span className="text-slate-400 text-sm">Rating</span>
                      <div className="flex items-center gap-1 text-amber-400 font-black">
                        <Star size={16} fill="currentColor" />
                        4.8
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                      <span className="text-slate-400 text-sm">Trabajos</span>
                      <span className="text-white font-black">124</span>
                    </div>
                  </div>
                </div>

                <div className="md:w-2/3 p-10">
                  <div className="mb-8">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Sobre el técnico</h4>
                    <p className="text-slate-300 leading-relaxed italic">
                      "Especialista con más de 10 años de experiencia en reparaciones domésticas e industriales. Comprometido con la calidad y la rapidez."
                    </p>
                  </div>

                  <div className="mb-10">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Ubicación</h4>
                    <div className="flex items-center gap-2 text-white">
                      <MapPin size={20} className="text-[#3B28FF]" />
                      <span className="font-bold">{selectedTech.city || 'Lima, Perú'}</span>
                      <span className="text-slate-500">• {selectedTech.address || 'Av. Principal 123'}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 py-5 bg-[#3B28FF] hover:bg-[#1E0ED6] text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                      <Calendar size={20} />
                      Agendar Cita
                    </button>
                    <button className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all">
                      Enviar Mensaje
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
