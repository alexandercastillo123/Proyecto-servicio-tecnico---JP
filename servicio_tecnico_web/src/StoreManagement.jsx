import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Phone, Store as StoreIcon, X, Layers, ChevronRight, Globe, Mail, Lock, ShieldCheck } from 'lucide-react';
import { adminService, storeService } from './services/api';
import StoreDetail from './StoreDetail';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const LocationPicker = ({ position, onSelect }) => {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      onSelect(lat, lng);

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          onSelect(lat, lng, data.display_name);
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err);
      }
    },
  });
  return position ? <Marker position={position} /> : null;
};

const StoreManagement = ({ user }) => {
  const { id: selectedId } = useParams();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const emptyForm = {
    name: '', description: '', address: '', city: 'Lima', state: 'Lima',
    zip_code: '15001', country: 'Perú', phone: '', email: '',
    opening_time: '09:00:00', closing_time: '18:00:00',
    admin_email: '', admin_password: '',
    image_url: '',
    latitude: -12.046374, longitude: -77.042793 // Default Lima
  };
  const [formData, setFormData] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    try { const r = await adminService.getBranches(); setStores(r.data.resultado || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await storeService.createBranch(formData);
      setShowForm(false); setFormData(emptyForm); fetchStores();
    } catch (err) { alert('Error: ' + (err.response?.data?.mensaje || err.message)); }
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await storeService.uploadStoreImage(fd);
      if (res.data.resultado?.url) setFormData(p => ({ ...p, image_url: res.data.resultado.url }));
    } catch (err) { alert('Error al subir imagen: ' + (err.response?.data?.mensaje || err.message)); }
    finally { setUploading(false); }
  };
  const f = (k) => ({ value: formData[k], onChange: e => setFormData(p => ({ ...p, [k]: e.target.value })) });

  const handleAddressBlur = async () => {
    if (!formData.address) return;
    try {
      const q = encodeURIComponent(`${formData.address}, ${formData.city || ''}, ${formData.country || ''}`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setFormData(p => ({ 
          ...p, 
          latitude: parseFloat(data[0].lat), 
          longitude: parseFloat(data[0].lon) 
        }));
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  if (loading) return (
    <div className="p-12 text-center text-muted text-xs font-black uppercase tracking-[0.4em]">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-2xl shadow-primary/20" />
      Sincronizando Ecosistema...
    </div>
  );

  if (selectedId) return <StoreDetail storeId={selectedId} user={user} onBack={() => navigate('/sucursales')} />;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-primary font-black text-[11px] uppercase tracking-[0.3em]">
            <Layers size={16} /> Arquitectura de Red
          </div>
          <h1 className="text-6xl font-black tracking-tighter leading-none text-slate-900 dark:text-white">
            Nuestras <span className="text-primary italic">Sucursales</span>
          </h1>
          <p className="text-muted font-semibold text-lg max-w-2xl">Gestión avanzada de puntos de atención y centros logísticos J&P.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`btn-primary !px-8 !py-5 !rounded-2xl ${showForm ? '!bg-rose-500 hover:!bg-rose-600' : ''}`}>
          {showForm ? <><X size={20} /> Cancelar Registro</> : <><Plus size={20} /> Expandir Red J&P</>}
        </button>
      </header>

      {/* Formulario nueva sucursal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="overflow-hidden">
            <div className="glass-card !p-12 border-white/40 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <StoreIcon size={240} />
              </div>

              <h2 className="text-3xl font-black mb-12 flex items-center gap-4 text-slate-800 dark:text-white">
                <Plus size={28} className="text-primary" /> Configurar Nueva Unidad
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                <div className="lg:col-span-4 space-y-8">
                  <SectionLabel color="primary" icon={<ShieldCheck size={14}/>}>Credenciales & Acceso</SectionLabel>
                  <div className="space-y-6">
                    <Field label="Nombre Comercial" required icon={<StoreIcon size={16}/>} {...f('name')} />
                    <Field label="Email Operativo" type="email" required icon={<Mail size={16}/>} {...f('email')} />
                    <Field label="Email Administrador" type="email" required icon={<ShieldCheck size={16}/>} {...f('admin_email')} />
                    <Field label="Clave de Seguridad" type="password" required icon={<Lock size={16}/>} {...f('admin_password')} />
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <SectionLabel color="indigo" icon={<MapPin size={14}/>}>Localización Física</SectionLabel>
                  <div className="space-y-6">
                    <Field label="Dirección Exacta" required icon={<MapPin size={16}/>} {...f('address')} onBlur={handleAddressBlur} />
                    <Field label="Ciudad Base" required icon={<Globe size={16}/>} {...f('city')} />
                    <Field label="Línea de Contacto" required icon={<Phone size={16}/>} {...f('phone')} />
                  </div>
                  
                  <div className="pt-4">
                    <SectionLabel color="rose" icon={<Globe size={14}/>}>Geolocalización</SectionLabel>
                    <div className="mt-6 h-56 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-xl">
                      <MapContainer center={[formData.latitude, formData.longitude]} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationPicker
                          position={[formData.latitude, formData.longitude]}
                          onSelect={(lat, lng, addr) => {
                            setFormData(p => ({
                              ...p,
                              latitude: lat,
                              longitude: lng,
                              address: addr || p.address
                            }));
                          }}
                        />
                      </MapContainer>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                  <SectionLabel color="emerald" icon={<Layers size={14}/>}>Branding & Multimedia</SectionLabel>
                  <div className="group relative">
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em]">Identidad Visual</label>
                    <div className="flex gap-6 items-center">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-primary transition-colors">
                        {formData.image_url 
                          ? <img src={`/uploads/${formData.image_url}`} className="w-full h-full object-cover" alt="Preview" /> 
                          : <StoreIcon className="text-slate-300" size={40} />
                        }
                      </div>
                      <div className="flex-1 space-y-3">
                        <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="simg" />
                        <label htmlFor="simg" className="flex items-center justify-center w-full py-4 rounded-2xl bg-primary/5 text-primary text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-primary hover:text-white transition-all border border-primary/20 shadow-sm">
                          {uploading ? 'Procesando...' : 'Cargar Logo'}
                        </label>
                        <p className="text-[10px] text-muted font-bold text-center italic">Alta resolución (PNG/JPG)</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10">
                    <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 mb-8">
                      <p className="text-[11px] text-primary font-black leading-relaxed uppercase tracking-wider">
                        🚀 La unidad quedará activa inmediatamente para recibir órdenes a través del ecosistema móvil.
                      </p>
                    </div>
                    <button type="submit" className="w-full bg-slate-900 dark:bg-primary text-white p-5 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Sincronizar y Desplegar
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grilla de sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {stores.map((store, i) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            onClick={() => navigate(`/sucursales/${store.id}`)}
            className="glass-card !p-0 overflow-hidden cursor-pointer group hover:shadow-3xl hover:-translate-y-3 transition-all duration-500 border-white/30"
          >
            {/* Imagen portada */}
            <div className="h-56 bg-slate-100 dark:bg-slate-800/80 relative overflow-hidden flex items-center justify-center">
              {store.image_url
                ? <img src={`/uploads/${store.image_url}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={store.name} />
                : <StoreIcon size={64} className="text-slate-200 dark:text-slate-700 group-hover:rotate-12 transition-transform duration-500" />
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <div className={`w-2 h-2 rounded-full ${store.status === 'active' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,113,0.8)]'}`} />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">{store.status === 'active' ? 'Operativo' : 'Inactivo'}</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-9 flex-1 flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white group-hover:text-primary transition-colors">{store.name}</h3>
                <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mt-2">#ST-{store.id}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><MapPin size={14} /></div>
                  <span className="truncate">{store.address}, {store.city}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><Phone size={14} /></div>
                  <span>{store.phone}</span>
                </div>
              </div>

              <div className="pt-6 mt-auto flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsable Administrativo</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{store.email}</span>
                </div>
                <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:translate-x-1 transition-all duration-500 shadow-sm">
                  <ChevronRight size={22} strokeWidth={3} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {stores.length === 0 && !showForm && (
        <div className="py-32 text-center glass-card border-dashed border-primary/20 !rounded-[3rem]">
          <StoreIcon size={64} className="text-primary/10 mx-auto mb-8 animate-pulse" />
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Red Desconectada</h3>
          <p className="text-muted font-semibold">Inicia la expansión registrando tu primera sucursal técnica.</p>
        </div>
      )}
    </motion.div>
  );
};

const Field = ({ label, type = 'text', required, value, onChange, icon }) => (
  <div className="space-y-2">
    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary transition-colors">
        {icon}
      </div>
      <input
        type={type} required={required} value={value} onChange={onChange}
        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 pl-11 pr-4 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-bold text-sm transition-all shadow-sm"
      />
    </div>
  </div>
);

const SectionLabel = ({ children, color, icon }) => {
  const colors = {
    primary: 'text-primary border-primary/10',
    indigo: 'text-indigo-500 border-indigo-100 dark:border-indigo-500/20',
    rose: 'text-rose-500 border-rose-100 dark:border-rose-500/20',
    emerald: 'text-emerald-500 border-emerald-100 dark:border-emerald-500/20',
  };
  return (
    <h4 className={`text-[12px] font-black uppercase tracking-[0.3em] flex items-center gap-3 pb-3 border-b ${colors[color] || 'text-slate-400 border-slate-100'}`}>
      <span className="opacity-70">{icon}</span> {children}
    </h4>
  );
};

export default StoreManagement;
