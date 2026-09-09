import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Cog, Store, ChevronRight, Mail, 
  Lock, ArrowLeft, CheckCircle, ShieldCheck 
} from 'lucide-react';
import { authService } from '../services/api';

const Register = ({ onLogin }) => {
  const [step, setStep] = useState(1); // 1: Role, 2: Person Type, 3: Form
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
    { id: 'client', label: 'Cliente', desc: 'Busco servicios técnicos para mi hogar', icon: <User size={24} /> },
    { id: 'tech', label: 'Técnico', desc: 'Ofrezco mis servicios especializados', icon: <Cog size={24} /> },
    { id: 'store', label: 'Tienda / Empresa', desc: 'Gestión de múltiples técnicos y ventas', icon: <Store size={24} /> },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.register(formData);
      const { token, ...user } = res.data.resultado;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060A] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#3B28FF]/5 blur-[150px] rounded-full"></div>
      
      <motion.div
        layout
        className="w-full max-w-2xl z-10"
      >
        <div className="glass-card p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                   <h2 className="text-4xl font-black tracking-tighter mb-2">Únete a <span className="text-[#3B28FF]">JyP</span></h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Paso 1 de 2: Selecciona tu rol</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => { setFormData({...formData, role: role.id}); setStep(2); }}
                      className="flex items-center gap-6 p-6 rounded-2xl bg-white/2 border border-white/5 hover:bg-[#3B28FF]/10 hover:border-[#3B28FF]/30 transition-all text-left group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#3B28FF] group-hover:text-white transition-all">
                        {role.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{role.label}</h4>
                        <p className="text-sm text-slate-500">{role.desc}</p>
                      </div>
                      <ChevronRight className="text-slate-700 group-hover:text-white transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-8"
              >
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
                >
                  <ArrowLeft size={14} /> Volver
                </button>

                <div className="text-center">
                   <h2 className="text-4xl font-black tracking-tighter mb-2">Crea tu <span className="text-[#3B28FF]">cuenta</span></h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Paso 2 de 2: Completa tus datos</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Persona</label>
                      <div className="flex gap-4">
                        {['natural', 'juridical'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, personType: type})}
                            className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all border ${
                              formData.personType === type 
                              ? 'bg-[#3B28FF] border-[#3B28FF] text-white' 
                              : 'bg-white/2 border-white/5 text-slate-500'
                            }`}
                          >
                            {type === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre de Usuario</label>
                       <input 
                        required 
                        type="text" 
                        placeholder="ej. jperry"
                        className="w-full bg-white/2 border border-white/5 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3B28FF] transition-all"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correo Electrónico</label>
                       <input 
                        required 
                        type="email" 
                        placeholder="correo@ejemplo.com"
                        className="w-full bg-white/2 border border-white/5 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3B28FF] transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                       />
                    </div>

                    {formData.personType === 'natural' ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombres</label>
                          <input required type="text" className="w-full bg-white/2 border border-white/5 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3B28FF]" value={formData.names} onChange={(e) => setFormData({...formData, names: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Apellidos</label>
                          <input required type="text" className="w-full bg-white/2 border border-white/5 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3B28FF]" value={formData.surnames} onChange={(e) => setFormData({...formData, surnames: e.target.value})} />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Razón Social</label>
                        <input required type="text" className="w-full bg-white/2 border border-white/5 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3B28FF]" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
                      </div>
                    )}

                    <div className="col-span-2 space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña</label>
                       <input 
                        required 
                        type="password" 
                        className="w-full bg-white/2 border border-white/5 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3B28FF]"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                       />
                    </div>
                  </div>

                  {error && <div className="text-rose-400 text-xs font-bold bg-rose-500/10 p-4 rounded-xl">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#3B28FF] py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#3B28FF]/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Finalizar Registro <CheckCircle size={16} /></>}
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
