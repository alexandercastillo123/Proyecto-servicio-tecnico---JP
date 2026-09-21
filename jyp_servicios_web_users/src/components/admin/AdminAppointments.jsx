import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Search, Eye, Filter } from 'lucide-react';
import { adminService } from '../../services/api';

/* ─── Constants ─────────────────────────────────────── */
const STATUS_LABELS = {
  pending: 'Pendiente', on_the_way: 'En camino 🚚', arrived: 'En sitio 📍',
  in_progress: 'En progreso 🛠', confirmed: 'Confirmada', completed: 'Terminado 🎉',
  cancelled: 'Cancelada', cancellation_pending: 'Cancel. Pend.', expired: 'Expirada'
};

const ORDER_STATUS_LABELS = {
  pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'En camino',
  delivered: 'Entregado', completed: 'Completado', cancelled: 'Cancelado'
};

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-${status}`}>
    {STATUS_LABELS[status] || ORDER_STATUS_LABELS[status] || status}
  </span>
);

/* ─── Detail Modal ───────────────────────────────────── */
const ApptModal = ({ appt, onClose }) => {
  if (!appt) return null;
  const InfoItem = ({ label, value }) => (
    <div className="bg-white/4 rounded-xl px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="font-bold text-sm text-white">{value || '—'}</p>
    </div>
  );
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0D0F1A', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Cita #{appt.id}</p>
            <h2 className="text-white font-black text-xl">{appt.description || 'Sin descripción'}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all text-sm font-bold">✕</button>
        </div>
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={appt.status} />
            {appt.price && <span className="text-xl font-black text-blue-400">S/ {parseFloat(appt.price).toFixed(2)}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Cliente" value={`${appt.client_names || ''} ${appt.client_surnames || ''}`} />
            <InfoItem label="Técnico" value={appt.tech_names ? `${appt.tech_names} ${appt.tech_surnames || ''}` : '—'} />
            <InfoItem label="Fecha" value={new Date(appt.scheduled_date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} />
            <InfoItem label="Hora" value={appt.scheduled_time?.slice(0, 5)} />
            <InfoItem label="Tipo" value={appt.service_type === 'domicilio' ? '🏠 Domicilio' : '🏢 Local'} />
            <InfoItem label="Pago" value={
              appt.payment_status === 'paid' ? '✅ Pagado' :
              appt.payment_status === 'waiting_confirmation' ? '⏳ En revisión' : '⏱ Pendiente'
            } />
          </div>
          {appt.service_address && <InfoItem label="Dirección del servicio" value={appt.service_address} />}
          {appt.payment_method && <InfoItem label="Método de pago" value={appt.payment_method.toUpperCase()} />}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Component ─────────────────────────────────── */
const AdminAppointments = () => {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    adminService.getAppointments({ limit: 200 }).then(r => {
      setAppts(r.data.resultado || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = appts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${a.client_names} ${a.client_surnames} ${a.description || ''}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2 flex items-center gap-2">
          <Calendar size={12} /> Agenda
        </p>
        <h1 className="text-4xl font-black tracking-tighter text-white">
          Gestión de <span className="text-blue-400 italic">Citas</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-semibold">Monitorea y controla todas las citas del sistema.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por cliente o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select">
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
          <option value="on_the_way">En camino</option>
          <option value="arrived">En el sitio</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
          <option value="expired">Expirada</option>
          <option value="cancellation_pending">Cancel. Pendiente</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">
              {filtered.length} cita{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
            </span>
            <Filter size={14} className="text-slate-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Cliente</th><th>Técnico</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Precio</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelected(a)}>
                    <td><span className="font-mono text-xs font-bold text-blue-400">#{a.id}</span></td>
                    <td>
                      <div className="font-bold text-sm text-white">{a.client_names} {a.client_surnames}</div>
                      <div className="text-[10px] text-slate-500">{a.client_email}</div>
                    </td>
                    <td className="text-sm font-medium text-slate-300">
                      {a.tech_names ? `${a.tech_names} ${a.tech_surnames || ''}` : <span className="text-slate-600">—</span>}
                    </td>
                    <td><span className="text-xs font-bold">{a.service_type === 'domicilio' ? '🏠 Dom.' : '🏢 Local'}</span></td>
                    <td>
                      <div className="font-bold text-sm">{new Date(a.scheduled_date).toLocaleDateString('es-PE')}</div>
                      <div className="text-xs text-slate-500">{a.scheduled_time}</div>
                    </td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      {a.price
                        ? <span className="font-black text-blue-400">S/ {parseFloat(a.price).toFixed(2)}</span>
                        : <span className="text-slate-600 text-xs">—</span>
                      }
                    </td>
                    <td>
                      <button className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all">
                        <Eye size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-slate-600 font-bold text-sm">No se encontraron citas con ese filtro.</div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && <ApptModal appt={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminAppointments;
