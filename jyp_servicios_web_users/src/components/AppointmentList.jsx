import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, MapPin, ChevronRight, Filter,
  Wrench, MessageSquare, Star, ArrowRight, Plus, Search,
  ShieldCheck, AlertCircle, CheckCircle2, Activity,
  Sparkles, SlidersHorizontal, RefreshCw
} from "lucide-react";
import { clientService, techService } from "../services/api";
import { formatDateShort } from "../services/formatters";
import { useNavigate } from "react-router-dom";
import { TechLoader } from "./common/TechLoader";

const STATUS = {
  pending: {
    label: "Pendiente",
    badgeCls: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    dotCls: "bg-amber-400 shadow-[0_0_8px_#f59e0b]",
  },
  confirmed: {
    label: "Confirmada",
    badgeCls: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    dotCls: "bg-blue-400 shadow-[0_0_8px_#3b82f6]",
  },
  on_the_way: {
    label: "En camino",
    badgeCls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/35 animate-pulse",
    dotCls: "bg-cyan-400 shadow-[0_0_10px_#06b6d4]",
  },
  arrived: {
    label: "En sitio",
    badgeCls: "bg-indigo-500/15 text-indigo-300 border-indigo-500/35",
    dotCls: "bg-indigo-400 shadow-[0_0_8px_#6366f1]",
  },
  in_progress: {
    label: "En progreso",
    badgeCls: "bg-teal-500/15 text-teal-300 border-teal-500/35 animate-pulse",
    dotCls: "bg-teal-400 shadow-[0_0_10px_#14b8a6]",
  },
  completed: {
    label: "Completada",
    badgeCls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    dotCls: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
  },
  paid: {
    label: "Pagada",
    badgeCls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dotCls: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
  },
  cancelled: {
    label: "Cancelada",
    badgeCls: "bg-rose-500/10 text-rose-300 border-rose-500/25",
    dotCls: "bg-rose-400",
  },
  cancellation_pending: {
    label: "Por cancelar",
    badgeCls: "bg-orange-500/10 text-orange-300 border-orange-500/25",
    dotCls: "bg-orange-400",
  },
};

const TABS = [
  { id: "Todas", label: "Todas" },
  { id: "Pendientes", label: "Pendientes" },
  { id: "En Curso", label: "En Curso" },
  { id: "Completadas", label: "Completadas" },
  { id: "Canceladas", label: "Canceladas" },
];

const TAB_FILTER = {
  "Todas": null,
  "Pendientes": ["pending"],
  "En Curso": ["confirmed", "paid", "on_the_way", "arrived", "in_progress"],
  "Completadas": ["completed"],
  "Canceladas": ["cancelled", "cancellation_pending", "expired"],
};

const AppointmentList = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Todas");
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role);
    fetchAppointments(user.role);
  }, []);

  const fetchAppointments = async (role, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = role === "tech"
        ? await techService.getAppointments()
        : await clientService.getMyAppointments();
      if (res.data?.exito) setAppointments(res.data.resultado || []);
    } catch (e) {
      console.error("Error loading appointments:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtered = appointments.filter(a => {
    const tabFilter = TAB_FILTER[activeTab];
    if (tabFilter && !tabFilter.includes(a.status)) return false;
    if (search) {
      const q = search.toLowerCase();
      const sType = (a.serviceType || a.service_type || "").toLowerCase();
      const cName = [a.client_names, a.client_surnames].filter(Boolean).join(" ").toLowerCase() ||
                    (a.client_username || a.clientName || a.client_name || "").toLowerCase();
      const tName = [a.tech_names, a.tech_surnames].filter(Boolean).join(" ").toLowerCase() ||
                    (a.tech_username || a.techName || a.tech_name || "").toLowerCase();
      const desc = (a.description || "").toLowerCase();
      const idStr = String(a.id || "");
      return sType.includes(q) || cName.includes(q) || tName.includes(q) || desc.includes(q) || idStr.includes(q);
    }
    return true;
  });

  const counts = {
    "Todas": appointments.length,
    "Pendientes": appointments.filter(a => a.status === "pending").length,
    "En Curso": appointments.filter(a => ["confirmed", "paid", "on_the_way", "arrived", "in_progress"].includes(a.status)).length,
    "Completadas": appointments.filter(a => a.status === "completed").length,
    "Canceladas": appointments.filter(a => ["cancelled", "cancellation_pending", "expired"].includes(a.status)).length,
  };

  return (
    <div className="w-full space-y-8 pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[32px] p-8 sm:p-10 border border-white/10 bg-gradient-to-br from-[#0c1322] via-[#080d17] to-[#0d1b2a] shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25">
              <Activity size={13} className="text-cyan-400 animate-pulse" />
              <span>Centro de Gestión de Reparaciones</span>
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {userRole === "tech" ? "Órdenes de Servicio Asignadas" : "Mis Citas Técnicas"}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              Monitoreo en tiempo real del ciclo técnico: diagnóstico, desplazamiento, intervención física y certificación de hardware.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchAppointments(userRole, true)}
              disabled={refreshing}
              className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2"
              title="Refrescar lista"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-cyan-400" : ""} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {userRole === "client" && (
              <button
                onClick={() => navigate("/appointments/schedule")}
                className="jyp-btn-primary px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-600/25 flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Solicitar Servicio</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick HUD Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Total Órdenes</span>
            <span className="text-2xl font-black text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {appointments.length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-500/[0.04] border border-cyan-500/20">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-1">En Intervención</span>
            <span className="text-2xl font-black text-cyan-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {counts["En Curso"]}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">Pendientes</span>
            <span className="text-2xl font-black text-amber-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {counts["Pendientes"]}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">Finalizadas</span>
            <span className="text-2xl font-black text-emerald-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {counts["Completadas"]}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar & Tab Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por ID (#12), tipo de servicio, cliente o especialista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0b121e]/80 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map(tab => {
            const count = counts[tab.id] || 0;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSel
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                    : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSel ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appointment Cards List */}
      {loading ? (
        <TechLoader
          compact
          title="Consultando Registro de Citas"
          subtitle="Sincronizando estado con el servidor central..."
        />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-white/10 bg-[#090f1a]/80 p-12 text-center backdrop-blur-xl space-y-5"
        >
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/5">
            <Calendar size={36} />
          </div>
          <div>
            <h3
              className="text-xl sm:text-2xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              No se encontraron citas
            </h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              {search
                ? `Ningún resultado coincide con el término "${search}".`
                : activeTab !== "Todas"
                ? `No tienes citas en la categoría "${activeTab.toLowerCase()}".`
                : "Aún no registras ninguna orden técnica de soporte."}
            </p>
          </div>

          {userRole === "client" && !search && (
            <button
              onClick={() => navigate("/appointments/schedule")}
              className="jyp-btn-primary px-7 py-3.5 text-xs font-bold rounded-2xl inline-flex items-center gap-2 shadow-xl shadow-blue-600/30"
            >
              <Plus size={16} /> Solicitar mi primera reparación
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((appt, i) => {
              const st = STATUS[appt.status] || {
                label: appt.status,
                badgeCls: "bg-slate-500/15 text-slate-300 border-white/10",
                dotCls: "bg-slate-400",
              };

              const clientName = [appt.client_names, appt.client_surnames].filter(Boolean).join(" ").trim() ||
                                 appt.client_username || appt.clientName || appt.client_name || "Cliente";
              const techName = [appt.tech_names, appt.tech_surnames].filter(Boolean).join(" ").trim() ||
                               appt.tech_username || appt.techName || appt.tech_name || "Especialista Asignado";
              const otherPerson = userRole === "client" ? techName : clientName;

              const scheduledDate = appt.scheduled_date || appt.scheduledDate;
              const scheduledTime = appt.scheduled_time || appt.scheduledTime;
              const serviceAddress = appt.service_address || appt.location_address || appt.address;

              return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => navigate(`/appointments/${appt.id}`)}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a101b]/90 hover:bg-[#0c1424] hover:border-cyan-500/40 p-6 sm:p-7 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left details */}
                    <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative"
                        style={{
                          background: "linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(6,182,212,0.15) 100%)",
                          color: "#38BDF8",
                          border: "1px solid rgba(59,130,246,0.35)",
                        }}
                      >
                        <Wrench size={26} />
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-blue-600/90 text-[9px] font-black text-white font-mono border border-blue-400">
                          #{appt.id}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-cyan-400 transition-colors truncate">
                            {appt.serviceType || appt.service_type || "Mantenimiento Técnico Hardware"}
                          </h3>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-400">
                          {userRole === "client" ? "Especialista: " : "Cliente: "}
                          <span className="text-slate-200 font-semibold">{otherPerson}</span>
                        </p>

                        {/* Location and time tags */}
                        <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs text-slate-400">
                          {scheduledDate && (
                            <span className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/5 font-mono text-[11px]">
                              <Clock size={12} className="text-cyan-400" />
                              <span>{formatDateShort(scheduledDate)} · {String(scheduledTime || "").slice(0, 5)} hrs</span>
                            </span>
                          )}
                          {serviceAddress && (
                            <span className="flex items-center gap-1.5 truncate max-w-[280px] bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/5 text-[11px]">
                              <MapPin size={12} className="text-blue-400 shrink-0" />
                              <span className="truncate">{serviceAddress}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Badge, Price, Button */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-white/5">
                      {appt.price ? (
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Presupuesto</span>
                          <span
                            className="text-lg sm:text-xl font-black text-white"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            S/. {parseFloat(appt.price).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Cotización</span>
                          <span className="text-xs font-bold text-amber-400">Pendiente</span>
                        </div>
                      )}

                      {/* Status pill with animated dot */}
                      <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${st.badgeCls}`}>
                        <span className={`w-2 h-2 rounded-full ${st.dotCls}`} />
                        <span>{st.label}</span>
                      </span>

                      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:text-white transition-all shadow">
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
