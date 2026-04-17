import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Check, AlertCircle, Info } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

const VerifyCode = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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
            <Link to="/forgot-password" className="text-[#3B28FF] hover:bg-[#3B28FF]/10 p-2 rounded-xl transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <img src="/assets/logo.png" alt="JyP Logo" className="h-10 object-contain" />
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <Info size={24} />
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Verificación</h1>
            <p className="text-slate-400">Hemos enviado un código a <span className="text-[#3B28FF] font-bold">{email}</span></p>
          </div>

          {showInfo && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 bg-[#3B28FF]/10 border border-[#3B28FF]/20 p-4 rounded-2xl text-sm text-slate-300 leading-relaxed"
            >
              El código de verificación se envía para proteger tu identidad y evitar accesos no autorizados. Si no lo recibes, revisa tu carpeta de SPAM.
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-center block">Ingresa el Código</label>
              <input
                type="text"
                maxLength="6"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 text-center text-4xl font-black text-[#3B28FF] tracking-[1rem] focus:outline-none focus:ring-2 focus:ring-[#3B28FF]/50 focus:border-[#3B28FF] transition-all placeholder:text-slate-800"
                placeholder="000000"
                required
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="w-full py-4 bg-[#3B28FF] hover:bg-[#1E0ED6] disabled:opacity-50 text-white font-black rounded-2xl shadow-[0_8px_30px_rgb(59,40,255,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Validar Código
                  <ShieldCheck size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            ¿No recibiste el código? <button className="text-[#3B28FF] font-bold hover:underline">Reenviar</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyCode;
