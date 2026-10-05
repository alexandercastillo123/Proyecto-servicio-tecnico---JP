import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, MapPin, Phone, Mail, Calendar, 
  MessageSquare, ChevronLeft, ShieldCheck, Zap,
  Clock, CheckCircle2, Wrench, Award
} from 'lucide-react';
import { clientService } from '../services/api';

const TechnicianProfile = () => {
  const { id } = useParams();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTechDetails();
  }, [id]);

  const fetchTechDetails = async () => {
    try {
      const response = await clientService.getTechnicianDetails(id);
      if (response.data.exito) {
        setTech(response.data.resultado);
      }
    } catch (error) {
      console.error('Error fetching tech details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div 
          className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm font-semibold animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          Cargando perfil del especialista...
        </p>
      </div>
    );
  }

  if (!tech) {
    return (
      <div 
        className="p-12 text-center rounded-2xl border max-w-lg mx-auto mt-12"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
        >
          <Wrench size={32} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Técnico no encontrado
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          El profesional que estás buscando no existe o ya no se encuentra disponible.
        </p>
        <Link 
          to="/technicians" 
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
        >
          <ChevronLeft size={16} />
          Volver al directorio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Back Button */}
      <Link 
        to="/technicians" 
        className="inline-flex items-center gap-2 transition-all font-semibold text-sm hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ChevronLeft size={18} />
        <span>Volver a técnicos</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div 
            className="p-8 text-center rounded-2xl border relative overflow-hidden shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            {/* Ambient accent top bar */}
            <div 
              className="absolute top-0 left-0 right-0 h-28 opacity-15"
              style={{ background: 'linear-gradient(180deg, var(--primary) 0%, transparent 100%)' }}
            />
            
            <div className="relative mb-5 mx-auto w-28 h-28 rounded-3xl flex items-center justify-center text-white text-4xl font-extrabold shadow-xl"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #00C6FF 100%)' }}
            >
              {tech.names?.[0] || 'T'}
            </div>
            
            <h1 className="text-xl font-bold mb-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {tech.names} {tech.surnames}
            </h1>
            <p className="text-xs font-semibold mb-4" style={{ color: 'var(--primary)' }}>
              Especialista en Soporte Técnico
            </p>

            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-6"
              style={{ 
                backgroundColor: 'rgba(0, 229, 160, 0.1)', 
                color: 'var(--secondary)',
                border: '1px solid rgba(0, 229, 160, 0.25)' 
              }}
            >
              <ShieldCheck size={14} />
              <span>Verificado por JyP</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div 
                className="p-3.5 rounded-xl border text-center"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="font-extrabold text-lg flex items-center justify-center gap-1 text-amber-400">
                  <Star size={16} fill="currentColor" />
                  {tech.rating || '4.8'}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Calificación
                </p>
              </div>
              <div 
                className="p-3.5 rounded-xl border text-center"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="font-extrabold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {tech.reviews_count || '120+'}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Servicios
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-left pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg)', color: 'var(--primary)' }}>
                  <MapPin size={16} />
                </div>
                <span className="text-sm font-medium">{tech.city || 'Trujillo, Perú'}</span>
              </div>
              {tech.phone && (
                <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg)', color: 'var(--primary)' }}>
                    <Phone size={16} />
                  </div>
                  <span className="text-sm font-medium">{tech.phone}</span>
                </div>
              )}
              {tech.email && (
                <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg)', color: 'var(--primary)' }}>
                    <Mail size={16} />
                  </div>
                  <span className="text-sm font-medium truncate">{tech.email}</span>
                </div>
              )}
            </div>
          </div>

          <div 
            className="p-6 rounded-2xl border space-y-3 shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Acciones Rápidas
            </h3>
            <Link 
              to={`/appointments/schedule?tech=${tech.id}`} 
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 rounded-xl font-bold shadow-lg"
            >
              <Calendar size={18} />
              <span>Agendar Cita Técnica</span>
            </Link>
            <Link 
              to={`/chat?user=${tech.id}`} 
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border font-bold text-sm transition-all"
              style={{ 
                backgroundColor: 'var(--bg)', 
                borderColor: 'var(--border)', 
                color: 'var(--text-primary)' 
              }}
            >
              <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
              <span>Enviar Mensaje</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <section 
            className="p-8 rounded-2xl border shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <Zap size={16} fill="currentColor" />
              <span>Sobre el Especialista</span>
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {tech.description || 
                'Técnico especialista certificado comprometido con la excelencia. Cuenta con amplia experiencia en diagnóstico, mantenimiento preventivo y correctivo, y reparación de dispositivos y equipos computacionales con repuestos originales y garantía de servicio.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
              {[
                'Diagnóstico Integral de Hardware',
                'Mantenimiento Preventivo y Limpieza',
                'Instalación y Optimización de SO',
                'Recuperación de Información',
                'Reemplazo de Pantallas y Baterías',
                'Asesoría y Garantía JyP'
              ].map((skill, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <CheckCircle2 size={16} style={{ color: 'var(--secondary)' }} className="shrink-0" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </section>

          <section 
            className="p-8 rounded-2xl border shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <Clock size={16} />
              <span>Horarios de Atención Semanal</span>
            </h3>
            <div className="space-y-2.5">
              {(tech.schedule && tech.schedule.length > 0) ? tech.schedule.map((slot, i) => (
                <div 
                  key={i} 
                  className="flex justify-between items-center p-3.5 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <span className="font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                    {slot.day_of_week}
                  </span>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      style={slot.is_active ? {
                        backgroundColor: 'rgba(0, 229, 160, 0.1)',
                        color: 'var(--secondary)'
                      } : {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444'
                      }}
                    >
                      {slot.is_active ? 'Disponible' : 'Cerrado'}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                    </span>
                  </div>
                </div>
              )) : (
                <div 
                  className="text-center py-8 rounded-xl border border-dashed text-xs"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Atención disponible de Lunes a Sábado de 09:00 AM a 06:00 PM.
                </div>
              )}
            </div>
          </section>

          <section 
            className="p-8 rounded-2xl border shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--primary)' }}>
              Ubicación y Referencia
            </h3>
            <div className="flex items-start gap-4">
              <div 
                className="p-3.5 rounded-xl text-white"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <MapPin size={22} />
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {tech.city || 'Trujillo'}, Perú
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {tech.reference_address || tech.address || 'Zona céntrica, atención a domicilio y en taller registrado.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TechnicianProfile;
