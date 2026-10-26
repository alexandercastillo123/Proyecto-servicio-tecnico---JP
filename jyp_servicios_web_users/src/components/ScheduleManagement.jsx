import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock, Save, AlertCircle, CheckCircle2, Calendar,
  ShieldCheck, Sparkles, Activity, ToggleLeft, ToggleRight
} from "lucide-react";
import { techService } from "../services/api";
import { WEEK_DAYS } from "../services/formatters";
import toast from "react-hot-toast";

const DEFAULT_SCHEDULE = [
  { dayOfWeek: "Monday", startTime: "08:00", endTime: "18:00", isActive: true },
  { dayOfWeek: "Tuesday", startTime: "08:00", endTime: "18:00", isActive: true },
  { dayOfWeek: "Wednesday", startTime: "08:00", endTime: "18:00", isActive: true },
  { dayOfWeek: "Thursday", startTime: "08:00", endTime: "18:00", isActive: true },
  { dayOfWeek: "Friday", startTime: "08:00", endTime: "18:00", isActive: true },
  { dayOfWeek: "Saturday", startTime: "09:00", endTime: "13:00", isActive: false },
  { dayOfWeek: "Sunday", startTime: "09:00", endTime: "13:00", isActive: false },
];

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const techId = user?.id || user?.userId;
      if (!techId) return;

      const response = await techService.getSchedule(techId);
      const rows = response.data?.resultado;
      if (Array.isArray(rows) && rows.length > 0) {
        const normalized = rows.map((r) => ({
          dayOfWeek: r.day_of_week || r.dayOfWeek,
          startTime: String(r.start_time || r.startTime || "08:00:00").slice(0, 5),
          endTime: String(r.end_time || r.endTime || "18:00:00").slice(0, 5),
          isActive: r.is_active === undefined ? true : Boolean(r.is_active),
        }));
        setSchedules(
          WEEK_DAYS.map((d) => normalized.find((n) => n.dayOfWeek === d.key) || {
            dayOfWeek: d.key,
            startTime: "08:00",
            endTime: "18:00",
            isActive: false,
          })
        );
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (index) => {
    setSchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleChange = (index, field, value) => {
    setSchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: s.isActive,
      }));
      const res = await techService.updateSchedule(payload);
      if (res.data?.exito) {
        toast.success("Disponibilidad técnica actualizada con éxito");
      } else {
        toast.error(res.data?.mensaje || "No se pudo guardar el horario");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error(error.response?.data?.mensaje || "Error al actualizar el horario");
    } finally {
      setSaving(false);
    }
  };

  const activeDaysCount = schedules.filter((s) => s.isActive).length;

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-slate-400 text-xs font-mono">Sincronizando matriz de disponibilidad...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] p-8 sm:p-10 border border-white/10 bg-gradient-to-br from-[#0c1322] via-[#080d17] to-[#0a1829] shadow-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25">
            <Activity size={13} className="text-cyan-400" />
            <span>Matriz de Operaciones Técnicas</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Gestión de Horarios
          </h1>
          <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
            Configura tus franjas horarias semanales para habilitar reservas automáticas de clientes en la plataforma.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Días Habilitados</span>
            <span className="text-lg font-black text-cyan-400 font-mono">{activeDaysCount} de 7 días</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="jyp-btn-primary px-8 py-3.5 flex items-center justify-center gap-2.5 rounded-2xl shadow-xl shadow-blue-600/30 text-xs font-black uppercase tracking-wider disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            <Save size={16} />
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>

      {/* Days Table Card */}
      <div className="overflow-hidden border border-white/10 rounded-[32px] bg-[#0a101b]/90 backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Calendar size={16} className="text-cyan-400" />
            <span>Configuración por Día</span>
          </h3>
          <span className="text-[11px] text-slate-400">Hora local (GMT-5)</span>
        </div>

        <div className="divide-y divide-white/5">
          {schedules.map((slot, index) => {
            const dayLabel = WEEK_DAYS.find((d) => d.key === slot.dayOfWeek)?.label || slot.dayOfWeek;

            return (
              <motion.div
                key={slot.dayOfWeek || index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                  slot.isActive ? "bg-white/[0.02]" : "bg-black/20 opacity-60"
                }`}
              >
                {/* Day & Toggle Switch */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => handleToggle(index)}
                    className={`relative w-14 h-7 rounded-full p-1 transition-all duration-300 focus:outline-none ${
                      slot.isActive
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md shadow-cyan-500/30"
                        : "bg-slate-800"
                    }`}
                    aria-label={`Activar ${dayLabel}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        slot.isActive ? "translate-x-7" : "translate-x-0"
                      }`}
                    />
                  </button>

                  <div>
                    <span className="font-bold text-base text-white block">{dayLabel}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {slot.isActive ? "Turno Activo" : "No disponible"}
                    </span>
                  </div>
                </div>

                {/* Time range picker */}
                {slot.isActive ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Hora Apertura
                      </label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                        <input
                          type="time"
                          className="bg-[#0c1424] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                          value={slot.startTime}
                          onChange={(e) => handleChange(index, "startTime", e.target.value)}
                        />
                      </div>
                    </div>

                    <span className="text-slate-500 font-bold text-xs mt-5">a</span>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Hora Cierre
                      </label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                        <input
                          type="time"
                          className="bg-[#0c1424] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                          value={slot.endTime}
                          onChange={(e) => handleChange(index, "endTime", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                    <span>Sin recepción de citas en este día</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info notice */}
      <div className="p-6 rounded-[28px] bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-4">
        <AlertCircle size={20} className="text-cyan-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-300 leading-relaxed">
          Las modificaciones en tu franja horaria se sincronizan al instante en el motor de agendamiento satelital. Los clientes únicamente podrán seleccionar bloques disponibles dentro de los intervalos activos configurados.
        </p>
      </div>
    </div>
  );
};

export default ScheduleManagement;
