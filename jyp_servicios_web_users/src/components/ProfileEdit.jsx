// Component for editing user profiles across all roles
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, 
  Camera, Shield, Bell, Save,
  LogOut, Star, Award, Zap
} from 'lucide-react';
import { authService } from '../services/api';

const ProfileEdit = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal'); // personal, professional, security

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      if (response.data.exito) {
        const fullUser = response.data.resultado;
        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(fullUser));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, we would call an updateProfile endpoint
      // await authService.updateProfile(user);
      localStorage.setItem('user', JSON.stringify(user));
      alert('Perfil actualizado localmente (Simulado)');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-dim font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 font-outfit">Mi <span className="gradient-text">Perfil</span></h1>
          <p className="text-text-secondary">Configura tu identidad y preferencias en la plataforma.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary px-8 py-4 flex items-center gap-2"
        >
          <Save size={18} />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Left Sidebar - Profile Summary */}
        <aside className="lg:col-span-1 space-y-6">
           <div className="glass-panel p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
              <div className="relative inline-block mb-6">
                 <div className="w-32 h-32 bg-primary/20 rounded-[40px] flex items-center justify-center text-primary font-black text-4xl shadow-2xl relative z-10">
                   {user.names?.[0]}
                 </div>
                 <button className="absolute -bottom-2 -right-2 bg-primary p-3 rounded-2xl text-white shadow-xl hover:scale-110 transition-all z-20">
                    <Camera size={20} />
                 </button>
                 <div className="absolute inset-0 bg-primary rounded-[40px] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              
              <h3 className="text-xl font-black text-white mb-1 font-outfit">{user.names} {user.surnames}</h3>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6">{user.role}</p>
              
              <div className="flex justify-center gap-4 py-4 border-y border-white/5">
                 <div className="text-center">
                    <p className="text-lg font-black text-white">4.9</p>
                    <p className="text-[10px] text-text-dim uppercase font-black">Rating</p>
                 </div>
                 <div className="w-px h-8 bg-white/5" />
                 <div className="text-center">
                    <p className="text-lg font-black text-white">124</p>
                    <p className="text-[10px] text-text-dim uppercase font-black">Servicios</p>
                 </div>
              </div>

              <button className="mt-8 flex items-center justify-center gap-2 text-error text-xs font-black uppercase tracking-widest hover:bg-error/10 w-full py-4 rounded-xl transition-all">
                 <LogOut size={16} />
                 Cerrar Sesión
              </button>
           </div>

           <nav className="glass-panel p-4 space-y-2">
              {[
                { id: 'personal', label: 'Datos Personales', icon: User },
                { id: 'professional', label: 'Información Profesional', icon: MapPin },
                { id: 'security', label: 'Seguridad y Cuenta', icon: Shield },
                { id: 'notifications', label: 'Notificaciones', icon: Bell },
              ].map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-dim hover:text-white hover:bg-white/5'}`}
                 >
                    <tab.icon size={20} />
                    <span className="font-bold text-sm">{tab.label}</span>
                 </button>
              ))}
           </nav>
        </aside>

        {/* Main Content - Form */}
        <div className="lg:col-span-3">
           <div className="glass-panel p-10 min-h-[600px]">
              <AnimatePresence mode="wait">
                 {activeTab === 'personal' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                       <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                             <User size={24} />
                          </div>
                          <div>
                             <h2 className="text-xl font-black text-white font-outfit">Datos Personales</h2>
                             <p className="text-text-dim text-xs">Información básica de tu perfil.</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Nombre(s)</label>
                             <input 
                              type="text" 
                              className="input-field w-full"
                              value={user.names || ''}
                              onChange={(e) => setUser({...user, names: e.target.value})}
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Apellido(s)</label>
                             <input 
                              type="text" 
                              className="input-field w-full"
                              value={user.surnames || ''}
                              onChange={(e) => setUser({...user, surnames: e.target.value})}
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Correo Electrónico</label>
                             <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                                <input 
                                  type="email" 
                                  disabled
                                  className="input-field w-full pl-12 opacity-50 cursor-not-allowed"
                                  value={user.email || ''}
                                />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Número de celular</label>
                             <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
                                <input 
                                  type="tel" 
                                  className="input-field w-full pl-12"
                                  value={user.phone || ''}
                                  onChange={(e) => setUser({...user, phone: e.target.value})}
                                />
                             </div>
                          </div>
                       </div>
                    </motion.div>
                 )}

                 {activeTab === 'professional' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                       <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                             <MapPin size={24} />
                          </div>
                          <div>
                             <h2 className="text-xl font-black text-white font-outfit">Información Profesional</h2>
                             <p className="text-text-dim text-xs">Detalles de ubicación y servicios.</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Ciudad / Región</label>
                             <select className="input-field w-full">
                                <option>Lima</option>
                                <option>Arequipa</option>
                                <option>Trujillo</option>
                                <option>Cusco</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Dirección de Referencia</label>
                             <input 
                              type="text" 
                              className="input-field w-full"
                              value={user.address || ''}
                              onChange={(e) => setUser({...user, address: e.target.value})}
                             />
                          </div>
                          {user.role === 'tech' && (
                             <div className="md:col-span-2 p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                                <Award size={24} className="text-primary mt-1 shrink-0" />
                                <div>
                                   <p className="text-sm font-bold text-white mb-2">Perfil de Especialista Verificado</p>
                                   <p className="text-xs text-text-secondary leading-relaxed">
                                      Tu perfil muestra la insignia de verificación <span className="text-primary font-black uppercase">JYPSERV</span>. Esto garantiza la confianza de los clientes en tus servicios técnicos.
                                   </p>
                                </div>
                             </div>
                          )}
                       </div>
                    </motion.div>
                 )}
              </AnimatePresence>

              {/* Security Hint */}
              <div className="mt-16 p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between">
                 <div className="flex items-center gap-4 text-text-dim">
                    <Shield size={20} className="text-primary" />
                    <p className="text-xs font-bold italic">Configura tu autenticación de dos factores para mayor seguridad.</p>
                 </div>
                 <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Activar Ahora</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
