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

const Spinner = ({ color = 'border-primary' }) => (
  <div className="flex items-center justify-center py-24">
    <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
  </div>
);

const SectionLabel = ({ children, color = 'primary', icon }) => {
  const cls = {
    primary: 'border-blue-500/20',
    indigo:  'text-indigo-400 border-indigo-500/20',
    rose:    'text-rose-400 border-rose-500/20',
    emerald: 'text-emerald-400 border-emerald-500/20',
  }[color] || 'border-white/10';
  const textStyle = color === 'primary' ? { color: 'var(--primary)' } : {};
  return (
    <h4 style={textStyle} className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2 pb-3 border-b ${cls}`}>
      <span className="opacity-70">{icon}</span> {children}
    </h4>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:brightness-125 transition-all duration-300"
      style={{ background: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{value || '—'}</p>
    </div>
  </div>
);

const AdminInput = ({ label, value, onChange, type = 'text', required, icon, onBlur, placeholder }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>{icon}</div>}
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
    <label className="block text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>{label}</label>
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
      <div className="flex items-center justify-between p-5 rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${store.status === 'active' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,113,0.8)]'} animate-pulse`} />
          <span className="font-black" style={{ color: 'var(--text-primary)' }}>{store.status === 'active' ? 'Operativo' : 'Inactivo'}</span>
        </div>
        <span className={`status-badge ${store.status === 'active' ? 'status-completed' : 'status-cancelled'}`}>
          {store.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      {store.description && (
        <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Descripción</p>
          <p className="text-sm font-medium italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>"{store.description}"</p>
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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>Catálogo de Productos</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${showForm ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'btn-primary'}`}
        >
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Agregar Producto</>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
            <h4 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AdminInput label="Nombre *" value={form.name} onChange={v => setForm(f => ({...f, name: v}))} required />
              <AdminInput label="Categoría" value={form.category} onChange={v => setForm(f => ({...f, category: v}))} />
              <AdminInput label="Precio (S/) *" type="number" value={form.price} onChange={v => setForm(f => ({...f, price: v}))} required />
              <AdminInput label="Marca" value={form.brand} onChange={v => setForm(f => ({...f, brand: v}))} />
              <AdminInput label="SKU" value={form.sku} onChange={v => setForm(f => ({...f, sku: v}))} />
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <label className="text-sm font-bold flex-1" style={{ color: 'var(--text-secondary)' }}>Disponible</label>
                <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({...f, is_available: e.target.checked}))}
                  className="w-5 h-5 accent-blue-600" />
              </div>
            </div>
            <AdminTextarea label="Descripción" value={form.description} onChange={v => setForm(f => ({...f, description: v}))} />
            <div className="flex items-center gap-4">
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="prod-img" />
              <label htmlFor="prod-img" className="px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center gap-2"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <ImageIcon size={15} /> {uploading ? 'Subiendo...' : (form.image_url ? 'Cambiar imagen' : 'Subir imagen')}
              </label>
              {form.image_url && <span className="text-xs text-emerald-400 font-bold">✓ Imagen lista</span>}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
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
            <div className="h-44 relative overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
              {p.image_url
                ? <img src={getImageUrl(p.image_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                : <ImageIcon size={40} style={{ color: 'var(--text-muted)' }} />}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(p)} className="p-2 rounded-lg bg-white/90 text-blue-600 hover:scale-110 transition-all shadow-lg"><Edit2 size={12} /></button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-rose-500 text-white hover:scale-110 transition-all shadow-lg"><Trash2 size={12} /></button>
              </div>
              <div className="absolute bottom-3 left-3">
                <span className="text-[9px] font-black uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                  {p.category || 'General'}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <h4 className="font-black line-clamp-1 transition-colors" style={{ color: 'var(--text-primary)' }}>{p.name}</h4>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{p.description || 'Sin descripción.'}</p>
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-xl font-black" style={{ color: 'var(--primary)' }}>S/ {parseFloat(p.price).toFixed(2)}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${p.is_available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {p.is_available ? 'Disponible' : 'No disponible'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {products.length === 0 && !showForm && (
        <div className="py-20 text-center glass-card border-dashed" style={{ borderColor: 'var(--border)' }}>
          <Package size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Sin productos registrados.</p>
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
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Pedido</p>
            <span className="font-mono text-sm font-black" style={{ color: 'var(--primary)' }}>#ORD-{o.id}</span>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('es-PE')}</p>
          </div>
          <div className="flex-1">
            <h4 className="font-black mb-2" style={{ color: 'var(--text-primary)' }}>{o.product_name} <span className="text-sm" style={{ color: 'var(--primary)' }}>×{o.quantity}</span></h4>
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1.5"><User size={12} /> {o.client_names} {o.client_surnames}</span>
              <span className="flex items-center gap-1.5"><Phone size={12} /> {o.client_phone}</span>
              {o.delivery_address && <span className="flex items-center gap-1.5"><MapPin size={12} /> {o.delivery_address}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>S/ {parseFloat(o.total_price).toFixed(2)}</p>
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
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          </div>
        </motion.div>
      ))}
      {orders.length === 0 && (
        <div className="py-20 text-center glass-card border-dashed" style={{ borderColor: 'var(--border)' }}>
          <ShoppingBag size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Sin pedidos registrados.</p>
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
                <td><span className="font-mono text-xs font-bold" style={{ color: 'var(--primary)' }}>#{a.id}</span></td>
                <td><div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{a.client_names} {a.client_surnames}</div></td>
                <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.tech_names || '—'}</td>
                <td><div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{new Date(a.scheduled_date).toLocaleDateString('es-PE')}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.scheduled_time}</div></td>
                <td><span className={`status-badge status-${a.status}`}>{a.status}</span></td>
                <td>{a.price ? <span className="font-black" style={{ color: 'var(--primary)' }}>S/ {parseFloat(a.price).toFixed(2)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {appts.length === 0 && (
          <div className="py-16 text-center font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Sin citas registradas para esta sucursal.</div>
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
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold mb-6 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Volver a Sucursales
        </button>
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            {store.image_url
              ? <img src={getImageUrl(store.image_url)} className="w-full h-full object-cover" alt={store.name} />
              : <StoreIcon size={32} style={{ color: 'var(--text-muted)' }} />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: 'var(--primary)' }}>Sucursal #ST-{store.id}</p>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{store.name}</h1>
            <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}><MapPin size={12} /> {store.address}, {store.city}</p>
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
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)'
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'shadow-lg shadow-blue-500/25' : 'hover:brightness-125'}`}>
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
    if (!store && !loading) return <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>Sucursal no encontrada.</div>;
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
          <h1 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
            Sucursales <span className="text-rose-400 italic">J&P</span>
          </h1>
          <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Gestión avanzada de puntos de atención.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all ${showForm ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'btn-primary'}`}>
          {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Nueva Sucursal</>}
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
              <h3 className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>Nueva Unidad</h3>
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
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Geolocalización (click para ajustar)</p>
                    <div className="h-48 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
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
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Logo / Imagen</p>
                    <div className="flex gap-4 items-center">
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        {formData.image_url
                          ? <img src={getImageUrl(formData.image_url)} className="w-full h-full object-cover" alt="preview" />
                          : <StoreIcon size={28} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                      <div>
                        <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="store-img" />
                        <label htmlFor="store-img" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
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

              <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => { setShowForm(false); setFormData(EMPTY); }}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
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
              className="glass-card !p-0 overflow-hidden cursor-pointer group hover:-translate-y-2 hover:shadow-2xl transition-all duration-400">
              {/* Cover image */}
              <div className="h-48 relative overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                {store.image_url
                  ? <img src={getImageUrl(store.image_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={store.name} />
                  : <StoreIcon size={48} className="group-hover:rotate-6 transition-transform duration-500" style={{ color: 'var(--text-muted)' }} />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                  <div className={`w-1.5 h-1.5 rounded-full ${store.status === 'active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`} />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">{store.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
              {/* Info */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-xl transition-colors leading-tight group-hover:text-blue-500" style={{ color: 'var(--text-primary)' }}>{store.name}</h3>
                  <span className="text-[9px] font-black uppercase" style={{ color: 'var(--text-muted)' }}>#ST-{store.id}</span>
                </div>
                <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-2"><MapPin size={12} style={{ color: 'var(--text-muted)' }} /> <span className="truncate">{store.address}, {store.city}</span></div>
                  <div className="flex items-center gap-2"><Phone size={12} style={{ color: 'var(--text-muted)' }} /> {store.phone}</div>
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[160px]" style={{ color: 'var(--text-muted)' }}>{store.email}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-400 shadow-sm"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {stores.length === 0 && !loading && !showForm && (
        <div className="py-28 text-center glass-card border-dashed rounded-3xl" style={{ borderColor: 'var(--border)' }}>
          <StoreIcon size={48} className="mx-auto mb-5" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Red desconectada</h3>
          <p className="font-semibold" style={{ color: 'var(--text-muted)' }}>Registra tu primera sucursal para comenzar.</p>
        </div>
      )}
    </motion.div>
  );
};

export default AdminStores;
