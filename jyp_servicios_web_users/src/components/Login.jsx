import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Cpu,
  Wrench, ShieldCheck, Zap, Sun, Moon, ChevronRight,
  Star, MapPin
} from "lucide-react";
import { authService } from "../services/api";
import { useTheme } from "../context/ThemeContext";

/* ── Floating orb ──────────────────────────────── */
const Orb = ({ style }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      filter: "blur(80px)",
      opacity: 0.5,
      animation: "float 8s ease-in-out infinite",
      ...style,
    }}
  />
);

/* ── Animated dot grid ─────────────────────────── */
const DotGrid = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: "radial-gradient(rgba(45,107,255,0.18) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
    }}
  />
);

/* ── Feature item ──────────────────────────────── */
const Feature = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    className="flex items-center gap-3"
  >
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      style={{
        background: "rgba(45,107,255,0.15)",
        border: "1px solid rgba(45,107,255,0.25)",
        boxShadow: "0 0 12px rgba(45,107,255,0.15)",
      }}
    >
      <Icon size={16} color="#2D6BFF" strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-sm font-bold" style={{ color: "#E8EDFF" }}>{title}</p>
      <p className="text-[11px]" style={{ color: "#607294" }}>{desc}</p>
    </div>
  </motion.div>
);

/* ── Main component ────────────────────────────── */
const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setError(err.response?.data?.mensaje || err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    height: 48,
    borderRadius: 12,
    fontFamily: "'Inter',sans-serif",
    fontSize: 14,
    fontWeight: 500,
    outline: "none",
    transition: "all 0.2s ease",
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)", fontFamily: "'Inter',sans-serif" }}>

      {/* ══ LEFT PANEL ══════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden"
        style={{ width: "55%", background: "#05070F" }}
      >
        {/* Decorative elements */}
        <DotGrid />
        <Orb style={{ left: "-8%", top: "10%", width: 420, height: 420, background: "radial-gradient(circle, rgba(45,107,255,0.28) 0%, transparent 70%)", animationDelay: "0s" }} />
        <Orb style={{ right: "5%", bottom: "15%", width: 320, height: 320, background: "radial-gradient(circle, rgba(0,229,160,0.18) 0%, transparent 70%)", animationDelay: "3s" }} />
        <Orb style={{ right: "20%", top: "5%", width: 200, height: 200, background: "radial-gradient(circle, rgba(155,127,212,0.2) 0%, transparent 70%)", animationDelay: "1.5s" }} />

        {/* Diagonal decorative line */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: 0, top: 0, bottom: 0, width: 1,
            background: "linear-gradient(to bottom, transparent, rgba(45,107,255,0.3) 40%, rgba(0,229,160,0.2) 70%, transparent)",
          }}
        />

        <div className="relative z-10 space-y-10 max-w-[480px]">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "#2D6BFF", boxShadow: "0 0 28px rgba(45,107,255,0.5)" }}
            >
              <Cpu size={22} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#F0F4FF" }}>JyP</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#2D6BFF" }}>Servicios Técnicos</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="space-y-4"
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
              style={{ background: "rgba(45,107,255,0.12)", border: "1px solid rgba(45,107,255,0.25)", color: "#6B9FFF" }}
            >
              <MapPin size={10} />
              Portal de Servicios — Lima, Perú
            </div>

            <h1
              className="text-5xl font-black leading-tight tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#F0F4FF" }}
            >
              Soporte Técnico<br />
              <span
                style={{
                  backgroundImage: "linear-gradient(135deg, #2D6BFF 0%, #00E5A0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Profesional
              </span>
            </h1>

            <p style={{ color: "#607294", fontSize: 15, lineHeight: 1.7, maxWidth: 400 }}>
              Conectamos clientes con técnicos certificados para reparación de equipos, servidores y electrónica en Lima Metropolitana.
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-4">
            <Feature icon={Wrench} title="Técnicos Certificados" desc="Profesionales verificados con experiencia comprobada" delay={0.3} />
            <Feature icon={ShieldCheck} title="Servicio Garantizado" desc="Garantía de 7 días en todas las reparaciones" delay={0.4} />
            <Feature icon={Zap} title="Atención Inmediata" desc="Tiempo de respuesta promedio de 15 minutos" delay={0.5} />
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="flex items-center gap-8 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {[["14,500+", "Equipos reparados"], ["4.9/5", "Valoración promedio"], ["99.6%", "Tasa de éxito"]].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-2xl font-black" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#F0F4FF" }}>{val}</p>
                <p className="text-[11px]" style={{ color: "#607294" }}>{lbl}</p>
              </div>
            ))}
          </motion.div>

          {/* Review badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(255,176,32,0.07)", border: "1px solid rgba(255,176,32,0.15)" }}
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#FFB020" color="#FFB020" />)}
            </div>
            <p className="text-[11px]" style={{ color: "#A89060" }}>
              <span style={{ color: "#FFB020", fontWeight: 700 }}>+2,400</span> clientes satisfechos en Lima
            </p>
          </motion.div>
        </div>
      </div>

      {/* ══ RIGHT PANEL — Login Form ═════════════════════════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 relative"
        style={{ background: "var(--bg-surface)" }}
      >
        {/* Subtle bg decoration for right panel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,107,255,0.04) 0%, transparent 100%)"
              : "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,107,255,0.06) 0%, transparent 100%)",
          }}
        />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle absolute top-6 right-6"
          title="Cambiar tema"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#2D6BFF" }}>
            <Cpu size={18} color="white" />
          </div>
          <span className="font-black text-xl" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)" }}>JyP</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full relative z-10"
          style={{ maxWidth: 400 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: "rgba(45,107,255,0.1)",
                border: "1px solid rgba(45,107,255,0.2)",
                boxShadow: "0 0 20px rgba(45,107,255,0.1)",
              }}
            >
              <ShieldCheck size={22} style={{ color: "#2D6BFF" }} />
            </div>
            <h2
              className="text-3xl font-black tracking-tight mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)" }}
            >
              Bienvenido de vuelta
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Ingresa al portal de servicios técnicos JyP
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }} />
                <input
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 44, paddingRight: 16 }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2D6BFF";
                    e.target.style.boxShadow = "0 0 0 3px rgba(45,107,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[11px] font-bold hover:underline"
                  style={{ color: "#2D6BFF", background: "none", border: "none", cursor: "pointer" }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }} />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 44, paddingRight: 48 }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2D6BFF";
                    e.target.style.boxShadow = "0 0 0 3px rgba(45,107,255,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--error-bg)", border: "1px solid rgba(255,77,109,0.25)", color: "var(--error)" }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
              style={{
                height: 50,
                fontSize: 15,
                borderRadius: 12,
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 700,
              }}
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  Ingresar al Portal
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider + Register */}
          <div className="mt-7 pt-6 text-center" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              ¿No tienes una cuenta?{" "}
              <button
                onClick={() => navigate("/register")}
                className="font-bold hover:underline"
                style={{ color: "#2D6BFF", background: "none", border: "none", cursor: "pointer" }}
              >
                Regístrate aquí
              </button>
            </p>
          </div>

          {/* Trust badge */}
          <div className="mt-6 flex items-center justify-center gap-2" style={{ color: "var(--text-dim)", fontSize: 11 }}>
            <ShieldCheck size={13} style={{ color: "#00E5A0" }} />
            <span>Conexión segura SSL · Datos protegidos</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
