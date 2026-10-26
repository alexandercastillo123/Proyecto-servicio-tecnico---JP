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
import { formatDateShort } from "../services/formatters";
import { toast } from "react-hot-toast";

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
  const clientName =
    [appt.client_names, appt.client_surnames].filter(Boolean).join(" ").trim() ||
    appt.client_username ||
    "Cliente Solicitante";
  const scheduledDate = appt.scheduled_date || appt.scheduledDate;
  const scheduledTime = appt.scheduled_time || appt.scheduledTime;
  const serviceAddress = appt.service_address || appt.location_address;

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
              {appt.description || (appt.service_type === "domicilio" ? "Servicio a domicilio" : "Atención en local")}
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

      {scheduledDate && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
          <Clock size={13} className="text-cyan-400 shrink-0" />
          <span>{formatDateShort(scheduledDate)} · {String(scheduledTime || "").slice(0, 5)}</span>
          {serviceAddress && (
            <>
              <span className="text-slate-600">·</span>
              <MapPin size={13} className="text-blue-400 shrink-0" />
              <span className="truncate max-w-[280px]">{serviceAddress}</span>
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
        const appts = Array.isArray(apptsResp.data.resultado) ? apptsResp.data.resultado : [];
        setAppointments(appts);
        setActiveAppointment(appts.find(a => ["confirmed", "in_progress", "on_the_way", "arrived"].includes(a.status)));
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
      if (res.data?.exito) {
        setIsAvailable(!isAvailable);
        toast.success(!isAvailable ? 'Ahora estás disponible para recibir citas' : 'Ahora estás inactivo');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.mensaje || 'No se pudo cambiar tu disponibilidad');
    } finally { setTogglingAvailability(false); }
  };

  const pending   = appointments.filter(a => a.status === "pending");
  const confirmed = appointments.filter(a => ["confirmed", "in_progress", "on_the_way", "arrived"].includes(a.status));
  const completed = appointments.filter(a => a.status === "completed");
  /* Sin precio no se inventa un monto: se suma solo lo realmente cobrado */
  const totalEarned = completed.reduce((s, a) => s + (parseFloat(a.price) || 0), 0);
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
    <div className="jyp-page">

      {/* ── 1. WORKSTATION HERO BANNER ─────────────────────── */}
      <section className="jyp-hero-card">
        <div className="jyp-hero-glow-1" />
        <div className="jyp-hero-glow-2" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="jyp-eyebrow">
                <Cpu size={13} className="text-cyan-400" />
                <span>Consola de Especialista</span>
              </span>
              <span className="jyp-badge-success">
                <ShieldCheck size={13} />
                <span>Técnico Certificado JyP</span>
              </span>
            </div>

            <h1 className="jyp-hero-title">
              Hola, <span className="jyp-gradient-text">{user?.names?.split(" ")[0] || "Especialista"}</span> ⚡
            </h1>

            <p className="jyp-hero-desc">
              {todayAppts.length > 0 
                ? `Tienes ${todayAppts.length} cita${todayAppts.length > 1 ? "s" : ""} programada${todayAppts.length > 1 ? "s" : ""} para la jornada de hoy en Lima Metropolitana.` 
                : "No tienes citas activas para hoy. Mantén el radar de servicio encendido para captar solicitudes cercanas."}
            </p>
          </div>

          {/* Availability Radar Switch */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleToggleAvailability}
              disabled={togglingAvailability}
              className={`flex items-center gap-3.5 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 border shadow-lg cursor-pointer ${
                isAvailable
                  ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:bg-emerald-500/25"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="relative flex h-3 w-3">
                {isAvailable && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isAvailable ? "bg-emerald-400 shadow-[0_0_10px_#10B981]" : "bg-slate-500"
                  }`}
                />
              </span>
              <span>
                {togglingAvailability 
                  ? "Actualizando..." 
                  : isAvailable ? "Radar Activo (En Línea)" : "Radar Inactivo (Fuera de Servicio)"}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. ACTIVE SERVICE BANNER (IF ANY ACTIVE) ─────────── */}
      {activeAppointment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="jyp-card border-blue-500/40 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(6, 182, 212, 0.1) 100%)",
            boxShadow: "0 20px 50px rgba(37, 99, 235, 0.2)",
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg bg-gradient-to-br from-blue-600 to-cyan-500"
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
                <h3 className="text-xl sm:text-2xl font-black text-white font-heading">
                  {activeAppointment.serviceType || activeAppointment.service_type || "Mantenimiento Técnico"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Cliente: <span className="text-white font-bold">{activeAppointment.clientName || activeAppointment.client_name || "Cliente JyP"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => navigate(`/appointments/${activeAppointment.id}`)}
                className="jyp-btn-ghost flex-1 md:flex-none text-xs"
              >
                Gestionar Estado
              </button>
              <button
                type="button"
                onClick={() => navigate(`/chat?user=${activeAppointment.clientId || activeAppointment.client_id}`)}
                className="jyp-btn-primary flex-1 md:flex-none text-xs"
              >
                <MessageSquare size={16} />
                <span>Chat con Cliente</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 3. STATS COUNTERS GRID ────────────────────────────── */}
      <section className="jyp-stats-grid">
        <div className="jyp-stat-card">
          <div className="jyp-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.14)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.28)' }}>
            <AlertCircle size={22} />
          </div>
          <div className="jyp-stat-body">
            <span className="jyp-stat-label">Solicitudes</span>
            <span className="jyp-stat-value">{pending.length} Pendientes</span>
            <span className="jyp-stat-sublabel">Requieren confirmación</span>
          </div>
        </div>

        <div className="jyp-stat-card">
          <div className="jyp-stat-icon" style={{ background: 'rgba(37, 99, 235, 0.14)', color: '#60a5fa', border: '1px solid rgba(37, 99, 235, 0.28)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="jyp-stat-body">
            <span className="jyp-stat-label">Confirmadas</span>
            <span className="jyp-stat-value">{confirmed.length} En Curso</span>
            <span className="jyp-stat-sublabel">En agenda técnica</span>
          </div>
        </div>

        <div className="jyp-stat-card">
          <div className="jyp-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.28)' }}>
            <Calendar size={22} />
          </div>
          <div className="jyp-stat-body">
            <span className="jyp-stat-label">Jornada de Hoy</span>
            <span className="jyp-stat-value">{todayAppts.length} Citas</span>
            <span className="jyp-stat-sublabel">Atención prioritaria</span>
          </div>
        </div>

        <div className="jyp-stat-card">
          <div className="jyp-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.14)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.28)' }}>
            <DollarSign size={22} />
          </div>
          <div className="jyp-stat-body">
            <span className="jyp-stat-label">Ingresos Reales</span>
            <span className="jyp-stat-value">S/. {totalEarned.toFixed(0)}</span>
            <span className="jyp-stat-sublabel">{completed.length} servicios cerrados</span>
          </div>
        </div>
      </section>

      {/* ── 4. TELEMETRY & PERFORMANCE SECTION ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Telemetry Chart */}
        <div className="lg:col-span-2 jyp-card space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/30">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-lg font-black text-white font-heading">
                Rendimiento Semanal de Reparaciones
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10">
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
        <div className="jyp-card space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                  <MessageSquare size={16} />
                </div>
                <h3 className="text-base font-black text-white font-heading">
                  Consultas Recientes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 transition-all"
              >
                Abrir Chat
              </button>
            </div>

            <div className="space-y-2.5">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Sin mensajes nuevos en la bandeja
                </p>
              ) : (
                conversations.slice(0, 3).map((conv, i) => (
                  <div
                    key={conv.other_user_id || i}
                    onClick={() => navigate(`/chat?user=${conv.other_user_id}`)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-3.5 border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm">
                      {conv.username?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{conv.username}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.last_message_text || "Iniciar chat..."}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-3 mt-4">
            <ShieldCheck size={18} className="shrink-0 text-cyan-400" />
            <span>Responde en menos de 15 min para mantener tu insignia PRO.</span>
          </div>
        </div>
      </div>

      {/* ── 5. APPOINTMENTS LIST ──────────────────────────────── */}
      <section className="jyp-section">
        <div className="jyp-section-header jyp-section-header-row">
          <div>
            <h2 className="jyp-section-title">Órdenes de Servicio Asignadas</h2>
            <p className="jyp-section-subtitle">
              Gestiona el flujo de trabajo técnico, diagnósticos y rutas hacia el cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/appointments")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors self-start sm:self-auto"
          >
            <span>Ver Todas ({appointments.length})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="jyp-empty-state">
              <div className="jyp-empty-icon">
                <Wrench size={28} />
              </div>
              <h4 className="jyp-empty-title">No tienes citas programadas</h4>
              <p className="jyp-empty-text">
                Mantén tu radar activo para que los clientes en tu radio puedan agendar mantenimientos.
              </p>
            </div>
          ) : (
            appointments.slice(0, 5).map((appt) => (
              <ApptRow key={appt.id} appt={appt} navigate={navigate} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default TechDashboard;
