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
    <div className="max-w-5xl mx-auto space-y-6 pb-20" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-400 block mb-1">
            Gestión de Reparaciones
          </span>
          <h1 
            className="text-3xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Mis Citas Técnicas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historial y seguimiento de diagnósticos y servicios de hardware.
          </p>
        </div>

        {userRole === "client" && (
          <button
            onClick={() => navigate("/appointments/schedule")}
            className="btn-primary py-3 px-5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg self-start sm:self-auto"
          >
            <Plus size={16} /> Nueva Solicitud
          </button>
        )}
      </div>

      {/* Search & Tabs Row */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por tipo de servicio, nombre de técnico o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 42, paddingRight: 16, height: 46, borderRadius: 14 }}
          />
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeTab === tab 
                  ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab}</span>
              {counts[tab] > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === tab ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
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
          className="glass-card text-center py-16 px-6 rounded-3xl space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-slate-400">
            <Calendar size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              No se encontraron citas
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {activeTab !== "Todas" 
                ? `No tienes citas con estado "${activeTab.toLowerCase()}".` 
                : "Aún no registras ninguna orden técnica de soporte."}
            </p>
          </div>
          {userRole === "client" && (
            <button
              onClick={() => navigate("/appointments/schedule")}
              className="btn-primary py-2.5 px-6 text-xs font-bold rounded-xl mt-2 inline-flex"
            >
              <Plus size={14} /> Solicitar mi primera reparación
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3.5">
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
                  className="glass-card p-5 rounded-2xl cursor-pointer group hover:border-blue-500/50 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(6,182,212,0.15) 100%)',
                          color: '#38BDF8',
                          border: '1px solid rgba(59,130,246,0.3)'
                        }}
                      >
                        <Wrench size={22} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                            {appt.serviceType || appt.service_type || "Mantenimiento Técnico"}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {userRole === "client" ? "Especialista: " : "Cliente: "}
                          <span className="text-slate-200 font-semibold">{otherPerson}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                          {appt.scheduled_at && (
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-cyan-400" />
                              <span>{new Date(appt.scheduled_at).toLocaleDateString("es-PE", { dateStyle: "medium" })} · {new Date(appt.scheduled_at).toLocaleTimeString("es-PE", { timeStyle: "short" })}</span>
                            </span>
                          )}
                          {(appt.location_address || appt.address) && (
                            <span className="flex items-center gap-1.5 truncate max-w-[220px]">
                              <MapPin size={12} className="text-blue-400" />
                              <span>{appt.location_address || appt.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                      {appt.price && (
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Presupuesto</span>
                          <span className="text-base font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                            S/. {parseFloat(appt.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <span className={st.cls}>{st.label}</span>
                      <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-transform" />
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
