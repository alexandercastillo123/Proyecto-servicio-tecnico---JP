import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, Store, TrendingUp, ChevronRight,
  Eye, Clock, CheckCircle, XCircle, AlertCircle, Package
} from 'lucide-react';
import { adminService } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

/* ─── Constants ─────────────────────────────────────── */
const STATUS_LABELS = {
  pending: 'Pendiente', on_the_way: 'En camino', arrived: 'En sitio',
  in_progress: 'En progreso', confirmed: 'Confirmada', completed: 'Completado',
  cancelled: 'Cancelada', cancellation_pending: 'Cancel.Pend.', expired: 'Expirada'
};
const STATUS_COLORS = {
  pending: '#FBBF24', on_the_way: '#60A5FA', arrived: '#A5B4FC',
  in_progress: '#C4B5FD', confirmed: '#818CF8', completed: '#10B981',
  cancelled: '#FB7185', cancellation_pending: '#FB923C', expired: '#94A3B8'
};
const ROLE_COLORS = ['#3B28FF', '#8B5CF6', '#EC4899', '#10B981'];
const ROLE_LABELS = { client: 'Clientes', tech: 'Técnicos', store: 'Tiendas', admin: 'Admins' };

/* ─── Helper Components ──────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cls = `status-badge status-${status}`;
  return <span className={cls}>{STATUS_LABELS[status] || status}</span>;
};

const StatCard = ({ icon, label, value, desc, color }) => (
  <motion.div whileHover={{ y: -4 }} className="admin-stat-card">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-1">{desc}</p>
    </div>
  </motion.div>
);

/* ─── Appointment Modal ──────────────────────────────── */
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
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0D0F1A', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#3B28FF] to-indigo-600 px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Cita #{appt.id}</p>
            <h2 className="text-white font-black text-xl">{appt.description || 'Sin descripción'}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">✕</button>
        </div>
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={appt.status} />
            {appt.price && <span className="text-xl font-black text-indigo-400">S/ {parseFloat(appt.price).toFixed(2)}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Cliente" value={`${appt.client_names || ''} ${appt.client_surnames || ''}`} />
            <InfoItem label="Técnico" value={appt.tech_names ? `${appt.tech_names} ${appt.tech_surnames || ''}` : '—'} />
            <InfoItem label="Fecha" value={new Date(appt.scheduled_date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} />
            <InfoItem label="Hora" value={appt.scheduled_time?.slice(0, 5)} />
            <InfoItem label="Tipo" value={appt.service_type === 'domicilio' ? '🏠 Domicilio' : '🏢 Local'} />
            <InfoItem label="Pago" value={appt.payment_status === 'paid' ? '✅ Pagado' : appt.payment_status === 'waiting_confirmation' ? '⏳ En revisión' : '⏱ Pendiente'} />
          </div>
          {appt.service_address && <InfoItem label="Dirección del servicio" value={appt.service_address} />}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Dashboard ──────────────────────────────────────── */
const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [aR, uR, sR] = await Promise.all([
          adminService.getAppointments({ limit: 50 }),
          adminService.getUsers(),
          adminService.getBranches(),
        ]);
        setAppointments(aR.data.resultado || []);
        setUsers(uR.data.resultado || []);
        setStores(sR.data.resultado || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const apptByStatus = Object.entries(
    appointments.reduce((a, x) => { a[x.status] = (a[x.status] || 0) + 1; return a; }, {})
  ).map(([status, count]) => ({ name: STATUS_LABELS[status] || status, count, fill: STATUS_COLORS[status] || '#94A3B8' }));

  const usersByRole = Object.entries(
    users.reduce((a, u) => { a[u.role] = (a[u.role] || 0) + 1; return a; }, {})
  ).map(([role, value], i) => ({ name: ROLE_LABELS[role] || role, value, fill: ROLE_COLORS[i % 4] }));

  const tick = { fill: '#64748B', fontSize: 10, fontWeight: 700 };
  const tooltipStyle = { background: '#0D0F1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontWeight: 700, fontSize: 12, color: '#fff' };

  const recentAppts = appointments.slice(0, 8);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Page title */}
      <div className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3B28FF] mb-2 flex items-center gap-2">
          <TrendingUp size={12} /> Centro de Control
        </p>
        <h1 className="text-4xl font-black tracking-tighter text-white">
          JyP <span className="text-[#3B28FF] italic">Dashboard</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-semibold">Vista general del ecosistema de servicios técnicos.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-[#3B28FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            <StatCard
              icon={<Calendar size={26} className="text-white" />}
              label="Citas Totales" value={appointments.length} desc="Servicios registrados"
              color="bg-[#3B28FF]/20"
            />
            <StatCard
              icon={<Users size={26} className="text-white" />}
              label="Usuarios" value={users.length} desc="Ecosistema completo"
              color="bg-indigo-500/20"
            />
            <StatCard
              icon={<Store size={26} className="text-white" />}
              label="Sucursales" value={stores.length} desc="Puntos de atención"
              color="bg-emerald-500/20"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-blue-400" />
                <h3 className="font-black text-sm text-white">Citas por Estado</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={apptByStatus} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {apptByStatus.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-5">
                <Users size={16} className="text-indigo-400" />
                <h3 className="font-black text-sm text-white">Usuarios por Rol</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={usersByRole} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={65} paddingAngle={3}>
                    {usersByRole.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>{v}</span>} />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-white">Actividad Reciente</h3>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">Últimas citas del sistema</p>
              </div>
              <Link to="/admin/citas" className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#3B28FF] hover:text-white transition-colors">
                Ver todas <ChevronRight size={13} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Cliente</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppts.map((a, i) => (
                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedAppt(a)}>
                      <td><span className="font-mono text-xs font-bold text-[#3B28FF]">#{a.id}</span></td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-300">
                            {(a.client_names || '?')[0]}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">{a.client_names} {a.client_surnames}</div>
                            <div className="text-[10px] text-slate-500">{a.client_email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-xs font-bold">{a.service_type === 'domicilio' ? '🏠 Domicilio' : '🏢 Local'}</span></td>
                      <td>
                        <div className="font-bold text-sm">{new Date(a.scheduled_date).toLocaleDateString('es-PE')}</div>
                        <div className="text-xs text-slate-500">{a.scheduled_time}</div>
                      </td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>
                        <button className="w-8 h-8 rounded-xl bg-[#3B28FF]/10 text-[#3B28FF] flex items-center justify-center hover:bg-[#3B28FF] hover:text-white transition-all">
                          <Eye size={13} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {recentAppts.length === 0 && (
                <div className="py-16 text-center text-slate-600 font-bold text-sm">No hay citas registradas.</div>
              )}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedAppt && <ApptModal appt={selectedAppt} onClose={() => setSelectedAppt(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
