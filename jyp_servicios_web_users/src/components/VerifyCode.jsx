import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, AlertCircle, Info, Cpu, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import './Login.css';

const VerifyCode = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res?.exito) {
        setError(null);
        toast.success('Código reenviado a tu correo');
      } else {
        setError(res?.mensaje || 'No se pudo reenviar el código');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo reenviar el código');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyCode(email, code);
      if (response.exito) {
        navigate('/reset-password', { state: { email, code } });
      } else {
        setError(response.mensaje || 'Código inválido o expirado');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || 'Error al validar el código');
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
            Verificación OTP en 2 Pasos
          </div>

          <h2 className="login-hero-title text-4xl font-extrabold leading-tight tracking-tight text-white lg:text-5xl">
            Confirmación de{" "}
            <span className="login-hero-title-accent">
              Identidad de Usuario
            </span>
          </h2>

          <p className="login-hero-description text-sm leading-relaxed text-gray-300">
            Ingresa el código numérico de 6 dígitos que enviamos a tu buzón de correo. Esta validación garantiza que sólo tú puedas autorizar cambios de acceso.
          </p>

          <div className="login-specialties flex flex-wrap gap-2.5 pt-1">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <ShieldCheck size={14} className="text-emerald-400" />
              Token Criptográfico
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Cpu size={14} className="text-cyan-400" />
              Protección Anti-Intrusión
            </div>
          </div>
        </div>

        {/* Métricas Inferiores */}
        <div className="login-metrics relative z-10 border-t border-white/10 pt-6">
          <div className="login-metrics-heading flex items-center gap-2 mb-3 text-xs text-emerald-400 font-medium">
            <CheckCircle2 size={14} />
            Transmisión Encriptada SSL/TLS
          </div>
          <div className="login-metrics-grid grid grid-cols-3 gap-4">
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">6 Dígitos</p>
              <p className="login-metric-label text-[11px] text-gray-400">Código de Seguridad</p>
            </div>
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">Inmediato</p>
              <p className="login-metric-label text-[11px] text-gray-400">Envío por Servidor</p>
            </div>
            <div className="login-metric">
              <p className="text-2xl font-bold text-white">0% Falsos</p>
              <p className="login-metric-label text-[11px] text-gray-400">Autenticación Única</p>
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
          {/* Header */}
          <div className="login-header text-center">
            <div className="login-portal-badge inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 text-xs text-blue-400 font-bold mb-3">
              <ShieldCheck size={14} />
              CÓDIGO DE VERIFICACIÓN
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white font-heading">
              Validar Código
            </h2>
            <p className="mt-2 text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              Enviamos un código de 6 dígitos a <span className="text-cyan-400 font-bold">{email}</span>. Si no lo encuentras, revisa tu carpeta de SPAM.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 text-center mb-2">
                INGRESA EL CÓDIGO DE 6 DÍGITOS
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full py-4 text-center text-3xl font-black tracking-[0.6rem] rounded-2xl border border-white/10 bg-[#141a26] text-cyan-300 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="••••••"
                required
              />
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
              disabled={isLoading || code.length < 6}
              className="btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Validar y Continuar</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <Link to="/forgot-password" className="flex items-center gap-1.5 text-slate-400 hover:text-white font-medium transition-colors">
              <ArrowLeft size={14} />
              <span>Cambiar Correo</span>
            </Link>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-blue-400 hover:underline font-bold bg-transparent border-none cursor-pointer disabled:opacity-50"
            >
              {isResending ? 'Reenviando...' : 'Reenviar Código'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyCode;
