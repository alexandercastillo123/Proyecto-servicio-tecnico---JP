import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Clock, ChevronRight, 
  ChevronLeft, FileText, AlertCircle, CheckCircle2,
  ArrowRight, MapPin, Check, Wrench, ShieldCheck, Cpu,
  Search, User, X, Star, RefreshCw
} from 'lucide-react';
import { clientService, storeService } from '../services/api';
import { extractTechnicians, localDateString, toLimaDate, WEEK_DAYS } from '../services/formatters';
import { TechLoader } from './common/TechLoader';
import { toast } from 'react-hot-toast';

const AppointmentScheduling = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const providerId = searchParams.get('tech') || searchParams.get('store');
  const navigate = useNavigate();
  
  const [provider, setProvider] = useState(null);
  const [techniciansList, setTechniciansList] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [showTechPicker, setShowTechPicker] = useState(false);
  const [searchTechTerm, setSearchTechTerm] = useState('');
  
  const [step, setStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('local');
  const [schedule, setSchedule] = useState([]);
  const [isStoreProvider, setIsStoreProvider] = useState(false);
  const [location, setLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user_location') || 'null') || {
        address: 'Lima Centro, Perú',
        lat: -12.046374,
        lng: -77.042793,
      };
    } catch {
      return { address: 'Lima Centro, Perú', lat: -12.046374, lng: -77.042793 };
    }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTechniciansList();
    if (providerId) {
      fetchProviderDetails(providerId);
    } else {
      setLoading(false);
    }
  }, [providerId]);

  const fetchTechniciansList = async () => {
    setLoadingTechs(true);
    try {
      const res = await clientService.getTechnicians({ page: 1, limit: 30 });
      setTechniciansList(extractTechnicians(res));
    } catch (err) {
      console.error('Error fetching technicians list:', err);
      setTechniciansList([]);
    } finally {
      setLoadingTechs(false);
    }
  };

  /* Carga el horario real publicado por el técnico o la sucursal (GET .../schedule) */
  const fetchProviderSchedule = async (id, store) => {
    try {
      const res = store
        ? await storeService.getStoreSchedules(id).catch(() => null)
        : await clientService.getTechnicianSchedule(id).catch(() => null);
      const rows = res?.data?.resultado;
      setSchedule(Array.isArray(rows) ? rows : []);
    } catch {
      setSchedule([]);
    }
  };

  const fetchProviderDetails = async (id) => {
    setLoading(true);
    try {
      const techResp = await clientService.getTechnicianDetails(id).catch(() => null);
      if (techResp?.data?.exito) {
        setProvider(techResp.data.resultado);
        setIsStoreProvider(false);
        setServiceType('domicilio');
        await fetchProviderSchedule(id, false);
      } else {
        const branchResp = await storeService.getBranchDetails(id).catch(() => null);
        if (branchResp?.data?.exito) {
          const b = branchResp.data.resultado;
          setProvider({
            id: b.id,
            user_id: b.user_id,
            names: b.name,
            surnames: '(Sucursal Oficial)',
            city: b.city,
            address: b.address,
            latitude: b.latitude,
            longitude: b.longitude,
          });
          setIsStoreProvider(true);
          setServiceType('local');
          await fetchProviderSchedule(b.id, true);
        } else {
          setError('No se pudo cargar la información del prestador seleccionado.');
        }
      }
    } catch (err) {
      console.error('Error fetching provider:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTechnician = async (tech) => {
    setProvider(tech);
    setSearchParams({ tech: String(tech.id || tech.user_id) });
    setShowTechPicker(false);
    setError(null);
    setSelectedDay('');
    setSelectedSlot('');
    setServiceType('domicilio');
    setIsStoreProvider(false);
    await fetchProviderSchedule(tech.id, false);
  };

  /* Calcula la próxima fecha (hora de Lima) que corresponde al día elegido.
     Se usa la fecha local, no toISOString(), porque en Lima (UTC-5) eso adelantaba un día. */
  const getNextDateForDay = (dayName) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const targetDayIndex = days.indexOf(dayName);
    if (targetDayIndex === -1) return localDateString();

    const now = toLimaDate();
    const resultDate = toLimaDate();
    const diff = (targetDayIndex + 7 - now.getDay()) % 7;
    const addDays = diff === 0 && now.getHours() >= 18 ? 7 : diff;
    resultDate.setDate(resultDate.getDate() + addDays);
    return localDateString(resultDate);
  };

  const handleSubmit = async () => {
    const targetTechId = provider?.user_id || provider?.id;
    if (!targetTechId) {
      setError('Por favor selecciona un especialista técnico para tu cita.');
      return;
    }
    if (!selectedDay || !selectedSlot) {
      setError('Por favor selecciona un día y horario de atención.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      /* Evita citas duplicadas activas con el mismo prestador (como en Android) */
      const existing = await clientService.getMyAppointments().catch(() => null);
      const mine = existing?.data?.resultado;
      const list = Array.isArray(mine) ? mine : [];
      const duplicate = list.find(
        (a) =>
          String(a.technician_id) === String(targetTechId) &&
          ['pending', 'confirmed'].includes(a.status)
      );
      if (duplicate) {
        setError('Ya tienes una cita activa con este especialista. Revisa "Mis Citas" antes de agendar otra.');
        setSubmitting(false);
        return;
      }

      const scheduledDate = getNextDateForDay(selectedDay);
      const data = {
        technicianId: parseInt(targetTechId, 10),
        scheduledDate: scheduledDate,
        scheduledTime: selectedSlot,
        description: description?.trim() || 'Diagnóstico y reparación de equipo',
        serviceType: serviceType || 'local',
      };

      if (serviceType === 'domicilio') {
        data.serviceLat = location.lat;
        data.serviceLng = location.lng;
        data.serviceAddress = location.address;
      }

      const response = await clientService.createAppointment(data);
      if (response.data?.exito) {
        toast.success('Cita registrada correctamente');
        setStep(4);
      } else {
        setError(response.data?.mensaje || 'Error al procesar la cita');
      }
    } catch (err) {
      console.error('Error creating appointment:', err);
      const backendMsg = err.response?.data?.resultado?.[0]?.mensaje
        || err.response?.data?.mensaje
        || 'Error de conexión con el servidor';
      setError(backendMsg);
    } finally {
      setSubmitting(false);
    }
  };

  /* Días disponibles: si el prestador publicó horario se usa el suyo, si no el genérico */
  const scheduleByDay = useMemo(() => {
    const map = {};
    schedule.forEach((row) => {
      const key = row.day_of_week || row.dayOfWeek;
      if (!key) return;
      if (!map[key]) map[key] = { active: false, start: null, end: null };
      if (row.is_active === false || row.is_active === 0 || row.is_closed) return;
      map[key].active = true;
      const start = row.start_time || row.open_time;
      const end = row.end_time || row.close_time;
      if (start) map[key].start = String(start).slice(0, 5);
      if (end) map[key].end = String(end).slice(0, 5);
    });
    return map;
  }, [schedule]);

  const hasSchedule = schedule.length > 0;

  const days = useMemo(() => {
    if (!hasSchedule) return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return WEEK_DAYS
      .filter((d) => scheduleByDay[d.key]?.active)
      .map((d) => d.label);
  }, [hasSchedule, scheduleByDay]);

  const times = useMemo(() => {
    if (!hasSchedule || !selectedDay) {
      return ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    }
    const dayKey = WEEK_DAYS.find((d) => d.label === selectedDay)?.key;
    const info = scheduleByDay[dayKey];
    if (!info?.start || !info?.end) return [];
    const slots = [];
    const [sh, sm] = info.start.split(':').map(Number);
    const [eh, em] = info.end.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur <= end && slots.length < 24) {
      slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
      cur += 60;
    }
    return slots;
  }, [hasSchedule, selectedDay, scheduleByDay]);

  useEffect(() => {
    if (selectedSlot && !times.includes(selectedSlot)) {
      setSelectedSlot('');
    }
  }, [times, selectedSlot]);

  const filteredTechs = techniciansList.filter(t => {
    const q = searchTechTerm.toLowerCase();
    const fullName = `${t.names || ''} ${t.surnames || ''} ${t.company_name || ''}`.toLowerCase();
    const specs = (t.specialties || '').toLowerCase();
    const city = (t.city || '').toLowerCase();
    return !q || fullName.includes(q) || specs.includes(q) || city.includes(q);
  });

  if (loading) {
    return (
      <TechLoader 
        title="Consultando Disponibilidad" 
        subtitle="Verificando agenda del especialista..." 
      />
    );
  }

  return (
    <div className="jyp-page max-w-4xl mx-auto">
      
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8 px-4 sm:px-12 relative">
        {[
          { num: 1, label: 'Especialista & Horario' },
          { num: 2, label: 'Diagnóstico' },
          { num: 3, label: 'Confirmación' }
        ].map(({ num, label }) => (
          <div key={num} className="flex flex-col items-center gap-2 relative z-10">
            <div 
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-md ${
                step > num 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                  : step === num 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] ring-4 ring-cyan-400/30' 
                  : 'bg-slate-900 text-slate-500 border border-white/10'
              }`}
            >
              {step > num ? <Check size={20} strokeWidth={3} /> : num}
            </div>
            <span 
              className={`text-[11px] font-bold uppercase tracking-wider text-center ${
                step >= num ? 'text-cyan-300' : 'text-slate-500'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
        {/* Connector line */}
        <div className="absolute top-6 left-1/4 right-1/4 h-[2px] -z-0 bg-white/10">
          <div 
            className="h-full transition-all duration-500 bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_#06B6D4]" 
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
            className="jyp-card p-6 sm:p-10 relative overflow-hidden space-y-8"
          >
            {/* Header */}
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white"
              >
                <CalendarIcon size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white font-heading">
                  Agendar Reparación Técnica
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Selecciona el especialista asignado y tu horario de preferencia en Lima.
                </p>
              </div>
            </div>

            {/* Specialist Selection Box */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">
                  Técnico Seleccionado
                </span>
                <button
                  type="button"
                  onClick={() => setShowTechPicker(!showTechPicker)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/15 border border-blue-400/30 text-blue-300 hover:bg-blue-500/25 transition-all"
                >
                  <RefreshCw size={12} />
                  <span>{provider ? 'Cambiar de Técnico' : 'Elegir Técnico'}</span>
                </button>
              </div>

              {provider ? (
                <div className="flex items-center gap-3.5 pt-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shrink-0 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
                  >
                    {provider.names?.[0]?.toUpperCase() || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-white truncate">
                      {provider.names} {provider.surnames}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-blue-400" />
                      <span>{provider.city || 'Lima'}</span>
                      {provider.rating && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                          <Star size={11} fill="currentColor" /> {parseFloat(provider.rating).toFixed(1)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-300 font-semibold mb-2">Aún no has seleccionado un técnico</p>
                  <button
                    type="button"
                    onClick={() => setShowTechPicker(true)}
                    className="btn-primary py-2 px-5 text-xs font-bold rounded-xl"
                  >
                    Seleccionar de la lista de especialistas
                  </button>
                </div>
              )}
            </div>

            {/* Technician Picker Drawer/Modal (Non-obstructive) */}
            <AnimatePresence>
              {showTechPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-5 space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">Selecciona un Especialista Certificado</h4>
                      <p className="text-xs text-slate-400">Busca por nombre, necesidad (laptop, redes) o ciudad</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTechPicker(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ej: Laptops, Recuperación de datos, Lima..."
                      value={searchTechTerm}
                      onChange={(e) => setSearchTechTerm(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 38, height: 42, borderRadius: 12 }}
                    />
                  </div>

                  {/* List */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {loadingTechs ? (
                      <div className="p-4 text-center text-xs text-slate-400">Cargando especialistas...</div>
                    ) : filteredTechs.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No se encontraron especialistas</div>
                    ) : (
                      filteredTechs.map((tech) => (
                        <div
                          key={tech.id}
                          onClick={() => handleSelectTechnician(tech)}
                          className="p-3 rounded-xl border border-white/5 hover:border-blue-500/50 bg-white/5 hover:bg-white/10 cursor-pointer flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-300 font-black flex items-center justify-center text-sm">
                              {tech.names?.[0] || 'T'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{tech.names} {tech.surnames}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <MapPin size={10} className="text-cyan-400" />
                                <span>{tech.city || 'Lima'}</span>
                                {tech.specialties && (
                                  <span className="text-blue-300 ml-1">· {tech.specialties.split(',')[0]}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-primary py-1 px-3 text-[10px] font-bold rounded-lg"
                          >
                            Seleccionar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date & Slot selection */}
            {hasSchedule && (
              <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 text-[11px] text-cyan-200 flex items-start gap-2.5">
                <Clock size={14} className="shrink-0 mt-0.5" />
                <span>
                  Horario publicado por el prestador:{' '}
                  {scheduleByDay && Object.keys(scheduleByDay).length > 0
                    ? Object.entries(scheduleByDay)
                        .filter(([, v]) => v.active)
                        .map(([k, v]) => {
                          const label = WEEK_DAYS.find((d) => d.key === k)?.label || k;
                          return `${label} ${v.start}-${v.end}`;
                        })
                        .join(' · ')
                    : 'sin días activos'}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Day selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                  Día de la Semana
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {days.map((day) => {
                    const isSelected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold transition-all text-center shadow-sm ${
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
                <div className="grid grid-cols-2 gap-3">
                  {times.map((time) => {
                    const isSelected = selectedSlot === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedSlot(time)}
                        className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
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

            {/* Modalidad de atención */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                Modalidad de Atención
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'domicilio', label: 'Técnico a Domicilio', desc: 'El especialista se desplaza a tu ubicación', icon: MapPin },
                  { id: 'local', label: 'Atención en Local', desc: 'Acudes a la sucursal o taller del prestador', icon: Wrench },
                ]
                  .filter((opt) => isStoreProvider || opt.id === 'domicilio')
                  .map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = serviceType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setServiceType(opt.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-400/60 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                          <Icon size={15} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                          {opt.label}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-1 leading-relaxed">{opt.desc}</span>
                      </button>
                    );
                  })}
              </div>

              {serviceType === 'domicilio' && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                  <MapPin size={12} className="text-cyan-400" />
                  <span>Punto de servicio: <strong className="text-slate-200">{location.address}</strong></span>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-6 border-t border-white/10 flex justify-end">
              <button 
                disabled={!provider || !selectedDay || !selectedSlot}
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
                className="jyp-btn-primary disabled:opacity-40"
              >
                <span>Continuar a Diagnóstico</span>
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
            className="jyp-card p-6 sm:p-10 space-y-8"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white"
              >
                <FileText size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white font-heading">
                  Descripción de la Falla
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Explica con el mayor detalle posible el síntoma que presenta tu equipo.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <textarea 
                rows="5"
                placeholder="Ejemplo: Mi laptop enciende los ventiladores pero no da video en pantalla. Comenzó tras una sobretensión eléctrica..."
                className="w-full p-4 rounded-2xl border border-white/10 bg-white/5 text-white text-xs sm:text-sm outline-none focus:border-cyan-400 leading-relaxed resize-none transition-all shadow-inner"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              
              <div 
                className="p-5 rounded-2xl border border-blue-500/25 bg-blue-500/10 flex items-start gap-3.5 text-xs text-slate-300 leading-relaxed"
              >
                <ShieldCheck size={20} className="shrink-0 text-cyan-400 mt-0.5" />
                <span>
                  <strong className="text-white">Garantía Escrita JyP:</strong> Tu cita incluye diagnóstico exhaustivo y revisión técnica. Podrás acordar repuestos originales y presupuesto directamente con el especialista asignado.
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/10">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="jyp-btn-ghost"
              >
                <ChevronLeft size={16} /> <span>Regresar</span>
              </button>
              <button 
                disabled={!description.trim()}
                onClick={() => setStep(3)}
                className="jyp-btn-primary disabled:opacity-40"
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
            className="jyp-card p-6 sm:p-10 space-y-8"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                Confirmación de la Cita Técnica
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Verifica los datos del servicio antes de emitir la orden a la red técnica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Provider Info */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                  Especialista Asignado
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
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                  Fecha & Horario de Atención
                </span>
                <div className="space-y-1.5 text-sm font-bold text-white">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={15} className="text-cyan-400" />
                    <span>{selectedDay} ({getNextDateForDay(selectedDay)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-cyan-400" />
                    <span>{selectedSlot} hrs</span>
                  </div>
                </div>
              </div>

              {/* Problem Details */}
              <div className="md:col-span-2 p-5 rounded-2xl border border-white/10 bg-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-2">
                  Detalle del Requerimiento
                </span>
                <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                  "{description}"
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl flex items-center gap-3 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="jyp-btn-primary w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
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
                className="text-xs font-bold text-slate-400 hover:text-white py-2 transition-colors cursor-pointer text-center"
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
            className="jyp-card p-8 sm:p-14 text-center rounded-[32px] shadow-2xl space-y-5"
          >
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-emerald-500/20 text-emerald-400 border border-emerald-400/40"
            >
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-black text-white font-heading">
              ¡Cita Técnica Solicitada!
            </h2>
            <p className="max-w-md mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed">
              La solicitud ha sido registrada correctamente. El técnico revisará tu orden y se comunicará contigo vía chat para coordinar el diagnóstico.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-4">
              <Link 
                to="/appointments" 
                className="jyp-btn-primary"
              >
                Ver Mis Citas
              </Link>
              <Link 
                to="/" 
                className="jyp-btn-ghost"
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
