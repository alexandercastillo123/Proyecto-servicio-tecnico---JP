import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, MapPin, ChevronRight, Filter,
  Wrench, MessageSquare, Star, ArrowRight, Plus, Search
} from "lucide-react";
import { clientService, techService, authService } from "../services/api";
import { useNavigate } from "react-router-dom";

const STATUS = {
  pending:    { label: "Pendiente",   cls: "status-badge status-pending" },
  confirmed:  { label: "Confirmada",  cls: "status-badge status-confirmed" },
  completed:  { label: "Completada",  cls: "status-badge status-completed" },
  cancelled:  { label: "Cancelada",   cls: "status-badge status-cancelled" },
  in_progress:{ label: "En progreso", cls: "status-badge status-in_progress" },
  on_the_way: { label: "En camino",   cls: "status-badge status-on_the_way" },
  arrived:    { label: "Llegó",       cls: "status-badge status-arrived" },
  paid:       { label: "Pagada",      cls: "status-badge status-completed" },
  cancellation_pending: { label: "Cancelación pendiente", cls: "status-badge status-cancellation_pending" },
};

const TABS = ["Todas", "Pendientes", "Confirmadas", "Completadas", "Canceladas"];
const TAB_FILTER = { "Todas": null, "Pendientes": "pending", "Confirmadas": "confirmed", "Completadas": "completed", "Canceladas": "cancelled" };

const AppointmentList = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Todas");
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role);
    fetchAppointments(user.role);
  }, []);

  const fetchAppointments = async (role) => {
    setLoading(true);
    try {
      const res = role === "tech"
        ? await techService.getAppointments()
        : await clientService.getMyAppointments();
      if (res.data.exito) setAppointments(res.data.resultado || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = appointments.filter(a => {
    const tabFilter = TAB_FILTER[activeTab];
    if (tabFilter && a.status !== tabFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (a.serviceType || a.service_type || "").toLowerCase().includes(q) ||
        (a.clientName || a.client_name || "").toLowerCase().includes(q) ||
        (a.techName   || a.tech_name   || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCounts = () => {
    return {
      Todas: appointments.length,
      Pendientes: appointments.filter(a => a.status === "pending").length,
      Confirmadas: appointments.filter(a => a.status === "confirmed").length,
      Completadas: appointments.filter(a => a.status === "completed").length,
      Canceladas: appointments.filter(a => a.status === "cancelled").length,
    };
  };
  const counts = getCounts();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 4 }}>
            Historial
          </p>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            Mis Citas
          </h1>
        </div>
        {userRole === "client" && (
          <button
            onClick={() => navigate("/appointments/schedule")}
            className="btn-primary"
          >
            <Plus size={16} /> Nueva Cita
          </button>
        )}
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
          <input
            type="text"
            placeholder="Buscar por servicio, técnico o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 40, paddingRight: 16, height: 44 }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab ? "var(--primary)" : "var(--bg-input)",
              color: activeTab === tab ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${activeTab === tab ? "var(--primary)" : "var(--border)"}`,
              boxShadow: activeTab === tab ? "var(--shadow-primary)" : "none",
            }}
          >
            {tab}
            {counts[tab] > 0 && (
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{
                  background: activeTab === tab ? "rgba(255,255,255,0.2)" : "var(--bg-elevated)",
                  color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                }}
              >
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 96, borderRadius: 16 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-16"
        >
          <Calendar size={40} style={{ color: "var(--text-dim)", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            No hay citas
          </p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
            {activeTab !== "Todas" ? `No tienes citas ${activeTab.toLowerCase()}` : "Aún no tienes citas registradas"}
          </p>
          {userRole === "client" && (
            <button
              onClick={() => navigate("/appointments/schedule")}
              className="btn-primary"
              style={{ margin: "20px auto 0", display: "inline-flex" }}
            >
              <Plus size={16} /> Agendar mi primera cita
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((appt, i) => {
              const st = STATUS[appt.status] || { label: appt.status, cls: "status-badge" };
              return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 cursor-pointer group"
                  style={{
                    borderLeft: `3px solid ${
                      appt.status === "completed" ? "var(--success)" :
                      appt.status === "confirmed" || appt.status === "paid" ? "var(--primary)" :
                      appt.status === "pending" ? "var(--warning)" :
                      appt.status === "cancelled" ? "var(--error)" : "var(--border)"
                    }`,
                    borderRadius: 16,
                  }}
                  onClick={() => navigate(`/appointments/${appt.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: "rgba(45,107,255,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        <Wrench size={20} style={{ color: "var(--primary)" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)" }}>
                          {appt.serviceType || appt.service_type || "Servicio Técnico"}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                          {userRole === "client"
                            ? (appt.techName || appt.tech_name ? `Técnico: ${appt.techName || appt.tech_name}` : "")
                            : (appt.clientName || appt.client_name ? `Cliente: ${appt.clientName || appt.client_name}` : "")}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {appt.scheduled_at && (
                            <span className="flex items-center gap-1" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                              <Clock size={11} />
                              {new Date(appt.scheduled_at).toLocaleDateString("es-PE", { dateStyle: "medium" })} ·{" "}
                              {new Date(appt.scheduled_at).toLocaleTimeString("es-PE", { timeStyle: "short" })}
                            </span>
                          )}
                          {(appt.location_address || appt.address) && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                              <MapPin size={11} />
                              {appt.location_address || appt.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {appt.price && (
                        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)" }}>
                          S/. {parseFloat(appt.price).toFixed(2)}
                        </span>
                      )}
                      <span className={st.cls}>{st.label}</span>
                      <ChevronRight size={16} style={{ color: "var(--text-dim)" }} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Quick actions */}
                  {appt.status === "completed" && userRole === "client" && (
                    <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/technician/${appt.techId || appt.tech_id}`); }}
                        className="btn-ghost btn-sm flex-1 justify-center"
                        style={{ height: 34, fontSize: 12 }}
                      >
                        <Star size={13} /> Dejar Reseña
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/chat?user=${appt.techId || appt.tech_id}`); }}
                        className="btn-ghost btn-sm flex-1 justify-center"
                        style={{ height: 34, fontSize: 12 }}
                      >
                        <MessageSquare size={13} /> Contactar
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
