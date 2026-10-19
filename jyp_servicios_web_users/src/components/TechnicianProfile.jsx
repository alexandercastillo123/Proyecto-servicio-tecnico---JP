import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, MapPin, Phone, Mail, Calendar, 
  MessageSquare, ChevronLeft, ShieldCheck, Zap,
  Clock, CheckCircle2, Wrench, Award, MessageCircle
} from 'lucide-react';
import { clientService } from '../services/api';
import { extractSpecialties, cleanDescription, mediaUrl } from '../services/formatters';
import toast from 'react-hot-toast';

const TechnicianProfile = () => {
  const { id } = useParams();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [sendingReview, setSendingReview] = useState(false);

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

  const handleSubmitReview = async () => {
    setSendingReview(true);
    try {
      const res = await clientService.addReview({
        technicianId: parseInt(id, 10),
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      if (res.data?.exito) {
        toast.success('¡Gracias por tu reseña!');
        setShowReviewForm(false);
        setReviewComment('');
        setReviewRating(5);
        fetchTechDetails();
      } else {
        toast.error(res.data?.mensaje || 'No se pudo registrar la reseña');
      }
    } catch (error) {
      console.error('Error sending review:', error);
      toast.error(error.response?.data?.mensaje || 'No se pudo registrar la reseña');
    } finally {
      setSendingReview(false);
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

  const specialties = extractSpecialties(tech);
  const aboutText = cleanDescription(tech);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canReview = user.role === 'client';

  return (
    <div className="w-full space-y-8 pb-4">
      {/* Back Button */}
      <Link 
        to="/technicians" 
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border bg-white/5 hover:bg-white/10 transition-all font-semibold text-xs tracking-wider uppercase shadow-sm"
        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
      >
        <ChevronLeft size={16} />
        <span>Volver a técnicos</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-8">
          <div 
            className="p-8 sm:p-10 text-center rounded-[32px] border relative overflow-hidden shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            {/* Ambient accent top bar */}
            <div 
              className="absolute top-0 left-0 right-0 h-32 opacity-20 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, var(--primary) 0%, transparent 100%)' }}
            />
            <div 
              className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-extrabold shadow-2xl border-4 border-white/10 mx-auto"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #00C6FF 100%)' }}
            >
              {tech.profile_image_url ? (
                <img src={mediaUrl(tech.profile_image_url)} alt={tech.names} className="w-full h-full rounded-full object-cover" />
              ) : (
                tech.names?.[0] || 'T'
              )}
            </div>
            
            <h1 className="text-2xl font-black mb-1.5 tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {tech.names} {tech.surnames}
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider mb-5" style={{ color: 'var(--primary)' }}>
              Especialista en Soporte Técnico
            </p>

            <div 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 shadow-sm"
              style={{ 
                backgroundColor: 'rgba(0, 229, 160, 0.1)', 
                color: 'var(--secondary)',
                border: '1px solid rgba(0, 229, 160, 0.25)' 
              }}
            >
              <ShieldCheck size={15} />
              <span>Verificado por JyP</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 mt-2">
              <div 
                className="p-4 rounded-2xl border text-center shadow-sm"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="font-extrabold text-xl flex items-center justify-center gap-1.5 text-amber-400">
                  <Star size={18} fill="currentColor" />
                  {tech.rating ? Number(tech.rating).toFixed(1) : '—'}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: 'var(--text-dim)' }}>
                  Calificación
                </p>
              </div>
              <div 
                className="p-4 rounded-2xl border text-center shadow-sm"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="font-extrabold text-xl" style={{ color: 'var(--text-primary)' }}>
                  {tech.reviews_count ?? 0}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-wider mt-1" style={{ color: 'var(--text-dim)' }}>
                  Reseñas
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3.5 text-left pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3.5" style={{ color: 'var(--text-secondary)' }}>
                <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: 'var(--bg)', color: 'var(--primary)' }}>
                  <MapPin size={18} />
                </div>
                <span className="text-sm font-medium">{tech.city || 'Lima Metropolitana'}</span>
              </div>
              {tech.phone && (
                <div className="flex items-center gap-3.5" style={{ color: 'var(--text-secondary)' }}>
                  <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: 'var(--bg)', color: 'var(--primary)' }}>
                    <Phone size={18} />
                  </div>
                  <span className="text-sm font-medium">{tech.phone}</span>
                </div>
              )}
              {tech.email && (
                <div className="flex items-center gap-3.5" style={{ color: 'var(--text-secondary)' }}>
                  <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: 'var(--bg)', color: 'var(--primary)' }}>
                    <Mail size={18} />
                  </div>
                  <span className="text-sm font-medium truncate">{tech.email}</span>
                </div>
              )}
            </div>
          </div>

          <div 
            className="p-8 rounded-[32px] border space-y-4 shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
              Acciones Rápidas
            </h3>
            <Link 
              to={`/appointments/schedule?tech=${tech.id}`} 
              className="btn-primary w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Calendar size={18} />
              <span>Agendar Cita Técnica</span>
            </Link>
            <Link 
              to={`/chat?user=${tech.id}`} 
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border font-black uppercase tracking-wider text-xs transition-all hover:bg-white/5 active:scale-[0.98]"
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
        <div className="lg:col-span-2 space-y-8">
          <section 
            className="p-8 sm:p-10 rounded-[32px] border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2.5" style={{ color: 'var(--primary)' }}>
              <Zap size={18} fill="currentColor" />
              <span>Sobre el Especialista</span>
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-slate-300" style={{ color: 'var(--text-secondary)' }}>
              {aboutText ||
                'Técnico especialista certificado comprometido con la excelencia. Cuenta con amplia experiencia en diagnóstico, mantenimiento preventivo y correctivo, y reparación de dispositivos y equipos computacionales con repuestos originales y garantía de servicio.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-8">
              {(specialties.length > 0 ? specialties : [
                'Diagnóstico Integral de Hardware',
                'Mantenimiento Preventivo y Limpieza',
                'Instalación y Optimización de SO',
                'Recuperación de Información',
              ]).map((skill, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-4 rounded-2xl border text-xs sm:text-sm font-semibold shadow-sm"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <CheckCircle2 size={18} style={{ color: 'var(--secondary)' }} className="shrink-0" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </section>

          <section 
            className="p-8 sm:p-10 rounded-[32px] border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-black uppercase tracking-wider mb-6 flex items-center gap-2.5" style={{ color: 'var(--primary)' }}>
              <Clock size={18} />
              <span>Horarios de Atención Semanal</span>
            </h3>
            <div className="space-y-3">
              {(tech.schedule && tech.schedule.length > 0) ? tech.schedule.map((slot, i) => (
                <div 
                  key={i} 
                  className="flex justify-between items-center p-4 rounded-2xl border text-sm shadow-sm"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <span className="font-bold capitalize text-white" style={{ color: 'var(--text-primary)' }}>
                    {slot.day_of_week}
                  </span>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
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
                  className="text-center py-10 rounded-2xl border border-dashed text-xs"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}
                >
                  Atención disponible de Lunes a Sábado de 09:00 AM a 06:00 PM.
                </div>
              )}
            </div>
          </section>

          <section 
            className="p-8 sm:p-10 rounded-[32px] border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2.5" style={{ color: 'var(--primary)' }}>
                <MessageCircle size={18} />
                <span>Reseñas del Cliente</span>
              </h3>
              {canReview && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="btn-primary px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider"
                >
                  Dejar reseña
                </button>
              )}
            </div>

            {showReviewForm && (
              <div 
                className="p-6 rounded-2xl border mb-6 space-y-4"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} estrellas`}>
                      <Star
                        size={26}
                        className={n <= reviewRating ? 'text-amber-400' : 'text-slate-600'}
                        fill={n <= reviewRating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {reviewRating} / 5
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Cuéntanos cómo fue el servicio (opcional)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-2xl p-4 text-sm outline-none resize-none"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={sendingReview}
                    className="btn-primary px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider disabled:opacity-50"
                  >
                    {sendingReview ? 'Enviando...' : 'Publicar reseña'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 p-6 rounded-2xl border"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
              <div className="text-center">
                <p className="text-4xl font-black text-amber-400">
                  {tech.rating ? Number(tech.rating).toFixed(1) : '—'}
                </p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      className={n <= Math.round(Number(tech.rating) || 0) ? 'text-amber-400' : 'text-slate-600'}
                      fill={n <= Math.round(Number(tech.rating) || 0) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {tech.reviews_count || 0} {tech.reviews_count === 1 ? 'reseña registrada' : 'reseñas registradas'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  Las reseñas se registran sobre citas completadas y verificadas.
                </p>
              </div>
            </div>
          </section>

          <section 
            className="p-8 sm:p-10 rounded-[32px] border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-black uppercase tracking-wider mb-5" style={{ color: 'var(--primary)' }}>
              Ubicación y Referencia
            </h3>
            <div className="flex items-start gap-4">
              <div 
                className="p-4 rounded-2xl text-white shadow-md shrink-0"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <MapPin size={24} />
              </div>
              <div>
                <p className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
                  {tech.city || 'Lima Metropolitana'}, Perú
                </p>
                <p className="text-sm mt-1 text-slate-300" style={{ color: 'var(--text-secondary)' }}>
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
