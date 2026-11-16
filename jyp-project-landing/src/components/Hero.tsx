import React, { useState } from 'react';
import { 
  Download, 
  Globe, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Wrench, 
  Star,
  ChevronRight,
  MessageCircle,
  Cpu,
  UserCheck
} from 'lucide-react';
import { TRUST_METRICS } from '../data/servicesData';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenDownload: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onOpenDownload }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'app' | 'web'>('app');
  const [interactiveStep, setInteractiveStep] = useState<number>(2); // 1: Solicitud, 2: En camino, 3: Resuelto

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/60 to-white pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-slate-200/60">
      {/* Subtle architectural grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#1226AA 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Main 2-Column Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Value Proposition & Call to Action */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Trust Pill / Kicker without slop */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/80 px-3.5 py-1.5 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-[#0000FE]" />
              <span className="font-display font-bold text-[#1226AA]">J&P PERIFÉRICOS S.A.C.</span>
              <span className="text-slate-400">·</span>
              <span>Lima y Callao</span>
            </div>

            {/* Headline with text-wrap balance */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-display font-extrabold text-slate-900 tracking-tight leading-[1.12] [text-wrap:balance]">
              El servicio técnico a domicilio que tu tecnología merece.
            </h1>

            {/* Subheading / Concrete Promise */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Especialistas certificados van hasta tu casa u oficina para reparar laptops, PCs, redes e impresoras con repuestos garantizados y diagnóstico honesto. Solicita y monitorea tu servicio desde la <strong className="text-slate-900 font-semibold">App Android</strong> o directamente desde la <strong className="text-slate-900 font-semibold">Web</strong>.
            </p>

            {/* Conversion CTA Group */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                onClick={onOpenDownload}
                type="button"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-[#1226AA] hover:bg-[#0d1d87] transition-all shadow-md shadow-blue-900/10 active:scale-[0.99] whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-sky-300" />
                <span>Descargar App Android (APK)</span>
              </button>

              <button
                onClick={onOpenBooking}
                type="button"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300/80 hover:border-slate-400 transition-all shadow-sm active:scale-[0.99] whitespace-nowrap"
              >
                <Globe className="w-4 h-4 text-[#1226AA]" />
                <span>Solicitar por Web</span>
              </button>

              <a
                href="https://wa.me/51997662381?text=Hola%20J%26P%20Perif%C3%A9ricos%2C%20necesito%20un%20servicio%20t%C3%A9cnico%20a%20domicilio."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
                <span>WhatsApp Rápido</span>
              </a>
            </div>

            {/* Quick Micro-Proofs */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Llegada en 30 a 50 min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Técnicos verificados con DNI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium">Garantía por escrito de 90 días</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive App & Web Interface Preview */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Platform Switcher Pills */}
              <div className="flex items-center justify-center p-1 mb-4 bg-slate-200/80 rounded-xl max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('app')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    activePreviewTab === 'app'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#1226AA]" />
                  <span>App Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('web')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    activePreviewTab === 'web'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 text-[#1226AA]" />
                  <span>Portal Web</span>
                </button>
              </div>

              {/* Device Frame */}
              {activePreviewTab === 'app' ? (
                /* Mobile Phone Mockup */
                <div className="relative bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl ring-1 ring-slate-800 max-w-[340px] sm:max-w-[360px] mx-auto">
                  {/* Phone Speaker & Camera Notch */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    <div className="w-8 h-1.5 rounded-full bg-slate-800" />
                  </div>

                  {/* Phone Screen */}
                  <div className="bg-slate-50 rounded-[2rem] overflow-hidden text-slate-900 text-xs pt-7 pb-4 px-3.5 min-h-[520px] flex flex-col justify-between border border-slate-200">
                    
                    {/* App Header */}
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <img 
                            src="/assets/aistudio/image_967d6eb3.png" 
                            alt="J&P App Oficial" 
                            className="w-8 h-8 rounded-lg object-contain shadow-xs" 
                          />
                          <div>
                            <p className="font-bold text-[11px] leading-tight text-slate-900">J&P Periféricos App</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-blue-600" /> Miraflores, Lima
                            </p>
                          </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Servicio Activo
                        </span>
                      </div>

                      {/* Interactive Simulation Stepper */}
                      <div className="my-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-[11px] text-slate-800">Estado del Técnico</span>
                          <span className="text-[10px] font-mono text-[#1226AA] font-bold">#TK-8492</span>
                        </div>

                        <div className="flex items-center justify-between gap-1 text-[9px] font-semibold text-slate-500 mb-2">
                          <button 
                            type="button" 
                            onClick={() => setInteractiveStep(1)}
                            className={`flex-1 py-1 rounded text-center transition-colors ${interactiveStep === 1 ? 'bg-blue-100 text-[#1226AA]' : 'bg-slate-100'}`}
                          >
                            1. Agendado
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setInteractiveStep(2)}
                            className={`flex-1 py-1 rounded text-center transition-colors ${interactiveStep === 2 ? 'bg-blue-100 text-[#1226AA]' : 'bg-slate-100'}`}
                          >
                            2. En Camino
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setInteractiveStep(3)}
                            className={`flex-1 py-1 rounded text-center transition-colors ${interactiveStep === 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100'}`}
                          >
                            3. Solucionado
                          </button>
                        </div>

                        {interactiveStep === 2 ? (
                          <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-[#1226AA] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                CM
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-bold text-[11px] text-slate-900">Carlos Mendoza</p>
                                  <span className="text-[9px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    ★ 4.98
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-600">Especialista Hardware · Moto J&P</p>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-blue-100/80 flex items-center justify-between text-[10px]">
                              <span className="text-slate-600 flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3 text-[#1226AA]" /> Tiempo estimado:
                              </span>
                              <span className="font-extrabold text-[#1226AA] font-mono">18 min (Av. Benavides)</span>
                            </div>
                          </div>
                        ) : interactiveStep === 1 ? (
                          <div className="bg-slate-100/70 p-2.5 rounded-lg">
                            <p className="font-bold text-slate-800 text-[11px]">Solicitud Confirmada</p>
                            <p className="text-[10px] text-slate-500">Mantenimiento preventivo Laptop Asus Gamer</p>
                            <p className="text-[10px] text-blue-700 font-semibold mt-1">Horario: Hoy 11:30 AM</p>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Servicio Completado con Éxito</span>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-1">Laptop reparada y limpia. Prueba de estrés 100% OK.</p>
                            <p className="text-[10px] text-emerald-700 font-semibold mt-1">Garantía activa: 90 días (hasta 26 Enero)</p>
                          </div>
                        )}
                      </div>

                      {/* Service Category Buttons */}
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-1">
                        Servicios a 1 Toque
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1226AA] flex items-center justify-center shrink-0">
                            <Laptop className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-[10px]">Laptops & PCs</p>
                            <p className="text-[9px] text-slate-500">Desde S/ 65</p>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Wrench className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-[10px]">Impresoras</p>
                            <p className="text-[9px] text-slate-500">Desde S/ 60</p>
                          </div>
                        </div>
                      </div>

                      {/* Safety Badge */}
                      <div className="bg-gradient-to-r from-slate-900 to-[#1226AA] text-white p-3 rounded-xl flex items-center gap-2.5">
                        <UserCheck className="w-6 h-6 text-sky-300 shrink-0" />
                        <div>
                          <p className="font-bold text-[11px] leading-tight">Garantía de Seguridad J&P</p>
                          <p className="text-[9px] text-sky-100/90 leading-tight">
                            Técnico con antecedentes y carnet con QR institucional.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* App Bottom Navigation */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-around text-slate-500 text-[10px]">
                      <span className="font-bold text-[#1226AA]">Inicio</span>
                      <span>Mis Equipos</span>
                      <span>Historial</span>
                      <span>Ayuda</span>
                    </div>

                  </div>
                </div>
              ) : (
                /* Web Portal Desktop Mockup */
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs">
                  {/* Browser Bar */}
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 bg-white px-3 py-1 rounded text-[11px] text-slate-500 font-mono text-center truncate border border-slate-200">
                      https://app.jypsac.com/portal-clientes
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Portal Web de Clientes & Empresas</h4>
                        <p className="text-slate-500 text-xs">Gestiona múltiples visitas técnicas sin instalar nada</p>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold text-[#1226AA] bg-blue-50 rounded-lg">
                        Acceso 24/7
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <p className="text-slate-500 text-[10px]">Solicitudes Activas</p>
                        <p className="text-lg font-bold text-slate-900">02</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <p className="text-slate-500 text-[10px]">Equipos en Garantía</p>
                        <p className="text-lg font-bold text-emerald-700">06</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <p className="text-slate-500 text-[10px]">Comprobantes</p>
                        <p className="text-lg font-bold text-[#1226AA]">XML/PDF</p>
                      </div>
                    </div>

                    <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-xs">Último Servicio Domicilio</span>
                        <span className="text-[10px] font-mono text-slate-500">Surco, Lima</span>
                      </div>
                      <p className="text-xs text-slate-600">Mantenimiento preventivo de Servidor NAS + 4 Laptops HP</p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-semibold">Técnico Asignado: Roberto Ramos</span>
                        <button 
                          onClick={onOpenBooking} 
                          className="font-bold text-[#1226AA] hover:underline"
                        >
                          Ver Detalle →
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={onOpenBooking}
                      type="button"
                      className="w-full py-2.5 rounded-lg bg-[#1226AA] text-white font-bold text-xs hover:bg-[#0e1d85] transition-colors"
                    >
                      Abrir Nueva Solicitud en la Web
                    </button>
                  </div>
                </div>
              )}

              {/* Decorative callout */}
              <div className="mt-3 text-center">
                <span className="text-xs text-slate-500">
                  Haz clic en las pestañas arriba para ver cómo se ve en <strong className="text-slate-700">Android</strong> y en la <strong className="text-slate-700">Web</strong>.
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Claim-to-Proof Row (Full-width below hero split per Section 5 Checklist #13) */}
        <div className="mt-14 pt-8 border-t border-slate-200/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {TRUST_METRICS.map((metric, idx) => (
              <div key={idx} className="space-y-1">
                <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tabular-nums">
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800">
                  {metric.label}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500">
                  {metric.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
