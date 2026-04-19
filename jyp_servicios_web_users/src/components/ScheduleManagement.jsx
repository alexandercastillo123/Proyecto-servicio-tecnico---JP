import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, Save, AlertCircle, CheckCircle2, 
  Plus, Trash2, Calendar, ChevronLeft
} from 'lucide-react';
import { techService } from '../services/api';
import { Link } from 'react-router-dom';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([
    { day_of_week: 'Lunes', start_time: '08:00', end_time: '18:00', is_active: true },
    { day_of_week: 'Martes', start_time: '08:00', end_time: '18:00', is_active: true },
    { day_of_week: 'Miércoles', start_time: '08:00', end_time: '18:00', is_active: true },
    { day_of_week: 'Jueves', start_time: '08:00', end_time: '18:00', is_active: true },
    { day_of_week: 'Viernes', start_time: '08:00', end_time: '18:00', is_active: true },
    { day_of_week: 'Sábado', start_time: '09:00', end_time: '13:00', is_active: false },
    { day_of_week: 'Domingo', start_time: '09:00', end_time: '13:00', is_active: false },
  ]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        const response = await techService.getSchedule(user.id);
        if (response.data.success && response.data.data.length > 0) {
          setSchedules(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (index) => {
    const newSchedules = [...schedules];
    newSchedules[index].is_active = !newSchedules[index].is_active;
    setSchedules(newSchedules);
  };

  const handleChange = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await techService.updateSchedule(schedules);
      setMessage({ type: 'success', text: 'Horario actualizado correctamente.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el horario.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center text-text-dim font-bold">Cargando disponibilidad...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black gradient-text">Gestión de Horarios</h1>
          <p className="text-text-secondary text-sm">Define cuándo estás disponible para recibir citas.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-8 py-3 flex items-center gap-2"
        >
          {saving ? 'Guardando...' : (
            <>
              <Save size={18} />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}
        >
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{message.text}</p>
        </motion.div>
      )}

      <div className="glass-panel overflow-hidden border border-white/5">
        <div className="grid grid-cols-1 divide-y divide-white/5">
          {schedules.map((slot, index) => (
            <div key={index} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${slot.is_active ? 'bg-white/[0.02]' : 'opacity-50'}`}>
              <div className="flex items-center gap-6 min-w-[150px]">
                <button 
                  onClick={() => handleToggle(index)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${slot.is_active ? 'bg-primary' : 'bg-surface-lighter'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${slot.is_active ? 'left-7' : 'left-1'}`} />
                </button>
                <span className="font-bold text-lg text-white">{slot.day_of_week}</span>
              </div>

              {slot.is_active ? (
                <div className="flex items-center gap-4 flex-1 justify-center md:justify-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Inicio</label>
                    <input 
                      type="time" 
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={slot.start_time.slice(0, 5)}
                      onChange={(e) => handleChange(index, 'start_time', e.target.value)}
                    />
                  </div>
                  <div className="text-text-dim mt-4">a</div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Fin</label>
                    <input 
                      type="time" 
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      value={slot.end_time.slice(0, 5)}
                      onChange={(e) => handleChange(index, 'end_time', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex justify-end">
                  <span className="text-text-dim text-sm italic">Cerrado / No disponible</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
        <AlertCircle size={20} className="text-primary mt-1 shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Los cambios realizados aquí afectarán directamente a los horarios que ven los clientes al intentar agendar una cita contigo. Asegúrate de mantener tu disponibilidad actualizada.
        </p>
      </div>
    </div>
  );
};

export default ScheduleManagement;
