import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Calendar, ArrowRight, ShieldCheck, Zap, X, Filter, Map as MapIcon, Link as LinkIcon } from 'lucide-react';
import { clientService } from '../services/api';
import LocationPicker from './LocationPicker';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const [technicians, setTechnicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState({ 
    address: 'Lima, Perú',
    lat: -12.046374, 
    lng: -77.042793 
  });

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const response = await clientService.getTechnicians();
      if (response.data.success) {
        setTechnicians(response.data.data.technicians || []);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTechs = technicians.filter(tech => 
    (tech.names + ' ' + tech.surnames).toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <section className="relative h-[400px] rounded-[32px] overflow-hidden flex items-center px-8 md:px-16 group border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background z-0" />
        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block opacity-20 z-0">
          <div className="absolute inset-0 bg-gradient-to-l from-background to-transparent z-10" />
          <img 
            src="/assets/hero.png" 
            alt="Hero" 
            className="w-full h-full object-cover grayscale brightness-50"
          />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap size={12} fill="currentColor" />
                Soporte Premium
              </span>
              <button 
                onClick={() => setShowLocationModal(true)}
                className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-text-secondary hover:text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all"
              >
                <MapPin size={12} className="text-primary" />
                {userLocation.address.split(',')[0]}
              </button>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
              Servicios técnicos <br />
              de <span className="gradient-text italic">confianza</span>.
            </h1>
            
            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
                <input 
                  type="text"
                  placeholder="¿Qué servicio o ciudad buscas?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full input-field py-5 pl-12 pr-4 text-base"
                />
              </div>
              <Link to="/technicians" className="btn-primary px-10 py-5 text-base">
                Ver Mapa
                <MapIcon size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Stats/Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {[
          { icon: ShieldCheck, title: 'Técnicos Verificados', desc: 'Validación rigurosa de identidad y experiencia.' },
          { icon: Calendar, title: 'Agenda Flexible', desc: 'Reserva citas según tu disponibilidad real.' },
          { icon: Zap, title: 'Respuesta Rápida', desc: 'Recibe cotizaciones en minutos vía chat.' }
        ].map((item, i) => (
          <div key={i} className="glass-card p-6 border-white/5 flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <item.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-text-dim leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Especialistas Destacados</h2>
            <p className="text-text-dim text-sm">Cerca de {userLocation.address.split(',')[0]}</p>
          </div>
          <Link to="/technicians" className="text-primary text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
            Ver todos los técnicos
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="glass-card h-80 animate-pulse" />
            ))
          ) : (
            filteredTechs.map((tech) => (
              <motion.div 
                key={tech.id}
                layoutId={`tech-${tech.id}`}
                onClick={() => setSelectedTech(tech)}
                className="glass-card p-6 flex flex-col cursor-pointer group hover:bg-white/[0.03]"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-tr from-primary to-[#6E5FFF] rounded-[24px] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {tech.names?.[0]}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-success w-6 h-6 rounded-full border-4 border-surface shadow-sm" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
                  {tech.names} {tech.surnames}
                </h3>
                <p className="text-primary/70 text-xs font-black uppercase tracking-widest mb-4">
                  {tech.city || 'Técnico General'}
                </p>

                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-1 text-warning bg-warning/5 px-2 py-1 rounded-lg">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-black">{tech.rating || '4.5'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-text-dim bg-white/5 px-2 py-1 rounded-lg">
                    <MapPin size={14} />
                    <span className="text-xs font-bold">{tech.city || 'Lima'}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-text-dim text-[10px] font-black uppercase tracking-widest">Desde S/.30.00</span>
                  <div className="bg-primary/10 text-primary p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-xl p-8 relative"
            >
              <button 
                onClick={() => setShowLocationModal(false)}
                className="absolute top-6 right-6 text-text-dim hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-black mb-2">Establecer Ubicación</h3>
              <p className="text-text-dim text-sm mb-8">Dinos dónde necesitas el servicio para mostrarte técnicos cerca de ti.</p>
              
              <LocationPicker 
                onLocationSelect={(loc) => {
                  setUserLocation(loc);
                  // In a real app, we would update the technicians list based on new coords
                }}
                initialLocation={{ lat: userLocation.lat, lng: userLocation.lng }}
              />
              
              <button 
                onClick={() => setShowLocationModal(false)}
                className="btn-primary w-full mt-8 py-4"
              >
                Confirmar Ubicación
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tech Details Modal (Partial paridad with mobile) */}
      <AnimatePresence>
        {selectedTech && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
            <motion.div 
              layoutId={`tech-${selectedTech.id}`}
              className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto relative no-scrollbar"
            >
              <button 
                onClick={() => setSelectedTech(null)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all z-10"
              >
                <X size={24} />
              </button>

              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
                  <div className="w-32 h-32 bg-primary rounded-[32px] flex items-center justify-center text-white text-5xl font-black shadow-[0_20px_40px_rgba(59,40,255,0.4)]">
                    {selectedTech.names?.[0]}
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-black text-white mb-2">{selectedTech.names} {selectedTech.surnames}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                      <div className="flex items-center gap-1 text-warning font-black bg-warning/5 px-3 py-1.5 rounded-full border border-warning/10 text-xs text-sm">
                        <Star size={14} fill="currentColor" />
                        4.8 (124 reseñas)
                      </div>
                      <div className="flex items-center gap-1 text-primary font-black bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 text-xs">
                        <MapPin size={14} />
                        {selectedTech.city}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-3">Dirección de Referencia</h4>
                      <p className="text-white font-medium">{selectedTech.reference_address || (selectedTech.city + ', Perú')}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-3">DNI / RUC</h4>
                      <p className="text-white font-medium">{selectedTech.dni || selectedTech.ruc || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className="glass-card p-6 border-white/5 bg-white/[0.02]">
                    <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4">Información de Contacto</h4>
                    <p className="text-sm text-text-secondary mb-2">Teléfono: <span className="text-white font-bold">{selectedTech.phone}</span></p>
                    <p className="text-sm text-text-secondary">Email: <span className="text-white font-bold">{selectedTech.email}</span></p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <Link 
                    to={`/appointments/schedule?tech=${selectedTech.id}`}
                    className="flex-1 btn-primary py-5"
                  >
                    <Calendar size={20} />
                    Agendar Cita
                  </Link>
                  <Link 
                    to={`/chat?user=${selectedTech.id}`}
                    className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={20} />
                    Enviar Mensaje
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
