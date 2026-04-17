import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        // Enviar a verificación con el email en el state para recordarlo
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
    <div className="min-h-screen bg-[#05060A] flex items-center justify-center p-6 font-outfit">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3B28FF]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3B28FF]/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <Link to="/login" className="text-[#3B28FF] hover:bg-[#3B28FF]/10 p-2 rounded-xl transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <img src="/assets/logo.png" alt="JyP Logo" className="h-10 object-contain" />
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Recuperar Acceso</h1>
            <p className="text-slate-400">Ingresa tu correo para recibir un código de verificación.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#3B28FF] transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B28FF]/50 focus:border-[#3B28FF] transition-all"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#3B28FF] hover:bg-[#1E0ED6] disabled:opacity-50 text-white font-black rounded-2xl shadow-[0_8px_30px_rgb(59,40,255,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enviar Código
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            ¿Recordaste tu contraseña? <Link to="/login" className="text-[#3B28FF] font-bold hover:underline">Inicia Sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
