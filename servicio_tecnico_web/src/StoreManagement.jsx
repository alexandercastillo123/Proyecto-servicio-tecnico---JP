import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Phone, Store as StoreIcon, X, Layers, ChevronRight } from 'lucide-react';
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

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const StoreManagement = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [stores, setStores]   = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading]  = useState(true);

  const emptyForm = {
    name:'', description:'', address:'', city:'Lima', state:'Lima',
    zip_code:'15001', country:'Perú', phone:'', email:'',
    opening_time:'09:00:00', closing_time:'18:00:00',
    admin_email:'', admin_password:'',
    latitude: -12.046374, longitude: -77.042793 // Default Lima
  };
  const [formData, setFormData] = useState(emptyForm);

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

  const f = (k) => ({ value: formData[k], onChange: e => setFormData(p => ({...p, [k]: e.target.value})) });

  if (loading) return (
    <div className="p-12 text-center text-muted text-xs font-black uppercase tracking-widest">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
      Sincronizando...
    </div>
  );

  // Vista de detalle de sucursal
  if (selectedId) return <StoreDetail storeId={selectedId} onBack={() => setSelectedId(null)} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-500 font-black text-[10px] uppercase tracking-[0.2em]">
            <Layers size={14}/> Infraestructura
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-none">
            Gestión de <span className="text-blue-600">Sucursales</span>
          </h1>
          <p className="text-muted font-medium mt-3">Administra los puntos de atención física de J&P.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><X size={18}/> Cancelar</> : <><Plus size={18}/> Nueva Sucursal</>}
        </button>
      </header>

      {/* Formulario nueva sucursal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden mb-10">
            <div className="glass-card p-10">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                <Plus size={22} className="text-blue-600"/> Registrar Sucursal
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <SectionLabel color="blue">Datos básicos</SectionLabel>
                  <Field label="Nombre" required {...f('name')} />
                  <Field label="Email de contacto" type="email" required {...f('email')} />
                  <Field label="Email admin" type="email" required {...f('admin_email')} />
                  <Field label="Contraseña" type="password" required {...f('admin_password')} />
                </div>
                <div className="space-y-4">
                  <SectionLabel color="indigo">Ubicación</SectionLabel>
                  <Field label="Dirección" required {...f('address')} />
                  <Field label="Ciudad" required {...f('city')} />
                  <Field label="Teléfono" required {...f('phone')} />
                </div>
                <div className="space-y-4">
                  <SectionLabel color="rose">Ubicación Exacta (Mapa)</SectionLabel>
                  <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-600">
                    <MapContainer center={[formData.latitude, formData.longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker 
                        position={[formData.latitude, formData.longitude]} 
                        setPosition={(pos) => setFormData(p => ({...p, latitude: pos[0], longitude: pos[1]}))} 
                      />
                    </MapContainer>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase text-muted">Latitud</label>
                      <input readOnly value={formData.latitude.toFixed(6)} className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase text-muted">Longitud</label>
                      <input readOnly value={formData.longitude.toFixed(6)} className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 mb-6">
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold leading-relaxed">
                      💡 El usuario de la sucursal gestionará sus propios productos y pedidos desde la app móvil.
                    </p>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:opacity-90 transition-all">
                    Confirmar y Activar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grilla de sucursales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store, i) => (
          <motion.div
            key={store.id}
            initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}
            onClick={() => setSelectedId(store.id)}
            className="glass-card overflow-hidden cursor-pointer group hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col"
          >
            {/* Imagen portada */}
            <div className="h-44 bg-slate-100 dark:bg-slate-700 relative overflow-hidden flex items-center justify-center">
              {store.image_url
                ? <img src={`/api/${store.image_url}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={store.name}/>
                : <StoreIcon size={44} className="text-slate-200 dark:text-slate-600 group-hover:scale-110 transition-transform"/>
              }
              <div className={`absolute top-4 left-4 w-2.5 h-2.5 rounded-full ${store.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} ring-2 ring-white`}/>
            </div>

            {/* Info */}
            <div className="p-7 flex-1 flex flex-col">
              <h3 className="text-xl font-black tracking-tight mb-3">{store.name}</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-muted">
                  <MapPin size={13} className="text-blue-500 flex-shrink-0"/> {store.address}, {store.city}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted">
                  <Phone size={13} className="text-blue-500 flex-shrink-0"/> {store.phone}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted">
                  <Plus size={13} className="text-blue-500 flex-shrink-0 opacity-0"/> {store.email}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">#ST-{store.id}</span>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-muted group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <ChevronRight size={18} strokeWidth={3}/>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {stores.length === 0 && !showForm && (
        <div className="py-24 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
          <StoreIcon size={40} className="text-slate-200 mx-auto mb-4"/>
          <p className="text-muted font-bold">No hay sucursales registradas aún.</p>
        </div>
      )}
    </motion.div>
  );
};

const Field = ({ label, type = 'text', required, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-black uppercase text-muted mb-1.5 tracking-widest">{label}</label>
    <input
      type={type} required={required} value={value} onChange={onChange}
      className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm transition-all"
    />
  </div>
);

const SectionLabel = ({ children, color }) => (
  <h4 className={`text-[10px] font-black uppercase tracking-widest text-${color}-500 pb-2 border-b border-${color}-100 dark:border-${color}-500/20`}>
    {children}
  </h4>
);

export default StoreManagement;
