import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle2, Search, Building2, Phone, Mail, Navigation } from 'lucide-react';
import { DISTRICTS_COVERAGE } from '../data/servicesData';

interface CoverageMapProps {
  onSelectDistrict: (districtName: string) => void;
}

export const CoverageMap: React.FC<CoverageMapProps> = ({ onSelectDistrict }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDistricts = DISTRICTS_COVERAGE.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="cobertura" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-bold text-[#1226AA] tracking-wider uppercase mb-2 font-mono">
            Rápida Llegada a tu Puerta
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
            Zonas de cobertura en Lima Metropolitana y Callao
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Nuestros especialistas motorizados están estratégicamente desplegados para llegar a tu hogar u oficina en tiempos récord de 30 a 50 minutos.
          </p>
        </div>

        {/* Coverage Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Interactive Districts Finder (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Distritos con atención inmediata hoy
              </h3>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
                ● Técnicos disponibles en ruta
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Busca tu distrito (ej: Miraflores, San Isidro, Surco, San Borja...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1226AA] focus:bg-white transition-all"
              />
            </div>

            {/* Districts List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredDistricts.map((district) => (
                <div
                  key={district.name}
                  onClick={() => onSelectDistrict(district.name)}
                  className="group p-3 bg-slate-50/70 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 hover:border-[#1226AA]/40 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-[#1226AA] group-hover:text-white text-slate-700 flex items-center justify-center transition-colors shadow-2xs border border-slate-200/60">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 group-hover:text-[#1226AA] transition-colors">
                        {district.name}
                      </p>
                      <p className="text-[10px] text-slate-500">{district.zone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-[#1226AA]" /> {district.eta}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {district.deliveryFee === 0 ? 'Sin recargo' : `+ S/${district.deliveryFee}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * ¿No encuentras tu distrito exacto? Contáctanos por WhatsApp para verificar disponibilidad de rutas especiales en Lima Norte, Este y Sur.
            </p>

          </div>

          {/* Right Column: Physical Flagship Sedes (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            <h3 className="font-display font-bold text-lg text-slate-900">
              Sedes Físicas & Laboratorio de Reparación
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Si prefieres dejar tu equipo personalmente o se trata de una recuperación de datos compleja, te atendemos con gusto en nuestros dos locales oficiales:
            </p>

            {/* Sede Centro de Lima */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#1226AA]" /> Sede Centro de Lima (Taller & Laboratorio)
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Ppal.
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                Av. Bolivia 148, Oficina 2218, Piso 4 – Galería Centro de Lima (Frente a Real Plaza Centro Cívico)
              </p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Lun - Sáb: 9:00 AM - 7:00 PM</span>
                <span className="font-semibold text-slate-800">Atención Directa</span>
              </div>
            </div>

            {/* Sede Santa Beatriz */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#1226AA]" /> Sede Santa Beatriz (Atención Corporativa)
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  Oficina
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                Calle Emilio Fernández 160, Oficina 1804 – Santa Beatriz, Lima
              </p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Lun - Vie: 9:00 AM - 6:00 PM</span>
                <span className="font-semibold text-slate-800">Previo Aviso</span>
              </div>
            </div>

            {/* Quick Contact info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/70 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">Central Telefónica & WhatsApp</p>
                <p className="font-mono text-sm font-extrabold text-[#1226AA] mt-0.5">+51 997 662 381</p>
              </div>
              <a
                href="https://wa.me/51997662381?text=Hola%2C%20quisiera%20consultar%20cobertura%20t%C3%A9cnica."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-[#1226AA] text-white font-bold hover:bg-blue-800 transition-colors"
              >
                Escribir al WhatsApp
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
