import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, CheckCircle2, Clock, AlertCircle,
  DollarSign, User, MapPin, Power, Bell,
  ChevronRight, MessageSquare, Star, ArrowRight, Cpu,
  TrendingUp, Wrench, Activity, Sparkles, ShieldCheck
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { techService, messageService, authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { TechLoader } from "./common/TechLoader";

/* ── Status color map ──────────────────────────────────────────── */
const STATUS = {
  pending:    { label: "Pendiente",   cls: "status-badge status-pending" },
  confirmed:  { label: "Confirmada",  cls: "status-badge status-confirmed" },
  completed:  { label: "Completada",  cls: "status-badge status-completed" },
  cancelled:  { label: "Cancelada",   cls: "status-badge status-cancelled" },
  in_progress:{ label: "En progreso", cls: "status-badge status-in_progress" },
  on_the_way: { label: "En camino",   cls: "status-badge status-on_the_way" },
  arrived:    { label: "En sitio",    cls: "status-badge status-arrived" },
  paid:       { label: "Pagada",      cls: "status-badge status-completed" },
};

/* ── Stat Card Component ───────────────────────────────────────── */
/* ── Stat Card Component ───────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sublabel, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="glass-card p-7 rounded-3xl flex items-center gap-5 relative overflow-hidden shadow-lg hover:shadow-xl transition-all border border-white/10"
  >
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}35`,
        color: color
      }}
    >
      <Icon size={24} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p 
        className="text-2xl sm:text-3xl font-black text-white leading-tight mt-1" 
        style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-[11px] font-medium text-slate-400 mt-1.5 truncate">
          {sublabel}
        </p>
      )}
    </div>
  </motion.div>
);

/* ── Appointment Row Component ─────────────────────────────────── */
const ApptRow = ({ appt, navigate }) => {
  const st = STATUS[appt.status] || { label: appt.status, cls: "status-badge" };
  const clientName = appt.clientName || appt.client_name || "Cliente Solicitante";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-5 sm:p-6 rounded-3xl cursor-pointer group hover:border-blue-500/40 hover:shadow-xl transition-all duration-200"
      onClick={() => navigate(`/appointments/${appt.id}`)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: "rgba(37, 99, 235, 0.15)", color: "#38BDF8", border: "1px solid rgba(37, 99, 235, 0.3)" }}
          >
            <Wrench size={20} />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors">
              {appt.serviceType || appt.service_type || "Mantenimiento & Reparación"}
            </h4>
            <p className="text-xs text-slate-400 truncate mt-1">
              Cliente: <span className="text-slate-300 font-semibold">{clientName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`${st.cls} rounded-full px-3 py-1 text-xs font-bold`}>{st.label}</span>
          <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-transform" />
        </div>
      </div>

      {appt.scheduled_at && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
          <Clock size={13} className="text-cyan-400 shrink-0" />
          <span>{new Date(appt.scheduled_at).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}</span>
          {appt.location_address && (
            <>
              <span className="text-slate-600">·</span>
              <MapPin size={13} className="text-blue-400 shrink-0" />
              <span className="truncate max-w-[280px]">{appt.location_address}</span>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ── Main Tech Dashboard ───────────────────────────────────────── */
const TechDashboard = () => {
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [appointments, setAppointments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [activeAppointment, setActiveAppointment] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    if (!socketService) return;
    const u1 = socketService.on("appointment_created", fetchDashboardData);
    const u2 = socketService.on("appointment_progress", fetchDashboardData);
    const u3 = socketService.on("receive_message", () => {
      messageService.getConversations().then(r => {
        if (r.data.exito) setConversations(r.data.resultado || []);
      }).catch(() => {});
    });
    return () => { u1(); u2(); u3(); };
  }, [socketService]);

  const fetchDashboardData = async () => {
    try {
      const [apptsResp, convsResp, profileResp] = await Promise.all([
        techService.getAppointments().catch(() => ({ data: {} })),
        messageService.getConversations().catch(() => ({ data: {} })),
        authService.getProfile().catch(() => ({ data: {} })),
      ]);
      if (apptsResp.data?.exito) {
        const appts = apptsResp.data.resultado || [];
        setAppointments(appts);
        setActiveAppointment(appts.find(a => ["confirmed", "paid", "in_progress", "on_the_way"].includes(a.status)));
      }
      if (convsResp.data?.exito) setConversations(convsResp.data.resultado || []);
      if (profileResp.data?.exito) {
        setIsAvailable(profileResp.data.resultado.is_available === 1);
        setUser(profileResp.data.resultado);
      }
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const handleToggleAvailability = async () => {
    setTogglingAvailability(true);
    try {
      const res = await techService.toggleAvailability(!isAvailable);
      if (res.data?.exito) setIsAvailable(!isAvailable);
    } catch (err) { console.error(err); }
    finally { setTogglingAvailability(false); }
  };

  const pending   = appointments.filter(a => a.status === "pending");
  const confirmed = appointments.filter(a => ["confirmed", "paid", "in_progress"].includes(a.status));
  const completed = appointments.filter(a => a.status === "completed");
  const totalEarned = completed.reduce((s, a) => s + (parseFloat(a.price) || 85), 0);
  const todayAppts = appointments.filter(a => {
    if (!a.scheduled_at) return false;
    const d = new Date(a.scheduled_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  // Mock weekly performance telemetry for recharts
  const weeklyData = [
    { day: 'Lun', reparaciones: 3 },
    { day: 'Mar', reparaciones: 5 },
    { day: 'Mié', reparaciones: 4 },
    { day: 'Jue', reparaciones: 6 },
    { day: 'Vie', reparaciones: completed.length > 5 ? completed.length : 7 },
    { day: 'Sáb', reparaciones: 4 },
    { day: 'Dom', reparaciones: 2 },
  ];

  if (isLoading) {
    return (
      <TechLoader 
        title="Iniciando Consola de Especialista" 
        subtitle="Sincronizando órdenes de servicio y telemetría..." 
      />
    );
  }

  return (
    <div className="w-full space-y-10 pb-4" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── WORKSTATION HEADER ─────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 sm:p-12 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden shadow-2xl border border-cyan-500/25"
        style={{
          background: "linear-gradient(135deg, rgba(13, 22, 41, 0.85) 0%, rgba(6, 9, 19, 0.95) 100%)",
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Terminal Técnico
            </span>
            <span className="text-xs font-medium text-slate-400">Lima Metropolitana</span>
          </div>

          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-heading"
          >
            Hola, <span className="gradient-tech">{user?.names?.split(" ")[0] || "Especialista"}</span> 👋
          </h1>

          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            {todayAppts.length > 0 
              ? `Tienes ${todayAppts.length} cita${todayAppts.length > 1 ? "s" : ""} programada${todayAppts.length > 1 ? "s" : ""} para hoy.` 
              : "No tienes citas para hoy. Mantén tu disponibilidad activa para recibir solicitudes en tu zona."}
          </p>
        </div>

        {/* Availability Switch */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleAvailability}
            disabled={togglingAvailability}
            className="flex items-center gap-3 px-6 py-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 border shadow-lg hover:scale-105 active:scale-95"
            style={{
              background: isAvailable ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.05)",
              borderColor: isAvailable ? "rgba(16, 185, 129, 0.4)" : "var(--border)",
              color: isAvailable ? "#34D399" : "var(--text-secondary)",
              boxShadow: isAvailable ? "0 0 25px rgba(16, 185, 129, 0.25)" : "none",
            }}
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                background: isAvailable ? "#10B981" : "#64748B",
                boxShadow: isAvailable ? "0 0 10px #10B981" : "none",
              }}
            />
            <span>
              {togglingAvailability 
                ? "Actualizando..." 
                : isAvailable ? "En Línea (Radar Activo)" : "Fuera de Servicio"}
            </span>
          </button>
        </div>
      </motion.header>

      {/* ── ACTIVE SERVICE BANNER ──────────────────────────── */}
      {activeAppointment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 sm:p-10 rounded-[32px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl border border-blue-500/35"
          style={{
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)",
            boxShadow: "0 15px 35px rgba(37, 99, 235, 0.15)",
          }}
        >
          <div className="flex items-center gap-5">
              <div 
                className="w-16 h-16 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-lg bg-gradient-to-br from-blue-600 to-cyan-500"
              >
              <Clock size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  Orden de Trabajo en Progreso
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {activeAppointment.serviceType || activeAppointment.service_type || "Mantenimiento Técnico"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Cliente: <span className="text-white font-bold">{activeAppointment.clientName || activeAppointment.client_name || "Cliente JyP"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate(`/appointments/${activeAppointment.id}`)}
              className="btn-ghost flex-1 md:flex-none text-xs font-bold py-3.5 px-5 rounded-2xl"
            >
              Gestionar Estado
            </button>
            <button
              onClick={() => navigate(`/chat?user=${activeAppointment.clientId || activeAppointment.client_id}`)}
              className="btn-primary flex-1 md:flex-none text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-2xl shadow-lg"
            >
              <MessageSquare size={16} />
              <span>Chat con Cliente</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── STATS COUNTERS GRID ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={AlertCircle} 
          label="Solicitudes Pendientes"  
          value={pending.length} 
          sublabel="Requieren confirmación"
          color="#F59E0B" 
          delay={0.05} 
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Citas Confirmadas" 
          value={confirmed.length} 
          sublabel="En agenda técnica"
          color="#3B82F6" 
          delay={0.10} 
        />
        <StatCard 
          icon={Calendar}    
          label="Programadas Hoy" 
          value={todayAppts.length} 
          sublabel="Atención prioritaria"
          color="#10B981" 
          delay={0.15} 
        />
        <StatCard 
          icon={DollarSign}  
          label="Ingresos Estimados"      
          value={`S/. ${totalEarned.toFixed(0)}`} 
          sublabel="Servicios completados"
          color="#8B5CF6" 
          delay={0.20} 
        />
      </div>

      {/* ── TELEMETRY & PERFORMANCE SECTION ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Chart */}
        <div className="lg:col-span-2 glass-card p-9 rounded-[32px] space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Rendimiento Semanal de Reparaciones
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/5">
              Últimos 7 días
            </span>
          </div>

          <div className="h-60 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRepairs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0B1120', 
                    borderColor: 'rgba(59, 130, 246, 0.4)', 
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="reparaciones" 
                  stroke="#38BDF8" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRepairs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Client Messages */}
        <div className="glass-card p-8 rounded-[32px] space-y-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <MessageSquare size={16} />
                </div>
                <h3 className="text-base font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  Consultas Recientes
                </h3>
              </div>
              <button
                onClick={() => navigate("/chat")}
                className="text-xs font-bold text-blue-400 hover:text-white px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-all"
              >
                Ver Chat
              </button>
            </div>

            <div className="space-y-3">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Sin mensajes nuevos
                </p>
              ) : (
                conversations.slice(0, 3).map((conv, i) => (
                  <div
                    key={conv.conversation_id || i}
                    onClick={() => navigate(`/chat?user=${conv.other_user_id}`)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-3.5 border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm">
                      {conv.username?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{conv.username}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.last_message || "Iniciar chat..."}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-3 mt-4">
            <ShieldCheck size={18} className="shrink-0 text-cyan-400" />
            <span>Responde en menos de 15 min para mantener tu insignia PRO.</span>
          </div>
        </div>
      </div>

      {/* ── APPOINTMENTS LIST ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            <span>Órdenes de Servicio Recientes</span>
          </h2>
          <button
            onClick={() => navigate("/appointments")}
            className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1"
          >
            <span>Ver Todas ({appointments.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="glass-card text-center py-12 rounded-3xl space-y-2">
              <Wrench size={32} className="text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No tienes citas programadas</p>
              <p className="text-xs text-slate-400">
                Mantén tu disponibilidad activa para que los clientes en tu radio puedan agendar.
              </p>
            </div>
          ) : (
            appointments.slice(0, 5).map((appt) => (
              <ApptRow key={appt.id} appt={appt} navigate={navigate} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TechDashboard;
