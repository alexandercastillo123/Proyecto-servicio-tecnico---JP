import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Wrench, ShieldCheck, Zap, Activity } from 'lucide-react';

/* ── Full Page or Container Diagnostic Loader ───────────────── */
export const TechLoader = ({ 
  title = "Iniciando Diagnóstico", 
  subtitle = "Sincronizando plataforma técnica...",
  compact = false,
  fullscreen = false 
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    "Verificando protocolos de seguridad...",
    "Comprobando cobertura de técnicos en Lima...",
    "Sintonizando canal de telemetría...",
    "Listo para conectar..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const content = (
    <div className={`flex flex-col items-center justify-center gap-5 text-center ${compact ? 'py-8' : 'py-16'}`}>
      {/* Animated Hardware Chip Core */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-24 h-24 rounded-2xl"
          style={{
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, transparent 70%)",
            filter: "blur(12px)",
          }}
        />

        {/* Rotating radar track */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center relative z-10"
          style={{
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(6, 182, 212, 0.12) 100%)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            boxShadow: "0 0 25px rgba(37, 99, 235, 0.35)",
          }}
        >
          <Cpu className="text-blue-500 animate-pulse" size={28} strokeWidth={2.2} />
          
          {/* Orbiting particle */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div 
              className="w-2 h-2 rounded-full absolute -top-1" 
              style={{ background: "#06B6D4", boxShadow: "0 0 10px #06B6D4" }} 
            />
          </motion.div>
        </div>
      </div>

      {/* Text Info */}
      <div className="space-y-1.5 max-w-sm">
        <h4 className="text-base font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h4>
        <p className="text-xs font-semibold tracking-wide" style={{ color: "#3B82F6" }}>
          {subtitle || steps[stepIndex]}
        </p>
      </div>

      {/* Progress bar shimmer */}
      <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255, 255, 255, 0.08)" }}>
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-1/2 h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #2563EB, #06B6D4)" }}
        />
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        {content}
      </div>
    );
  }

  return content;
};

/* ── Skeleton Card Loader ───────────────────────────────────── */
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card p-6 space-y-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl skeleton" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 skeleton rounded" />
              <div className="h-3 w-1/2 skeleton rounded" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full skeleton rounded" />
            <div className="h-3 w-5/6 skeleton rounded" />
          </div>
          <div className="pt-2 flex justify-between items-center">
            <div className="h-4 w-20 skeleton rounded" />
            <div className="h-8 w-24 skeleton rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Live Technical Radar Sweep ─────────────────────────────── */
export const RadarIndicator = ({ label = "Buscando técnicos..." }) => {
  return (
    <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full" style={{ background: "rgba(37, 99, 235, 0.12)", border: "1px solid rgba(37, 99, 235, 0.28)" }}>
      <div className="relative w-3.5 h-3.5 flex items-center justify-center">
        <span className="w-2 h-2 rounded-full" style={{ background: "#06B6D4", boxShadow: "0 0 8px #06B6D4" }} />
        <span className="absolute w-full h-full rounded-full animate-ping" style={{ background: "rgba(6, 182, 212, 0.4)" }} />
      </div>
      <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#38BDF8" }}>
        {label}
      </span>
    </div>
  );
};
