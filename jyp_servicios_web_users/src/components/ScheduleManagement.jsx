import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Save, AlertCircle, CheckCircle2, Calendar
} from 'lucide-react';
import { techService } from '../services/api';
import { WEEK_DAYS } from '../services/formatters';
import toast from 'react-hot-toast';

const DEFAULT_SCHEDULE = [
  { dayOfWeek: 'Monday', startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 'Tuesday', startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 'Wednesday', startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 'Thursday', startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 'Friday', startTime: '08:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '13:00', isActive: false },
  { dayOfWeek: 'Sunday', startTime: '09:00', endTime: '13:00', isActive: false },
];

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  /* El backend expone GET /technicians/:id/schedule con day_of_week/start_time/end_time
     (snake_case) pero exige POST /technicians/schedule con dayOfWeek/startTime/endTime
     (camelCase) y días en inglés, por eso se normaliza en ambos sentidos. */
  const fetchSchedule = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const techId = user?.id || user?.userId;
      if (!techId) return;

      const response = await techService.getSchedule(techId);
      const rows = response.data?.resultado;
      if (Array.isArray(rows) && rows.length > 0) {
        const normalized = rows.map((r) => ({
          dayOfWeek: r.day_of_week || r.dayOfWeek,
          startTime: String(r.start_time || r.startTime || '08:00:00').slice(0, 5),
          endTime: String(r.end_time || r.endTime || '18:00:00').slice(0, 5),
          isActive: r.is_active === undefined ? true : Boolean(r.is_active),
        }));
        setSchedules(WEEK_DAYS.map((d) => normalized.find((n) => n.dayOfWeek === d.key) || {
          dayOfWeek: d.key,
          startTime: '08:00',
          endTime: '18:00',
          isActive: false,
        }));
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (index) => {
    setSchedules((prev) => prev.map((s, i) => (i === index ? { ...s, isActive: !s.isActive } : s)));
  };

  const handleChange = (index, field, value) => {
    setSchedules((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
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
        toast.success('Horario actualizado correctamente');
      } else {
        toast.error(res.data?.mensaje || 'No se pudo guardar el horario');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error(error.response?.data?.mensaje || 'Error al actualizar el horario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-bold" style={{ color: 'var(--text-dim)' }}>
        Cargando disponibilidad...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5 p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-blue-900/20 via-slate-900/30 to-purple-900/20 border border-white/5 backdrop-blur-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
            <Calendar size={12} /> Disponibilidad Técnica
          </span>
          <h1
            className="text-3xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Gestión de Horarios
          </h1>
          <p className="text-slate-400 text-sm mt-1">Define cuándo estás disponible para recibir citas de soporte.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8 py-3.5 flex items-center gap-2 rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-[1.02] transition-transform self-start sm:self-auto disabled:opacity-50"
        >
          {saving ? 'Guardando...' : (
            <>
              <Save size={18} />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      <div className="glass-panel overflow-hidden border border-white/5 rounded-[32px] shadow-xl">
        <div className="grid grid-cols-1 divide-y divide-white/5">
          {schedules.map((slot, index) => {
            const dayLabel = WEEK_DAYS.find((d) => d.key === slot.dayOfWeek)?.label || slot.dayOfWeek;
            return (
              <div
                key={slot.dayOfWeek || index}
                className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${slot.isActive ? 'bg-white/[0.02]' : 'opacity-50'}`}
              >
                <div className="flex items-center gap-6 min-w-[150px]">
                  <button
                    onClick={() => handleToggle(index)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${slot.isActive ? 'bg-primary' : 'bg-surface-lighter'}`}
                    aria-label={`Activar ${dayLabel}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${slot.isActive ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="font-bold text-lg text-white">{dayLabel}</span>
                </div>

                {slot.isActive ? (
                  <div className="flex items-center gap-4 flex-1 justify-center md:justify-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Inicio</label>
                      <input
                        type="time"
                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={slot.startTime}
                        onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                      />
                    </div>
                    <div className="text-slate-400 mt-4 text-xs font-bold">a</div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fin</label>
                      <input
                        type="time"
                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={slot.endTime}
                        onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex justify-end">
                    <span className="text-slate-500 text-sm italic">Cerrado / No disponible</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 bg-primary/5 border border-primary/20 rounded-[28px] flex items-start gap-4">
        <AlertCircle size={20} className="text-primary mt-1 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Los cambios realizados aquí afectarán directamente a los horarios que ven los clientes al intentar agendar una cita contigo. Asegúrate de mantener tu disponibilidad actualizada.
        </p>
      </div>
    </div>
  );
};

export default ScheduleManagement;
