import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, AlertCircle, Cpu, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success || response.exito) {
        navigate('/verify-code', { state: { email } });
      } else {
        setError(response.message || response.mensaje || 'Error al enviar el código');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.message || 'Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="jyp-page jyp-container flex items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-20"
          style={{ backgroundColor: 'var(--primary)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] opacity-15"
          style={{ backgroundColor: 'var(--secondary)' }}
        />
      </div>

      {/* Theme toggle (identico al login) */}
      <button
        type="button"
        className="jyp-theme-toggle"
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10 mx-auto"
      >
        <div className="jyp-card p-10 md:p-12 rounded-[36px] shadow-2xl backdrop-blur-xl border border-white/10">
          <div className="flex items-center justify-between mb-10 px-2">
            <Link
              to="/login"
              className="flex items-center justify-center transition-colors hover:scale-105 text-slate-400 hover:text-white hover:border-white/20"
            >
              <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <ArrowLeft size={20} />
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-600 to-cyan-500"
              >
                <Cpu size={24} className="text-white" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-lg text-slate-100 font-heading">JyP</span>
                <span className="block text-[10px] uppercase tracking-wider -mt-1 font-semibold text-blue-400">Servicios</span>
              </div>
            </div>

            <div className="w-14 h-14" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight text-slate-100 font-heading">
              Recuperar Acceso
            </h1>
            <p className="text-sm text-slate-400">
              Ingresa tu correo para recibir un código seguro de verificación.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="jyp-form-label">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500"
                >
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="jyp-form-input w-full py-3.5 pl-11 pr-4 rounded-2xl border outline-none"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl flex items-center gap-3 text-sm jyp-badge jyp-badge-outline"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  color: '#EF4444'
                }}
              >
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="jyp-btn-primary w-full h-12 shadow-xl shadow-blue-600/20 hover:scale-[1.01]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enviar Código</span>
                  <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            ¿Recordaste tu contraseña?{' '}
            <Link to="/login" className="font-bold hover:underline text-blue-400">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
