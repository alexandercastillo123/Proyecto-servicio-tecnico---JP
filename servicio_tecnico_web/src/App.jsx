import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, Store, LogOut, Sun, Moon,
  ChevronRight, MapPin, Home, Map, TrendingUp, X, Eye,
  CheckCircle, XCircle, Clock, AlertCircle, Search, Filter, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminService, authService } from './services/api';
import Login from './Login';
import StoreManagement from './StoreManagement';

// ─── DARK MODE ────────────────────────────────────────────────
export const DarkModeContext = createContext({ dark: false, toggle: () => { } });

// ─── CONSTANTS ───────────────────────────────────────────────
const STATUS_LABELS = {
  pending: 'Pendiente', 
  on_the_way: 'En camino 🚚',
  arrived: 'En el sitio 📍', 
  in_progress: 'En progreso 🛠',
  confirmed: 'Confirmada', 
  completed: 'Terminado 🎉',
  cancelled: 'Cancelada', 
  cancellation_pending: 'Cancel. Pend.',
  expired: 'Expirada'
};
const ORDER_STATUS_LABELS = {
  pending: 'Pendiente', confirmed: 'Confirmado', shipped: 'En camino',
  delivered: 'Entregado', completed: 'Completado', cancelled: 'Cancelado'
};
const STATUS_COLORS_HEX = {
  pending: '#FBBF24', 
  on_the_way: '#3B82F6',
  arrived: '#6366F1',
  in_progress: '#8B5CF6',
  confirmed: '#3B28FF', 
  completed: '#10B981',
  cancelled: '#F43F5E', 
  cancellation_pending: '#F97316',
  expired: '#94A3B8',
  shipped: '#8B5CF6', 
  delivered: '#14B8A6'
};
const ROLE_COLORS = ['#3B28FF', '#8B5CF6', '#EC4899', '#10B981'];
const ROLE_LABELS = { client: 'Cliente', tech: 'Técnico', store: 'Tienda', admin: 'Admin' };

// ─── BADGE COMPONENT ─────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    cancellation_pending: 'status-cancellation_pending',
  };
  return (
    <span className={`status-badge ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {STATUS_LABELS[status] || ORDER_STATUS_LABELS[status] || status}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const colors = {
    admin: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
    tech: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    store: 'bg-pink-100 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400',
    client: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  };
  return (
    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[role] || 'bg-slate-100 text-slate-600'}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────
const StatCard = ({ icon, label, value, desc }) => (
  <motion.div whileHover={{ y: -8 }} className="stat-card group">
    <div className="stat-icon bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">{icon}</div>
    <div className="stat-info">
      <h4>{label}</h4>
      <p>{value}</p>
      <span className="text-[11px] text-muted font-black uppercase tracking-[0.2em]">{desc}</span>
    </div>
  </motion.div>
);

// ─── APPOINTMENT DETAIL MODAL ─────────────────────────────────
const AppointmentModal = ({ appt, onClose }) => {
  if (!appt) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-black uppercase tracking-widest">Cita #{appt.id}</p>
            <h2 className="text-white font-black text-xl">{appt.description || 'Sin descripción'}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-8 space-y-5">
          <div className="flex items-center justify-between">
            <StatusBadge status={appt.status} />
            {appt.price && <span className="text-xl font-black text-blue-600">S/ {parseFloat(appt.price).toFixed(2)}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Cliente" value={`${appt.client_names || ''} ${appt.client_surnames || ''}`} />
            <InfoItem label="Técnico" value={`${appt.tech_names || '—'} ${appt.tech_surnames || ''}`} />
            <InfoItem label="Fecha" value={new Date(appt.scheduled_date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} />
            <InfoItem label="Hora" value={appt.scheduled_time?.slice(0, 5)} />
            <InfoItem label="Tipo" value={appt.service_type === 'domicilio' ? '🏠 Domicilio' : '🏢 Local'} />
            <InfoItem label="Pago" value={appt.payment_status === 'paid' ? '✅ Pagado' : appt.payment_status === 'waiting_confirmation' ? '⏳ En revisión' : '⏱ Pendiente'} />
          </div>
          {appt.service_address && <InfoItem label="Dirección del servicio" value={appt.service_address} />}
          {appt.payment_method && <InfoItem label="Método de pago" value={appt.payment_method.toUpperCase()} />}
        </div>
      </motion.div>
    </motion.div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-4 py-3">
    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">{label}</p>
    <p className="font-bold text-sm">{value || '—'}</p>
  </div>
);

const UserModal = ({ user, onClose }) => {
  if (!user) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <X size={16} />
          </button>
          <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center mx-auto mb-4 shadow-xl text-white font-black text-3xl">
            {(user.names || user.username || '?')[0].toUpperCase()}
          </div>
          <h2 className="text-white font-black text-xl">{user.names ? `${user.names} ${user.surnames || ''}` : user.username}</h2>
          <p className="text-indigo-200 text-sm">{user.email}</p>
        </div>
        <div className="p-8 space-y-4">
          <div className="flex justify-center mb-4"><RoleBadge role={user.role} /></div>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Username" value={user.username} />
            <InfoItem label="Tipo" value={user.person_type === 'natural' ? 'Persona Natural' : 'Persona Jurídica'} />
            <InfoItem label="Ciudad" value={user.city} />
            <InfoItem label="Teléfono" value={user.phone} />
            {user.dni && <InfoItem label="DNI" value={user.dni} />}
            {user.ruc && <InfoItem label="RUC" value={user.ruc} />}
            {user.company_name && <InfoItem label="Empresa" value={user.company_name} />}
            <InfoItem label="Registro" value={new Date(user.created_at).toLocaleDateString('es-PE')} />
          </div>
          {user.address && <InfoItem label="Dirección" value={user.address} />}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── ORDER DETAIL MODAL ───────────────────────────────────────
const OrderModal = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-xs font-black uppercase tracking-widest">Pedido #{order.id}</p>
            <h2 className="text-white font-black text-xl">{order.product_name}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <X size={18} />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <span className="text-2xl font-black text-emerald-600">S/ {parseFloat(order.total_price).toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted border-b border-slate-100 dark:border-slate-700 pb-2">Información del Cliente</h3>
              <div className="space-y-3">
                <InfoItem label="Nombre completo" value={`${order.client_names} ${order.client_surnames}`} />
                <InfoItem label="Email" value={order.client_email} />
                <InfoItem label="Teléfono" value={order.client_phone} />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted border-b border-slate-100 dark:border-slate-700 pb-2">Información de la Tienda</h3>
              <div className="space-y-3">
                <InfoItem label="Nombre de Sucursal" value={order.store_name} />
                <InfoItem label="Dirección Tienda" value={order.store_address} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted border-b border-slate-100 dark:border-slate-700 pb-2">Detalles de Entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Dirección de Envío" value={order.delivery_address || 'Recojo en tienda'} />
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><MapPin size={18} /></div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-0.5">Coordenadas</p>
                  <p className="text-xs font-bold font-mono">{order.latitude}, {order.longitude}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState({ appointments: 0, users: 0, stores: 0 });
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const { dark } = useContext(DarkModeContext);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [appRes, userRes, storeRes] = await Promise.all([
          adminService.getAppointments({ limit: 50 }),
          adminService.getUsers(),
          adminService.getBranches()
        ]);
        const apps = appRes.data.resultado || [];
        const usrs = userRes.data.resultado || [];
        setStats({ appointments: apps.length, users: usrs.length, stores: (storeRes.data.resultado || []).length });
        setAppointments(apps.slice(0, 8));
        setUsers(usrs);
      } catch { }
    };
    fetch();
  }, []);

  const apptByStatus = Object.entries(
    appointments.reduce((a, x) => { a[x.status] = (a[x.status] || 0) + 1; return a; }, {})
  ).map(([status, count]) => ({ name: STATUS_LABELS[status] || status, count, fill: STATUS_COLORS_HEX[status] || '#94A3B8' }));

  const usersByRole = Object.entries(
    users.reduce((a, u) => { a[u.role] = (a[u.role] || 0) + 1; return a; }, {})
  ).map(([role, value], i) => ({ name: ROLE_LABELS[role] || role, value, fill: ROLE_COLORS[i % 4] }));

  const tick = { fill: dark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 };
  const tooltipStyle = { background: dark ? '#1E293B' : '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 12 };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
        <StatCard icon={<Calendar size={32} />} label="Citas Totales" value={stats.appointments} desc="Servicios Agendados" />
        <StatCard icon={<Users size={32} />} label="Ecosistema Usuarios" value={stats.users} desc="Total Registrados" />
        <StatCard icon={<Store size={32} />} label="Sucursales J&P" value={stats.stores} desc="Puntos de Atención" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={18} className="text-blue-500" />
            <h3 className="font-black text-base">Citas por Estado</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={apptByStatus} barCategoryGap="35%">
              <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {apptByStatus.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users size={18} className="text-indigo-500" />
            <h3 className="font-black text-base">Usuarios por Rol</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={usersByRole} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} paddingAngle={3}>
                {usersByRole.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, fontWeight: 700 }}>{v}</span>} />
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-8 py-6 border-b border-card flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg">Actividad Reciente</h3>
            <p className="text-muted text-xs font-medium mt-0.5">Últimas citas registradas</p>
          </div>
          <Link to="/citas" className="bg-slate-100 dark:bg-slate-700 text-muted px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-80 transition-all">
            Ver todas <ChevronRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {appointments.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedAppt(a)}>
                  <td className="font-mono text-xs font-bold text-blue-600">#{a.id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black">
                        {(a.client_names || '?')[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{a.client_names} {a.client_surnames}</div>
                        <div className="text-[10px] text-muted">{a.client_email || a.client_username}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="text-xs font-bold">{a.service_type === 'domicilio' ? '🏠 Domicilio' : '🏢 Local'}</span></td>
                  <td><div className="font-bold text-sm">{new Date(a.scheduled_date).toLocaleDateString('es-PE')}</div><div className="text-xs text-muted">{a.scheduled_time}</div></td>
                  <td><StatusBadge status={a.status} /></td>
                  <td><button className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"><Eye size={14} /></button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>{selectedAppt && <AppointmentModal appt={selectedAppt} onClose={() => setSelectedAppt(null)} />}</AnimatePresence>
    </motion.div>
  );
};

// ─── APPOINTMENTS PAGE ────────────────────────────────────────
const AppointmentsPage = () => {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    adminService.getAppointments({ limit: 200 }).then(r => {
      setAppts(r.data.resultado || []);
      setLoading(false);
    });
  }, []);

  const filtered = appts.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${a.client_names} ${a.client_surnames} ${a.description}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-8">
        <div className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar size={13} /> Agenda</div>
        <h1 className="text-5xl font-black tracking-tighter">Gestión de <span className="text-blue-600">Citas</span></h1>
        <p className="text-muted text-sm mt-2 font-medium">Monitorea y gestiona todas las citas del sistema.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text" placeholder="Buscar por cliente o descripción..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-card text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-5 py-3 rounded-2xl bg-card border border-card text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="on_the_way">En camino</option>
          <option value="arrived">En el sitio</option>
          <option value="in_progress">En progreso</option>
          <option value="confirmed">Confirmada</option>
          <option value="completed">Completada</option>
          <option value="cancelled">Cancelada</option>
          <option value="expired">Expirada</option>
          <option value="cancellation_pending">Cancel. Pend.</option>
        </select>
      </div>

      {loading ? <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
        <div className="glass-card overflow-hidden">
          <div className="px-8 py-4 border-b border-card flex justify-between items-center">
            <span className="text-sm font-bold text-muted">{filtered.length} cita{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th>ID</th><th>Cliente</th><th>Técnico</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Pago</th><th></th></tr></thead>
              <tbody>
                {filtered.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                    onClick={() => setSelected(a)}>
                    <td className="font-mono text-xs font-bold text-blue-600">#{a.id}</td>
                    <td><div className="font-bold text-sm">{a.client_names} {a.client_surnames}</div><div className="text-[10px] text-muted">{a.client_email}</div></td>
                    <td className="text-sm font-medium">{a.tech_names ? `${a.tech_names} ${a.tech_surnames || ''}` : <span className="text-muted">—</span>}</td>
                    <td><span className="text-xs font-bold">{a.service_type === 'domicilio' ? '🏠 Domicilio' : '🏢 Local'}</span></td>
                    <td><div className="font-bold text-sm">{new Date(a.scheduled_date).toLocaleDateString('es-PE')}</div><div className="text-xs text-muted">{a.scheduled_time}</div></td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{a.price ? <span className="font-black text-blue-600">S/ {parseFloat(a.price).toFixed(2)}</span> : <span className="text-muted text-xs">—</span>}</td>
                    <td><button className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"><Eye size={14} /></button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted font-bold">No se encontraron citas con ese filtro.</div>
          )}
        </div>
      )}
      <AnimatePresence>{selected && <AppointmentModal appt={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </motion.div>
  );
};

// ─── USERS PAGE ───────────────────────────────────────────────
const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    adminService.getUsers().then(r => { setUsers(r.data.resultado || []); setLoading(false); });
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${u.names || ''} ${u.surnames || ''} ${u.email} ${u.username}`.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-8">
        <div className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Users size={13} /> Directorio</div>
        <h1 className="text-5xl font-black tracking-tighter">Gestión de <span className="text-indigo-600">Usuarios</span></h1>
        <p className="text-muted text-sm mt-2 font-medium">Administra clientes, técnicos y administradores.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-card text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-5 py-3 rounded-2xl bg-card border border-card text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
          <option value="all">Todos los roles</option>
          <option value="client">Cliente</option>
          <option value="tech">Técnico</option>
          <option value="store">Tienda</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
        <div className="glass-card overflow-hidden">
          <div className="px-8 py-4 border-b border-card">
            <span className="text-sm font-bold text-muted">{filtered.length} usuario{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th>Nombre</th><th>Rol</th><th>Tipo Persona</th><th>Ciudad</th><th>Registro</th><th></th></tr></thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer" onClick={() => setSelected(u)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-sm flex-shrink-0">
                          {(u.names || u.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-sm">{u.names ? `${u.names} ${u.surnames || ''}` : u.username}</div>
                          <div className="text-[11px] text-blue-500 font-bold">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td className="text-sm font-medium text-muted">{u.person_type === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}</td>
                    <td><div className="flex items-center gap-1.5 text-muted font-medium text-sm"><MapPin size={12} />{u.city || '—'}</div></td>
                    <td className="text-sm text-muted font-medium">{new Date(u.created_at).toLocaleDateString('es-PE')}</td>
                    <td><button className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all"><Eye size={14} /></button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-16 text-center text-muted font-bold">No se encontraron usuarios.</div>}
        </div>
      )}
      <AnimatePresence>{selected && <UserModal user={selected} onClose={() => setSelected(null)} />}</AnimatePresence>
    </motion.div>
  );
};

// ─── ORDERS PAGE ──────────────────────────────────────────────
const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await adminService.getOrders();
        setOrders(r.data.resultado || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${o.client_names} ${o.client_surnames} ${o.product_name} ${o.store_name}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-8">
        <div className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Package size={13} /> Logística</div>
        <h1 className="text-5xl font-black tracking-tighter">Gestión de <span className="text-emerald-600">Pedidos</span></h1>
        <p className="text-muted text-sm mt-2 font-medium">Control general de ventas y envíos de productos.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Buscar por cliente, producto o tienda..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-card text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-5 py-3 rounded-2xl bg-card border border-card text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer">
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="shipped">En camino</option>
          <option value="delivered">Entregado</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {loading ? <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
        <div className="glass-card overflow-hidden">
          <div className="px-8 py-4 border-b border-card">
            <span className="text-sm font-bold text-muted">{filtered.length} pedido{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th>ID</th><th>Cliente</th><th>Tienda</th><th>Producto</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtered.map((o, i) => (
                  <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer">
                    <td className="font-mono text-xs font-bold text-emerald-600">#{o.id}</td>
                    <td><div className="font-bold text-sm">{o.client_names} {o.client_surnames}</div></td>
                    <td className="text-sm font-medium">{o.store_name}</td>
                    <td><div className="font-bold text-xs">{o.product_name}</div><div className="text-[10px] text-muted">Cant: {o.quantity}</div></td>
                    <td><div className="font-bold text-xs">{new Date(o.created_at).toLocaleDateString('es-PE')}</div></td>
                    <td><span className="font-black text-emerald-600">S/ {parseFloat(o.total_price).toFixed(2)}</span></td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      <button onClick={() => setSelectedOrder(o)} className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                        <Eye size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-16 text-center text-muted font-bold">No se encontraron pedidos.</div>}
        </div>
      )}
      <AnimatePresence>
        {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────────
const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const { dark, toggle } = useContext(DarkModeContext);

  return (
    <aside className="sidebar">
      <div className="logo-container border-b border-white/5 pb-10">
        <motion.div 
          whileHover={{ rotate: -5, scale: 1.1 }}
          className="bg-white p-3 rounded-2xl shadow-2xl ring-4 ring-white/5"
        >
          <img src="/assets/logo.png" alt="J&P" className="logo-img !w-10 !h-10" />
        </motion.div>
        <div>
          <span className="logo-text !text-xl">JyP <span className="text-primary text-2xl">Admin</span></span>
          <span className="block text-[10px] text-primary/70 font-black tracking-[0.3em] uppercase mt-1">Sistemas Globales</span>
        </div>
      </div>

      <nav className="flex-1 mt-10 space-y-2">
        {[
          { to: '/', label: 'Dashboards', icon: <LayoutDashboard size={22} /> },
          { to: '/citas', label: 'Citas & Servicios', icon: <Calendar size={22} /> },
          { to: '/usuarios', label: 'Ecosistema Usuarios', icon: <Users size={22} /> },
          { to: '/pedidos', label: 'Logística Pedidos', icon: <Package size={22} /> },
          { to: '/sucursales', label: 'Sucursales J&P', icon: <Store size={22} /> },
        ].map(item => (
          <Link key={item.to} to={item.to} className={`nav-item ${isActive(item.to) ? 'active' : ''}`}>
            {item.icon} <span className="tracking-tight">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-6">
        <button onClick={toggle}
          className="w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] bg-white/2 border border-white/5 hover:bg-white/5 transition-all group">
          <div className="flex items-center gap-3">
            {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-400" />}
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Tema {dark ? 'Luz' : 'Noche'}
            </span>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-colors duration-500 ${dark ? 'bg-primary' : 'bg-slate-700'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-500 ${dark ? 'left-7' : 'left-1'}`} />
          </div>
        </button>

        <div className="glass-card !bg-white/2 !p-5 !rounded-[1.75rem] border border-white/5 shadow-none">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-[1.1rem] bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center font-black text-white shadow-xl text-lg">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-white truncate tracking-tight">{user?.names || user?.username || 'Admin'}</p>
              <p className="text-[10px] text-slate-600 truncate font-bold uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center justify-center w-full gap-3 px-5 py-3 bg-rose-500/10 text-rose-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all duration-300">
            <LogOut size={16} /> Salir del Sistema
          </button>
        </div>
        <p className="text-[9px] text-slate-800 font-black uppercase tracking-[0.4em] text-center">Version 4.0.0-PRO</p>
      </div>
    </aside>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');

  const toggle = () => setDark(prev => {
    const next = !prev;
    localStorage.setItem('darkMode', String(next));
    return next;
  });

  useEffect(() => {
    const saved = localStorage.getItem('admin_user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  // Apply or remove .dark class on <html>
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-blue-400 font-black text-xs uppercase tracking-widest">Cargando...</p>
    </div>
  );

  if (!user) return <Login onLogin={setUser} />;

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      <Router>
        <div className="app-container">
          <Sidebar user={user} onLogout={handleLogout} />
          <main className="main-content">
            <header className="mb-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-[0.3em]">
                  <LayoutDashboard size={14} /> Gestión Administrativa
                </div>
                <h1 className="text-5xl font-black tracking-tighter leading-none text-slate-900 dark:text-white">
                  JyP <span className="text-primary italic">Workspace</span>
                </h1>
                <p className="text-muted font-semibold text-base">Plataforma central de control técnico y logístico</p>
              </div>
              <div className="glass-card px-8 py-5 flex items-center gap-5 border-white/40 shadow-2xl">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary shadow-inner">
                  <Calendar size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Operación Activa</p>
                  <span className="font-black text-base text-slate-800 dark:text-slate-100">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
              </div>
            </header>

            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/citas" element={<AppointmentsPage />} />
                <Route path="/usuarios" element={<UsersPage />} />
                <Route path="/pedidos" element={<OrdersPage />} />
                <Route path="/sucursales" element={<StoreManagement user={user} />} />
                <Route path="/sucursales/:id" element={<StoreManagement user={user} />} />
                <Route path="/sucursales/:id/:tab" element={<StoreManagement user={user} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </Router>
    </DarkModeContext.Provider>
  );
}

export default App;
