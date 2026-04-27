import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, 
  ChevronLeft, FileText, AlertCircle, CheckCircle2,
  ArrowRight, MapPin
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
      // First try as tech
      const techResp = await clientService.getTechnicianDetails(providerId).catch(() => null);
      if (techResp?.data?.exito) {
        setProvider(techResp.data.resultado);
      } else {
        // Then try as branch
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
    
    // If it's today but time might have passed, or just always pick next week if it's today
    // For simplicity, let's just return the YYYY-MM-DD
    return resultDate.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const scheduledDate = getNextDateForDay(selectedDay);
      const data = {
        technicianId: provider.user_id || provider.id, // backend expects user_id for technicians, but let's check
        scheduledDate: scheduledDate,
        scheduledTime: selectedSlot,
        description,
        serviceType: 'local' // Stores usually local
      };
      
      const response = await clientService.createAppointment(data);
      if (response.data.exito) {
        setStep(4); // Success step
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
    <div className="h-screen bg-[#020306] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#3B28FF] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[#3B28FF] font-black text-xs uppercase tracking-widest">Cargando Agenda...</p>
    </div>
  );

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 font-outfit">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-16 px-4 md:px-20 relative">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-3 relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base transition-all duration-500 ${step >= s ? 'bg-primary text-white shadow-2xl shadow-primary/40 rotate-12' : 'bg-white/5 text-text-dim border border-white/10'}`}>
              {s}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-white' : 'text-text-dim'}`}>
              {s === 1 ? 'Agenda' : s === 2 ? 'Detalles' : 'Confirmar'}
            </span>
          </div>
        ))}
        {/* Connector lines */}
        <div className="absolute top-6 left-1/4 right-1/4 h-[2px] bg-white/5 -z-0">
          <div className={`h-full bg-primary transition-all duration-700 shadow-[0_0_10px_#3B28FF]`} style={{ width: `${(step-1) * 50}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-5 mb-10 relative z-10">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                <CalendarIcon size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">Selecciona Horario</h2>
                <p className="text-text-dim text-sm">Reserva una cita con {provider?.names || 'el experto'}.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <div className="space-y-6">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] pl-1">Día de la semana</label>
                <div className="grid grid-cols-2 gap-3">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`p-5 rounded-2xl border-2 text-sm font-black transition-all ${selectedDay === day ? 'bg-primary border-primary text-white shadow-xl scale-95' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] pl-1">Hora disponible</label>
                <div className="grid grid-cols-2 gap-3">
                  {times.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedSlot(time)}
                      className={`p-5 rounded-2xl border-2 text-sm font-black transition-all ${selectedSlot === time ? 'bg-primary border-primary text-white shadow-xl scale-95' : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Clock size={16} />
                        {time}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
              <button 
                disabled={!selectedDay || !selectedSlot}
                onClick={() => setStep(2)}
                className="btn-primary px-10 py-5 disabled:opacity-30"
              >
                Continuar
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-8 md:p-12"
          >
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                <FileText size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">¿Qué problema tienes?</h2>
                <p className="text-text-dim text-sm">Describe brevemente la falla de tu equipo.</p>
              </div>
            </div>

            <div className="space-y-6">
              <textarea 
                rows="8"
                placeholder="Ej. Mi laptop no enciende, el ventilador hace mucho ruido, necesito mantenimiento general..."
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-white text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-700"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              
              <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                <AlertCircle size={24} className="text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Información importante: Esta es una solicitud de cita. El técnico revisará tu descripción y podrá enviarte un presupuesto inicial a través del chat antes de confirmar la visita.
                </p>
              </div>
            </div>

            <div className="mt-12 flex justify-between items-center">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-slate-500 font-black hover:text-white transition-all uppercase tracking-widest text-[10px]"
              >
                <ChevronLeft size={18} />
                Regresar
              </button>
              <button 
                disabled={!description.trim()}
                onClick={() => setStep(3)}
                className="btn-primary px-10 py-5 disabled:opacity-30"
              >
                Ver Resumen
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-8 md:p-12"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-white mb-2">Resumen de Cita</h2>
              <p className="text-text-dim text-sm">Confirma los detalles para agendar con el experto.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Profesional</p>
                <div 
                  className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-2 rounded-2xl transition-all"
                  onClick={() => {
                    const techId = searchParams.get('tech');
                    const storeId = searchParams.get('store');
                    if (techId) navigate(`/technician/${techId}`);
                    else if (storeId) navigate(`/store/${storeId}`);
                  }}
                >
                   <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-2xl">
                     {provider?.names?.[0]}
                   </div>
                   <div>
                     <p className="text-white font-black text-lg group-hover:text-primary transition-colors">{provider?.names} {provider?.surnames}</p>
                     <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <MapPin size={14} className="text-primary" />
                        {provider?.city}
                     </div>
                   </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Fecha y Hora</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white font-black text-lg">
                    <CalendarIcon size={20} className="text-primary" />
                    {selectedDay}
                  </div>
                  <div className="flex items-center gap-3 text-white font-black text-lg">
                    <Clock size={20} className="text-primary" />
                    {selectedSlot} hrs
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 p-8 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Problema Reportado</p>
                <p className="text-slate-300 text-lg italic leading-relaxed">"{description}"</p>
              </div>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error text-sm font-bold animate-in shake duration-500">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-5">
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full py-6 text-lg shadow-2xl shadow-primary/30"
              >
                {submitting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Agendando...
                  </div>
                ) : (
                  'Confirmar y Agendar'
                )}
              </button>
              <button 
                onClick={() => setStep(2)}
                className="text-slate-500 font-black text-[10px] hover:text-white transition-all uppercase tracking-[0.3em] text-center"
              >
                Modificar Detalles
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-12 text-center"
          >
            <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center text-success mx-auto mb-10 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              <CheckCircle2 size={56} />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">¡Reserva Exitosa!</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-12 text-lg leading-relaxed">
              Tu solicitud ha sido enviada a {provider?.names}. Te notificaremos vía chat en cuanto el profesional revise tu caso.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/appointments" className="btn-primary px-12 py-5 text-lg">
                Mis Citas
              </Link>
              <Link to="/" className="bg-white/5 px-12 py-5 rounded-2xl text-white font-black hover:bg-white/10 transition-all border border-white/5">
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
