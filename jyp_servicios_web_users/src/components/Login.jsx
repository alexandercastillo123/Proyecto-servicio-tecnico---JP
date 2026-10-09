import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Cpu,
  Wrench, ShieldCheck, Zap, Sun, Moon, ChevronRight,
  Star, MapPin, CheckCircle2, Server, Monitor, Sparkles
} from "lucide-react";
import { authService } from "../services/api";
import { useTheme } from "../context/ThemeContext";

/* ── Quick Demo Presets ────────────────────────────── */
const DEMO_ACCOUNTS = [
  { role: "client", label: "Cliente", email: "cliente@test.com", pass: "123456", icon: ShieldCheck },
  { role: "tech", label: "Técnico", email: "tecnico@test.com", pass: "123456", icon: Wrench },
  { role: "store", label: "Tienda / Empresa", email: "empresa@test.com", pass: "123456", icon: Server },
];

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authService.login(email, password);
      const { token, ...rawUser } = res.data.resultado;
      const user = { ...rawUser, id: rawUser.id || rawUser.userId, userId: rawUser.userId || rawUser.id };
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demo) => {
    setSelectedDemo(demo.role);
    setEmail(demo.email);
    setPassword(demo.pass);
    setError("");
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* ── Theme Toggle floating in top corner ───────────────── */}
      <div className="absolute top-5 right-5 z-40">
        <button
          onClick={toggleTheme}
          className="theme-toggle shadow-lg"
          title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        >
          {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
        </button>
      </div>

      {/* ════ LEFT SHOWCASE PANEL: Brand & Tech Experience ════ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden">
        {/* Background Hero Image with Layered Gradient */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: "url('/tech_service_hero.jpg')",
          }}
        />
        {/* Gradient overlays for cinematic contrast */}
        <div
          className="absolute inset-0 z-1"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(6, 9, 19, 0.92) 0%, rgba(11, 17, 32, 0.85) 50%, rgba(6, 9, 19, 0.95) 100%)"
              : "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.82) 50%, rgba(15, 23, 42, 0.95) 100%)",
          }}
        />

        {/* Ambient neon orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none z-1"
          style={{
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none z-1"
          style={{
            background: "radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        {/* Top: Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-3.5"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
              boxShadow: "0 0 25px rgba(37, 99, 235, 0.45)",
            }}
          >
            <Cpu size={24} className="text-white" strokeWidth={2.3} />
            <div className="absolute inset-0 bg-white/15 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                JyP
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/25 text-blue-300 border border-blue-400/30">
                PRO v3.0
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400 block">
              Servicios Técnicos Especializados
            </span>
          </div>
        </motion.div>

        {/* Center: Hero Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative z-10 my-auto py-10 max-w-lg space-y-6"
        >
          {/* Location badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-blue-300"
            style={{
              background: "rgba(37, 99, 235, 0.18)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              backdropFilter: "blur(10px)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <MapPin size={12} className="text-cyan-400" />
            <span>Red de Especialistas Certificados · Lima, Perú</span>
          </div>

          <h1
            className="text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Soporte & Reparación de{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #60A5FA 0%, #38BDF8 40%, #34D399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Hardware y Servidores
            </span>
          </h1>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
            Plataforma integral para diagnóstico, mantenimiento preventivo y reparación electrónica con garantía escrita y seguimiento satelital de técnicos.
          </p>

          {/* Specialty Hardware Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { label: "Microelectrónica", icon: Cpu },
              { label: "Servidores & Redes", icon: Server },
              { label: "Laptops & PCs", icon: Monitor },
              { label: "Repuestos Garantizados", icon: ShieldCheck },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Icon size={13} className="text-cyan-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div
            className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10"
          >
            {[
              { val: "15,200+", lbl: "Equipos Reparados" },
              { val: "4.9 / 5", lbl: "Satisfacción Clientes" },
              { val: "15 min", lbl: "Tiempo de Respuesta" },
            ].map((stat) => (
              <div key={stat.lbl}>
                <p className="text-xl xl:text-2xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {stat.val}
                </p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">{stat.lbl}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom: Satisfaction badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 flex items-center justify-between p-4 rounded-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["/assets/hero_tech.png", "/assets/hero_client.png", "/assets/hero_store.png"].map((src, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-white">
                  {i === 0 ? "TC" : i === 1 ? "CL" : "TI"}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-white">+2,800 Técnicos y Clientes activos</p>
              <div className="flex items-center gap-1 text-[11px] text-amber-300">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill="currentColor" />
                  ))}
                </div>
                <span className="text-slate-400 ml-1">Garantía total de servicio</span>
              </div>
            </div>
          </div>
          <span className="hidden xl:inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            En línea 24/7
          </span>
        </motion.div>
      </div>

      {/* ════ RIGHT FORM PANEL: Authentication Hub ═════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 md:p-14 lg:p-12 xl:p-16 relative z-10">
        
        {/* Subtle Ambient Background Gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(ellipse 65% 55% at 50% 20%, rgba(37, 99, 235, 0.06) 0%, transparent 80%)",
          }}
        />

        {/* Mobile Header (shown only when left panel is hidden) */}
        <div className="lg:hidden flex items-center gap-3 mb-8 self-start">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)" }}
          >
            <Cpu size={22} className="text-white" strokeWidth={2.3} />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)" }}>
              JyP
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider block text-blue-500">
              Servicios Técnicos
            </span>
          </div>
        </div>

        {/* Form Container with Perfect Margins & Max Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] mx-auto space-y-7"
        >
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Sparkles size={11} /> Portal de Acceso
            </div>
            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)" }}
            >
              Iniciar Sesión
            </h2>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Ingresa tus credenciales para administrar tus servicios técnicos.
            </p>
          </div>

          {/* Quick Demo Switcher Tabs */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Prueba Rápida con 1 Click (Cuentas Demo)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((demo) => {
                const Icon = demo.icon;
                const isSelected = selectedDemo === demo.role;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleSelectDemo(demo)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200"
                    style={{
                      background: isSelected ? "rgba(37, 99, 235, 0.16)" : "var(--bg-input)",
                      borderColor: isSelected ? "var(--primary-light)" : "var(--border)",
                      color: isSelected ? "#38BDF8" : "var(--text-secondary)",
                    }}
                  >
                    <Icon size={16} className={isSelected ? "text-cyan-400" : "text-slate-400"} />
                    <span className="text-[11px] font-bold mt-1 truncate max-w-full">
                      {demo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-1.5">
              <label
                className="text-[11px] font-bold uppercase tracking-wider block"
                style={{ color: "var(--text-secondary)" }}
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                  style={{ color: "var(--text-dim)" }}
                />
                <input
                  type="email"
                  required
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 16 }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  className="text-[11px] font-bold uppercase tracking-wider block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold hover:underline transition-colors"
                  style={{ color: "var(--primary-light)" }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                  style={{ color: "var(--text-dim)" }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                  title={showPass ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 p-3.5 rounded-xl text-xs font-semibold"
                  style={{
                    background: "var(--error-bg)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "var(--error)",
                  }}
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full shadow-lg"
              style={{
                height: 50,
                fontSize: 15,
                borderRadius: 12,
              }}
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  Ingresar a JyP
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div
            className="pt-6 text-center border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              ¿Aún no tienes una cuenta?{" "}
              <Link
                to="/register"
                className="font-bold hover:underline transition-colors ml-1"
                style={{ color: "var(--primary-light)" }}
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Security & SSL Trust Badge */}
          <div
            className="flex items-center justify-center gap-2 text-[11px] font-semibold"
            style={{ color: "var(--text-dim)" }}
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Conexión cifrada SSL · JyP Seguridad Certificada</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
