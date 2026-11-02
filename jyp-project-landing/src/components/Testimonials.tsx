import React from 'react';
import { Star, MapPin, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data/servicesData';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-bold text-[#1226AA] tracking-wider uppercase mb-2 font-mono">
            Evidencia Comprobada en Lima
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
            Lo que opinan quienes confiaron su tecnología a J&P
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Más de 15,000 servicios completados en hogares, estudios profesionales y empresas de Lima respaldan nuestra trayectoria.
          </p>
        </div>

        {/* Testimonials 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="bg-slate-50/70 rounded-2xl p-7 border border-slate-200/80 hover:border-[#1226AA]/40 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Clean unboxed stars and date */}
                <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-mono">{t.date}</span>
                </div>

                <div className="text-xs font-bold font-mono text-[#1226AA] mb-2 uppercase tracking-wide">
                  Servicio: {t.service}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed italic mb-6">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">
                    {t.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0 font-medium">
                  <MapPin className="w-3 h-3 text-[#1226AA]" /> {t.location}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Brand Proof Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-around gap-6 text-center">
          <div className="space-y-0.5">
            <span className="font-display font-black text-2xl text-[#1226AA] tabular-nums">4.9 / 5</span>
            <p className="text-xs text-slate-600 font-semibold">Calificación Promedio en Google</p>
          </div>
          <div className="space-y-0.5">
            <span className="font-display font-black text-2xl text-slate-900 tabular-nums">98.7%</span>
            <p className="text-xs text-slate-600 font-semibold">Índice de Recomendación</p>
          </div>
          <div className="space-y-0.5">
            <span className="font-display font-black text-2xl text-emerald-700 tabular-nums">20+ Años</span>
            <p className="text-xs text-slate-600 font-semibold">Empresa Constituida en Lima</p>
          </div>
        </div>

      </div>
    </section>
  );
};
