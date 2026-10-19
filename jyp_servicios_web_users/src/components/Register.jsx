import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Store, Mail, Lock, ArrowLeft, CheckCircle2, ShieldCheck, 
  Cpu, Wrench, Eye, EyeOff, Sun, Moon, Building2, Sparkles, AlertCircle,
  ArrowRight, Phone, FileText, Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import './Login.css';

const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [step, setStep] = useState(1); // 1: Role, 2: Form
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'client',
    personType: 'natural',
    names: '',
    surnames: '',
    companyName: '',
    dni: '',
    ruc: '',
    phone: '',
    city: 'Lima'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { 
      id: 'client', 
      label: 'Cliente', 
      desc: 'Solicito servicio para laptops, PCs, microelectrónica o servidores con garantía.', 
      icon: User,
      badge: "Usuario Final",
      color: "from-blue-600 to-cyan-500"
    },
    { 
      id: 'tech', 
      label: 'Técnico Especialista', 
      desc: 'Ofrezco servicios técnicos verificados a domicilio o en taller sobre el mapa satelital.', 
      icon: Wrench,
      badge: "Profesional",
      color: "from-cyan-600 to-teal-500"
    },
    { 
      id: 'store', 
      label: 'Tienda / Taller Autorizado', 
      desc: 'Gestiono sucursal física, catálogo de repuestos, inventario y recojo en Lima.', 
      icon: Store,
      badge: "Empresa",
      color: "from-purple-600 to-indigo-500"
    },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.register(formData);
      const { token, ...rawUser } = res.data.resultado;
      const user = { ...rawUser, id: rawUser.id || rawUser.userId, userId: rawUser.userId || rawUser.id };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || err.message || 'Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── LEFT HERO PROMOTIONAL BANNER ── */}
      <div className="login-hero">
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
            Registro de Nueva Cuenta · Lima Metropolitana
          </div>

          <h2 className="login-hero-title text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
            Únete a la Red de{" "}
            <span className="login-hero-title-accent">
              Soporte y Garantía
            </span>
          </h2>

          <p className="login-hero-description text-sm leading-relaxed text-gray-300">
            Crea tu cuenta en minutos para acceder al radar de especialistas en tiempo real, agendamiento transparente, repuestos originales y trazabilidad de extremo a extremo.
          </p>

          <div className="login-specialties flex flex-wrap gap-2.5 pt-1">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <ShieldCheck size={14} className="text-blue-400" />
              Garantía Escrita 7 Días
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Cpu size={14} className="text-cyan-400" />
              Laboratorio Certificado
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Store size={14} className="text-emerald-400" />
              Repuestos & Talleres
            </div>
          </div>
        </div>

        {/* Métricas Inferiores */}
        <div className="login-metrics relative z-10 border-t border-white/10 pt-6">
          <div className="login-metrics-heading flex items-center gap-2 mb-3 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={14} />
            Plataforma 100% Verificada en Lima
          </div>
          <div className="login-metrics-grid grid grid-cols-3 gap-4">
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">15,200+</p>
              <p className="login-metric-label text-[11px] text-gray-400">Servicios Realizados</p>
            </div>
            <div className="login-metric">
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-white">4.9</p>
                <span className="login-rating text-xs text-yellow-400">/ 5</span>
              </div>
              <p className="login-metric-label text-[11px] text-gray-400">Calificación Promedio</p>
            </div>
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="login-metric-label text-[11px] text-gray-400">Técnicos Auditados</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="login-form-panel">
        {/* Theme toggle */}
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
          className="login-card w-full"
          style={{ width: 'min(100%, 540px)', padding: 'clamp(28px, 3.5vw, 44px)' }}
        >
          {/* Header Formulario */}
          <div className="login-header text-center">
            <div className="login-portal-badge inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs text-blue-400 font-bold mb-3">
              <Sparkles size={14} />
              {step === 1 ? 'PASO 1 DE 2: TIPO DE CUENTA' : 'PASO 2 DE 2: DATOS DE REGISTRO'}
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white font-heading">
              Crear Cuenta JyP
            </h2>
            <p className="mt-1.5 text-xs text-gray-400">
              {step === 1 
                ? 'Selecciona el rol que mejor describe tu actividad.' 
                : 'Completa tus datos para activar tu acceso inmediato.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-3 pt-1">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = formData.role === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => setFormData({ ...formData, role: role.id })}
                        className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group ${
                          isSelected 
                            ? 'bg-blue-600/15 border-blue-500/60 shadow-lg shadow-blue-600/15' 
                            : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div 
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105 bg-gradient-to-br ${role.color}`}
                        >
                          <Icon size={22} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-white">{role.label}</h4>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                              {role.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{role.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                          isSelected ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-xl mt-4 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continuar con Datos Personales</span>
                  <ArrowRight size={15} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Back to Step 1 & Role pill */}
                <div className="flex items-center justify-between pb-1">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Cambiar Perfil
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Rol: {roles.find(r => r.id === formData.role)?.label}
                  </span>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                  {/* Persona Natural vs Jurídica (matching Android) */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Tipo de Registro
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, personType: 'natural' })}
                        className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          formData.personType === 'natural' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Persona Natural
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, personType: 'juridical' })}
                        className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          formData.personType === 'juridical' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Empresa / Jurídica
                      </button>
                    </div>
                  </div>

                  {/* Form fields based on Natural vs Jurídica */}
                  {formData.personType === 'natural' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Nombres *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.names}
                          onChange={(e) => setFormData({ ...formData, names: e.target.value })}
                          placeholder="Juan Carlos"
                          className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.surnames}
                          onChange={(e) => setFormData({ ...formData, surnames: e.target.value })}
                          placeholder="Pérez Gómez"
                          className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          DNI (8 dígitos) *
                        </label>
                        <input
                          type="text"
                          maxLength={8}
                          required
                          value={formData.dni}
                          onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
                          placeholder="74829103"
                          className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Teléfono / Celular
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="987 654 321"
                          className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Razón Social / Empresa *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          placeholder="JyP Computadoras S.A.C."
                          className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          RUC (11 dígitos) *
                        </label>
                        <input
                          type="text"
                          maxLength={11}
                          required
                          value={formData.ruc}
                          onChange={(e) => setFormData({ ...formData, ruc: e.target.value.replace(/\D/g, '') })}
                          placeholder="20601234567"
                          className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Teléfono Empresa
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="01 456 7890"
                          className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Common credentials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Nombre de Usuario *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="usuario_jyp"
                        className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 px-3.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Contraseña de Acceso *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-white/10 bg-[#141a26] py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-xl mt-3 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Completar Registro JyP</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer link */}
          <div className="text-center pt-2 border-t border-white/5">
            <p className="text-xs text-slate-400">
              ¿Ya tienes una cuenta registrada?{' '}
              <Link to="/login" className="text-blue-400 hover:underline font-bold">
                Inicia Sesión aquí
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
