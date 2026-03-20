import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Phone, Mail, Store as StoreIcon, Save, X, Layers, ChevronRight } from 'lucide-react';
import { adminService, storeService } from './services/api';

const StoreManagement = () => {
  const [stores, setStores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: 'Lima',
    state: 'Lima',
    zip_code: '15001',
    country: 'Perú',
    phone: '',
    email: '',
    opening_time: '09:00:00',
    closing_time: '18:00:00',
    admin_email: '',
    admin_password: ''
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await adminService.getBranches();
      setStores(res.data.resultado || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await storeService.createBranch(formData);
      setShowForm(false);
      fetchStores();
      // Reset form
      setFormData({
        name: '', description: '', address: '', city: 'Lima', state: 'Lima', zip_code: '15001',
        country: 'Perú', phone: '', email: '', opening_time: '09:00:00', closing_time: '18:00:00',
        admin_email: '', admin_password: ''
      });
    } catch (err) {
      alert('Error: ' + (err.response?.data?.mensaje || err.message));
    }
  };

  if (loading) return (
    <div className="p-12 text-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando Sedes...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-500 font-black text-[10px] uppercase tracking-[0.2em]">
            <Layers size={14} /> Infraestructura
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
            Gestión de <span className="text-blue-600">Sucursales</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3 max-w-xl">Administra los puntos de atención física y coordina la logística operativa de JyP.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary shadow-blue-500/20"
        >
          {showForm ? <><X size={20} /> Cancelar Registro</> : <><Plus size={20} /> Nueva Sucursal</>}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <div className="glass-card p-10 bg-gradient-to-br from-white to-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                  <Plus size={20} />
                </div>
                Registrar Nuevo Punto de Venta
              </h2>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 border-b border-blue-100 pb-2">Información Básica</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre Comercial</label>
                    <input 
                      required
                      className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ej: JyP Wilson - Centro"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción Corta</label>
                    <textarea 
                      className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm h-32 resize-none"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Pequeña reseña de la ubicación o servicios..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 border-b border-indigo-100 pb-2">Credenciales de Acceso</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Corporativo (Login)</label>
                    <input 
                      required
                      type="email"
                      className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm"
                      value={formData.admin_email}
                      onChange={e => setFormData({...formData, admin_email: e.target.value})}
                      placeholder="sucursal_norte@jyp.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña Temporal</label>
                    <input 
                      required
                      type="password"
                      className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm"
                      value={formData.admin_password}
                      onChange={e => setFormData({...formData, admin_password: e.target.value})}
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                      💡 Estas credenciales permitirán a la sucursal gestionar sus propios pedidos, chats y productos desde la App Móvil.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b border-emerald-100 pb-2">Ubicación y Contacto</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dirección Física</label>
                    <input 
                      required
                      className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      placeholder="Av. Wilson 1234, Lima"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ciudad</label>
                      <input 
                        required
                        className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
                      <input 
                        required
                        className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 shadow-sm"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
                  >
                    Finalizar y Activar Sucursal
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {stores.map((store, i) => (
          <motion.div 
            key={store.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -10 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-blue-600 rounded-[40px] opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500"></div>
            <div className="glass-card h-full flex flex-col overflow-hidden relative z-10 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group-hover:border-blue-200">
               <div className="p-2">
                 <div className="bg-slate-50/50 rounded-[28px] p-8 relative overflow-hidden group-hover:bg-blue-50/30 transition-colors duration-500">
                    <div className="absolute top-0 right-0 p-6">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${store.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    </div>
                    
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-slate-200/50">
                      <StoreIcon size={32} strokeWidth={2.5} />
                    </div>
                    
                    <h3 className="font-black text-2xl text-slate-900 mb-2 tracking-tight line-clamp-1">{store.name}</h3>
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-3">
                      <MapPin size={12} /> {store.city}
                    </div>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3 h-12">
                      {store.description || 'Esta sucursal es un punto clave para las operaciones técnicas de JyP en esta región del país.'}
                    </p>
                 </div>
               </div>

               <div className="p-8 space-y-5 flex-1 flex flex-col">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <Phone size={14} />
                       </div>
                       {store.phone}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <Mail size={14} />
                       </div>
                       <span className="line-clamp-1">{store.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <MapPin size={14} />
                       </div>
                       <span className="line-clamp-1">{store.address}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Digital ID</p>
                      <span className="font-mono text-xs font-bold text-slate-400">#ST-{store.id}00</span>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-500">
                      <ChevronRight size={20} strokeWidth={3} />
                    </button>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default StoreManagement;
