import React from 'react';
import { Smartphone, ShieldCheck, CheckCircle2, ArrowRight, Clock, MapPin, Receipt, Wrench } from 'lucide-react';

interface HowItWorksProps {
  onOpenBooking: () => void;
  onOpenDownload: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenBooking, onOpenDownload }) => {
  const steps = [
    {
      num: '01',
      title: 'Solicita desde la App o en Línea',
      description: 'Elige tu tipo de equipo (laptop, PC, impresora, red o cámaras) y describe la falla o síntoma. Recibes un presupuesto estimado transparente al instante y puedes elegir el horario que más te convenga.',
      highlights: [
        'Sin llamadas tediosas ni esperas en espera',
        'Presupuesto claro antes de confirmar',
        'Horarios flexibles de lunes a sábado'
      ],
      icon: Smartphone,
      accent: 'border-blue-200'
    },
    {
      num: '02',
      title: 'Llegada de tu Especialista Certificado',
      description: 'Un técnico de J&P con antecedentes verificados y uniforme oficial acude a tu domicilio en moto con maletín de herramientas de precisión y repuestos certificados. Recibes aviso en tu móvil.',
      highlights: [
        'Identificación oficial con código QR y DNI',
        'Llegada puntual en el rango de 30 a 50 min',
        'Protocolo de cuidado y respeto en tu hogar'
      ],
      icon: ShieldCheck,
      accent: 'border-indigo-200'
    },
    {
      num: '03',
      title: 'Diagnóstico, Solución y Garantía Escrita',
      description: 'El técnico realiza la inspección frente a ti, explica con claridad el procedimiento y repara tu equipo. El 85% de los casos se resuelven en la misma visita. Recibes boleta/factura y certificado de garantía.',
      highlights: [
        'Solución inmediata frente a tus ojos',
        'Garantía por escrito de 30 a 90 días',
        'Paga fácil con Yape, Plin, tarjeta o efectivo'
      ],
      icon: CheckCircle2,
      accent: 'border-emerald-200'
    }
  ];

  return (
    <section id="como-funciona" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-bold text-[#1226AA] tracking-wider uppercase mb-2 font-mono">
            Proceso Simple y Transparente
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
            Así de fácil es reparar tu tecnología sin salir de casa
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Eliminamos el estrés de cargar tu computadora o impresora por la ciudad. Llevamos más de 20 años de experiencia técnica directa a tu puerta.
          </p>
        </div>

        {/* 3 Step Editorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.num}
                className={`relative bg-slate-50/70 rounded-2xl p-7 border ${step.accent} hover:border-[#1226AA]/40 transition-all shadow-xs flex flex-col justify-between`}
              >
                <div>
                  {/* Human Editorial Numbering Header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-display font-extrabold text-3xl text-slate-300 tabular-nums">
                      {step.num}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-white text-[#1226AA] shadow-xs border border-slate-200/80 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-display font-bold text-slate-900 mb-3">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/60 space-y-2">
                  {step.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1226AA] mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Fast Action Prompt */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-[#1226AA] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-display font-bold text-lg sm:text-xl text-white">
              ¿Tu equipo no enciende o necesitas ayuda urgente hoy?
            </h4>
            <p className="text-xs sm:text-sm text-blue-100">
              Disponibilidad inmediata para atenderte en menos de 50 minutos en Lima y Callao.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenBooking}
              type="button"
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#1226AA] bg-white hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap"
            >
              Pedir Técnico a Domicilio
            </button>
            <button
              onClick={onOpenDownload}
              type="button"
              className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-blue-800/80 hover:bg-blue-800 border border-blue-600/60 transition-colors whitespace-nowrap"
            >
              Descargar App
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
