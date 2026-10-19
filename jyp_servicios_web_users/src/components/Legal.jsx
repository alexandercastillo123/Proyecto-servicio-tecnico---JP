import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, ShieldCheck, FileText, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = {
  terms: {
    title: 'Términos y Condiciones',
    icon: FileText,
    updated: 'Última actualización: Enero 2026',
    blocks: [
      {
        h: '1. Objeto del servicio',
        p: 'JyP Servicios Técnicos conecta a clientes con técnicos verificados y sucursales autorizadas en Lima Metropolitana para el diagnóstico, mantenimiento, reparación y venta de repuestos de equipos computacionales.',
      },
      {
        h: '2. Registro y cuenta',
        p: 'El usuario debe registrar datos veraces. Los datos de una persona jurídica requieren RUC vigente y los de persona natural DNI válido. El usuario es responsable de la custodia de sus credenciales.',
      },
      {
        h: '3. Cotizaciones y precios',
        p: 'Los precios de los servicios técnicos se cotizan según el diagnóstico del especialista y pueden variar según la disponibilidad de repuestos. El precio final se acuerda antes de iniciar la reparación.',
      },
      {
        h: '4. Agendamiento de citas',
        p: 'Las citas se agendan dentro de los horarios publicados por el técnico o la sucursal. La cancelación debe realizarse con al menos 2 horas de anticipación para no afectar al prestador.',
      },
      {
        h: '5. Garantías',
        p: 'Los repuestos vendidos por sucursales autorizadas incluyen garantía del fabricante. La garantía de la mano de obra del técnico se informa en cada cotización y se detalla en el comprobante de servicio.',
      },
      {
        h: '6. Pagos',
        p: 'Los pagos se realizan mediante Yape, Plin, transferencia bancaria, efectivo o tarjeta (Culqi). El pago queda registrado como "esperando confirmación" hasta que el prestador lo valida.',
      },
    ],
  },
  privacy: {
    title: 'Política de Privacidad',
    icon: ShieldCheck,
    updated: 'Última actualización: Enero 2026',
    blocks: [
      {
        h: '1. Datos que recopilamos',
        p: 'Recopilamos datos de identificación (nombres, DNI/RUC, teléfono, correo), ubicación aproximada para agendar citas, historial de citas y pedidos, y las reseñas que publicas.',
      },
      {
        h: '2. Uso de la información',
        p: 'Usamos tus datos para prestar el servicio, coordinar citas y entregas, emitir comprobantes, notificarte el estado de tus solicitudes y mejorar la experiencia de la plataforma.',
      },
      {
        h: '3. Ubicación y mapas',
        p: 'Compartimos la ubicación del punto de servicio únicamente con el técnico o la sucursal asignada a tu solicitud, y únicamente durante la ejecución del servicio.',
      },
      {
        h: '4. Mensajería en tiempo real',
        p: 'Los mensajes entre usuarios se almacenan para dar continuidad a la atención. Puedes editar o eliminar tus mensajes en cualquier momento desde el chat.',
      },
      {
        h: '5. Compartir con terceros',
        p: 'No vendemos tus datos. Compartimos información mínima con pasarelas de pago (Culqi) y servicios de notificación (FCM) para procesar tus pagos y avisos.',
      },
      {
        h: '6. Tus derechos',
        p: 'Puedes solicitar la actualización o eliminación de tus datos escribiendo a soporte@jyp-servicios.pe. Puedes desactivar notificaciones push desde Preferencias en el centro de avisos.',
      },
    ],
  },
};

const Legal = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('terms');
  const [openIndex, setOpenIndex] = useState(0);
  const current = SECTIONS[tab];
  const Icon = current.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={15} />
        Volver
      </button>

      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0c1427] via-[#091020] to-[#060a14] p-8 sm:p-10 space-y-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
          <Scale size={26} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Legal y Privacidad</h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Consulta los términos que rigen el uso de JyP Servicios Técnicos y cómo tratamos tu información personal.
        </p>
      </motion.header>

      <div className="flex gap-2 border-b border-white/10 pb-4">
        {Object.entries(SECTIONS).map(([key, section]) => {
          const TabIcon = section.icon;
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setOpenIndex(0);
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2.5 ${
                active
                  ? 'bg-blue-600/20 border-blue-400/50 text-white'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <TabIcon size={15} />
              {key === 'terms' ? 'Términos' : 'Privacidad'}
            </button>
          );
        })}
      </div>

      <section className="rounded-[32px] border border-white/10 bg-[#0e1424] p-7 sm:p-9 space-y-3">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <Icon size={20} className="text-blue-400" />
          <div>
            <h2 className="text-lg font-black text-white">{current.title}</h2>
            <p className="text-[11px] text-slate-500 font-semibold">{current.updated}</p>
          </div>
        </div>

        {current.blocks.map((block, i) => {
          const open = openIndex === i;
          return (
            <div key={block.h} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setOpenIndex(open ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="text-sm font-black text-white">{block.h}</span>
                {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
              </button>
              {open && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-5 pb-5 text-sm leading-relaxed text-slate-300"
                >
                  {block.p}
                </motion.p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default Legal;
