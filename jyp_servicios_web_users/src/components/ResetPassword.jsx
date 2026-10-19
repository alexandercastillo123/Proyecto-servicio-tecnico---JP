import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, RefreshCw, Eye, EyeOff, AlertCircle, CheckCircle2, Cpu, Sun, Moon, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import './Login.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const { email, code } = location.state || {};

  useEffect(() => {
    if (!email || !code) {
      navigate('/forgot-password');
    }
  }, [email, code, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.resetPassword(email, code, password);
      if (response.exito) {
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(response.mensaje || 'Error al actualizar la contraseña');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
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
            Nueva Clave de Seguridad
          </div>

          <h2 className="login-hero-title text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
            Actualización de{" "}
            <span className="login-hero-title-accent">
              Contraseña Blindada
            </span>
          </h2>

          <p className="login-hero-description text-sm leading-relaxed text-gray-300">
            Define una contraseña segura con mínimo 6 caracteres. Tus credenciales son almacenadas con encriptación bcrypt de alta seguridad.
          </p>

          <div className="login-specialties flex flex-wrap gap-2.5 pt-1">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <ShieldCheck size={14} className="text-emerald-400" />
              Cifrado Hashing Bcrypt
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Cpu size={14} className="text-cyan-400" />
              Acceso Inmediato
            </div>
          </div>
        </div>

        {/* Métricas Inferiores */}
        <div className="login-metrics relative z-10 border-t border-white/10 pt-6">
          <div className="login-metrics-heading flex items-center gap-2 mb-3 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={14} />
            Protección de Cuenta Activa
          </div>
          <div className="login-metrics-grid grid grid-cols-3 gap-4">
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="login-metric-label text-[11px] text-gray-400">Protección de Datos</p>
            </div>
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">SSL</p>
              <p className="login-metric-label text-[11px] text-gray-400">Canal Seguro</p>
            </div>
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">JyP</p>
              <p className="login-metric-label text-[11px] text-gray-400">Red Certificada</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
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
          className="login-card w-full"
          style={{ width: 'min(100%, 460px)', padding: 'clamp(28px, 3.5vw, 44px)' }}
        >
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white font-heading">¡Contraseña Actualizada!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tu clave ha sido restablecida con éxito. Redirigiéndote al inicio de sesión en segundos...
              </p>
              <Link to="/login" className="btn-primary w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center">
                Iniciar Sesión Ahora
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="login-header text-center">
                <div className="login-portal-badge inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs text-blue-400 font-bold mb-3">
                  <Lock size={14} />
                  RESTABLECER ACCESO
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white font-heading">
                  Nueva Contraseña
                </h2>
                <p className="mt-2 text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Ingresa tu nueva clave de acceso para tu cuenta <span className="text-cyan-400 font-bold">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    NUEVA CONTRASEÑA (MÍN. 6 CARACTERES)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#141a26] py-3 pl-4 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    CONFIRMAR NUEVA CONTRASEÑA
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#141a26] py-3 pl-4 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Actualizar Contraseña</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <Link to="/login" className="flex items-center gap-1.5 text-slate-400 hover:text-white font-medium transition-colors">
                  <ArrowLeft size={14} />
                  <span>Cancelar y Volver al Login</span>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
