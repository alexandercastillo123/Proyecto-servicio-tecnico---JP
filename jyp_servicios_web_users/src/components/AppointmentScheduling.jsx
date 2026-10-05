import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, 
  ChevronLeft, FileText, AlertCircle, CheckCircle2,
  ArrowRight, MapPin, Check
} from 'lucide-react';
import { clientService, storeService } from '../services/api';

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
            surnames: '(Sucursal)',
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
        technicianId: provider.user_id || provider.id,
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

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div 
        className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
      />
      <p className="font-bold text-xs uppercase tracking-wider animate-pulse" style={{ color: 'var(--primary)' }}>
        Cargando Agenda...
      </p>
    </div>
  );

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-12 px-6 md:px-20 relative">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2 relative z-10">
            <div 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md ${
                step > s ? 'text-white' : step === s ? 'text-white shadow-lg' : ''
              }`}
              style={{
                backgroundColor: step >= s ? 'var(--primary)' : 'var(--bg-card)',
                color: step >= s ? '#fff' : 'var(--text-muted)',
                border: step >= s ? 'none' : '1px solid var(--border)'
              }}
            >
              {step > s ? <Check size={18} /> : s}
            </div>
            <span 
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {s === 1 ? 'Horario' : s === 2 ? 'Falla' : 'Confirmar'}
            </span>
          </div>
        ))}
        {/* Connector line */}
        <div 
          className="absolute top-5 left-1/4 right-1/4 h-[2px] -z-0"
          style={{ backgroundColor: 'var(--border)' }}
        >
          <div 
            className="h-full transition-all duration-500" 
            style={{ 
              width: `${(step - 1) * 50}%`,
              backgroundColor: 'var(--primary)'
            }} 
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
            className="p-8 md:p-10 rounded-2xl border shadow-xl relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
              >
                <CalendarIcon size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Selecciona Horario
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Reserva una cita técnica con {provider?.names || 'el especialista'}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--primary)' }}>
                  Día de la semana
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {days.map((day) => {
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className="p-4 rounded-xl border text-sm font-bold transition-all text-center"
                        style={{
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg)',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                          boxShadow: isSelected ? '0 4px 14px rgba(45, 107, 255, 0.3)' : 'none'
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--primary)' }}>
                  Hora disponible
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {times.map((time) => {
                    const isSelected = selectedSlot === time;
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedSlot(time)}
                        className="p-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg)',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                          boxShadow: isSelected ? '0 4px 14px rgba(45, 107, 255, 0.3)' : 'none'
                        }}
                      >
                        <Clock size={16} />
                        <span>{time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
              <button 
                disabled={!selectedDay || !selectedSlot}
                onClick={() => setStep(2)}
                className="btn-primary px-8 py-3.5 text-sm flex items-center gap-2 rounded-xl font-bold shadow-lg disabled:opacity-40"
              >
                <span>Continuar</span>
                <ChevronRight size={18} />
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
            className="p-8 md:p-10 rounded-2xl border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
              >
                <FileText size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  ¿Qué problema presenta tu equipo?
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Describe detalladamente el síntoma o motivo de la visita.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <textarea 
                rows="6"
                placeholder="Ej. Mi laptop no enciende, el ventilador hace mucho ruido, la pantalla parpadea, requiero mantenimiento general preventivo..."
                className="w-full rounded-2xl p-5 text-sm outline-none border transition-all"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              
              <div 
                className="p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed"
                style={{ 
                  backgroundColor: 'rgba(45, 107, 255, 0.05)', 
                  borderColor: 'rgba(45, 107, 255, 0.2)',
                  color: 'var(--text-secondary)'
                }}
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                <span>
                  Información: Esta es una solicitud de cita técnica. El profesional revisará tu caso y podrá comunicarse vía chat para brindarte orientación o coordinar la visita.
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-colors hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronLeft size={16} />
                <span>Regresar</span>
              </button>
              <button 
                disabled={!description.trim()}
                onClick={() => setStep(3)}
                className="btn-primary px-8 py-3.5 text-sm flex items-center gap-2 rounded-xl font-bold shadow-lg disabled:opacity-40"
              >
                <span>Ver Resumen</span>
                <ChevronRight size={18} />
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
            className="p-8 md:p-10 rounded-2xl border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Confirmación de Cita
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Revisa los datos antes de registrar tu cita técnica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div 
                className="p-5 rounded-xl border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--primary)' }}>
                  Especialista Seleccionado
                </p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    {provider?.names?.[0] || 'T'}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {provider?.names} {provider?.surnames}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={13} style={{ color: 'var(--primary)' }} />
                      <span>{provider?.city || 'Trujillo, Perú'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className="p-5 rounded-xl border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--primary)' }}>
                  Fecha y Hora
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    <CalendarIcon size={16} style={{ color: 'var(--primary)' }} />
                    <span>{selectedDay}</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    <Clock size={16} style={{ color: 'var(--primary)' }} />
                    <span>{selectedSlot} hrs</span>
                  </div>
                </div>
              </div>

              <div 
                className="md:col-span-2 p-5 rounded-xl border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--primary)' }}>
                  Motivo de la Cita
                </p>
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  "{description}"
                </p>
              </div>
            </div>

            {error && (
              <div 
                className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#EF4444' 
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-lg"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Agendando...</span>
                  </div>
                ) : (
                  <span>Confirmar y Agendar Cita</span>
                )}
              </button>
              <button 
                onClick={() => setStep(2)}
                className="text-xs font-bold uppercase tracking-wider py-2 transition-colors hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                Modificar Detalles
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 text-center rounded-2xl border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(0, 229, 160, 0.15)', color: 'var(--secondary)' }}
            >
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              ¡Cita Agendada con Éxito!
            </h2>
            <p className="max-w-md mx-auto mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Tu solicitud ha sido remitida a {provider?.names}. Podrás revisar el estado y comunicarte con el técnico desde tu panel.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/appointments" 
                className="btn-primary px-8 py-3.5 text-sm font-bold rounded-xl shadow-lg"
              >
                Ver Mis Citas
              </Link>
              <Link 
                to="/" 
                className="px-8 py-3.5 rounded-xl font-bold text-sm border transition-colors hover:opacity-80"
                style={{ 
                  backgroundColor: 'var(--bg)', 
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)' 
                }}
              >
                Volver al Inicio
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentScheduling;
