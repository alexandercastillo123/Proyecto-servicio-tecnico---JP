import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Star, Calendar, ArrowRight, ShieldCheck, 
  Zap, X, Filter, Store, MessageSquare, User, Target, Clock,
  Cpu, Monitor, Server, Wrench, HardDrive, Wifi, Sparkles, Navigation,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { clientService, messageService } from '../services/api';
import LocationPicker from './LocationPicker';
import { Link, useNavigate } from 'react-router-dom';
import TechnicianList from './TechnicianList';
import { useSocket } from '../context/SocketContext';
import { TechLoader, RadarIndicator } from './common/TechLoader';

const SERVICE_CATEGORIES = [
  { id: 'all', label: 'Todos los Servicios', icon: Sparkles },
  { id: 'pc', label: 'Laptops & PCs', icon: Monitor },
  { id: 'electronics', label: 'Microelectrónica', icon: Cpu },
  { id: 'servers', label: 'Servidores & Redes', icon: Server },
  { id: 'storage', label: 'Recuperación de Datos', icon: HardDrive },
  { id: 'maintenance', label: 'Mantenimiento Preventivo', icon: Wrench },
];

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  
  // Try to load from localStorage first
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : { 
      address: 'Lima Centro, Perú',
      lat: -12.046374, 
      lng: -77.042793 
    };
  });

  useEffect(() => {
    fetchData();
    if (userLocation.lat === -12.046374 && userLocation.lng === -77.042793) {
       detectLocation();
    }
  }, []);

  // Listen to socket events for real-time dashboard refresh
  useEffect(() => {
    if (!socketService) return;

    const unsubApptProgress = socketService.on('appointment_progress', () => {
      fetchData();
    });

    const unsubApptCreated = socketService.on('appointment_created', () => {
      fetchData();
    });

    const unsubMsg = socketService.on('receive_message', () => {
      messageService.getConversations().then(r => {
        if (r.data.exito) setConversations(r.data.resultado || []);
      }).catch(() => {});
    });

    return () => {
      unsubApptProgress();
      unsubApptCreated();
      unsubMsg();
    };
  }, [socketService]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Ubicación Detectada (GPS)'
          };
          updateLocation(newLoc);
          reverseGeocode(newLoc.lat, newLoc.lng);
        },
        () => console.log('Geolocation auto-detect failed'),
        { enableHighAccuracy: true }
      );
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        const shortAddr = data.display_name.split(',').slice(0, 2).join(',');
        const newLoc = { lat, lng, address: shortAddr || data.display_name };
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
        messageService.getConversations().catch(() => ({ data: {} })),
        clientService.getMyAppointments().catch(() => ({ data: {} }))
      ]);
      
      if (convsResp.data?.exito) {
        setConversations(convsResp.data.resultado || []);
      }
      if (apptsResp.data?.exito) {
        const appts = apptsResp.data.resultado || [];
        const active = appts.find(a => 
          ['confirmed', 'paid', 'in_progress', 'on_the_way'].includes(a.status)
        );
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
    <div className="max-w-6xl mx-auto space-y-8 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── HERO BANNER WITH CINEMATIC TECH BACKGROUND ─────────── */}
      <div 
        className="glass-card p-6 sm:p-8 md:p-10 rounded-3xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(13, 22, 41, 0.85) 0%, rgba(6, 9, 19, 0.95) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(37, 99, 235, 0.15)",
        }}
      >
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 bg-tech-circuit opacity-60 pointer-events-none" 
        />
        {/* Glowing orb */}
        <div 
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 70%)", filter: "blur(60px)" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Location selector pill */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setShowLocationModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                style={{
                  background: 'rgba(37, 99, 235, 0.18)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60A5FA'
                }}
              >
                <Target size={13} className="text-cyan-400 animate-pulse" />
                <span>{userLocation.address.split(',')[0]}</span>
                <span className="text-[10px] text-blue-300 uppercase underline ml-1 font-semibold">Cambiar</span>
              </button>

              <RadarIndicator label="Radar de Técnicos Activo" />
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              Hola, <span className="gradient-tech">{user?.names?.split(' ')[0] || user?.username || 'Cliente'}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Solicita asistencia técnica en tiempo real. Conectamos tu necesidad de hardware con especialistas certificados con garantía de 7 días.
            </p>
          </div>

          {/* Quick Schedule CTA button */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/appointments/schedule')}
              className="btn-primary py-3.5 px-6 shadow-xl text-center"
              style={{ borderRadius: 14 }}
            >
              <Calendar size={18} />
              <span>Agendar Reparación</span>
            </button>
            <Link
              to="/stores"
              className="btn-ghost py-3.5 px-6 text-center text-xs font-bold"
              style={{ borderRadius: 14 }}
            >
              <Store size={16} />
              <span>Ver Tiendas & Talleres</span>
            </Link>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="relative z-10 pt-8 border-t border-white/10 mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {SERVICE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200"
                style={{
                  background: isSelected ? "rgba(37, 99, 235, 0.3)" : "rgba(255, 255, 255, 0.05)",
                  border: isSelected ? "1px solid rgba(59, 130, 246, 0.6)" : "1px solid rgba(255, 255, 255, 0.08)",
                  color: isSelected ? "#38BDF8" : "var(--text-secondary)",
                }}
              >
                <Icon size={14} className={isSelected ? "text-cyan-400" : "text-slate-400"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE SERVICE BANNER ───────────────────────────────── */}
      {activeAppointment && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 sm:p-7 rounded-3xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.35)",
            boxShadow: "0 15px 35px rgba(37, 99, 235, 0.15)",
          }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
                style={{ background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)" }}
              >
                <Clock size={28} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    Servicio Activo en Progreso
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h3 className="text-xl font-black text-white">
                  {activeAppointment.serviceType || 'Mantenimiento Especializado'}
                </h3>
                <p className="text-xs text-slate-300">
                  Especialista asignado: <span className="text-white font-bold">{activeAppointment.techName || 'Técnico JyP'}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={() => navigate(`/appointments/${activeAppointment.id}`)}
                className="btn-ghost flex-1 lg:flex-none text-xs font-bold py-3"
              >
                Ver Detalle & Ruta
              </button>
              <button 
                onClick={() => navigate(`/chat?user=${activeAppointment.techId}`)}
                className="btn-primary flex-1 lg:flex-none text-xs font-black uppercase tracking-wider py-3"
              >
                <MessageSquare size={15} />
                <span>Chat Directo</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── RECENT CONSULTATION BANNER ──────────────────────────── */}
      {recentTechChat && !activeAppointment && (
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/chat?user=${recentTechChat.other_user_id}`)}
          className="glass-card p-5 rounded-2xl flex items-center gap-4 cursor-pointer group hover:border-blue-500/50 transition-all"
        >
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%)" }}
          >
            {recentTechChat.username?.[0]?.toUpperCase() || "T"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-0.5">
              Última Consulta Técnica
            </span>
            <h4 className="text-sm font-bold text-white truncate">{recentTechChat.username}</h4>
            <p className="text-xs text-slate-400 line-clamp-1">{recentTechChat.last_message || 'Abrir conversación...'}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400">
            <ArrowRight size={16} />
          </div>
        </motion.div>
      )}

      {/* ── TECHNICIAN LIST AREA ────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <span>Especialistas Disponibles en tu Zona</span>
              <ShieldCheck className="text-cyan-400" size={22} />
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Filtra y visualiza la ubicación de técnicos certificados listos para acudir a domicilio o recibir tu equipo.
            </p>
          </div>
        </div>

        {/* Technician List Component */}
        <TechnicianList 
          userLocation={userLocation} 
          onLocationUpdate={updateLocation}
        />
      </section>

      {/* ── LOCATION SELECTOR MODAL ─────────────────────────────── */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-xl p-6 sm:p-8 rounded-3xl relative"
            >
              <button 
                onClick={() => setShowLocationModal(false)} 
                className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-400"
                  style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                >
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Fijar Ubicación de Servicio</h3>
                  <p className="text-xs text-slate-400">Ubica tu punto de referencia en el mapa interactivo.</p>
                </div>
              </div>
              
              <div className="mt-5 rounded-2xl overflow-hidden border border-white/10">
                <LocationPicker 
                  onLocationSelect={(loc) => updateLocation(loc)}
                  initialLocation={{ lat: userLocation.lat, lng: userLocation.lng }}
                />
              </div>
              
              <button 
                onClick={() => setShowLocationModal(false)} 
                className="btn-primary w-full mt-6 py-4 font-black uppercase tracking-wider text-xs shadow-xl"
              >
                Confirmar y Actualizar Radar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
