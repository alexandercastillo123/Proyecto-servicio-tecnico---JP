import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Store, Package, ShoppingBag, Calendar, MapPin, Phone, Mail,
  Clock, Edit2, Trash2, Plus, Image as ImageIcon, Tag, User, ChevronDown, CheckCircle, XCircle, MoreVertical, ExternalLink, ShieldCheck, Layers
} from 'lucide-react';
import { storeService, adminService } from './services/api';
import { getImageUrl } from './utils/urlUtils';

// ─────────────────────────── TABS ──────────────────────────────
const TABS = [
  { id: 'overview', label: 'Centro de Operaciones', icon: Store },
  { id: 'products', label: 'Catálogo de Productos', icon: Package },
  { id: 'orders', label: 'Ventas & Logística', icon: ShoppingBag },
  { id: 'citas', label: 'Agenda de Servicios', icon: Calendar },
];

// ─────────────────────────── OVERVIEW TAB ──────────────────────
const OverviewTab = ({ store }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
    <div className="glass-card !p-10 space-y-8 border-white/40 shadow-xl">
      <SectionLabel color="primary" icon={<Phone size={14}/>}>Gestión de Contacto</SectionLabel>
      <div className="grid grid-cols-1 gap-6">
        <InfoRow icon={<Phone size={18} />} label="Línea Telefónica" value={store.phone} />
        <InfoRow icon={<Mail size={18} />} label="Correo Corporativo" value={store.email} />
        <InfoRow icon={<MapPin size={18} />} label="Geolocalización" value={`${store.address}, ${store.city}`} />
        <InfoRow icon={<Clock size={18} />} label="Ventana Operativa" value={`${store.opening_time?.slice(0, 5)} - ${store.closing_time?.slice(0, 5)}`} />
      </div>
    </div>
    
    <div className="glass-card !p-10 space-y-8 border-white/40 shadow-xl">
      <SectionLabel color="indigo" icon={<ShieldCheck size={14}/>}>Estado de la Unidad</SectionLabel>
      <div className="flex items-center justify-between bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${store.status === 'active' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]'} animate-pulse`} />
          <span className="font-black text-lg tracking-tight">{store.status === 'active' ? 'Operativo Global' : 'Mantenimiento / Inactivo'}</span>
        </div>
        <StatusBadge status={store.status} />
      </div>
      
      <div className="space-y-4">
        <SectionLabel color="rose" icon={<Tag size={14}/>}>Especialidades & Alcance</SectionLabel>
        <p className="font-black text-primary text-sm uppercase tracking-widest">{store.specialties || 'Servicio Técnico Integral'}</p>
        {store.description && (
          <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem]">
            <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-60">Reseña Institucional</p>
            <p className="text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300 italic">"{store.description}"</p>
          </div>
        )}
      </div>
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
    <h4 className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 pb-4 border-b ${colors[color] || 'text-slate-400 border-slate-100'}`}>
      <span className="opacity-70">{icon}</span> {children}
    </h4>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-6 group">
    <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">{icon}</div>
    <div>
      <p className="text-muted text-[10px] font-black uppercase tracking-[0.22em] mb-1 opacity-50">{label}</p>
      <p className="font-black text-base text-slate-800 dark:text-slate-100 tracking-tight">{value || 'No Aplicable'}</p>
    </div>
  </div>
);

// ─────────────────────────── PRODUCTS TAB ──────────────────────
const ProductsTab = ({ storeId, isAdmin }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const emptyForm = { name: '', description: '', price: '', image_url: '', category: '', brand: '', sku: '', is_available: true };
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

  const handleEdit = (p) => { setEditingId(p.id); setForm({ name: p.name, description: p.description || '', price: p.price, image_url: p.image_url || '', category: p.category || '', brand: p.brand || '', sku: p.sku || '', is_available: p.is_available ?? true }); setShowForm(true); };
  const handleDelete = async (id) => { if (!window.confirm('¿Eliminar este producto?')) return; await storeService.deleteProduct(id); fetchProducts(); };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center glass-card !p-10 border-white/30 shadow-2xl">
        <div className="space-y-2">
          <SectionLabel color="primary" icon={<Package size={14}/>}>Catálogo Activo</SectionLabel>
          <h3 className="font-black text-3xl tracking-tighter text-slate-900 dark:text-white">Inventario Estratégico</h3>
          <p className="text-muted font-semibold text-base">Gestión y control de disponibilidad de hardware y repuestos.</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className={`btn-primary !px-8 !py-5 !rounded-2xl shadow-xl transition-all ${showForm ? '!bg-rose-500 hover:!bg-rose-600' : ''}`}>
            {showForm ? <XCircle size={20} /> : <Plus size={20} />}
            <span className="ml-2 font-black tracking-widest uppercase text-[11px]">{showForm ? 'Cancelar Edición' : 'Agregar Referencia'}</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card !p-12 shadow-3xl">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-10 border-b border-slate-100 dark:border-white/5 pb-6">
              {editingId ? 'Refinar Especificaciones' : 'Apertura de Nuevo Item'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField label="Denominación del Producto" required value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                  <FormField label="Categoría Técnica" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
                </div>
                <FormField label="Descripción Detallada" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} textarea />
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/10">
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white">Estado de Disponibilidad</h4>
                    <p className="text-[11px] text-muted font-medium mt-1">Si se desactiva, los clientes no podrán cotizar este artículo.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FormField label="Precio Base (S/)" type="number" step="0.01" required value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} />
                  <FormField label="Marca / Fabricante" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} />
                  <FormField label="SKU / Identificador" value={form.sku} onChange={v => setForm(f => ({ ...f, sku: v }))} />
                </div>
              </div>
              
              <div className="lg:col-span-4 space-y-8 flex flex-col justify-between">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-6 tracking-[0.3em]">Identidad del Item</label>
                  <div className="flex flex-col gap-6 items-center">
                    <div className="w-full h-56 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner group">
                      {form.image_url ? <img src={getImageUrl(form.image_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <ImageIcon className="text-slate-300" size={56} />}
                    </div>
                    <div className="w-full space-y-3">
                      <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="pimg" />
                      <label htmlFor="pimg" className="flex items-center justify-center w-full py-5 rounded-2xl bg-primary/5 text-primary text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-primary hover:text-white transition-all border border-primary/10 shadow-sm">
                        {uploading ? 'Capturando Multimedia...' : 'Vincular Fotografía'}
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-10">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="flex-1 py-5 rounded-[1.5rem] bg-slate-100 dark:bg-white/5 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 transition-all">Descartar</button>
                  <button type="submit" className="flex-2 py-5 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">Guardar Cambios</button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card !p-0 overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-white/20">
            <div className="h-48 bg-slate-100 dark:bg-white/5 relative overflow-hidden flex items-center justify-center">
              {p.image_url ? <img src={getImageUrl(p.image_url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /> : <ImageIcon size={48} className="text-slate-200 dark:text-slate-700" />}
                {!isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <button onClick={() => handleEdit(p)} className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 text-primary shadow-xl hover:scale-110 active:scale-95 transition-all"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2.5 rounded-xl bg-rose-500 text-white shadow-xl hover:scale-110 active:scale-95 transition-all"><Trash2 size={14} /></button>
                  </div>
                )}
              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">{p.category || 'General'}</span>
              </div>
            </div>
            <div className="p-7 space-y-4">
              <div>
                <h4 className="font-black text-lg text-slate-800 dark:text-white leading-tight line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h4>
                <p className="text-muted text-[11px] font-bold uppercase tracking-widest mt-1 opacity-60">{p.brand || 'Original J&P'}</p>
              </div>
              <p className="text-muted text-xs font-semibold line-clamp-2 leading-relaxed h-10">{p.description || 'Especificaciones técnicas no detalladas para este módulo.'}</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                <span className="text-2xl font-black text-primary tracking-tighter">S/ {parseFloat(p.price).toFixed(2)}</span>
                <span className="text-[9px] font-black text-slate-400 font-mono tracking-tighter uppercase">{p.sku || 'ID-'+p.id}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {products.length === 0 && !showForm && <EmptyState icon={<Package size={48} />} text="Sincronización de inventario vacía." />}
    </div>
  );
};

// ─────────────────────────── ORDERS TAB ──────────────────────
const OrdersTab = ({ storeId, isAdmin }) => {
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
    <div className="space-y-6">
      {orders.map((o, i) => (
        <motion.div key={o.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card !p-8 flex flex-col lg:flex-row gap-10 lg:items-center hover:shadow-2xl hover:border-primary/20 transition-all border-white/40">
          <div className="lg:w-48 space-y-3">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Orden Central</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-primary bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">#ORD-{o.id}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold italic translate-x-1">{new Date(o.created_at).toLocaleString('es-PE')}</p>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h4 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-3">
                {o.product_name} <span className="text-primary text-sm bg-primary/5 px-2.5 py-1 rounded-lg">×{o.quantity}</span>
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400"><User size={14} /></div>
                <span>{o.client_names} {o.client_surnames}</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                <span>{o.client_phone}</span>
              </div>
              {o.delivery_address && (
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-400 md:col-span-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400"><MapPin size={14} /></div>
                  <span className="truncate">{o.delivery_address}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:text-right space-y-2 h-full flex flex-col justify-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Liquidación</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">S/ {parseFloat(o.total_price).toFixed(2)}</p>
          </div>
          
          <div className="lg:w-56 pt-6 lg:pt-0">
             <div className="relative group">
                <select value={o.status} onChange={e => handleStatus(o.id, e.target.value)}
                  disabled={isAdmin}
                  className={`w-full appearance-none px-6 py-4 rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.2em] outline-none transition-all border-2 ${isAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
                    ${o.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400' :
                    o.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400' : 
                    'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400'}`}>
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                {!isAdmin && <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><ChevronDown size={14} /></div>}
             </div>
          </div>
        </motion.div>
      ))}
      {orders.length === 0 && <EmptyState icon={<ShoppingBag size={48} />} text="Sin transacciones logísticas activas." />}
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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {citas.map((c, i) => (
        <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card !p-8 flex flex-col md:flex-row gap-8 md:items-center hover:border-primary/30 transition-all shadow-lg">
          <div className="md:w-32 space-y-2">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Registro Cita</p>
            <span className="font-mono text-sm font-black text-primary">#CIT-{c.id}</span>
          </div>
          <div className="flex-1 space-y-3">
            <h4 className="font-black text-lg text-slate-900 dark:text-white">{c.client_names} {c.client_surnames}</h4>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 italic">
              <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">{c.service_type || 'General'}</span>
              <span className="truncate max-w-sm">{c.description || 'Sin notas descriptivas en el ticket.'}</span>
            </div>
          </div>
          <div className="flex flex-col md:items-end gap-1">
            <div className="flex items-center gap-3 bg-primary/5 px-5 py-2.5 rounded-2xl border border-primary/10 shadow-sm">
                <Calendar size={16} className="text-primary" />
                <span className="font-black text-sm text-slate-800 dark:text-slate-100">{new Date(c.scheduled_date).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' })}</span>
                <span className="text-primary font-black opacity-30 text-lg">/</span>
                <span className="font-black text-sm text-slate-800 dark:text-slate-100">{c.scheduled_time?.slice(0, 5)}</span>
            </div>
            <StatusBadge status={c.status} />
          </div>
        </motion.div>
      ))}
      {citas.length === 0 && <EmptyState icon={<Calendar size={48} />} text="Agenda de servicios disponible." />}
    </div>
  );
};

// ─────────────────────────── HELPERS ──────────────────────────
const FormField = ({ label, value, onChange, required, type = 'text', step, textarea, icon }) => (
  <div className="space-y-2">
    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">{label}</label>
    <div className="relative group">
      {textarea
        ? <textarea required={required} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-sm font-semibold h-32 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none transition-all shadow-sm" value={value} onChange={e => onChange(e.target.value)} />
        : <input type={type} step={step} required={required} className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-sm font-black focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm" value={value} onChange={e => onChange(e.target.value)} />
      }
    </div>
  </div>
);

const Spinner = () => (
  <div className="py-24 text-center">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-2xl shadow-primary/20" />
    <p className="mt-6 text-[11px] font-black uppercase text-primary tracking-[0.4em] animate-pulse">Consultando Protocolos...</p>
  </div>
);

const EmptyState = ({ icon, text }) => (
  <div className="py-24 text-center glass-card border border-dashed border-slate-200 dark:border-white/10 !rounded-[3rem]">
    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-inner">{icon}</div>
    <p className="text-slate-500 font-black text-sm uppercase tracking-[0.2em]">{text}</p>
  </div>
);

const StatusBadge = ({ status }) => {
    const labels = { pending: 'Pendiente', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada', cancellation_pending: 'Cancelación Pendiente', active: 'Activo', inactive: 'Inactivo' };
    const styles = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50',
        confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200/50',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50',
        cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/50',
        cancellation_pending: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200/50',
        active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50',
        inactive: 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-400 border-slate-200/50'
    };
    return (
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles.inactive}`}>
            {labels[status] || status}
        </span>
    );
};

const StoreDetail = ({ storeId, user, onBack }) => {
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(urlTab || 'overview');
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/sucursales/${storeId}/${tabId}`);
  };

  useEffect(() => {
    storeService.getBranches()
      .then(r => { 
        const s = (r.data.resultado || []).find(x => Number(x.id) === Number(storeId)); 
        setStore(s); 
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return <Spinner />;
  if (!store) return <p className="text-muted text-center py-24 text-xs font-black uppercase tracking-[0.3em]">Nodo Desconectado del Sistema.</p>;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
      {/* Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.3em] mb-8 hover:-translate-x-2 transition-transform group">
          <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary group-hover:text-white transition-colors"><ArrowLeft size={16} /></div> 
          Infraestructura de Red
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center gap-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-white/5 border-4 border-white/20 shadow-3xl flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            {store.image_url ? <img src={getImageUrl(store.image_url)} className="w-full h-full object-cover" /> : <Store size={48} className="text-primary/20" />}
          </motion.div>
          <div className="space-y-3">
             <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{store.name}</h1>
                <StatusBadge status={store.status} />
             </div>
             <div className="flex items-center gap-6 text-base font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-2.5"><MapPin size={18} className="text-primary" /> {store.address}, {store.city}</span>
                <span className="flex items-center gap-2.5"><Phone size={18} className="text-primary" /> {store.phone}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 p-2.5 bg-white/50 dark:bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] w-fit shadow-2xl overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === t.id ? 'bg-primary text-white shadow-2xl shadow-primary/40 scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-300'}`}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div 
           key={activeTab} 
           initial={{ opacity: 0, scale: 0.98, y: 10 }} 
           animate={{ opacity: 1, scale: 1, y: 0 }} 
           exit={{ opacity: 0, scale: 1.02, y: -10 }}
           transition={{ duration: 0.4, ease: "circOut" }}
           className="min-h-[400px]"
        >
          {activeTab === 'overview' && <OverviewTab store={store} />}
          {activeTab === 'products' && <ProductsTab storeId={storeId} isAdmin={isAdmin} />}
          {activeTab === 'orders' && <OrdersTab storeId={storeId} isAdmin={isAdmin} />}
          {activeTab === 'citas' && <CitasTab storeId={storeId} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default StoreDetail;
