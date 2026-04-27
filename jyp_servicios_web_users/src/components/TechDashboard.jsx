import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, CheckCircle, Clock, AlertCircle, 
  DollarSign, User, MapPin, Power, Bell, 
  ChevronRight, MessageSquare, Star, ArrowRight, Zap
} from 'lucide-react';
import { techService, messageService, authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const TechDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [activeAppointment, setActiveAppointment] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [apptsResp, convsResp, profileResp] = await Promise.all([
        techService.getAppointments(),
        messageService.getConversations(),
        authService.getProfile()
      ]);
      
      if (apptsResp.data.exito) {
        const appts = apptsResp.data.resultado || [];
        setAppointments(appts);
        // Find active appointment (confirmed or paid)
        const active = appts.find(a => a.status === 'confirmed' || a.status === 'paid');
        setActiveAppointment(active);
      }
      if (convsResp.data.exito) setConversations(convsResp.data.resultado || []);
      if (profileResp.data.exito) {
        setIsAvailable(profileResp.data.resultado.is_available === 1);
        setUser(profileResp.data.resultado);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setTogglingAvailability(true);
    try {
      const resp = await techService.toggleAvailability(!isAvailable);
      if (resp.data.exito) {
        setIsAvailable(!isAvailable);
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
    } finally {
      setTogglingAvailability(false);
    }
  };

  const pendingProposals = appointments.filter(a => a.status === 'pending');
  const completedJobs = appointments.filter(a => a.status === 'completed');
  const activeConsultations = conversations.filter(c => c.other_user_role === 'client');
  const recentChat = activeConsultations[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-outfit pb-20 animate-in fade-in duration-500">
      
      {/* ── MOBILE PARITY HEADER ──────────────────────────────────────────── */}
      <header className="bg-surface p-6 rounded-[32px] border border-white/5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Zap size={24} className="text-primary" />
           </div>
           <div>
              <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Dashboard</p>
              <h1 className="text-xl font-black text-white">Hola, {user.names || 'Especialista'}</h1>
           </div>
        </div>

        <div className="flex items-center gap-6">
           {/* Availability Toggle - Mobile Design */}
           <div className={`hidden md:flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all ${isAvailable ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="text-right">
                 <p className={`text-[10px] font-black tracking-widest ${isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                    {isAvailable ? 'DISPONIBLE' : 'INACTIVO'}
                 </p>
                 <p className="text-[9px] text-text-dim font-bold">{isAvailable ? 'Visible en mapa' : 'Oculto del radar'}</p>
              </div>
              <button 
                onClick={handleToggleAvailability}
                disabled={togglingAvailability}
                className={`relative w-12 h-6 rounded-full transition-colors ${isAvailable ? 'bg-green-500' : 'bg-slate-700'}`}
              >
                 <motion.div 
                   animate={{ x: isAvailable ? 26 : 4 }}
                   className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                 />
              </button>
           </div>

           {/* Avatar */}
           <div 
             onClick={() => navigate('/profile')}
             className="w-12 h-12 rounded-full border-2 border-primary p-0.5 cursor-pointer hover:scale-105 transition-transform"
           >
              <div className="w-full h-full bg-surface rounded-full flex items-center justify-center text-primary font-black overflow-hidden">
                 {user.names?.[0] || <User size={20} />}
              </div>
           </div>
        </div>
      </header>

      {/* ── ACTIVE SERVICE BANNER ─────────────────────────────────────────── */}
      {activeAppointment && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/10 border border-primary/20 p-6 rounded-[32px] flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <Clock size={28} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Servicio en Curso</p>
              <h3 className="text-lg font-black text-white">{activeAppointment.serviceType || 'Mantenimiento Técnico'}</h3>
              <p className="text-xs text-text-dim">Cliente: <span className="text-white font-bold">{activeAppointment.clientName}</span></p>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/chat?user=${activeAppointment.clientId}`)}
            className="bg-primary text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            Ir al Chat
          </button>
        </motion.div>
      )}

      {/* ── 1. CONSULTAS DE CLIENTES ──────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-white px-2">Consultas de Clientes</h2>
        <div className="bg-surface rounded-[32px] p-4 border border-white/5 shadow-lg space-y-2">
          {isLoading ? (
            <div className="h-20 animate-pulse bg-white/5 rounded-2xl" />
          ) : activeConsultations.length === 0 ? (
            <p className="p-8 text-center text-text-dim font-bold text-sm italic">No hay consultas nuevas</p>
          ) : (
            activeConsultations.slice(0, 3).map((chat) => (
              <div 
                key={chat.other_user_id} 
                onClick={() => navigate(`/chat?user=${chat.other_user_id}`)}
                className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black">
                    {chat.username?.[0]}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{chat.username}</h4>
                    <div className="flex gap-1">
                       {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-yellow-500 text-yellow-500" />)}
                    </div>
                  </div>
                </div>
                {chat.unread_count > 0 ? (
                  <div className="bg-error text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {chat.unread_count}
                  </div>
                ) : <ChevronRight size={18} className="text-text-dim group-hover:translate-x-1 transition-transform" />}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── 2. PROPUESTAS DE CHAMBA ───────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-2">
           <h2 className="text-lg font-black text-white">Propuestas de Chamba</h2>
           {pendingProposals.length > 0 && (
              <span className="bg-error text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                {pendingProposals.length} NUEVAS
              </span>
           )}
        </div>
        <div className="bg-surface rounded-[32px] p-4 border border-white/5 shadow-lg space-y-2">
          {isLoading ? (
             <div className="h-20 animate-pulse bg-white/5 rounded-2xl" />
          ) : pendingProposals.length === 0 ? (
            <p className="p-8 text-center text-text-dim font-bold text-sm italic">No hay propuestas pendientes</p>
          ) : (
            pendingProposals.map((appt) => (
              <div key={appt.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-text-secondary">
                          <User size={18} />
                       </div>
                       <div>
                          <p className="text-white font-bold text-sm">{appt.clientName || 'Cliente'}</p>
                          <p className="text-[10px] text-text-dim font-black uppercase">{appt.serviceType}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-primary font-black">S/.{appt.price}</p>
                       <p className="text-[9px] text-text-dim font-bold">{appt.time}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="flex-1 py-3 bg-primary text-white text-xs font-black rounded-xl hover:scale-[1.02] transition-all">ACEPTAR</button>
                    <button className="flex-1 py-3 bg-white/5 text-white text-xs font-black rounded-xl hover:bg-white/10 transition-all">RECHAZAR</button>
                 </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── 3. TRABAJOS COMPLETADOS ───────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-primary px-2">Trabajos Completados</h2>
        <div className="bg-surface rounded-[32px] p-4 border border-white/5 shadow-lg space-y-2">
          {isLoading ? (
             <div className="h-20 animate-pulse bg-white/5 rounded-2xl" />
          ) : completedJobs.length === 0 ? (
            <p className="p-8 text-center text-text-dim font-bold text-sm italic">No hay trabajos completados</p>
          ) : (
            completedJobs.slice(0, 3).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-2xl">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border-2 border-primary/20 rounded-full flex items-center justify-center text-primary">
                       <User size={18} />
                    </div>
                    <div>
                       <h4 className="text-white font-bold text-sm">{job.clientName}</h4>
                       <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-yellow-500 text-yellow-500" />)}
                       </div>
                    </div>
                 </div>
                 <ChevronRight size={18} className="text-text-dim" />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── 4. RECENT CLIENT BANNER ───────────────────────────────────────── */}
      {recentChat && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/chat?user=${recentChat.other_user_id}`)}
          className="bg-primary p-5 rounded-[28px] shadow-2xl shadow-primary/30 flex items-center justify-between cursor-pointer group hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xl border-2 border-white/10">
                {recentChat.username?.[0]}
             </div>
             <div>
                <h3 className="text-white font-black">{recentChat.username}</h3>
                <p className="text-white/70 text-xs line-clamp-1">{recentChat.last_message}</p>
             </div>
          </div>
          {recentChat.unread_count > 0 ? (
             <div className="bg-white text-primary w-6 h-6 rounded-full flex items-center justify-center font-black text-xs">
                {recentChat.unread_count}
             </div>
          ) : <ArrowRight size={20} className="text-white group-hover:translate-x-1 transition-transform" />}
        </motion.div>
      )}

    </div>
  );
};

export default TechDashboard;
