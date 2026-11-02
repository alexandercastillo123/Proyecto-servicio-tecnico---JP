import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Globe, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowUpRight, 
  Bell, 
  MapPin, 
  FileText, 
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface PlatformShowcaseProps {
  onOpenDownloadModal: () => void;
  onOpenBooking: () => void;
}

export const PlatformShowcase: React.FC<PlatformShowcaseProps> = ({ 
  onOpenDownloadModal, 
  onOpenBooking 
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'web'>('android');
  const [showQR, setShowQR] = useState(false);

  return (
    <section id="app-plataforma" className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
      
      {/* Background glow lines */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#1226AA]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-mono font-bold text-sky-400 tracking-wider uppercase mb-2">
            Disponibilidad Multiplataforma
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight [text-wrap:balance]">
            Diseñada para la máxima comodidad en Android y en la Web
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Ya sea desde tu smartphone mientras estás fuera o desde tu computadora de trabajo, tienes control total sobre tus solicitudes técnicas, presupuestos y garantías.
          </p>

          {/* Segmented Platform Toggle */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-800 rounded-xl mt-6 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                activeTab === 'android'
                  ? 'bg-[#1226AA] text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>App Móvil Android</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('web')}
              className={`flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                activeTab === 'web'
                  ? 'bg-[#1226AA] text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Plataforma Web (Navegador)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Platform Feature Split */}
        {activeTab === 'android' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Android Features & Download Options */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-3">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  Versión 2.4.0 Oficial · Android 8.0+
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                  Todo tu servicio técnico en la palma de tu mano
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Diseñada para acompañarte cuando tu computadora falla. Pide un técnico de emergencia, envía una foto de la pantalla o código de error y sigue el trayecto de llegada en tiempo real.
                </p>
              </div>

              {/* 4 Key Native App Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>Rastreo GPS en Tiempo Real</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mira en el mapa el trayecto del técnico y la hora estimada exacta de llegada a tu casa.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Bell className="w-4 h-4" />
                    <span>Notificaciones Push Instantáneas</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Avisos en cada etapa: técnico asignado, en camino, diagnóstico listo y conformidad firmada.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <FileText className="w-4 h-4" />
                    <span>Carnet de Garantía Digital</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tus boletas, facturas y reportes técnicos guardados en tu historial sin papeles que perder.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validación del Técnico por QR</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Escanea el carnet del técnico antes de abrir la puerta para confirmar su identidad y récord legal.
                  </p>
                </div>
              </div>

              {/* Download Buttons Strip */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenDownloadModal}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-[#1226AA] hover:from-blue-700 hover:to-[#0e1d85] flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <Download className="w-4 h-4 text-sky-300" />
                  <span>Descargar APK Android Directo (42 MB)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className="px-4 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <QrCode className="w-4 h-4 text-sky-400" />
                  <span>{showQR ? 'Ocultar Código QR' : 'Escanear con Celular'}</span>
                </button>
              </div>

              {/* QR Code Expansion Panel */}
              {showQR && (
                <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center gap-5 animate-in fade-in">
                  <div className="bg-white p-2.5 rounded-xl shrink-0 shadow-sm">
                    {/* High-contrast generated SVG QR Code representation */}
                    <svg viewBox="0 0 120 120" className="w-24 h-24" fill="none">
                      <rect width="120" height="120" fill="white" />
                      {/* Standard QR finder patterns */}
                      <rect x="10" y="10" width="30" height="30" fill="#1226AA" />
                      <rect x="15" y="15" width="20" height="20" fill="white" />
                      <rect x="20" y="20" width="10" height="10" fill="#1226AA" />

                      <rect x="80" y="10" width="30" height="30" fill="#1226AA" />
                      <rect x="85" y="15" width="20" height="20" fill="white" />
                      <rect x="90" y="20" width="10" height="10" fill="#1226AA" />

                      <rect x="10" y="80" width="30" height="30" fill="#1226AA" />
                      <rect x="15" y="85" width="20" height="20" fill="white" />
                      <rect x="20" y="90" width="10" height="10" fill="#1226AA" />

                      {/* Data dots */}
                      <rect x="48" y="15" width="6" height="6" fill="#111" />
                      <rect x="60" y="15" width="6" height="6" fill="#111" />
                      <rect x="48" y="28" width="6" height="6" fill="#111" />
                      <rect x="58" y="38" width="6" height="6" fill="#111" />
                      <rect x="48" y="48" width="8" height="8" fill="#1226AA" />
                      <rect x="62" y="52" width="6" height="6" fill="#111" />
                      <rect x="75" y="48" width="6" height="6" fill="#111" />
                      <rect x="85" y="58" width="8" height="8" fill="#111" />
                      <rect x="20" y="55" width="6" height="6" fill="#111" />
                      <rect x="50" y="70" width="6" height="6" fill="#111" />
                      <rect x="65" y="70" width="8" height="8" fill="#1226AA" />
                      <rect x="80" y="80" width="6" height="6" fill="#111" />
                      <rect x="95" y="80" width="8" height="8" fill="#111" />
                      <rect x="52" y="90" width="6" height="6" fill="#111" />
                      <rect x="85" y="95" width="6" height="6" fill="#111" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white">Escanea con tu cámara</h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Apunta la cámara de tu Android a este código para iniciar la descarga del instalador seguro APK v2.4.0.
                    </p>
                    <span className="inline-block mt-2 text-[10px] text-emerald-400 font-mono">
                      ✓ Archivo verificado sin publicidad ni malware
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Android Visual Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[320px] bg-slate-800/90 rounded-[2.5rem] p-3 shadow-2xl border border-slate-700">
                <div className="bg-slate-900 rounded-[2rem] p-4 text-white space-y-4 border border-slate-800">
                  
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[11px] font-bold text-sky-400">J&P SERVICIO A DOMICILIO</span>
                    <span className="text-[10px] text-slate-400 font-mono">10:45 AM</span>
                  </div>

                  <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Solicitud #4928</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Técnico Asignado
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Mantenimiento y cambio de teclado Laptop Dell Inspiron
                    </p>

                    <div className="pt-2 border-t border-slate-700/80 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#1226AA] text-white flex items-center justify-center font-bold text-xs">
                        JR
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-xs text-white">Jorge Ramírez</p>
                        <p className="text-[10px] text-slate-400">Técnico Nivel II · DNI 44***912</p>
                      </div>
                      <span className="text-xs text-sky-400 font-mono font-bold">ETA 22 min</span>
                    </div>
                  </div>

                  {/* Simulated map route element */}
                  <div className="relative h-28 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden p-2 flex flex-col justify-between">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:12px_12px]" />
                    <div className="relative flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-[#0000FE]" /> San Borja Norte
                      </span>
                      <span className="text-emerald-400 font-bold">Ruta más rápida</span>
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="px-3 py-1 bg-[#1226AA] rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>En camino por Av. Javier Prado</span>
                      </div>
                    </div>
                    <div className="relative text-[9px] text-slate-500 text-right">
                      Destino: Tu dirección guardada
                    </div>
                  </div>

                  <div className="space-y-1.5 text-center">
                    <p className="text-[11px] text-slate-400">
                      ¿Tienes consultas sobre tu servicio?
                    </p>
                    <button
                      type="button"
                      onClick={onOpenBooking}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 transition-colors"
                    >
                      Abrir Soporte Directo
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Web Platform Showcase */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Web Features */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-3">
                <span className="text-xs font-mono text-sky-400 uppercase tracking-widest font-bold">
                  Acceso Inmediato por Navegador · Cero Instalación
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                  El portal corporativo y residencial más rápido
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Ideal para cuando estás en tu laptop, computadora de oficina o administrando varios equipos en tu empresa. Realiza solicitudes técnicas en lote, descarga facturas electrónicas y consulta reportes técnicos en formato PDF.
                </p>
              </div>

              {/* 4 Web Platform Strengths */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <Laptop className="w-4 h-4" />
                    <span>Compatible con Cualquier Equipo</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Funciona en Windows, macOS, Linux, ChromeOS o tablets desde Chrome, Edge, Safari o Firefox.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <FileText className="w-4 h-4" />
                    <span>Facturación Electrónica SUNAT</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Ingresa el RUC de tu empresa y recibe automáticamente los archivos XML y PDF de tus comprobantes.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Gestión de Múltiples Sedes</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Agenda visitas técnicas para oficinas en San Isidro, Surco, Miraflores o almacenes desde un solo panel.
                  </p>
                </div>

                <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>SLA y Reportes de Mantenimiento</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Reportes detallados de la salud de hardware, discos y estado de licencias de tu parque informático.
                  </p>
                </div>
              </div>

              {/* Web Portal Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-[#1226AA] hover:from-blue-700 hover:to-[#0e1d85] flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/20 transition-all"
                >
                  <Globe className="w-4 h-4 text-sky-300" />
                  <span>Usar Portal Web Ahora</span>
                </button>

                <a
                  href="#cotizador"
                  className="px-4 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Calcular Cotización B2B</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              </div>

            </div>

            {/* Right Column: Web Browser Visual Mockup */}
            <div className="lg:col-span-5">
              <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700 shadow-2xl">
                <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 text-xs">
                  
                  {/* Window Bar */}
                  <div className="bg-slate-950 px-3 py-2 flex items-center gap-2 border-b border-slate-800">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex-1 text-center font-mono text-[10px] text-slate-400">
                      https://portal.jypsac.com
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <p className="font-bold text-white text-xs">Panel Corporativo J&P</p>
                        <p className="text-[10px] text-slate-400">3 sedes registradas en Lima</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800">
                        Plan Pro TI
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 bg-slate-800/80 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-xs">Sede San Isidro</p>
                          <p className="text-[10px] text-slate-400">Red Wi-Fi 6 Mesh · 12 puestos</p>
                        </div>
                        <span className="text-emerald-400 font-bold text-[10px]">Operativo 100%</span>
                      </div>

                      <div className="p-2.5 bg-slate-800/80 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-xs">Sede Miraflores</p>
                          <p className="text-[10px] text-slate-400">Mantenimiento preventivo 6 laptops</p>
                        </div>
                        <span className="text-blue-400 font-bold text-[10px]">Agendado hoy 3 PM</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenBooking}
                      className="w-full py-2 bg-[#1226AA] text-white font-bold text-xs rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      + Solicitar Nueva Visita Técnica
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
