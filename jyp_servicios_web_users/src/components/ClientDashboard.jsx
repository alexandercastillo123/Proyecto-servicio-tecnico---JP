import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, Calendar, ArrowRight, ShieldCheck, Zap, X, Filter, Store, MessageSquare, User, Target } from 'lucide-react';
import { clientService, messageService } from '../services/api';
import LocationPicker from './LocationPicker';
import { Link, useNavigate } from 'react-router-dom';
import TechnicianList from './TechnicianList';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  
  // Try to load from localStorage first
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : { 
      address: 'Lima Centro',
      lat: -12.046374, 
      lng: -77.042793 
    };
  });

  useEffect(() => {
    fetchData();
    // Auto-detect if it's the default location
    if (userLocation.lat === -12.046374 && userLocation.lng === -77.042793) {
       detectLocation();
    }
  }, []);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Ubicación Detectada'
          };
          updateLocation(newLoc);
          // Try to get address
          reverseGeocode(newLoc.lat, newLoc.lng);
        },
        (err) => console.log('Geolocation auto-detect failed'),
        { enableHighAccuracy: true }
      );
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        const newLoc = { lat, lng, address: data.display_name };
        updateLocation(newLoc);
      }
    } catch (e) {}
  };

  const updateLocation = (loc) => {
    setUserLocation(loc);
    localStorage.setItem('user_location', JSON.stringify(loc));
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [convsResp, apptsResp] = await Promise.all([
        messageService.getConversations(),
        clientService.getMyAppointments()
      ]);
      
      if (convsResp.data.exito) {
        setConversations(convsResp.data.resultado || []);
      }
      if (apptsResp.data.exito) {
        const appts = apptsResp.data.resultado || [];
        const active = appts.find(a => a.status === 'confirmed' || a.status === 'paid');
        setActiveAppointment(active);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recentTechChat = conversations.find(c => c.other_user_role === 'tech' || c.other_user_role === 'technician');

  return (
    <div className="max-w-6xl mx-auto space-y-10 font-outfit pb-20 animate-in fade-in duration-700">
      
      {/* ── PREMIUM HEADER (EXPLORAR TÉCNICOS) ────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowLocationModal(true)}
                className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary hover:bg-primary hover:text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-lg shadow-primary/10"
              >
                <Target size={12} className="animate-pulse" />
                {userLocation.address.split(',')[0]}
              </button>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Explorar <span className="text-primary">Técnicos</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-lg">
            Estamos buscando expertos cerca de tu zona actual para brindarte soporte inmediato.
          </p>
        </div>
        <div className="p-6 bg-primary/10 rounded-3xl text-primary shadow-xl border border-primary/20">
           <Zap size={40} />
        </div>
      </header>

      {/* ── ACTIVE SERVICE BANNER ─────────────────────────────────────────── */}
      {activeAppointment && (
        <div className="px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between shadow-xl gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
                <Clock size={28} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Tu servicio está listo</p>
                <h3 className="text-xl font-black text-white">{activeAppointment.serviceType || 'Servicio Técnico'}</h3>
                <p className="text-xs text-text-dim">Especialista: <span className="text-white font-bold">{activeAppointment.techName || 'Técnico'}</span></p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:flex-none text-right hidden sm:block">
                 <p className="text-[10px] font-black text-text-dim uppercase">Estado</p>
                 <p className="text-sm font-black text-primary uppercase">{activeAppointment.status}</p>
              </div>
              <button 
                onClick={() => navigate(`/chat?user=${activeAppointment.techId}`)}
                className="flex-1 md:flex-none bg-primary text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              >
                Ir al Chat
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── RECENT TECH BANNER ────────────────────────────────────────────── */}
      {recentTechChat && (
        <div className="px-4">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             onClick={() => navigate(`/chat?user=${recentTechChat.other_user_id}`)}
             className="bg-primary p-6 rounded-[32px] shadow-2xl shadow-primary/30 flex items-center gap-5 cursor-pointer group hover:scale-[1.02] transition-all relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-2xl border-2 border-white/10 relative z-10">
                 {recentTechChat.username?.[0]}
              </div>
              <div className="flex-1 relative z-10">
                 <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Última Consulta</p>
                 <h3 className="text-white font-black text-lg">{recentTechChat.username}</h3>
                 <p className="text-white/80 text-xs line-clamp-1">{recentTechChat.last_message}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl text-white group-hover:translate-x-1 transition-transform">
                 <ArrowRight size={20} />
              </div>
           </motion.div>
        </div>
      )}

      {/* ── TECHNICIAN LIST AREA ─────────────────────────────────────────── */}
      <main className="px-4 space-y-10">
        <div className="flex justify-between items-end">
           <h2 className="text-2xl font-black text-white px-2 flex items-center gap-3">
              Expertos Disponibles
              <ShieldCheck className="text-primary" size={24} />
           </h2>
        </div>
        <TechnicianList userLocation={userLocation} />
      </main>

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
              <button onClick={() => setShowLocationModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                    <MapPin size={24} />
                 </div>
                 <h3 className="text-2xl font-black text-white">Establecer Ubicación</h3>
              </div>
              <p className="text-slate-500 text-sm mb-8">Selecciona tu ubicación exacta en el mapa para ver técnicos cerca de ti.</p>
              
              <LocationPicker 
                onLocationSelect={(loc) => updateLocation(loc)}
                initialLocation={{ lat: userLocation.lat, lng: userLocation.lng }}
              />
              
              <button 
                onClick={() => setShowLocationModal(false)} 
                className="btn-primary w-full mt-8 py-5 text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30"
              >
                Confirmar Ubicación
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
