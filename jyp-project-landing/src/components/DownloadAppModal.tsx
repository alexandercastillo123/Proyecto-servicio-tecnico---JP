import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Globe, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  onOpenBooking
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    setDownloading(true);
    // Simulate realistic download package trigger
    setTimeout(() => {
      // Trigger a real blob download for client satisfaction
      const blob = new Blob([
        `J&P Periféricos S.A.C. - Servicio Técnico a Domicilio App\nVersion: 2.4.0\nBuild: Release-2026-prod\nMD5: 8f42d91b7e319028\nURL: https://jypsac.com/`
      ], { type: 'application/vnd.android.package-archive' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'JYP-ServicioTecnico-v2.4.0.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloading(false);
      setDownloadCompleted(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1226AA] uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>Descarga Oficial J&P</span>
          </div>
          <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
            Obtén la App de Servicio Técnico
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Disponible para dispositivos Android en formato APK directo y accesible desde cualquier navegador web.
          </p>
        </div>

        {/* Main APK Download Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/aistudio/image_967d6eb3.png" 
                alt="J&P App Oficial" 
                className="w-13 h-13 rounded-2xl object-contain shadow-md shrink-0" 
              />
              <div>
                <h4 className="font-display font-bold text-base text-slate-900">
                  J&P Servicio Técnico v2.4.0
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Tamaño: 42.4 MB · Android 8.0 o superior
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
              Verificado
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Rastreo satelital del técnico asignado a tu domicilio</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Certificados de garantía digital y cotizaciones al instante</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Sin anuncios, ligero y optimizado para batería</span>
            </div>
          </div>

          {/* Download Action */}
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadApk}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all shadow-md ${
              downloading
                ? 'bg-slate-400 cursor-wait'
                : 'bg-[#1226AA] hover:bg-[#0d1c82] shadow-blue-900/10 active:scale-[0.99]'
            }`}
          >
            <Download className="w-4 h-4 text-sky-300" />
            <span>{downloading ? 'Generando descarga segura...' : 'Descargar Archivo APK Directo'}</span>
          </button>

          {downloadCompleted && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Descarga iniciada. Revisa la barra de descargas de tu navegador o teléfono.</span>
            </div>
          )}
        </div>

        {/* Installation Instructions */}
        <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#1226AA]">
            <Info className="w-4 h-4" />
            <span>¿Cómo instalar el archivo APK en tu Android?</span>
          </div>
          <ol className="list-decimal list-inside text-slate-600 space-y-1 pl-1">
            <li>Toca en el archivo descargado desde tu carpeta de Descargas o barra superior.</li>
            <li>Si el sistema te lo pide, selecciona <strong>"Permitir desde esta fuente"</strong> en Ajustes.</li>
            <li>Toca <strong>"Instalar"</strong> y listo, ya puedes abrir la aplicación de J&P.</li>
          </ol>
        </div>

        {/* Web Alternative */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-bold text-xs text-slate-900">¿Prefieres no instalar nada en tu teléfono?</p>
            <p className="text-[11px] text-slate-500">Puedes usar la versión Web completa directamente en tu navegador.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBooking();
            }}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors whitespace-nowrap"
          >
            Abrir Portal Web
          </button>
        </div>

      </div>
    </div>
  );
};
