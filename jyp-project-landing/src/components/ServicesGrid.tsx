import React, { useState } from 'react';
import { 
  Cpu, 
  Wrench, 
  Wifi, 
  HardDrive, 
  ShieldCheck, 
  Lock, 
  Printer, 
  Server, 
  ArrowUpRight, 
  Check, 
  Clock, 
  Tag,
  ChevronRight,
  Info
} from 'lucide-react';
import { JYP_SERVICES } from '../data/servicesData';
import { ServiceDetail } from '../types';

interface ServicesGridProps {
  onSelectService: (service: ServiceDetail) => void;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({ onSelectService }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeModalService, setActiveModalService] = useState<ServiceDetail | null>(null);

  const filteredServices = activeCategory === 'all' 
    ? JYP_SERVICES 
    : JYP_SERVICES.filter(s => s.category === activeCategory);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Wrench': return <Wrench className="w-5 h-5" />;
      case 'Wifi': return <Wifi className="w-5 h-5" />;
      case 'HardDrive': return <HardDrive className="w-5 h-5" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
      case 'Lock': return <Lock className="w-5 h-5" />;
      case 'Printer': return <Printer className="w-5 h-5" />;
      case 'Server': return <Server className="w-5 h-5" />;
      default: return <Wrench className="w-5 h-5" />;
    }
  };

  return (
    <section id="servicios" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="text-xs font-bold text-[#1226AA] tracking-wider uppercase mb-2 font-mono">
              Catálogo Oficial · Brochure 2025
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
              Especialistas en 8 áreas tecnológicas clave
            </h2>
            <p className="mt-3 text-base text-slate-600 leading-relaxed">
              Desde reparaciones puntuales en tu hogar hasta infraestructura corporativa y ciberseguridad. Todo atendido con personal propio y garantía legal.
            </p>
          </div>

          {/* Interactive Category Filter Tabs (Zero-pill compliant segmented controls) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos (8)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('hardware')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'hardware'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hardware & Laptops
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('network')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'network'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Redes & Wi-Fi
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('security')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeCategory === 'security'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Seguridad & CCTV
            </button>
          </div>
        </div>

        {/* Bento Grid Layout (Section 2C Asymmetric Hierarchy) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => {
            const isMarquee = service.popular || index === 0;
            return (
              <div
                key={service.id}
                className={`group relative bg-slate-50/70 hover:bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 hover:border-[#1226AA]/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isMarquee && activeCategory === 'all' ? 'lg:col-span-1 border-blue-200' : ''
                }`}
              >
                <div>
                  {/* Clean unboxed metadata per section 1A */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="font-mono font-bold text-[#1226AA]">{service.code}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{service.tagline}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-semibold font-mono tabular-nums">Desde S/ {service.startingPrice}</span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-[#1226AA] shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0 group-hover:bg-[#1226AA] group-hover:text-white transition-colors">
                      {getServiceIcon(service.icon)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-[#1226AA] transition-colors leading-snug">
                        {service.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{service.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                    {service.description}
                  </p>

                  {/* Top Features */}
                  <div className="space-y-1.5 mb-6">
                    {service.features.slice(0, 3).map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-[#1226AA] mt-0.5 shrink-0" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModalService(service)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ver detalles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectService(service)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#1226AA] hover:bg-[#0e1d85] transition-colors whitespace-nowrap"
                  >
                    <span>Solicitar</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Corporate Brochure Download Callout */}
        <div className="mt-12 bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <p className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">
              ¿Requieres atención para tu empresa o contratos de soporte?
            </p>
            <h4 className="font-display font-extrabold text-xl sm:text-2xl text-white">
              Descarga nuestro Brochure Corporativo J&P Oficial 2025
            </h4>
            <p className="text-xs sm:text-sm text-slate-300">
              Conoce nuestro catálogo completo de equipamiento informático, licencias Microsoft originales y acuerdos de nivel de servicio (SLA).
            </p>
          </div>

          <a
            href="/assets/aistudio/BROCHURE_JYP_FINAL_d46f2610.pdf"
            download="Brochure_JYP_Perifericos_2025.pdf"
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 font-bold text-xs sm:text-sm text-[#1226AA] transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-2"
          >
            <span>Descargar Brochure PDF (98 MB)</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

      </div>

      {/* Service Detail Modal */}
      {activeModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1226AA] flex items-center justify-center font-bold">
                  {getServiceIcon(activeModalService.icon)}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">{activeModalService.title}</h3>
                  <p className="text-xs text-slate-500 font-mono">Código oficial {activeModalService.code} · J&P</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalService(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeModalService.description}
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  ¿Qué incluye este servicio?
                </h4>
                <div className="space-y-1.5">
                  {activeModalService.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Problemas más comunes que resolvemos:
                </h4>
                <div className="space-y-1.5">
                  {activeModalService.commonProblems.map((prob, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{prob}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Tiempo estimado: </span>
                  <span className="font-bold text-slate-800">{activeModalService.estimatedTime}</span>
                </div>
                <div>
                  <span className="text-slate-500">Inversión inicial: </span>
                  <span className="font-bold text-[#1226AA] font-mono text-sm">Desde S/ {activeModalService.startingPrice}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveModalService(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = activeModalService;
                  setActiveModalService(null);
                  onSelectService(s);
                }}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#1226AA] hover:bg-[#0e1d85] transition-colors"
              >
                Solicitar este Servicio Ahora
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
