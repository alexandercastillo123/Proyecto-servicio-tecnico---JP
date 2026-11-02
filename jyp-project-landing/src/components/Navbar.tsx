import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Menu, X, ArrowUpRight, Smartphone, Laptop } from 'lucide-react';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenDownload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBooking, onOpenDownload }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a href="#" className="shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1226AA] rounded-lg">
          <BrandLogo size="md" />
        </a>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
          <a href="#como-funciona" className="hover:text-[#1226AA] transition-colors whitespace-nowrap shrink-0">
            Cómo Funciona
          </a>
          <a href="#servicios" className="hover:text-[#1226AA] transition-colors whitespace-nowrap shrink-0">
            Servicios
          </a>
          <a href="#cotizador" className="hover:text-[#1226AA] transition-colors whitespace-nowrap shrink-0">
            Cotizador
          </a>
          <a href="#app-plataforma" className="hover:text-[#1226AA] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5">
            <span>App Android & Web</span>
          </a>
          <a href="#cobertura" className="hover:text-[#1226AA] transition-colors whitespace-nowrap shrink-0">
            Cobertura Lima
          </a>
          <a href="#garantia" className="hover:text-[#1226AA] transition-colors whitespace-nowrap shrink-0">
            Garantía
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action + Quick Download trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenDownload}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#1226AA] bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#0000FE]" />
            <span>Descargar App</span>
          </button>

          <button
            onClick={onOpenBooking}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#1226AA] to-[#0d1c82] hover:from-[#0d1c82] hover:to-[#09145c] rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-[#1226AA]"
          >
            <span>Solicitar Técnico</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-none"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-5 pt-3 pb-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3 text-base font-semibold text-slate-800">
            <a 
              href="#como-funciona" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1226AA] transition-colors"
            >
              Cómo Funciona
            </a>
            <a 
              href="#servicios" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1226AA] transition-colors"
            >
              Servicios Técnicos
            </a>
            <a 
              href="#cotizador" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1226AA] transition-colors"
            >
              Cotizador en Línea
            </a>
            <a 
              href="#app-plataforma" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1226AA] transition-colors"
            >
              App Android y Portal Web
            </a>
            <a 
              href="#cobertura" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1226AA] transition-colors"
            >
              Zonas de Cobertura en Lima
            </a>
            <a 
              href="#garantia" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[#1226AA] transition-colors"
            >
              Garantía y Seguridad
            </a>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDownload();
              }}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#1226AA] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Smartphone className="w-4 h-4 text-[#1226AA]" />
              Descargar App Android (APK)
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-[#1226AA] hover:bg-[#0e1d85] rounded-lg transition-colors shadow-sm"
            >
              Solicitar Técnico a Domicilio
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
