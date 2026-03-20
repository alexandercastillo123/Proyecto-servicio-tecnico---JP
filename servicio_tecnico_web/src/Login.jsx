import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-10 bg-white/5 border-white/10 backdrop-blur-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-white p-4 rounded-3xl shadow-xl mb-6 ring-1 ring-white/20">
              <img src="/assets/logo.png" alt="JyP Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter text-center">
              Panel de <span className="text-blue-500">Administración</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2 text-sm text-center">Gestiona el ecosistema de JyP</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-slate-600" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium placeholder:text-slate-600"
                  placeholder="admin@jyp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña de Seguridad</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-600" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-white/5 border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all font-medium placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold text-center flex items-center gap-3"
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-black uppercase tracking-widest text-sm p-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:shadow-blue-500/40 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><LogIn size={18} /> Iniciar Sesión Segura</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">
              Sistemas de Servicio Técnico JyP © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
