import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, AlertCircle, Info, Cpu, Sun, Moon } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const VerifyCode = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyCode(email, code);
      if (response.success) {
        navigate('/reset-password', { state: { email, code } });
      } else {
        setError(response.message || 'Código inválido o expirado');
      }
    } catch (err) {
      setError('Error al validar el código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      {/* Background Decorative Glows */}
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
              to="/forgot-password" 
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

            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="p-2.5 rounded-xl border transition-colors"
              style={{ 
                backgroundColor: 'var(--bg)', 
                borderColor: 'var(--border)',
                color: showInfo ? 'var(--primary)' : 'var(--text-secondary)' 
              }}
            >
              <Info size={20} />
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-black mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Verificación
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Hemos enviado un código a <span className="font-bold" style={{ color: 'var(--primary)' }}>{email}</span>
            </p>
          </div>

          {showInfo && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl text-xs leading-relaxed border"
              style={{
                backgroundColor: 'rgba(45, 107, 255, 0.08)',
                borderColor: 'rgba(45, 107, 255, 0.25)',
                color: 'var(--text-secondary)'
              }}
            >
              El código de verificación se envía para proteger tu identidad y evitar accesos no autorizados. Si no lo recibes en tu bandeja principal, revisa tu carpeta de SPAM.
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-center block" style={{ color: 'var(--text-secondary)' }}>
                Ingresa el Código de 6 Dígitos
              </label>
              <input
                type="text"
                maxLength="6"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full py-5 text-center text-3xl font-black tracking-[0.8rem] rounded-xl border outline-none transition-all"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--primary)'
                }}
                placeholder="••••••"
                required
              />
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
              disabled={isLoading || code.length < 6}
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
                  <span>Validar Código</span>
                  <ShieldCheck size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            ¿No recibiste el código?{' '}
            <button 
              type="button" 
              onClick={() => alert('Si el correo existe, el código fue reenviado')}
              className="font-bold hover:underline" 
              style={{ color: 'var(--primary)' }}
            >
              Reenviar
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyCode;
