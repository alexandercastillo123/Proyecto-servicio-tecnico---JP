import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, 
  ChevronLeft, FileText, AlertCircle, CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { clientService } from '../services/api';

const AppointmentScheduling = () => {
  const [searchParams] = useSearchParams();
  const techId = searchParams.get('tech');
  const navigate = useNavigate();
  
  const [tech, setTech] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (techId) {
      fetchTechDetails();
    }
  }, [techId]);

  const fetchTechDetails = async () => {
    try {
      const response = await clientService.getTechnicianDetails(techId);
      if (response.data.success) {
        setTech(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tech:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = {
        technicianId: techId,
        appointmentDate: `${selectedDate} ${selectedSlot}`,
        description,
      };
      const response = await clientService.createAppointment(data);
      if (response.data.success) {
        setStep(4); // Success step
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center animate-pulse text-text-dim font-bold">Iniciando sistema de reservas...</div>;

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-12 px-4 md:px-20">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center relative gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm z-10 transition-all duration-500 ${step >= s ? 'bg-primary text-white shadow-[0_0_20px_rgba(59,40,255,0.4)]' : 'bg-surface-lighter text-text-dim'}`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`absolute left-10 w-[calc(100vw/3)] md:w-40 h-[2px] -z-0 transition-all duration-500 ${step > s ? 'bg-primary' : 'bg-surface-lighter'}`} />
            )}
            <span className={`hidden md:block text-[10px] font-black uppercase tracking-widest ${step >= s ? 'text-white' : 'text-text-dim'}`}>
              {s === 1 ? 'Fecha y Hora' : s === 2 ? 'Detalles' : 'Confirmar'}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-8 md:p-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                <CalendarIcon size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Selecciona Horario</h2>
                <p className="text-text-dim text-sm">¿Cuándo necesitas el servicio de {tech?.names}?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Día de la semana</label>
                <div className="grid grid-cols-2 gap-3">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`p-4 rounded-xl border text-sm font-bold transition-all ${selectedDate === day ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/20'}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Hora disponible</label>
                <div className="grid grid-cols-2 gap-3">
                  {times.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedSlot(time)}
                      className={`p-4 rounded-xl border text-sm font-bold transition-all ${selectedSlot === time ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-text-secondary hover:border-white/20'}`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Clock size={14} />
                        {time}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-end">
              <button 
                disabled={!selectedDate || !selectedSlot}
                onClick={() => setStep(2)}
                className="btn-primary px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-8 md:p-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                <FileText size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Detalles del Problema</h2>
                <p className="text-text-dim text-sm">Cuéntanos un poco más para una mejor cotización.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                <AlertCircle size={20} className="text-primary mt-1" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  Describe los síntomas de la falla o el mantenimiento requerido. Esto ayudará al técnico a preparar las herramientas necesarias.
                </p>
              </div>

              <textarea 
                rows="6"
                placeholder="Escribe aquí los detalles del servicio solicitado..."
                className="input-field w-full p-6 text-sm resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="mt-12 flex justify-between">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-text-dim font-bold hover:text-white transition-all"
              >
                <ChevronLeft size={20} />
                Atrás
              </button>
              <button 
                disabled={!description.trim()}
                onClick={() => setStep(3)}
                className="btn-primary px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-8 md:p-12"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-white mb-2">Resumen de Cita</h2>
              <p className="text-text-dim text-sm">Verifica la información antes de enviar tu solicitud.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="glass-card p-6 border-white/5">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Profesional</h3>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black">
                     {tech?.names?.[0]}
                   </div>
                   <div>
                     <p className="text-white font-bold">{tech?.names} {tech?.surnames}</p>
                     <p className="text-text-dim text-xs">{tech?.city}</p>
                   </div>
                </div>
              </div>

              <div className="glass-card p-6 border-white/5">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Horario Estipulado</h3>
                <div className="space-y-2">
                  <p className="text-white font-bold flex items-center gap-2 text-sm">
                    <CalendarIcon size={14} className="text-primary" />
                    {selectedDate}
                  </p>
                  <p className="text-white font-bold flex items-center gap-2 text-sm">
                    <Clock size={14} className="text-primary" />
                    {selectedSlot} hrs
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 glass-card p-6 border-white/5">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Descripción del Servicio</h3>
                <p className="text-text-secondary text-sm italic">"{description}"</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full py-5 text-base shadow-[0_20px_40px_rgba(59,40,255,0.3)]"
              >
                {submitting ? 'Enviando solicitud...' : 'Confirmar y Agendar'}
              </button>
              <button 
                onClick={() => setStep(2)}
                className="text-text-dim font-bold text-sm hover:text-white transition-all text-center"
              >
                Quiero modificar algo
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
            <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center text-success mx-auto mb-8 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">¡Cita Solicitada!</h2>
            <p className="text-text-dim max-w-md mx-auto mb-10 leading-relaxed">
              Tu solicitud ha sido enviada a {tech?.names}. El técnico revisará los detalles y te responderá vía chat con una cotización inicial.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link to="/appointments" className="btn-primary px-8 py-4">
                Ver mis citas
              </Link>
              <Link to="/dashboard" className="bg-white/5 px-8 py-4 rounded-2xl text-white font-bold hover:bg-white/10 transition-all">
                Ir al Inicio
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentScheduling;
