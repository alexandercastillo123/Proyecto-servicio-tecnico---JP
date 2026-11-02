import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Phone, Mail, MapPin, Download, ArrowUpRight, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onOpenBooking: () => void;
  onOpenDownload: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBooking, onOpenDownload }) => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand & Mission (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <BrandLogo variant="white" size="md" />
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Empresa peruana de informática y soporte tecnológico con más de 20 años de trayectoria. Tu aliado confiable para servicio técnico a domicilio, reparación de hardware, redes y ciberseguridad.
            </p>
            <div className="text-xs font-mono text-slate-500">
              RUC: 20556789123 · J&P PERIFÉRICOS S.A.C.
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={onOpenDownload}
                type="button"
                className="px-3.5 py-2 rounded-lg bg-[#1226AA] hover:bg-blue-800 text-white font-bold text-xs transition-colors"
              >
                App Android (APK)
              </button>
              <button
                onClick={onOpenBooking}
                type="button"
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                Portal Web Clientes
              </button>
            </div>
          </div>

          {/* Servicios Clave (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Servicios a Domicilio
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#servicios" className="hover:text-white transition-colors">Reparación de Laptops & PCs</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Mantenimiento Térmico Preventivo</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Instalación de Redes & Wi-Fi Mesh</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Reparación de Impresoras (Láser/Inyección)</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Recuperación de Datos en Discos HDD/SSD</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Cámaras de Seguridad CCTV & Acceso</a></li>
              <li><a href="#servicios" className="hover:text-white transition-colors">Ciberseguridad y Licencias Microsoft</a></li>
            </ul>
          </div>

          {/* Sedes Físicas y Contacto (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Sedes en Lima
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div>
                <p className="font-bold text-slate-200">Sede Centro de Lima (Taller):</p>
                <p className="mt-0.5">Av. Bolivia 148, Of. 2218, Piso 4 (Galería Centro de Lima)</p>
              </div>
              <div>
                <p className="font-bold text-slate-200">Sede Santa Beatriz (Oficinas):</p>
                <p className="mt-0.5">Calle Emilio Fernández 160, Of. 1804, Lima</p>
              </div>
              <div>
                <p className="font-bold text-slate-200">Contacto Directo:</p>
                <p className="font-mono text-sky-400 font-bold">+51 997 662 381</p>
                <p>ventas@jypsac.com</p>
              </div>
            </div>
          </div>

          {/* Documentación & Descargas (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Descargas
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a 
                  href="/assets/aistudio/BROCHURE_JYP_FINAL_d46f2610.pdf" 
                  download="Brochure_JYP_2025.pdf"
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Brochure J&P 2025</span>
                </a>
              </li>
              <li>
                <a 
                  href="/assets/aistudio/manual_de_marca_J_P_21mayo2025_d63fb2da.pdf" 
                  download="Manual_Marca_JYP.pdf"
                  className="hover:text-sky-400 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Manual de Marca</span>
                </a>
              </li>
              <li>
                <button 
                  onClick={onOpenDownload}
                  className="hover:text-white transition-colors text-left"
                >
                  App Móvil Android (.apk)
                </button>
              </li>
              <li>
                <a href="#cotizador" className="hover:text-white transition-colors">
                  Cotizador en Línea
                </a>
              </li>
              <li>
                <a href="#cobertura" className="hover:text-white transition-colors">
                  Zonas de Cobertura
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Quiet Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} J&P Periféricos S.A.C. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Garantía Legal Escrita</span>
            </span>
            <span>·</span>
            <span>Lima, Perú</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
