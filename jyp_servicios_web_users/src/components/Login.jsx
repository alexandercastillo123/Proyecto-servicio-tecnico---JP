import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { authService } from "../services/api";
import {
  ShieldCheck,
  User,
  Wrench,
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Cpu,
  Server,
  Laptop,
  AlertCircle,
  Loader2,
} from "lucide-react";

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState("cliente"); // 'cliente' | 'tecnico' | 'tienda'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const demoUsers = {
    cliente: {
      email: "alekeycastillo1@gmail.com",
      password: "123456",
      label: "Cliente",
    },
    tecnico: {
      email: "alekeycastillo2@gmail.com",
      password: "123456",
      label: "Técnico",
    },
    tienda: {
      email: "alekeycastillo3@gmail.com",
      password: "123456",
      label: "Tienda",
    },
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (demoUsers[selectedRole]) {
      setFormData({
        email: demoUsers[selectedRole].email,
        password: demoUsers[selectedRole].password,
      });
      setError("");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authService.login(formData.email.trim(), formData.password);
      const result = res.data?.resultado || res.data;

      if (!result) {
        throw new Error("Respuesta no válida del servidor.");
      }

      const token = result.token;
      const user = {
        id: result.userId || result.id,
        userId: result.userId || result.id,
        email: result.email,
        username: result.username,
        role: result.role,
      };

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }

      if (onLogin) {
        onLogin(user);
      }

      toast.success(res.data?.mensaje || "¡Inicio de sesión exitoso!");
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        err.message ||
        "Credenciales incorrectas o error en la conexión con el servidor.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#080d17] text-white font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sección Izquierda - Hero Promocional con margen mínimo de 5.2cm desde el borde */}
      <div
        className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex"
        style={{
          paddingLeft: "5.2cm",
          paddingRight: "3cm",
          paddingTop: "4rem",
          paddingBottom: "4rem",
        }}
      >
        {/* Imagen de fondo nítida y visible con overlays armoniosos */}
        <div className="absolute inset-0 z-0">
          <img
            src="/tech_service_hero.jpg"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop";
            }}
            alt="Laboratorio de Microelectrónica"
            className="h-full w-full object-cover opacity-65 transition-all duration-700"
          />
          {/* Overlays elegantes que garantizan contraste de texto sin perder la imagen */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d17] via-[#080d17]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#080d17]/45 to-[#080d17]" />
          <div className="absolute inset-0 bg-blue-950/20 pointer-events-none" />
        </div>

        {/* Branding Superior */}
        <div className="relative z-10 flex items-center gap-3.5 mb-auto">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-xl shadow-blue-500/25 ring-1 ring-white/20">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none">
              JyP
            </h1>
            <p className="text-xs tracking-wider text-slate-300 uppercase font-semibold mt-1">
              Servicios Técnicos Especializados
            </p>
          </div>
        </div>

        {/* Mensaje Principal - Centrado verticalmente y balanceado */}
        <div className="relative z-10 my-auto space-y-7 max-w-xl py-8">
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.18] tracking-tight text-white">
            Soporte & Reparación de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
              Hardware y Servidores
            </span>
          </h2>

          <p className="text-base leading-relaxed text-slate-300/90 font-normal">
            Plataforma integral para diagnóstico, mantenimiento preventivo y
            reparación electrónica con garantía escrita y seguimiento satelital de técnicos.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur-md text-slate-200">
              <Cpu size={16} className="text-blue-400" />
              Microelectrónica
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur-md text-slate-200">
              <Server size={16} className="text-cyan-400" />
              Servidores & Redes
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold backdrop-blur-md text-slate-200">
              <Laptop size={16} className="text-emerald-400" />
              Laptops & PCs
            </div>
          </div>
        </div>

        {/* Pie inferior discreto para estabilizar el equilibrio vertical */}
        <div className="relative z-10 mt-auto text-xs text-slate-500 font-medium">
          © {new Date().getFullYear()} JyP Servicios · Todos los derechos reservados
        </div>
      </div>

      {/* Sección Derecha - Formulario de Login Amplio, Centrado y Separado */}
      <div className="relative flex w-full items-center justify-center p-6 sm:p-12 lg:w-1/2 lg:p-16">
        {/* Glow de fondo para eliminar la sensación de vacío */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none -z-0"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-[640px] rounded-[36px] bg-[#0e1524]/95 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-8"
          style={{
            paddingLeft: "3.2cm",
            paddingRight: "3.2cm",
            paddingTop: "3.5rem",
            paddingBottom: "3.5rem",
          }}
        >
          {/* Header Formulario */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-400 font-bold tracking-wide">
              <ShieldCheck size={15} />
              PORTAL DE ACCESO
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white pt-1">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-slate-400 text-center w-full leading-relaxed">
              Ingresa tus credenciales para administrar tus servicios técnicos.
            </p>
          </div>

          {/* Selector de Rol en pestañas amplias y cómodas */}
          <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-[#070b13] p-1.5 border border-white/10 my-2">
            <button
              type="button"
              onClick={() => handleRoleSelect("cliente")}
              className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                role === "cliente"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/35"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <User size={16} />
              <span>Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("tecnico")}
              className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                role === "tecnico"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/35"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Wrench size={16} />
              <span>Técnico</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect("tienda")}
              className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                role === "tienda"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/35"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Store size={16} />
              <span>Tienda</span>
            </button>
          </div>

          {/* Mensaje de error si falla la autenticación */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300"
            >
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Formulario con campos separados y espaciados */}
          <form onSubmit={handleSubmit} className="pt-2">
            <div style={{ marginBottom: "26px" }}>
              <label
                className="block text-xs font-bold tracking-wider text-slate-300 uppercase"
                style={{ marginBottom: "12px" }}
              >
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <Mail size={19} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@ejemplo.com"
                  required
                  style={{ paddingLeft: "3.2rem", paddingRight: "1.2rem" }}
                  className="w-full h-14 rounded-xl border border-white/10 bg-[#070b13] text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                />
              </div>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: "12px" }}
              >
                <label className="block text-xs font-bold tracking-wider text-slate-300 uppercase">
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-semibold transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock size={19} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{ paddingLeft: "3.2rem", paddingRight: "3.2rem" }}
                  className="w-full h-14 rounded-xl border border-white/10 bg-[#070b13] text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:from-blue-500 hover:to-blue-400 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin text-white" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar a JyP</span>
                    <ArrowRight size={19} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Enlace de Registro */}
          <div className="text-center pt-4 border-t border-white/[0.08]">
            <p className="text-xs text-slate-400">
              ¿Aún no tienes una cuenta?{" "}
              <Link
                to="/register"
                className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors ml-1"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;