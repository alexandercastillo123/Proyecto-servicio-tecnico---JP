import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star, MapPin, Phone, Mail, Calendar,
  MessageSquare, ChevronLeft, ShieldCheck, Zap,
  Clock, CheckCircle2, Wrench, Award, MessageCircle,
  Sparkles, Check, ArrowRight
} from "lucide-react";
import { clientService } from "../services/api";
import { extractSpecialties, cleanDescription, mediaUrl } from "../services/formatters";
import toast from "react-hot-toast";

const TechnicianProfile = () => {
  const { id } = useParams();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);

  useEffect(() => {
    fetchTechDetails();
  }, [id]);

  const fetchTechDetails = async () => {
    try {
      const response = await clientService.getTechnicianDetails(id);
      if (response.data?.exito) {
        setTech(response.data.resultado);
      }
    } catch (error) {
      console.error("Error fetching tech details:", error);
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
        toast.success("¡Reseña registrada y certificada con éxito!");
        setShowReviewForm(false);
        setReviewComment("");
        setReviewRating(5);
        fetchTechDetails();
      } else {
        toast.error(res.data?.mensaje || "No se pudo registrar la reseña");
      }
    } catch (error) {
      console.error("Error sending review:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo registrar la reseña");
    } finally {
      setSendingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-slate-400 animate-pulse">
          Cargando telemetría del especialista...
        </p>
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="p-12 text-center rounded-[32px] border border-white/10 bg-[#0a101b] max-w-lg mx-auto mt-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Wrench size={32} />
        </div>
        <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Especialista No Encontrado
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          El técnico que buscas no está disponible o su registro se encuentra fuera de servicio.
        </p>
        <Link
          to="/technicians"
          className="jyp-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider"
        >
          <ChevronLeft size={16} /> Volver al directorio
        </Link>
      </div>
    );
  }

  const specialties = extractSpecialties(tech);
  const aboutText = cleanDescription(tech);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canReview = user.role === "client";

  return (
    <div className="w-full space-y-8 pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Back button */}
      <div>
        <Link
          to="/technicians"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-wider text-slate-300 hover:text-white"
        >
          <ChevronLeft size={16} />
          <span>Volver al Directorio Satelital</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tech Hero Card & Quick Actions */}
        <div className="lg:col-span-1 space-y-8">
          <div className="p-8 text-center rounded-[32px] border border-white/10 bg-[#0a101b]/95 shadow-2xl relative overflow-hidden space-y-5">
            {/* Ambient accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/20 via-cyan-500/10 to-transparent pointer-events-none" />

            {/* Avatar or profile image */}
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center text-white text-4xl font-extrabold shadow-2xl border-4 border-white/10 mx-auto relative z-10 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)" }}
            >
              {tech.profile_image_url ? (
                <img
                  src={mediaUrl(tech.profile_image_url)}
                  alt={tech.names}
                  className="w-full h-full object-cover"
                />
              ) : (
                tech.names?.[0] || "T"
              )}
            </div>

            <div className="relative z-10 space-y-1">
              <h1
                className="text-2xl font-black text-white tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {tech.names} {tech.surnames}
              </h1>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Especialista de Hardware Certificado
              </p>
            </div>

            {/* Verified badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              <ShieldCheck size={15} />
              <span>Verificación Oficial JyP</span>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-[#070c14] border border-white/5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 font-black text-xl font-mono">
                  <Star size={18} fill="currentColor" />
                  <span>{tech.rating ? Number(tech.rating).toFixed(1) : "5.0"}</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1 block">
                  Calificación
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#070c14] border border-white/5 text-center">
                <span className="font-black text-xl text-white font-mono block">
                  {tech.reviews_count ?? 0}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1 block">
                  Reseñas
                </span>
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-3 text-left pt-5 border-t border-white/5 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 text-cyan-400 shrink-0">
                  <MapPin size={16} />
                </div>
                <span className="truncate">{tech.city || "Lima Metropolitana"}</span>
              </div>
              {tech.phone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 text-blue-400 shrink-0">
                    <Phone size={16} />
                  </div>
                  <span>{tech.phone}</span>
                </div>
              )}
              {tech.email && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 text-cyan-400 shrink-0">
                    <Mail size={16} />
                  </div>
                  <span className="truncate">{tech.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="p-8 rounded-[32px] border border-white/10 bg-[#0a101b]/95 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              Interacción Inmediata
            </h3>
            <Link
              to={`/appointments/schedule?tech=${tech.id}`}
              className="jyp-btn-primary w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 rounded-2xl shadow-xl shadow-blue-600/30 transition-transform hover:scale-[1.02]"
            >
              <Calendar size={18} />
              <span>Agendar Cita Técnica</span>
            </Link>
            <Link
              to={`/chat?user=${tech.id}`}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-wider text-xs text-white transition-all"
            >
              <MessageSquare size={18} className="text-cyan-400" />
              <span>Enviar Mensaje Seguro</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Bio, Capabilities, Schedule, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bio & Capabilities */}
          <section className="p-8 sm:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
              <Zap size={16} fill="currentColor" />
              <span>Perfil Profesional y Capacidades</span>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-slate-300">
              {aboutText ||
                "Especialista certificado de la red JyP con experiencia comprobada en diagnóstico de microelectrónica, mantenimiento preventivo de estaciones de trabajo, reemplazo de componentes de precisión y solución de fallos de hardware con garantía de servicio."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {(specialties.length > 0
                ? specialties
                : [
                    "Diagnóstico Integral de Hardware",
                    "Mantenimiento Preventivo y Limpieza Térmica",
                    "Recuperación de Discos y Memorias",
                    "Reparación de Fuentes y Placas Base",
                  ]
              ).map((skill, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-xs sm:text-sm font-semibold text-white"
                >
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Schedule Matrix */}
          <section className="p-8 sm:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
              <Clock size={16} />
              <span>Disponibilidad Semanal</span>
            </div>

            <div className="space-y-2.5">
              {tech.schedule && tech.schedule.length > 0 ? (
                tech.schedule.map((slot, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 rounded-2xl border border-white/5 bg-white/[0.02] text-sm"
                  >
                    <span className="font-bold capitalize text-white font-mono">{slot.day_of_week}</span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          slot.is_active
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                            : "bg-rose-500/10 text-rose-300 border border-rose-500/25"
                        }`}
                      >
                        {slot.is_active ? "Disponible" : "Cerrado"}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 rounded-2xl border border-dashed border-white/10 text-xs text-slate-400">
                  Atención habitual de Lunes a Sábado de 09:00 a 18:00 hrs.
                </div>
              )}
            </div>
          </section>

          {/* Client Reviews Section */}
          <section className="p-8 sm:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
                <MessageCircle size={16} />
                <span>Auditoría de Reseñas Certificadas</span>
              </div>
              {canReview && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="jyp-btn-primary px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider"
                >
                  Dejar Reseña
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="p-6 rounded-2xl border border-cyan-500/25 bg-[#0c1424] space-y-4">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} estrellas`}>
                      <Star
                        size={24}
                        className={n <= reviewRating ? "text-amber-400" : "text-slate-600"}
                        fill={n <= reviewRating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-300">{reviewRating} / 5</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Describe la calidad de la intervención técnica..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-[#070c14] border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={sendingReview}
                    className="jyp-btn-primary px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
                  >
                    {sendingReview ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="text-center">
                <p className="text-4xl font-black text-amber-400 font-mono">
                  {tech.rating ? Number(tech.rating).toFixed(1) : "5.0"}
                </p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={13}
                      className={n <= Math.round(Number(tech.rating) || 5) ? "text-amber-400" : "text-slate-600"}
                      fill={n <= Math.round(Number(tech.rating) || 5) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {tech.reviews_count || 0} {tech.reviews_count === 1 ? "evaluación auditada" : "evaluaciones auditadas"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Solo clientes con órdenes finalizadas pueden registrar calificaciones en el libro técnico.
                </p>
              </div>
            </div>
          </section>

          {/* Location Reference */}
          <section className="p-8 sm:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-4">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400 block">
              Ubicación del Taller / Sede
            </span>
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shrink-0">
                <MapPin size={22} />
              </div>
              <div>
                <p className="font-black text-lg text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {tech.city || "Lima Metropolitana"}, Perú
                </p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  {tech.reference_address || tech.address || "Sede autorizada para recepción física de equipos y laboratorio de hardware."}
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
