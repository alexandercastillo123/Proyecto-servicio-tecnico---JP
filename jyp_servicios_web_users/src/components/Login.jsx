import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { authService } from '../services/api';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authService.login(email, password);
      const { token, ...user } = res.data.resultado;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#3B28FF]/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3B28FF]/5 blur-[150px] rounded-full"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg z-10"
      >
        <div className="glass-card p-12">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="bg-white p-4 rounded-[2rem] shadow-2xl mb-6"
            >
              <img src="/assets/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
            </motion.div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">Bienvenido a <span className="text-[#3B28FF]">JyP</span></h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Portal de Servicios Técnicos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#3B28FF] transition-colors" size={20} />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-white/2 border border-white/5 pl-14 pr-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-[#3B28FF]/50 focus:bg-white/5 transition-all text-lg font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#3B28FF] transition-colors" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/2 border border-white/5 pl-14 pr-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-[#3B28FF]/50 focus:bg-white/5 transition-all text-lg font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end mt-2">
                <span onClick={() => navigate('/forgot-password')} className="text-[11px] text-[#3B28FF] font-black uppercase tracking-widest cursor-pointer hover:underline">
                  ¿Olvidaste tu contraseña?
                </span>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3"
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3B28FF] py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_-10px_rgba(59,40,255,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(59,40,255,0.5)] transition-all duration-300 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Ingresar al Portal <LogIn size={18} /></>}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-white/5">
            <p className="text-slate-500 text-sm font-medium">
              ¿No tienes una cuenta? <span onClick={() => navigate('/register')} className="text-[#3B28FF] font-black cursor-pointer hover:underline">Regístrate aquí</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
