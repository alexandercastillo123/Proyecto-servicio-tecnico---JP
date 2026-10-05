import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, RefreshCw, Eye, EyeOff, AlertCircle, CheckCircle, Cpu, Sun, Moon } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const { email, code } = location.state || {};

  useEffect(() => {
    if (!email || !code) {
      navigate('/forgot-password');
    }
  }, [email, code, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.resetPassword(email, code, password);
      if (response.success) {
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(response.message || 'Error al actualizar la contraseña');
      }
    } catch (err) {
      setError('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md p-10 text-center rounded-2xl border shadow-2xl backdrop-blur-xl"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border)' 
          }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ 
              backgroundColor: 'rgba(0, 229, 160, 0.15)', 
              color: 'var(--secondary)' 
            }}
          >
            <CheckCircle size={44} />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ color: 'var(--text-primary)' }}>¡Actualizada!</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            Tu contraseña ha sido actualizada con éxito. Serás redirigido al inicio de sesión en unos segundos.
          </p>
          <Link 
            to="/login" 
            className="inline-block px-8 py-3.5 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Ir al Login
          </Link>
        </motion.div>
      </div>
    );
  }

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
              to="/verify-code" 
              state={{ email }} 
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
              Nueva Contraseña
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Protege tu cuenta creando una nueva contraseña segura.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-secondary)' }}>
                Nueva Contraseña
              </label>
              <div className="relative group">
                <div 
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-11 rounded-xl border transition-all text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-secondary)' }}>
                Confirmar Contraseña
              </label>
              <div className="relative group">
                <div 
                  className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-3.5 pl-11 pr-11 rounded-xl border transition-all text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="••••••••"
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
              disabled={isLoading || !password || password !== confirmPassword}
              className="w-full py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group text-white shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: 'var(--primary)',
                boxShadow: '0 8px 24px rgba(45, 107, 255, 0.35)'
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Actualizar Contraseña</span>
                  <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
