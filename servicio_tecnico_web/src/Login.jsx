import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { authService } from './services/api';

const Login = ({ onLogin }) => {
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

      if (user.role !== 'admin') {
        throw new Error('Acceso denegado. Se requiere rol de administrador.');
      }

      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#3B28FF]/10 blur-[160px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#3B28FF]/5 blur-[160px] rounded-full"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full"></div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-card p-12 bg-white/5 border-white/5 backdrop-blur-3xl shadow-[0_32px_120px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/95 p-5 rounded-[2.5rem] shadow-2xl mb-8 ring-4 ring-white/5"
            >
              <img src="/assets/logo.png" alt="JyP Logo" className="w-20 h-20 object-contain" />
            </motion.div>

            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-black text-white tracking-tighter leading-tight">
                <span className="text-primary">Inicio de Sesión</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <ShieldCheck size={14} className="text-primary" />
                <p className="font-bold text-[13px] uppercase tracking-[0.2em]">Acceso Administrador</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="text-slate-600 group-focus-within:text-primary transition-colors" size={20} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-white/2 border border-white/5 pl-14 pr-6 py-5 rounded-[1.5rem] text-white outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/5 focus:border-primary/30 transition-all font-medium placeholder:text-slate-700 text-lg shadow-inner"
                  placeholder="nombre@jyp.com.pe"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1">Contraseña de Seguridad</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="text-slate-600 group-focus-within:text-primary transition-colors" size={20} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full bg-white/2 border border-white/5 pl-14 pr-6 py-5 rounded-[1.5rem] text-white outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/5 focus:border-primary/30 transition-all font-medium placeholder:text-slate-700 text-lg shadow-inner"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-5 rounded-[1.5rem] text-sm font-bold flex items-center gap-4"
              >
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-black uppercase tracking-[0.3em] text-[13px] py-6 rounded-[1.5rem] shadow-2xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-500 active:scale-[0.97] hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Iniciar Sesión Segura
                  <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em]">
              Servicio Técnico J&P &copy; {new Date().getFullYear()} &bull; Cloud Security
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
