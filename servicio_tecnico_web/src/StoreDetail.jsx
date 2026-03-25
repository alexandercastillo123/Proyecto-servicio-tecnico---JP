import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Store, Package, ShoppingBag, Calendar, MapPin, Phone, Mail,
  Clock, Edit2, Trash2, Plus, Image as ImageIcon, Tag, User, ChevronDown, CheckCircle, XCircle
} from 'lucide-react';
import { storeService, adminService } from './services/api';

// ─────────────────────────── TABS ──────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Resumen',   icon: Store },
  { id: 'products',  label: 'Productos', icon: Package },
  { id: 'orders',    label: 'Pedidos',   icon: ShoppingBag },
  { id: 'citas',     label: 'Citas',     icon: Calendar },
];

// ─────────────────────────── OVERVIEW TAB ──────────────────────
const OverviewTab = ({ store }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="bg-card rounded-3xl border border-card p-8 space-y-5">
      <h3 className="font-black text-sm text-muted uppercase tracking-widest">Información de Contacto</h3>
      <InfoRow icon={<Phone size={16}/>} label="Teléfono" value={store.phone} />
      <InfoRow icon={<Mail size={16}/>} label="Correo" value={store.email} />
      <InfoRow icon={<MapPin size={16}/>} label="Dirección" value={`${store.address}, ${store.city}`} />
      <InfoRow icon={<Clock size={16}/>} label="Horario" value={`${store.opening_time?.slice(0,5)} - ${store.closing_time?.slice(0,5)}`} />
    </div>
    <div className="bg-card rounded-3xl border border-card p-8 space-y-5">
      <h3 className="font-black text-sm text-muted uppercase tracking-widest">Estado</h3>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${store.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
        <span className="font-bold">{store.status === 'active' ? 'Activa' : 'Inactiva'}</span>
      </div>
      <InfoRow icon={<Tag size={16}/>} label="Especialidades" value={store.specialties || '—'} />
      {store.description && (
        <div>
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-2">Descripción</p>
          <p className="text-sm font-medium leading-relaxed">{store.description}</p>
        </div>
      )}
    </div>
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
    <div>
      <p className="text-muted text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="font-bold text-sm">{value || '—'}</p>
    </div>
  </div>
);

// ─────────────────────────── PRODUCTS TAB ──────────────────────
const ProductsTab = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const emptyForm = { name: '', description: '', price: '', image_url: '', category: '', brand: '', sku: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchProducts(); }, [storeId]);

  const fetchProducts = async () => {
    try { const r = await storeService.getProducts(storeId); setProducts(r.data.resultado || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const r = await storeService.uploadProductImage(fd);
      setForm(f => ({ ...f, image_url: r.data.resultado.url }));
    } catch { alert('Error subiendo imagen'); } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await storeService.updateProduct(editingId, form);
      else await storeService.addProduct({ ...form, sucursal_id: storeId });
      setShowForm(false); setEditingId(null); setForm(emptyForm); fetchProducts();
    } catch (err) { alert('Error: ' + (err.response?.data?.mensaje || err.message)); }
  };

  const handleEdit = (p) => { setEditingId(p.id); setForm({ name: p.name, description: p.description||'', price: p.price, image_url: p.image_url||'', category: p.category||'', brand: p.brand||'', sku: p.sku||'' }); setShowForm(true); };
  const handleDelete = async (id) => { if (!window.confirm('¿Eliminar este producto?')) return; await storeService.deleteProduct(id); fetchProducts(); };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
        <div>
          <h3 className="font-black text-lg">Inventario de Sucursal</h3>
          <p className="text-muted text-xs font-medium">Los productos son gestionados por el administrador de la sucursal.</p>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="bg-card border border-card rounded-3xl p-8">
            <h3 className="font-black text-slate-800 dark:text-white mb-6">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField label="Nombre" required value={form.name} onChange={v => setForm(f=>({...f,name:v}))} />
                <FormField label="Descripción" value={form.description} onChange={v => setForm(f=>({...f,description:v}))} textarea />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Precio (S/)" type="number" step="0.01" required value={form.price} onChange={v => setForm(f=>({...f,price:v}))} />
                  <FormField label="Categoría" value={form.category} onChange={v => setForm(f=>({...f,category:v}))} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase text-muted mb-2 tracking-widest">Imagen</label>
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-700 border border-card flex items-center justify-center overflow-hidden">
                    {form.image_url ? <img src={`/api/${form.image_url}`} className="w-full h-full object-cover" /> : <ImageIcon className="text-muted" size={28}/>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="pimg" />
                    <label htmlFor="pimg" className="flex items-center justify-center w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase tracking-widest text-muted cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-600 transition-all">
                      {uploading ? 'Subiendo...' : 'Seleccionar foto'}
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => {setShowForm(false);setEditingId(null);setForm(emptyForm);}} className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-muted font-bold uppercase tracking-widest text-xs hover:bg-slate-200">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/30 hover:bg-blue-700">Guardar</button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {products.map((p, i) => (
          <motion.div key={p.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} className="bg-card border border-card rounded-3xl overflow-hidden group hover:border-blue-300 dark:hover:border-blue-600 transition-all">
            <div className="h-36 bg-slate-100 dark:bg-slate-700 relative overflow-hidden flex items-center justify-center">
              {p.image_url ? <img src={`/api/${p.image_url}`} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-slate-300"/>}
            </div>
            <div className="p-5">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">{p.category || 'General'}</span>
              <h4 className="font-black text-sm mt-2 mb-1 leading-tight">{p.name}</h4>
              <p className="text-muted text-xs line-clamp-2 mb-3">{p.description || 'Sin descripción.'}</p>
              <span className="text-lg font-black text-blue-600">S/ {parseFloat(p.price).toFixed(2)}</span>
            </div>
          </motion.div>
        ))}
      </div>
      {products.length === 0 && !showForm && <EmptyState icon={<Package size={36}/>} text="No hay productos registrados." />}
    </div>
  );
};

// ─────────────────────────── ORDERS TAB ──────────────────────
const OrdersTab = ({ storeId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, [storeId]);

  const fetchOrders = async () => {
    try { const r = await storeService.getOrders(storeId); setOrders(r.data.resultado || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleStatus = async (id, status) => {
    try { await storeService.updateOrderStatus(id, status); fetchOrders(); }
    catch { alert('Error actualizando pedido'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {orders.map((o, i) => (
        <motion.div key={o.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}} className="bg-card border border-card rounded-3xl p-6 flex flex-col md:flex-row gap-6 md:items-center hover:border-blue-200 dark:hover:border-blue-700 transition-all">
          <div className="md:w-36">
            <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">Pedido</p>
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg">#ORD-{o.id}</span>
            <p className="text-[10px] text-muted mt-2">{new Date(o.created_at).toLocaleString('es-PE')}</p>
          </div>
          <div className="flex-1">
            <h4 className="font-black text-base mb-2">{o.product_name} <span className="text-blue-500">×{o.quantity}</span></h4>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-muted">
              <span className="flex items-center gap-1.5"><User size={12}/> {o.client_names} {o.client_surnames}</span>
              <span className="flex items-center gap-1.5"><Phone size={12}/> {o.client_phone}</span>
              {o.delivery_address && <span className="flex items-center gap-1.5"><MapPin size={12}/> {o.delivery_address}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">Total</p>
            <p className="text-xl font-black">S/ {parseFloat(o.total_price).toFixed(2)}</p>
          </div>
          <select value={o.status} onChange={e => handleStatus(o.id, e.target.value)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer transition-all ${
              o.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
              o.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'}`}>
            <option value="pending">Pendiente</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </motion.div>
      ))}
      {orders.length === 0 && <EmptyState icon={<ShoppingBag size={36}/>} text="No hay pedidos recibidos aún." />}
    </div>
  );
};

// ─────────────────────────── CITAS TAB ──────────────────────
const CitasTab = ({ storeId }) => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCitas(); }, [storeId]);

  const fetchCitas = async () => {
    try { const r = await storeService.getStoreAppointments(storeId); setCitas(r.data.resultado || []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const statusLabel = { pending:'Pendiente', confirmed:'Confirmada', completed:'Completada', cancelled:'Cancelada', cancellation_pending:'Cancelación Pend.' };
  const statusColor = { pending:'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', confirmed:'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', completed:'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', cancelled:'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400', cancellation_pending:'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      {citas.map((c, i) => (
        <motion.div key={c.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.04}} className="bg-card border border-card rounded-3xl p-6 flex flex-col md:flex-row gap-4 md:items-center hover:border-blue-200 transition-all">
          <div className="md:w-28">
            <p className="text-[9px] text-muted font-black uppercase tracking-widest mb-1">Cita</p>
            <span className="font-mono text-xs font-bold text-blue-600">#CIT-{c.id}</span>
          </div>
          <div className="flex-1">
            <p className="font-black text-sm">{c.client_names} {c.client_surnames}</p>
            <p className="text-muted text-xs mt-1">{c.description || 'Sin descripción'}</p>
          </div>
          <div className="text-center">
            <p className="font-black text-sm">{new Date(c.scheduled_date).toLocaleDateString('es-PE')}</p>
            <p className="text-muted text-xs">{c.scheduled_time?.slice(0,5)}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${statusColor[c.status] || ''}`}>{statusLabel[c.status] || c.status}</span>
        </motion.div>
      ))}
      {citas.length === 0 && <EmptyState icon={<Calendar size={36}/>} text="No hay citas registradas para esta sucursal." />}
    </div>
  );
};

// ─────────────────────────── HELPERS ──────────────────────────
const FormField = ({ label, value, onChange, required, type='text', step, textarea }) => (
  <div>
    <label className="block text-[10px] font-black uppercase text-muted mb-1.5 tracking-widest">{label}</label>
    {textarea
      ? <textarea required={required} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-sm font-medium h-20 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all" value={value} onChange={e=>onChange(e.target.value)} />
      : <input type={type} step={step} required={required} className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={value} onChange={e=>onChange(e.target.value)} />
    }
  </div>
);

const Spinner = () => (
  <div className="py-16 text-center">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"/>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div className="py-20 text-center bg-card border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-muted mx-auto mb-4">{icon}</div>
    <p className="text-muted font-bold text-sm">{text}</p>
  </div>
);

// ─────────────────────────── MAIN ──────────────────────────────
const StoreDetail = ({ storeId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeService.getBranches()
      .then(r => { const s = (r.data.resultado||[]).find(x => x.id === storeId); setStore(s); })
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return <Spinner />;
  if (!store) return <p className="text-muted text-center py-20">Sucursal no encontrada.</p>;

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest mb-4 hover:-translate-x-1 transition-transform">
          <ArrowLeft size={14}/> Volver a Sucursales
        </button>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-700 border border-card flex items-center justify-center overflow-hidden flex-shrink-0">
            {store.image_url ? <img src={`/api/${store.image_url}`} className="w-full h-full object-cover"/> : <Store size={36} className="text-muted"/>}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-black tracking-tight">{store.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${store.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700'}`}>
                {store.status === 'active' ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <p className="text-muted text-sm font-medium">{store.address}, {store.city}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-card border border-card rounded-2xl p-1.5 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-muted hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-5 }}>
          {activeTab === 'overview'  && <OverviewTab store={store} />}
          {activeTab === 'products'  && <ProductsTab storeId={storeId} />}
          {activeTab === 'orders'    && <OrdersTab storeId={storeId} />}
          {activeTab === 'citas'     && <CitasTab storeId={storeId} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default StoreDetail;
