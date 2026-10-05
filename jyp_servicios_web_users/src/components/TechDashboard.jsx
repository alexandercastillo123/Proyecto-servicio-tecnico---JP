import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar, CheckCircle, Clock, AlertCircle,
  DollarSign, User, MapPin, Power, Bell,
  ChevronRight, MessageSquare, Star, ArrowRight, Cpu,
  TrendingUp, Wrench, Activity
} from "lucide-react";
import { techService, messageService, authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

/* ── Status color map ──────────────────────────────────────────── */
const STATUS = {
  pending:    { label: "Pendiente",   cls: "status-badge status-pending" },
  confirmed:  { label: "Confirmada",  cls: "status-badge status-confirmed" },
  completed:  { label: "Completada",  cls: "status-badge status-completed" },
  cancelled:  { label: "Cancelada",   cls: "status-badge status-cancelled" },
  in_progress:{ label: "En progreso", cls: "status-badge status-in_progress" },
  on_the_way: { label: "En camino",   cls: "status-badge status-on_the_way" },
  arrived:    { label: "Llegó",       cls: "status-badge status-arrived" },
  paid:       { label: "Pagada",      cls: "status-badge status-completed" },
};

/* ── Stat card ─────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="card card-hover"
    style={{ display: "flex", alignItems: "center", gap: 16 }}
  >
    <div
      style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-dim)" }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)", lineHeight: 1.2 }}>
        {value}
      </p>
    </div>
  </motion.div>
);

/* ── Appointment row ───────────────────────────────────────────── */
const ApptRow = ({ appt, navigate }) => {
  const st = STATUS[appt.status] || { label: appt.status, cls: "status-badge" };
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-4 cursor-pointer group"
      style={{ borderRadius: 14 }}
      onClick={() => navigate(`/appointments/${appt.id}`)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(45,107,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Wrench size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div className="min-w-0">
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans',sans-serif" }} className="truncate">
              {appt.serviceType || appt.service_type || "Servicio Técnico"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }} className="truncate">
              {appt.clientName || appt.client_name || "Cliente"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={st.cls}>{st.label}</span>
          <ChevronRight size={16} style={{ color: "var(--text-dim)" }} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
      {appt.scheduled_at && (
        <div className="flex items-center gap-1.5 mt-2.5" style={{ fontSize: 11, color: "var(--text-dim)" }}>
          <Clock size={12} />
          {new Date(appt.scheduled_at).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
          {appt.location_address && (
            <>
              <span style={{ margin: "0 4px" }}>·</span>
              <MapPin size={12} />
              <span className="truncate max-w-[160px]">{appt.location_address}</span>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ── TechDashboard ─────────────────────────────────────────────── */
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
        techService.getAppointments(),
        messageService.getConversations(),
        authService.getProfile(),
      ]);
      if (apptsResp.data.exito) {
        const appts = apptsResp.data.resultado || [];
        setAppointments(appts);
        setActiveAppointment(appts.find(a => a.status === "confirmed" || a.status === "paid"));
      }
      if (convsResp.data.exito) setConversations(convsResp.data.resultado || []);
      if (profileResp.data.exito) {
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
      if (res.data.exito) setIsAvailable(!isAvailable);
    } catch (err) { console.error(err); }
    finally { setTogglingAvailability(false); }
  };

  const pending   = appointments.filter(a => a.status === "pending");
  const confirmed = appointments.filter(a => a.status === "confirmed" || a.status === "paid");
  const completed = appointments.filter(a => a.status === "completed");
  const totalEarned = completed.reduce((s, a) => s + (parseFloat(a.price) || 0), 0);
  const todayAppts = appointments.filter(a => {
    if (!a.scheduled_at) return false;
    const d = new Date(a.scheduled_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ── WELCOME HEADER ─────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
      >
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 4 }}>
            Dashboard Técnico
          </p>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)", lineHeight: 1.2 }}>
            Hola, {user?.names?.split(" ")[0] || "Técnico"} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
            {todayAppts.length > 0 ? `Tienes ${todayAppts.length} cita${todayAppts.length > 1 ? "s" : ""} hoy` : "Sin citas para hoy"}
          </p>
        </div>

        {/* Availability Toggle */}
        <button
          onClick={handleToggleAvailability}
          disabled={togglingAvailability}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm transition-all"
          style={{
            background: isAvailable ? "rgba(0,229,160,0.12)" : "var(--bg-input)",
            border: `1px solid ${isAvailable ? "rgba(0,229,160,0.3)" : "var(--border)"}`,
            color: isAvailable ? "var(--success)" : "var(--text-secondary)",
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: isAvailable ? "var(--success)" : "var(--text-dim)",
              boxShadow: isAvailable ? "0 0 8px var(--secondary-glow)" : "none",
              animation: isAvailable ? "pulse 2s infinite" : "none",
            }}
          />
          {togglingAvailability ? "Actualizando..." : isAvailable ? "Disponible" : "No disponible"}
        </button>
      </motion.header>

      {/* ── ACTIVE APPOINTMENT ALERT ──────────────────────── */}
      {activeAppointment && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(45,107,255,0.15) 0%, rgba(45,107,255,0.05) 100%)",
            border: "1px solid rgba(45,107,255,0.25)",
          }}
        >
          <div className="flex items-center gap-4">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={22} color="white" style={{ animation: "pulse 2s infinite" }} />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 2 }}>
                Servicio activo
              </p>
              <p style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)" }}>
                {activeAppointment.serviceType || activeAppointment.service_type || "Servicio Técnico"}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Cliente: {activeAppointment.clientName || activeAppointment.client_name || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/chat?user=${activeAppointment.clientId || activeAppointment.client_id}`)}
            className="btn-primary btn-sm"
            style={{ whiteSpace: "nowrap" }}
          >
            <MessageSquare size={15} /> Ir al Chat
          </button>
        </motion.div>
      )}

      {/* ── STATS GRID ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={AlertCircle} label="Pendientes"  value={pending.length}   color="#FFB020" delay={0.05} />
        <StatCard icon={CheckCircle} label="Confirmadas" value={confirmed.length} color="#2D6BFF" delay={0.10} />
        <StatCard icon={Calendar}    label="Hoy"         value={todayAppts.length} color="#00E5A0" delay={0.15} />
        <StatCard icon={DollarSign}  label="Ganado"      value={`S/. ${totalEarned.toFixed(0)}`} color="#9B7FD4" delay={0.20} />
      </div>

      {/* ── APPOINTMENTS ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} style={{ color: "var(--primary)" }} />
            Citas Recientes
          </h2>
          <button
            onClick={() => navigate("/appointments")}
            style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            Ver todas <ArrowRight size={13} />
          </button>
        </div>
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="card text-center py-10">
              <Calendar size={32} style={{ color: "var(--text-dim)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>No tienes citas aún</p>
              <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>Activa tu disponibilidad para recibir solicitudes</p>
            </div>
          ) : (
            appointments.slice(0, 5).map((appt, i) => (
              <ApptRow key={appt.id} appt={appt} navigate={navigate} />
            ))
          )}
        </div>
      </div>

      {/* ── RECENT MESSAGES ───────────────────────────────── */}
      {conversations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={18} style={{ color: "var(--primary)" }} />
              Mensajes Recientes
            </h2>
            <button
              onClick={() => navigate("/chat")}
              style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              Abrir Chat <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {conversations.slice(0, 3).map((conv, i) => (
              <motion.div
                key={conv.conversation_id || i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="glass-card p-4 cursor-pointer group flex items-center gap-3"
                style={{ borderRadius: 14 }}
                onClick={() => navigate(`/chat?user=${conv.other_user_id}`)}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, color: "white", fontSize: 16, flexShrink: 0,
                  }}
                >
                  {conv.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    {conv.username}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }} className="truncate">
                    {conv.last_message || "Sin mensajes"}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-dim)" }} className="group-hover:translate-x-1 transition-transform shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechDashboard;
