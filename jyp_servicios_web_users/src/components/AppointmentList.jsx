import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, MapPin, ChevronRight, Filter,
  Wrench, MessageSquare, Star, ArrowRight, Plus, Search,
  ShieldCheck, AlertCircle, CheckCircle2
} from "lucide-react";
import { clientService, techService, authService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { TechLoader } from "./common/TechLoader";

const STATUS = {
  pending:    { label: "Pendiente",   cls: "status-badge status-pending" },
  confirmed:  { label: "Confirmada",  cls: "status-badge status-confirmed" },
  completed:  { label: "Completada",  cls: "status-badge status-completed" },
  cancelled:  { label: "Cancelada",   cls: "status-badge status-cancelled" },
  in_progress:{ label: "En progreso", cls: "status-badge status-in_progress" },
  on_the_way: { label: "En camino",   cls: "status-badge status-on_the_way" },
  arrived:    { label: "En sitio",    cls: "status-badge status-arrived" },
  paid:       { label: "Pagada",      cls: "status-badge status-completed" },
  cancellation_pending: { label: "Por cancelar", cls: "status-badge status-cancellation_pending" },
};

const TABS = ["Todas", "Pendientes", "Confirmadas", "Completadas", "Canceladas"];
const TAB_FILTER = { 
  "Todas": null, 
  "Pendientes": "pending", 
  "Confirmadas": "confirmed", 
  "Completadas": "completed", 
  "Canceladas": "cancelled" 
};

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
      if (res.data?.exito) setAppointments(res.data.resultado || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
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
      Confirmadas: appointments.filter(a => ["confirmed", "paid", "in_progress"].includes(a.status)).length,
      Completadas: appointments.filter(a => a.status === "completed").length,
      Canceladas: appointments.filter(a => a.status === "cancelled").length,
    };
  };
  const counts = getCounts();

  return (
    <div className="w-full space-y-10 pb-4" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 sm:p-10 rounded-[32px] bg-gradient-to-r from-blue-900/20 via-slate-900/30 to-purple-900/20 border border-white/5 backdrop-blur-xl">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
            Gestión de Reparaciones
          </span>
          <h1 
            className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Mis Citas Técnicas
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
            Historial y seguimiento de diagnósticos y servicios de hardware certificados.
          </p>
        </div>

        {userRole === "client" && (
          <button
            onClick={() => navigate("/appointments/schedule")}
            className="btn-primary py-4 px-7 text-xs font-bold uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-600/20 self-start sm:self-auto flex items-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <Plus size={16} /> Nueva Solicitud
          </button>
        )}
      </div>

      {/* Search & Tabs Row */}
      <div className="space-y-5">
        <div className="relative">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por tipo de servicio, técnico o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
          />
        </div>

        {/* Tab pills */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeTab === tab 
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 scale-[1.02]' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab}</span>
              {counts[tab] > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab ? 'bg-white/25 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Cards List */}
      {loading ? (
        <TechLoader 
          compact 
          title="Consultando Registro de Citas" 
          subtitle="Obteniendo estado de servicios..." 
        />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card text-center py-20 px-8 rounded-[32px] space-y-4"
        >
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400 shadow-xl shadow-blue-500/5">
            <Calendar size={36} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              No se encontraron citas
            </h3>
            <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
              {activeTab !== "Todas" 
                ? `No tienes citas con estado "${activeTab.toLowerCase()}".` 
                : "Aún no registras ninguna orden técnica de soporte."}
            </p>
          </div>
          {userRole === "client" && (
            <button
              onClick={() => navigate("/appointments/schedule")}
              className="btn-primary py-3 px-7 text-xs font-bold rounded-2xl mt-4 inline-flex items-center gap-2"
            >
              <Plus size={16} /> Solicitar mi primera reparación
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence>
            {filtered.map((appt, i) => {
              const st = STATUS[appt.status] || { label: appt.status, cls: "status-badge" };
              const otherPerson = userRole === "client" 
                ? (appt.techName || appt.tech_name || "Técnico Especialista") 
                : (appt.clientName || appt.client_name || "Cliente");

              return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/appointments/${appt.id}`)}
                  className="glass-card p-7 sm:p-8 rounded-3xl cursor-pointer group hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-5">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(6,182,212,0.15) 100%)',
                          color: '#38BDF8',
                          border: '1px solid rgba(59,130,246,0.35)'
                        }}
                      >
                        <Wrench size={24} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                            {appt.serviceType || appt.service_type || "Mantenimiento Técnico"}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                          {userRole === "client" ? "Especialista: " : "Cliente: "}
                          <span className="text-slate-200 font-semibold">{otherPerson}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-400">
                          {appt.scheduled_at && (
                            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                              <Clock size={13} className="text-cyan-400" />
                              <span>{new Date(appt.scheduled_at).toLocaleDateString("es-PE", { dateStyle: "medium" })} · {new Date(appt.scheduled_at).toLocaleTimeString("es-PE", { timeStyle: "short" })}</span>
                            </span>
                          )}
                          {(appt.location_address || appt.address) && (
                            <span className="flex items-center gap-1.5 truncate max-w-[260px] bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                              <MapPin size={13} className="text-blue-400" />
                              <span>{appt.location_address || appt.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-white/5">
                      {appt.price && (
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Presupuesto</span>
                          <span className="text-lg font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            S/. {parseFloat(appt.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <span className={st.cls}>{st.label}</span>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow">
                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
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
