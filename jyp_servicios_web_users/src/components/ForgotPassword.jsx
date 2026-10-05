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
      if (response.success) {
        navigate('/verify-code', { state: { email } });
      } else {
        setError(response.message || 'Error al enviar el código');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
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

      {/* Theme toggle in top right */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-xl border transition-all z-20 flex items-center gap-2"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)'
        }}
        title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      >
        {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-500" />}
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div 
          className="p-8 md:p-10 rounded-2xl border shadow-2xl backdrop-blur-xl"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border)' 
          }}
        >
          <div className="flex justify-between items-center mb-8">
            <Link 
              to="/login" 
              className="p-2.5 rounded-xl border transition-colors flex items-center justify-center"
              style={{ 
                backgroundColor: 'var(--bg)', 
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)' 
              }}
            >
              <ArrowLeft size={20} />
            </Link>
            
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Cpu size={22} className="text-white" />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-lg" style={{ color: 'var(--text-primary)' }}>JyP</span>
                <span className="block text-[10px] uppercase tracking-wider -mt-1 font-semibold" style={{ color: 'var(--primary)' }}>Servicios</span>
              </div>
            </div>

            <div className="w-10" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Recuperar Acceso
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Ingresa tu correo para recibir un código seguro de verificación.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-secondary)' }}>
                Correo Electrónico
              </label>
              <div className="relative group">
                <div 
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-4 rounded-xl border transition-all text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl flex items-center gap-3 text-sm"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.25)',
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
              className="w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group text-white shadow-lg"
              style={{
                backgroundColor: 'var(--primary)',
                boxShadow: '0 8px 24px rgba(45, 107, 255, 0.35)'
              }}
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

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            ¿Recordaste tu contraseña?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: 'var(--primary)' }}>
              Inicia Sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
