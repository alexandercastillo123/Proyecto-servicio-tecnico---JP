import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { FAQS } from '../data/servicesData';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-[#1226AA] tracking-wider uppercase mb-2 font-mono">
            Resolvemos tus Dudas
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
            Preguntas Frecuentes sobre el Servicio Técnico a Domicilio
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Todo lo que necesitas saber antes de agendar tu visita o descargar la aplicación móvil.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1226AA]"
                >
                  <span className="font-display font-bold text-base sm:text-lg text-slate-900 leading-snug">
                    {faq.q}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-blue-50 text-[#1226AA]' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Need more help direct chat */}
        <div className="mt-10 p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">¿Tienes un caso técnico especial o duda no listada?</h4>
              <p className="text-xs text-slate-500">Chatea directamente con nuestro jefe de operaciones en Lima.</p>
            </div>
          </div>

          <a
            href="https://wa.me/51997662381?text=Hola%20J%26P%2C%20tengo%20una%20consulta%20t%C3%A9cnica."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap transition-colors shadow-xs"
          >
            Hablar por WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
};
