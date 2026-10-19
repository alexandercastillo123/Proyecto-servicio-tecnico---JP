import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/api";
import { toast } from "react-hot-toast";
import "./Login.css";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  Cpu,
  Server,
  Laptop,
  CheckCircle2,
} from "lucide-react";

const Login = ({ onLogin }) => {
  const { isDark, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.login(formData.email, formData.password);
      const { token, ...rawUser } = res.data.resultado;
      const user = {
        ...rawUser,
        id: rawUser.id || rawUser.userId,
        userId: rawUser.userId || rawUser.id,
      };
      localStorage.setItem("token", token);

      /* El login no devuelve names/surnames (viven en user_profiles), así que se
         consulta el perfil para que el saludo y el header usen el nombre real. */
      let profile = null;
      try {
        const profileRes = await authService.getProfile();
        profile = profileRes.data?.resultado || null;
      } catch (err) {
        console.warn("No se pudo cargar el perfil tras el login:", err);
      }

      const userWithProfile = profile ? { ...user, ...profile } : user;
      localStorage.setItem("user", JSON.stringify(userWithProfile));
      toast.success("Inicio de sesión exitoso");
      onLogin(userWithProfile);
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "Credenciales inválidas. Intenta de nuevo.";
      toast.error(msg);
    }
  };

  return (
    <div className="login-page">
      {/* Sección Izquierda - Hero / Banner Promocional */}
      <div className="login-hero">
        {/* Imagen de fondo con overlay degradado */}
        <div className="login-hero-background">
          <img
            src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop"
            alt="Laboratorio de Microelectrónica y Servidores J&P"
            className="login-hero-image"
          />
          <div className="login-hero-overlay" />
        </div>

        {/* Branding Superior */}
        <div className="login-brand">
          <div className="flex items-center gap-3">
            <div className="login-brand-mark flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="login-brand-name text-xl font-bold tracking-tight text-white">
                JyP <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">PRO V3.0</span>
              </h1>
              <p className="login-brand-caption text-[10px] tracking-wider text-gray-400 uppercase font-medium">
                Servicios Técnicos Especializados
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje Principal */}
        <div className="login-hero-content">
          <div className="login-eyebrow inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            Red de Especialistas Certificados · Lima, Perú
          </div>

          <h2 className="login-hero-title text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
            Soporte & Reparación de{" "}
            <span className="login-hero-title-accent">
              Hardware y Servidores
            </span>
          </h2>

          <p className="login-hero-description text-sm leading-relaxed text-gray-300">
            Plataforma integral para diagnóstico, mantenimiento preventivo y
            reparación electrónica con garantía escrita y seguimiento satelital de técnicos.
          </p>

          <div className="login-specialties flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Cpu size={14} className="text-blue-400" />
              Microelectrónica
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Server size={14} className="text-cyan-400" />
              Servidores & Redes
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Laptop size={14} className="text-emerald-400" />
              Laptops & PCs
            </div>
          </div>
        </div>

        {/* Métricas / Estadísticas */}
        <div className="login-metrics relative z-10 border-t border-white/10 pt-6">
          <div className="login-metrics-heading flex items-center gap-2 mb-3 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={14} />
            Repuestos Garantizados
          </div>
          <div className="login-metrics-grid grid grid-cols-3 gap-4">
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">15,200+</p>
              <p className="login-metric-label text-[11px] text-gray-400">Equipos Reparados</p>
            </div>
            <div className="login-metric">
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-white">4.9</p>
                <span className="login-rating text-xs text-yellow-400">/ 5</span>
              </div>
              <p className="login-metric-label text-[11px] text-gray-400">Satisfacción Clientes</p>
            </div>
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">15 min</p>
              <p className="login-metric-label text-[11px] text-gray-400">Tiempo de Respuesta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Derecha - Formulario de Login */}
      <div className="login-form-panel">
        <button
          type="button"
          className="login-theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
          title={isDark ? "Activar modo claro" : "Activar modo oscuro"}
        >
          {isDark ? (
            <Sun size={19} className="text-amber-400" />
          ) : (
            <Moon size={19} className="text-blue-500" />
          )}
        </button>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="login-card"
        >
          {/* Header Formulario */}
          <div className="login-header text-center">
            <div className="login-portal-badge inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400 font-medium mb-3">
              <ShieldCheck size={14} />
              PORTAL DE ACCESO
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-xs text-gray-400">
              Ingresa tus credenciales para administrar tus servicios técnicos.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="login-form space-y-4">
            <div>
              <label className="login-field-label block text-xs font-semibold tracking-wider text-gray-300 uppercase mb-1.5">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@ejemplo.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#141a26] py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="login-password-heading flex items-center justify-between mb-1.5">
                <label className="login-field-label block text-xs font-semibold tracking-wider text-gray-300 uppercase">
                  CONTRASEÑA
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-400 hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#141a26] py-3 pl-10 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 active:scale-[0.99]"
            >
              Ingresar a JyP
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Enlace de Registro */}
          <div className="login-register text-center pt-2">
            <p className="text-xs text-gray-400">
              ¿Aún no tienes una cuenta?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-400 hover:underline"
                style={{ color: "var(--primary-light)" }}
              >
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* SSL Badge */}
          <div
            className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400"
            style={{ color: "var(--text-dim)" }}
          >
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Conexión cifrada SSL · JyP Seguridad Certificada</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
