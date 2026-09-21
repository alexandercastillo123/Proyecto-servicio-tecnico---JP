import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store as StoreIcon, Plus, MapPin, Phone, Mail, Clock, X,
  Package, ShoppingBag, Calendar, ChevronRight, ArrowLeft,
  Edit2, Trash2, Image as ImageIcon, Layers, Globe,
  ShieldCheck, Lock, ChevronDown, User
} from 'lucide-react';
import { adminService, adminStoreService } from '../../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

/* ─── Helpers ────────────────────────────────────────── */
const getImageUrl = (url) => url ? (url.startsWith('http') ? url : `/uploads/${url}`) : null;

const Spinner = ({ color = 'border-[#3B28FF]' }) => (
  <div className="flex items-center justify-center py-24">
    <div className={`w-10 h-10 border-4 ${color} border-t-transparent rounded-full animate-spin`} />
  </div>
);

const SectionLabel = ({ children, color = 'primary', icon }) => {
  const cls = {
    primary: 'text-[#3B28FF] border-[#3B28FF]/20',
    indigo:  'text-indigo-400 border-indigo-500/20',
    rose:    'text-rose-400 border-rose-500/20',
    emerald: 'text-emerald-400 border-emerald-500/20',
  }[color] || 'text-slate-400 border-white/10';
  return (
    <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2 pb-3 border-b ${cls}`}>
      <span className="opacity-70">{icon}</span> {children}
    </h4>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-[#3B28FF]/10 text-[#3B28FF] flex items-center justify-center shrink-0 group-hover:bg-[#3B28FF] group-hover:text-white transition-all duration-300">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">{label}</p>
      <p className="font-bold text-sm text-white">{value || '—'}</p>
    </div>
  </div>
);

const AdminInput = ({ label, value, onChange, type = 'text', required, icon, onBlur, placeholder }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
      <input
        type={type} required={required} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} onBlur={onBlur}
        className={`admin-input ${icon ? 'pl-10' : ''}`}
      />
    </div>
  </div>
);

const AdminTextarea = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</label>
    <textarea
      value={value} onChange={e => onChange(e.target.value)} rows={3}
      className="admin-input resize-none"
    />
  </div>
);

/* ─── Location Picker ────────────────────────────────── */
const LocationPickerMap = ({ position, onSelect }) => {
  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        onSelect(lat, lng, data?.display_name);
      } catch { onSelect(lat, lng); }
    }
  });
  return position ? <Marker position={position} /> : null;
};

/* ─── Store Detail View ──────────────────────────────── */

// Overview Tab
const OverviewTab = ({ store }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="glass-card p-8 space-y-6">
      <SectionLabel color="primary" icon={<Phone size={13} />}>Contacto</SectionLabel>
      <div className="space-y-5">
        <InfoRow icon={<Phone size={16} />} label="Teléfono" value={store.phone} />
        <InfoRow icon={<Mail size={16} />}  label="Email"    value={store.email} />
        <InfoRow icon={<MapPin size={16} />} label="Dirección" value={`${store.address}, ${store.city}`} />
        <InfoRow icon={<Clock size={16} />} label="Horario" value={`${store.opening_time?.slice(0,5)} - ${store.closing_time?.slice(0,5)}`} />
      </div>
    </div>
    <div className="glass-card p-8 space-y-6">
      <SectionLabel color="indigo" icon={<ShieldCheck size={13} />}>Estado de la Unidad</SectionLabel>
      <div className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${store.status === 'active' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,113,0.8)]'} animate-pulse`} />
          <span className="font-black text-white">{store.status === 'active' ? 'Operativo' : 'Inactivo'}</span>
        </div>
        <span className={`status-badge ${store.status === 'active' ? 'status-completed' : 'status-cancelled'}`}>
          {store.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      {store.description && (
        <div className="bg-white/3 p-5 rounded-2xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Descripción</p>
          <p className="text-sm text-slate-300 font-medium italic leading-relaxed">"{store.description}"</p>
        </div>
      )}
    </div>
  </div>
);

// Products Tab
const ProductsTab = ({ storeId }) => {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const emptyForm = { name: '', description: '', price: '', image_url: '', category: '', brand: '', sku: '', is_available: true };
  const [form, setForm] = useState(emptyForm);

  const fetchProducts = async () => {
    try { const r = await adminStoreService.getProducts(storeId); setProducts(r.data.resultado || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, [storeId]);

  const handleImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const r = await adminStoreService.uploadProductImage(fd);
      setForm(f => ({ ...f, image_url: r.data.resultado?.url || '' }));
    } catch { alert('Error subiendo imagen'); } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await adminStoreService.updateProduct(editingId, form);
      else await adminStoreService.addProduct({ ...form, sucursal_id: storeId });
      setShowForm(false); setEditingId(null); setForm(emptyForm); fetchProducts();
    } catch (err) { alert('Error: ' + (err.response?.data?.mensaje || err.message)); }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || '', price: p.price, image_url: p.image_url || '', category: p.category || '', brand: p.brand || '', sku: p.sku || '', is_available: p.is_available ?? true });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    await adminStoreService.deleteProduct(id); fetchProducts();
  };

  if (loading) return <Spinner color="border-[#3B28FF]" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-xl text-white">Catálogo de Productos</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${showForm ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-[#3B28FF]/10 text-[#3B28FF] border border-[#3B28FF]/20 hover:bg-[#3B28FF] hover:text-white'}`}
        >
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Agregar Producto</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
            <h4 className="font-black text-white">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AdminInput label="Nombre *" value={form.name} onChange={v => setForm(f => ({...f, name: v}))} required />
              <AdminInput label="Categoría" value={form.category} onChange={v => setForm(f => ({...f, category: v}))} />
              <AdminInput label="Precio (S/) *" type="number" value={form.price} onChange={v => setForm(f => ({...f, price: v}))} required />
              <AdminInput label="Marca" value={form.brand} onChange={v => setForm(f => ({...f, brand: v}))} />
              <AdminInput label="SKU" value={form.sku} onChange={v => setForm(f => ({...f, sku: v}))} />
              <div className="flex items-center gap-3 p-4 rounded-xl border border-white/8 bg-white/3">
                <label className="text-sm font-bold text-slate-300 flex-1">Disponible</label>
                <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({...f, is_available: e.target.checked}))}
                  className="w-5 h-5 accent-[#3B28FF]" />
              </div>
            </div>
            <AdminTextarea label="Descripción" value={form.description} onChange={v => setForm(f => ({...f, description: v}))} />
            <div className="flex items-center gap-4">
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="prod-img" />
              <label htmlFor="prod-img" className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 cursor-pointer hover:bg-white/10 transition-all flex items-center gap-2">
                <ImageIcon size={15} /> {uploading ? 'Subiendo...' : (form.image_url ? 'Cambiar imagen' : 'Subir imagen')}
              </label>
              {form.image_url && <span className="text-xs text-emerald-400 font-bold">✓ Imagen lista</span>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">
                Cancelar
              </button>
              <button type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#3B28FF] text-white font-black text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-[#3B28FF]/30">
                {editingId ? 'Guardar Cambios' : 'Agregar Producto'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {products.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card !p-0 overflow-hidden group hover:-translate-y-2 hover:shadow-2xl transition-all duration-400">
            <div className="h-44 bg-white/3 relative overflow-hidden flex items-center justify-center">
              {p.image_url
                ? <img src={getImageUrl(p.image_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                : <ImageIcon size={40} className="text-slate-700" />}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(p)} className="p-2 rounded-lg bg-white/90 text-[#3B28FF] hover:scale-110 transition-all shadow-lg"><Edit2 size={12} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-rose-500 text-white hover:scale-110 transition-all shadow-lg"><Trash2 size={12} /></button>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="text-[9px] font-black uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                  {p.category || 'General'}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <h4 className="font-black text-white line-clamp-1 group-hover:text-[#3B28FF] transition-colors">{p.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-2">{p.description || 'Sin descripción.'}</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-xl font-black text-[#3B28FF]">S/ {parseFloat(p.price).toFixed(2)}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${p.is_available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {p.is_available ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {products.length === 0 && !showForm && (
        <div className="py-20 text-center glass-card border-dashed border-white/10">
          <Package size={40} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Sin productos registrados.</p>
        </div>
      )}
    </div>
  );
};

// Orders Tab
const OrdersTab = ({ storeId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminStoreService.getOrders(storeId)
      .then(r => { setOrders(r.data.resultado || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [storeId]);

  const handleStatus = async (id, status) => {
    try { await adminStoreService.updateOrderStatus(id, status); }
    catch { alert('Error actualizando pedido'); }
  };

  if (loading) return <Spinner color="border-emerald-500" />;

  return (
    <div className="space-y-4">
      {orders.map((o, i) => (
        <motion.div key={o.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
          className="glass-card p-6 flex flex-col lg:flex-row gap-6 lg:items-center">
          <div className="shrink-0">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Pedido</p>
            <span className="font-mono text-sm font-black text-[#3B28FF]">#ORD-{o.id}</span>
            <p className="text-[10px] text-slate-600 mt-1">{new Date(o.created_at).toLocaleDateString('es-PE')}</p>
          </div>
          <div className="flex-1">
            <h4 className="font-black text-white mb-2">{o.product_name} <span className="text-[#3B28FF] text-sm">×{o.quantity}</span></h4>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><User size={12} /> {o.client_names} {o.client_surnames}</span>
              <span className="flex items-center gap-1.5"><Phone size={12} /> {o.client_phone}</span>
              {o.delivery_address && <span className="flex items-center gap-1.5"><MapPin size={12} /> {o.delivery_address}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white">S/ {parseFloat(o.total_price).toFixed(2)}</p>
          </div>
          <div className="shrink-0 relative">
            <select value={o.status} onChange={e => handleStatus(o.id, e.target.value)} className="admin-select appearance-none pr-8">
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="shipped">En camino</option>
              <option value="delivered">Entregado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </motion.div>
      ))}
      {orders.length === 0 && (
        <div className="py-20 text-center glass-card border-dashed border-white/10">
          <ShoppingBag size={40} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Sin pedidos registrados.</p>
        </div>
      )}
    </div>
  );
};

// Appointments Tab
const AppointmentsTab = ({ storeId }) => {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminStoreService.getStoreAppointments(storeId)
      .then(r => { setAppts(r.data.resultado || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [storeId]);

  if (loading) return <Spinner color="border-blue-500" />;

  return (
    <div className="overflow-hidden glass-card">
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Cliente</th><th>Técnico</th><th>Fecha</th><th>Estado</th><th>Precio</th></tr></thead>
          <tbody>
            {appts.map((a, i) => (
              <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <td><span className="font-mono text-xs font-bold text-[#3B28FF]">#{a.id}</span></td>
                <td><div className="font-bold text-sm">{a.client_names} {a.client_surnames}</div></td>
                <td className="text-sm text-slate-400">{a.tech_names || '—'}</td>
                <td><div className="text-sm font-bold">{new Date(a.scheduled_date).toLocaleDateString('es-PE')}</div><div className="text-xs text-slate-500">{a.scheduled_time}</div></td>
                <td><span className={`status-badge status-${a.status}`}>{a.status}</span></td>
                <td>{a.price ? <span className="font-black text-[#3B28FF]">S/ {parseFloat(a.price).toFixed(2)}</span> : <span className="text-slate-600">—</span>}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {appts.length === 0 && (
          <div className="py-16 text-center text-slate-600 font-bold text-sm">Sin citas registradas para esta sucursal.</div>
        )}
      </div>
    </div>
  );
};

const TABS = [
  { id: 'overview',  label: 'Info General',      icon: StoreIcon },
  { id: 'products',  label: 'Catálogo',           icon: Package   },
  { id: 'orders',    label: 'Ventas',             icon: ShoppingBag },
  { id: 'citas',     label: 'Citas',              icon: Calendar  },
];

/* ─── Store Detail Screen ────────────────────────────── */
const StoreDetail = ({ store, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white text-sm font-bold mb-6 transition-colors">
          <ArrowLeft size={16} /> Volver a Sucursales
        </button>
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            {store.image_url
              ? <img src={getImageUrl(store.image_url)} className="w-full h-full object-cover" alt={store.name} />
              : <StoreIcon size={32} className="text-slate-600" />}
          </div>
          <div>
            <p className="text-[10px] text-[#3B28FF] font-black uppercase tracking-[0.3em] mb-1">Sucursal #ST-{store.id}</p>
            <h1 className="text-3xl font-black text-white tracking-tight">{store.name}</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5"><MapPin size={12} /> {store.address}, {store.city}</p>
          </div>
          <div className="ml-auto">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${store.status === 'active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
              <div className={`w-2 h-2 rounded-full ${store.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {store.status === 'active' ? 'Operativo' : 'Inactivo'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-[#3B28FF] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'overview'  && <OverviewTab store={store} />}
          {activeTab === 'products'  && <ProductsTab storeId={store.id} />}
          {activeTab === 'orders'    && <OrdersTab storeId={store.id} />}
          {activeTab === 'citas'     && <AppointmentsTab storeId={store.id} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ─── Main Stores List ───────────────────────────────── */
const AdminStores = () => {
  const { id: selectedId } = useParams();
  const navigate           = useNavigate();
  const [stores,    setStores]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [uploading, setUploading] = useState(false);

  const EMPTY = {
    name: '', description: '', address: '', city: 'Lima', state: 'Lima',
    zip_code: '15001', country: 'Perú', phone: '', email: '',
    opening_time: '09:00:00', closing_time: '18:00:00',
    admin_email: '', admin_password: '', image_url: '',
    latitude: -12.046374, longitude: -77.042793
  };
  const [formData, setFormData] = useState(EMPTY);
  const f = (key) => ({ value: formData[key], onChange: v => setFormData(p => ({ ...p, [key]: v })) });

  const fetchStores = async () => {
    try { const r = await adminService.getBranches(); setStores(r.data.resultado || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { fetchStores(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await adminStoreService.createBranch(formData); setShowForm(false); setFormData(EMPTY); fetchStores(); }
    catch (err) { alert('Error: ' + (err.response?.data?.mensaje || err.message)); }
  };

  const handleImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const res = await adminStoreService.uploadStoreImage(fd);
      if (res.data.resultado?.url) setFormData(p => ({ ...p, image_url: res.data.resultado.url }));
    } catch { alert('Error subiendo imagen'); } finally { setUploading(false); }
  };

  const handleAddressBlur = async () => {
    if (!formData.address) return;
    try {
      const q = encodeURIComponent(`${formData.address}, ${formData.city}, ${formData.country}`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
      const data = await res.json();
      if (data?.length > 0) setFormData(p => ({ ...p, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }));
    } catch { console.error('Geocoding error'); }
  };

  // Show detail view if an id is in the URL
  if (selectedId) {
    const store = stores.find(s => String(s.id) === selectedId);
    if (!store && !loading) return <div className="text-slate-500 py-20 text-center">Sucursal no encontrada.</div>;
    if (!store) return <Spinner />;
    return <StoreDetail store={store} onBack={() => navigate('/admin/sucursales')} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 mb-2 flex items-center gap-2">
            <Layers size={12} /> Red de Sucursales
          </p>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Sucursales <span className="text-rose-400 italic">J&P</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">Gestión avanzada de puntos de atención.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${showForm ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'bg-[#3B28FF]/10 text-[#3B28FF] border border-[#3B28FF]/20 hover:bg-[#3B28FF] hover:text-white'}`}>
          {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Nueva Sucursal</>}
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
              <h3 className="font-black text-xl text-white">Nueva Unidad</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Col 1: Credentials */}
                <div className="space-y-5">
                  <SectionLabel color="primary" icon={<ShieldCheck size={13} />}>Credenciales & Acceso</SectionLabel>
                  <AdminInput label="Nombre Comercial *" icon={<StoreIcon size={14} />} {...f('name')} required />
                  <AdminInput label="Email Operativo *"  icon={<Mail size={14} />}    type="email" {...f('email')} required />
                  <AdminInput label="Email Administrador *" icon={<ShieldCheck size={14} />} type="email" {...f('admin_email')} required />
                  <AdminInput label="Clave de Seguridad *"  icon={<Lock size={14} />}  type="password" {...f('admin_password')} required />
                </div>

                {/* Col 2: Location */}
                <div className="space-y-5">
                  <SectionLabel color="indigo" icon={<MapPin size={13} />}>Localización Física</SectionLabel>
                  <AdminInput label="Dirección Exacta *" icon={<MapPin size={14} />} {...f('address')} required onBlur={handleAddressBlur} />
                  <AdminInput label="Ciudad *" icon={<Globe size={14} />} {...f('city')} required />
                  <AdminInput label="Teléfono *" icon={<Phone size={14} />} {...f('phone')} required />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Geolocalización (click para ajustar)</p>
                    <div className="h-48 rounded-2xl overflow-hidden border border-white/10">
                      <MapContainer center={[formData.latitude, formData.longitude]} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationPickerMap
                          position={[formData.latitude, formData.longitude]}
                          onSelect={(lat, lng, addr) => setFormData(p => ({ ...p, latitude: lat, longitude: lng, address: addr || p.address }))}
                        />
                      </MapContainer>
                    </div>
                  </div>
                </div>

                {/* Col 3: Branding + Horario */}
                <div className="space-y-5">
                  <SectionLabel color="rose" icon={<ImageIcon size={13} />}>Branding & Horario</SectionLabel>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Logo / Imagen</p>
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.image_url
                          ? <img src={getImageUrl(formData.image_url)} className="w-full h-full object-cover" alt="preview" />
                          : <StoreIcon size={28} className="text-slate-600" />}
                      </div>
                      <div>
                        <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="store-img" />
                        <label htmlFor="store-img" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 cursor-pointer hover:bg-white/10 transition-all">
                          <ImageIcon size={14} /> {uploading ? 'Subiendo...' : 'Cargar Logo'}
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <AdminInput label="Apertura" type="time" value={formData.opening_time} onChange={v => setFormData(p => ({...p, opening_time: v}))} />
                    <AdminInput label="Cierre"   type="time" value={formData.closing_time}  onChange={v => setFormData(p => ({...p, closing_time: v}))} />
                  </div>
                  <AdminTextarea label="Descripción" value={formData.description} onChange={v => setFormData(p => ({...p, description: v}))} />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => { setShowForm(false); setFormData(EMPTY); }}
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-all">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-8 py-2.5 rounded-xl bg-[#3B28FF] text-white font-black text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-[#3B28FF]/30">
                  Crear Sucursal
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stores Grid */}
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store, i) => (
            <motion.div key={store.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => navigate(`/admin/sucursales/${store.id}`)}
              className="glass-card !p-0 overflow-hidden cursor-pointer group hover:-translate-y-2 hover:shadow-2xl hover:border-[#3B28FF]/30 transition-all duration-400">
              {/* Cover image */}
              <div className="h-48 bg-white/3 relative overflow-hidden flex items-center justify-center">
                {store.image_url
                  ? <img src={getImageUrl(store.image_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={store.name} />
                  : <StoreIcon size={48} className="text-slate-700 group-hover:rotate-6 transition-transform duration-500" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                  <div className={`w-1.5 h-1.5 rounded-full ${store.status === 'active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`} />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">{store.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
              {/* Info */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-xl text-white group-hover:text-[#3B28FF] transition-colors leading-tight">{store.name}</h3>
                  <span className="text-[9px] text-slate-600 font-black uppercase">#ST-{store.id}</span>
                </div>
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2"><MapPin size={12} className="text-slate-600" /> <span className="truncate">{store.address}, {store.city}</span></div>
                  <div className="flex items-center gap-2"><Phone size={12} className="text-slate-600" /> {store.phone}</div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest truncate max-w-[160px]">{store.email}</span>
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:bg-[#3B28FF] group-hover:text-white group-hover:translate-x-0.5 transition-all duration-400 shadow-sm">
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {stores.length === 0 && !loading && !showForm && (
        <div className="py-28 text-center glass-card border-dashed border-white/10 rounded-3xl">
          <StoreIcon size={48} className="text-slate-700 mx-auto mb-5" />
          <h3 className="text-xl font-black text-white mb-2">Red desconectada</h3>
          <p className="text-slate-500 font-semibold">Registra tu primera sucursal para comenzar.</p>
        </div>
      )}
    </motion.div>
  );
};

export default AdminStores;
