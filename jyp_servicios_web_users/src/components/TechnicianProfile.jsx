import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, MapPin, Phone, Mail, Calendar, 
  MessageSquare, ChevronLeft, ShieldCheck, Zap,
  Clock, CheckCircle2
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
      if (response.data.success) {
        setTech(response.data.data);
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
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-dim font-bold animate-pulse">Cargando perfil...</p>
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="glass-card p-12 text-center">
        <h2 className="text-2xl font-black text-white mb-4">Técnico no encontrado</h2>
        <Link to="/technicians" className="btn-primary inline-flex">Volver al buscador</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Back Button */}
      <Link to="/technicians" className="inline-flex items-center gap-2 text-text-dim hover:text-white transition-all font-bold text-sm">
        <ChevronLeft size={18} />
        Volver a técnicos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent" />
            
            <div className="relative mb-6 mx-auto w-32 h-32 bg-primary rounded-[32px] flex items-center justify-center text-white text-5xl font-black shadow-2xl border-4 border-background">
              {tech.names?.[0]}
            </div>
            
            <h1 className="text-2xl font-black text-white mb-2">{tech.names} {tech.surnames}</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6">
              <ShieldCheck size={12} fill="currentColor" />
              Técnico Verificado
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-warning font-black text-xl flex items-center justify-center gap-1">
                  <Star size={18} fill="currentColor" />
                  {tech.rating || '4.5'}
                </p>
                <p className="text-[10px] text-text-dim uppercase font-bold mt-1">Rating</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-white font-black text-xl">{tech.reviews_count || '120'}</p>
                <p className="text-[10px] text-text-dim uppercase font-bold mt-1">Reseñas</p>
              </div>
            </div>

            <div className="mt-8 space-y-4 text-left">
              <div className="flex items-center gap-3 text-text-secondary">
                <MapPin size={18} className="text-primary" />
                <span className="text-sm font-medium">{tech.city}</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Phone size={18} className="text-primary" />
                <span className="text-sm font-medium">{tech.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail size={18} className="text-primary" />
                <span className="text-sm font-medium truncate">{tech.email}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-4">Acciones</h3>
            <Link to={`/appointments/schedule?tech=${tech.id}`} className="btn-primary w-full py-4 text-sm">
              <Calendar size={18} />
              Agendar Cita
            </Link>
            <Link to={`/chat?user=${tech.id}`} className="w-full flex items-center justify-center gap-2 bg-white/5 p-4 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all">
              <MessageSquare size={18} />
              Enviar Mensaje
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-panel p-8">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap size={16} fill="currentColor" />
              Sobre el Profesional
            </h3>
            <p className="text-text-secondary leading-relaxed">
              Técnico especialista comprometido con la excelencia. Cuenta con amplia experiencia en mantenimiento y reparación técnica, ofreciendo soluciones rápidas y garantizadas para clientes naturales y jurídicos.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {[
                'Reparación de Hardware', 'Mantenimiento Preventivo', 
                'Instalación de Software', 'Asesoría Técnica'
              ].map((skill, i) => (
                <div key={i} className="flex items-center gap-2 text-text-secondary text-sm">
                  <CheckCircle2 size={16} className="text-success" />
                  {skill}
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-8">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock size={16} />
              Horarios de Atención
            </h3>
            <div className="space-y-3">
              {(tech.schedule && tech.schedule.length > 0) ? tech.schedule.map((slot, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <span className="text-white font-bold text-sm">{slot.day_of_week}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${slot.is_active ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                      {slot.is_active ? 'Abierto' : 'Cerrado'}
                    </span>
                    <span className="text-text-secondary text-sm">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-text-dim italic text-sm">
                  No se han definido horarios específicos.
                </div>
              )}
            </div>
          </section>

          <section className="glass-panel p-8">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest mb-6">Ubicación y Referencia</h3>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-xl text-primary">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-white font-bold">{tech.city}, Perú</p>
                <p className="text-text-secondary text-sm mt-1">{tech.reference_address || tech.address}</p>
              </div>
            </div>
            {/* Simple Map Placeholder */}
            <div className="mt-6 aspect-video rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
               <div className="text-text-dim text-xs">Vista de mapa del taller próximamente</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TechnicianProfile;
