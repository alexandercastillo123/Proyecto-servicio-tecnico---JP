import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, 
  ChevronLeft, FileText, AlertCircle, CheckCircle2,
  ArrowRight, MapPin, Check, Wrench, ShieldCheck, Cpu
} from 'lucide-react';
import { clientService, storeService } from '../services/api';
import { TechLoader } from './common/TechLoader';

const AppointmentScheduling = () => {
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('tech') || searchParams.get('store');
  const navigate = useNavigate();
  
  const [provider, setProvider] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (providerId) {
      fetchProviderDetails();
    } else {
      setLoading(false);
    }
  }, [providerId]);

  const fetchProviderDetails = async () => {
    try {
      const techResp = await clientService.getTechnicianDetails(providerId).catch(() => null);
      if (techResp?.data?.exito) {
        setProvider(techResp.data.resultado);
      } else {
        const branchResp = await storeService.getBranchDetails(providerId).catch(() => null);
        if (branchResp?.data?.exito) {
          const b = branchResp.data.resultado;
          setProvider({
            id: b.id,
            user_id: b.user_id,
            names: b.name,
            surnames: '(Sucursal Oficial)',
            city: b.city
          });
        }
      }
    } catch (error) {
      console.error('Error fetching provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextDateForDay = (dayName) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const targetDayIndex = days.indexOf(dayName);
    if (targetDayIndex === -1) return new Date().toISOString().split('T')[0];

    const now = new Date();
    const resultDate = new Date();
    resultDate.setDate(now.getDate() + (targetDayIndex + 7 - now.getDay()) % 7);
    return resultDate.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const scheduledDate = getNextDateForDay(selectedDay);
      const data = {
        technicianId: provider?.user_id || provider?.id || providerId,
        scheduledDate: scheduledDate,
        scheduledTime: selectedSlot,
        description,
        serviceType: 'local'
      };
      
      const response = await clientService.createAppointment(data);
      if (response.data.exito) {
        setStep(4);
      } else {
        setError(response.data.mensaje || 'Error al procesar la cita');
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError(err.response?.data?.mensaje || 'Error de conexión con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <TechLoader 
        title="Consultando Disponibilidad Técnica" 
        subtitle="Sincronizando agenda del especialista..." 
      />
    );
  }

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-10 px-4 sm:px-16 relative">
        {[
          { num: 1, label: 'Horario' },
          { num: 2, label: 'Falla & Diagnóstico' },
          { num: 3, label: 'Confirmación' }
        ].map(({ num, label }) => (
          <div key={num} className="flex flex-col items-center gap-2 relative z-10">
            <div 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-md ${
                step > num 
                  ? 'bg-blue-600 text-white' 
                  : step === num 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-blue-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-white/10'
              }`}
            >
              {step > num ? <Check size={18} strokeWidth={3} /> : num}
            </div>
            <span 
              className={`text-[11px] font-bold uppercase tracking-wider text-center ${
                step >= num ? 'text-white' : 'text-slate-500'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
        {/* Connector line */}
        <div 
          className="absolute top-5 left-1/4 right-1/4 h-[2px] -z-0 bg-white/10"
        >
          <div 
            className="h-full transition-all duration-500 bg-gradient-to-r from-blue-600 to-cyan-400" 
            style={{ width: `${(step - 1) * 50}%` }} 
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card p-6 sm:p-10 rounded-3xl relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(6,182,212,0.2) 100%)', color: '#38BDF8' }}
              >
                <CalendarIcon size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  Selecciona Fecha & Turno
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Reserva con {provider?.names || 'el especialista'} en los bloques oficiales de atención.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Day selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                  Día de la Semana
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {days.map((day) => {
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30' 
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                  Horario de Atención
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {times.map((time) => {
                    const isSelected = selectedSlot === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedSlot(time)}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30' 
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <Clock size={15} />
                        <span>{time} hrs</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
              <button 
                disabled={!selectedDay || !selectedSlot}
                onClick={() => setStep(2)}
                className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-40"
              >
                <span>Continuar</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card p-6 sm:p-10 rounded-3xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'rgba(37,99,235,0.2)', color: '#38BDF8' }}
              >
                <FileText size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  Descripción de la Falla
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Explica con el mayor detalle posible el comportamiento o falla que presenta tu equipo.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea 
                rows="5"
                placeholder="Ejemplo: Mi laptop ThinkPad enciende los LEDs pero no da video en pantalla. Comenzó tras una sobretensión eléctrica..."
                className="input-field h-auto py-4 rounded-2xl leading-relaxed resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              
              <div 
                className="p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed"
                style={{ 
                  backgroundColor: 'rgba(37, 99, 235, 0.08)', 
                  borderColor: 'rgba(59, 130, 246, 0.25)',
                  color: 'var(--text-secondary)'
                }}
              >
                <ShieldCheck size={18} className="shrink-0 text-cyan-400 mt-0.5" />
                <span>
                  <strong>Garantía de Servicio JyP:</strong> Tu cita incluye una revisión de integridad física y diagnóstico preliminary. Podrás acordar repuestos originales directamente con el técnico a través del chat en vivo.
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center pt-4 border-t border-white/10">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="btn-ghost py-2.5 px-4 text-xs font-bold"
              >
                <ChevronLeft size={16} /> Regresar
              </button>
              <button 
                disabled={!description.trim()}
                onClick={() => setStep(3)}
                className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-40"
              >
                <span>Revisar Resumen</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card p-6 sm:p-10 rounded-3xl"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Confirmación de la Cita Técnica
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Verifica los datos del servicio antes de emitir la orden.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Provider Info */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                  Especialista / Taller Asignado
                </span>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white"
                    style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
                  >
                    {provider?.names?.[0] || 'T'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {provider?.names} {provider?.surnames}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <MapPin size={12} className="text-blue-400" />
                      <span>{provider?.city || 'Lima Metropolitana'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                  Fecha & Horario de Llegada
                </span>
                <div className="space-y-1.5 text-sm font-bold text-white">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={15} className="text-cyan-400" />
                    <span>{selectedDay}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-cyan-400" />
                    <span>{selectedSlot} hrs</span>
                  </div>
                </div>
              </div>

              {/* Problem Details */}
              <div className="md:col-span-2 p-5 rounded-2xl border border-white/10 bg-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block mb-2">
                  Detalle del Requerimiento
                </span>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  "{description}"
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full py-4 text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registrando Solicitud...</span>
                  </div>
                ) : (
                  <>
                    <span>Confirmar y Enviar Solicitud</span>
                    <CheckCircle2 size={16} />
                  </>
                )}
              </button>
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-slate-400 hover:text-white py-2"
              >
                Editar Descripción
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 sm:p-12 text-center rounded-3xl"
          >
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              <CheckCircle2 size={44} />
            </div>
            <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              ¡Cita Técnica Solicitada!
            </h2>
            <p className="max-w-md mx-auto mb-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
              La solicitud ha sido enviada al técnico. Puedes monitorear el estado y chatear directamente desde tu panel.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/appointments" 
                className="btn-primary px-8 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg text-center"
              >
                Ver Mis Citas
              </Link>
              <Link 
                to="/" 
                className="btn-ghost px-8 py-3.5 text-xs font-bold rounded-xl text-center"
              >
                Volver al Panel
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentScheduling;
