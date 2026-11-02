import React from 'react';
import { ShieldCheck, UserCheck, Award, FileCheck2, Wrench, Lock, CheckCircle2 } from 'lucide-react';

export const SecurityAndGuarantee: React.FC = () => {
  const pillars = [
    {
      icon: UserCheck,
      title: 'Técnicos con Antecedentes Verificados',
      description: 'Tu seguridad es intransferible. Todo el personal técnico pasa por un riguroso filtro de antecedentes policiales, judiciales y penales. Visten uniforme oficial y portan carnet con código QR de validación en tiempo real.',
      badge: 'Filtro Riguroso'
    },
    {
      icon: Award,
      title: 'Repuestos Originales y Nuevos',
      description: 'No utilizamos piezas usadas ni genéricas de dudosa procedencia. Cada pantalla, teclado, batería, pasta térmica o disco SSD proviene de distribuidores autorizados con garantía oficial de fábrica.',
      badge: 'Garantía de Fábrica'
    },
    {
      icon: FileCheck2,
      title: 'Garantía por Escrito de 30 a 90 Días',
      description: 'Si la misma falla vuelve a presentarse dentro del periodo de garantía, regresamos a tu domicilio y la resolvemos sin ningún costo adicional. Entregamos comprobante legal (Boleta o Factura SUNAT).',
      badge: 'Respaldo Legal'
    },
    {
      icon: Lock,
      title: 'Diagnóstico Transparente Frente a Ti',
      description: 'Reparamos tu equipo en tu propia mesa de trabajo u oficina. Puedes observar cada paso del desarmado y limpieza. Tu información privada, fotos y contraseñas permanecen siempre bajo tu control.',
      badge: '100% Confidencial'
    }
  ];

  return (
    <section id="garantia" className="py-16 sm:py-24 bg-slate-50/70 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-bold text-[#1226AA] tracking-wider uppercase mb-2 font-mono">
            Tu Tranquilidad es Nuestra Prioridad
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
            4 Pilares de seguridad y confianza para tu hogar y empresa
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Sabemos que abrir la puerta de tu casa o entregar tu computadora de trabajo requiere máxima confianza. Por eso en J&P Periféricos S.A.C. operamos bajo estrictos protocolos de integridad.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1226AA] border border-blue-100 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#1226AA] bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-100">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-xl text-slate-900 mb-2.5">
                    {pillar.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Protocolo verificado por J&P Periféricos S.A.C.</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
