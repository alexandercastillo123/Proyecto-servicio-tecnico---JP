import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Eye, MapPin, Filter } from 'lucide-react';
import { adminService } from '../../services/api';

const ORDER_STATUS_LABELS = {
  pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'En camino',
  delivered: 'Entregado', completed: 'Completado', cancelled: 'Cancelado'
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>
    {ORDER_STATUS_LABELS[status] || status}
  </span>
);

/* ─── Order Detail Modal ─────────────────────────────── */
const OrderModal = ({ order, onClose }) => {
  if (!order) return null;
  const InfoItem = ({ label, value }) => (
    <div className="rounded-xl px-4 py-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{value || '—'}</p>
    </div>
  );
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
        className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-8 py-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}>
          <div>
            <p className="text-emerald-100 text-xs font-black uppercase tracking-widest">Pedido #{order.id}</p>
            <h2 className="text-white font-black text-xl">{order.product_name}</h2>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm font-bold transition-all">
            ✕
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <span className="text-2xl font-black text-emerald-400">S/ {parseFloat(order.total_price).toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Cliente</p>
              <InfoItem label="Nombre completo" value={`${order.client_names} ${order.client_surnames}`} />
              <InfoItem label="Email"            value={order.client_email} />
              <InfoItem label="Teléfono"         value={order.client_phone} />
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Tienda</p>
              <InfoItem label="Sucursal"          value={order.store_name} />
              <InfoItem label="Dirección tienda"  value={order.store_address} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Entrega</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoItem label="Dirección de envío" value={order.delivery_address || 'Recojo en tienda'} />
              <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin size={15} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Coordenadas</p>
                  <p className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{order.latitude}, {order.longitude}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <InfoItem label="Cantidad"   value={order.quantity} />
            <InfoItem label="Fecha"      value={new Date(order.created_at).toLocaleDateString('es-PE')} />
            <InfoItem label="Pago"       value={order.payment_method?.toUpperCase() || '—'} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Component ─────────────────────────────────── */
const AdminOrders = () => {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected,     setSelected]     = useState(null);

  useEffect(() => {
    adminService.getOrders()
      .then(r => { setOrders(r.data.resultado || []); setLoading(false); })
      .catch(()  => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${o.client_names} ${o.client_surnames} ${o.product_name} ${o.store_name}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2" style={{ color: 'var(--secondary)' }}>
          <Package size={12} /> Logística
        </p>
        <h1 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
          Gestión de <span className="italic" style={{ color: 'var(--secondary)' }}>Pedidos</span>
        </h1>
        <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Control general de ventas y envíos de productos.</p>
      </div>

      {/* Revenue mini-card */}
      {!loading && filtered.length > 0 && (
        <div className="mb-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Facturación filtrada</span>
          <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>S/ {totalRevenue.toFixed(2)}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por cliente, producto o tienda..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select">
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="shipped">En camino</option>
          <option value="delivered">Entregado</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
            </span>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Cliente</th><th>Tienda</th><th>Producto</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <motion.tr key={o.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelected(o)}
                  >
                    <td><span className="font-mono text-xs font-bold text-emerald-400">#{o.id}</span></td>
                    <td>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{o.client_names} {o.client_surnames}</div>
                    </td>
                    <td className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{o.store_name}</td>
                    <td>
                      <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{o.product_name}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cant: {o.quantity}</div>
                    </td>
                    <td>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{new Date(o.created_at).toLocaleDateString('es-PE')}</div>
                    </td>
                    <td><span className="font-black text-emerald-400">S/ {parseFloat(o.total_price).toFixed(2)}</span></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <button className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                        <Eye size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center font-bold text-sm" style={{ color: 'var(--text-muted)' }}>No se encontraron pedidos.</div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && <OrderModal order={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminOrders;
