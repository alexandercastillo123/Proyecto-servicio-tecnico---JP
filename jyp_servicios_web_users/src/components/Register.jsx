import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Cog, Store, ChevronRight, Mail, 
  Lock, ArrowLeft, CheckCircle2, ShieldCheck, Cpu, Wrench, Eye, EyeOff, Sun, Moon,
  Building2, Sparkles, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [step, setStep] = useState(1); // 1: Role, 2: Form
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'client',
    personType: 'natural',
    names: '',
    surnames: '',
    companyName: '',
    dni: '',
    ruc: '',
    city: 'Lima'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { 
      id: 'client', 
      label: 'Cliente', 
      desc: 'Solicito soporte para laptops, computadoras o servidores', 
      icon: User,
      badge: "Usuario Final"
    },
    { 
      id: 'tech', 
      label: 'Técnico Especialista', 
      desc: 'Ofrezco servicios técnicos verificados en Lima', 
      icon: Wrench,
      badge: "Profesional"
    },
    { 
      id: 'store', 
      label: 'Tienda / Taller Autorizado', 
      desc: 'Gestiono sucursales, repuestos e inventario', 
      icon: Store,
      badge: "Empresa"
    },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.register(formData);
      const { token, ...rawUser } = res.data.resultado;
      const user = { ...rawUser, id: rawUser.id || rawUser.userId, userId: rawUser.userId || rawUser.id };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || 'Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Inter',sans-serif" }}
    >
      {/* Background Glows */}
      <div 
        className="fixed -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none" 
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', filter: 'blur(90px)' }} 
      />
      <div 
        className="fixed -bottom-32 -right-32 w-96 h-96 rounded-full pointer-events-none" 
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)', filter: 'blur(90px)' }} 
      />

      {/* Theme toggle */}
      <button 
        onClick={toggleTheme} 
        className="theme-toggle fixed top-5 right-5 z-40 shadow-lg"
        title="Cambiar tema"
      >
        {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-blue-500" />}
      </button>

      <motion.div
        layout
        className="w-full max-w-xl z-10 my-8"
      >
        <div 
          className="glass-card p-6 sm:p-8 md:p-10 rounded-3xl relative"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
        >
          {/* Header Brand */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
              >
                <Cpu size={20} className="text-white" strokeWidth={2.3} />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: 'var(--text-primary)' }}>
                  JyP Servicios Técnicos
                </span>
                <span className="text-[10px] font-bold text-blue-500 block uppercase tracking-wider">
                  Registro de Nueva Cuenta
                </span>
              </div>
            </div>

            <Link
              to="/login"
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              ¿Ya tienes cuenta? <span className="text-blue-500 underline ml-0.5">Ingresar</span>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Sparkles size={11} /> Paso 1 de 2
                  </div>
                  <h2 
                    className="text-2xl sm:text-3xl font-black tracking-tight"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                  >
                    ¿Cómo usarás JyP?
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Elige el perfil que mejor se adapte a tus necesidades.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 pt-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => { setFormData({...formData, role: role.id}); setStep(2); }}
                        className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 group hover:translate-x-1"
                        style={{
                          background: 'var(--bg-input)',
                          borderColor: 'var(--border)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary-light)';
                          e.currentTarget.style.background = 'rgba(37,99,235,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.background = 'var(--bg-input)';
                        }}
                      >
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                          style={{ background: 'rgba(37,99,235,0.15)', color: '#38BDF8', border: '1px solid rgba(37,99,235,0.3)' }}
                        >
                          <Icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-white">{role.label}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {role.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{role.desc}</p>
                        </div>
                        <ChevronRight className="text-slate-500 group-hover:text-blue-400 transition-colors" size={18} />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                  >
                    <ArrowLeft size={14} /> Cambiar Perfil
                  </button>
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                    Paso 2 de 2: Información
                  </span>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Person type selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Tipo de Registro
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'natural', label: 'Persona Natural' },
                        { type: 'juridical', label: 'Empresa / Jurídica' }
                      ].map(({ type, label }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({...formData, personType: type})}
                          className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border ${
                            formData.personType === type 
                              ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                              : 'bg-white/3 border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Two column inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Usuario
                      </label>
                      <input 
                        required 
                        type="text" 
                        placeholder="ej. jperez"
                        className="input-field"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Correo Electrónico
                      </label>
                      <input 
                        required 
                        type="email" 
                        placeholder="correo@ejemplo.com"
                        className="input-field"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>

                    {formData.personType === 'natural' ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Nombres
                          </label>
                          <input 
                            required 
                            type="text" 
                            placeholder="Juan Carlos"
                            className="input-field" 
                            value={formData.names} 
                            onChange={(e) => setFormData({...formData, names: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Apellidos
                          </label>
                          <input 
                            required 
                            type="text" 
                            placeholder="Pérez García"
                            className="input-field" 
                            value={formData.surnames} 
                            onChange={(e) => setFormData({...formData, surnames: e.target.value})} 
                          />
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Razón Social / Nombre Comercial
                        </label>
                        <input 
                          required 
                          type="text" 
                          placeholder="Servicios Técnicos JyP S.A.C."
                          className="input-field" 
                          value={formData.companyName} 
                          onChange={(e) => setFormData({...formData, companyName: e.target.value})} 
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input 
                          required 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Mínimo 6 caracteres"
                          className="input-field"
                          style={{ paddingRight: 44 }}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full mt-4"
                    style={{ height: 50, borderRadius: 14 }}
                  >
                    {loading ? (
                      <div className="spinner" />
                    ) : (
                      <>
                        Crear Cuenta y Comenzar
                        <CheckCircle2 size={18} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
