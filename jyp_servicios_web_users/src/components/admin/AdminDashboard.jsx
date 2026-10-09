import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, Store, TrendingUp, ChevronRight,
  Eye, Clock, CheckCircle, XCircle, AlertCircle, Package, Shield, Cpu
} from 'lucide-react';
import { adminService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
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
  pending: '#FBBF24', on_the_way: '#3B82F6', arrived: '#06B6D4',
  in_progress: '#00E5A0', confirmed: '#2D6BFF', completed: '#10B981',
  cancelled: '#EF4444', cancellation_pending: '#FB923C', expired: '#94A3B8'
};
const ROLE_COLORS = ['#2D6BFF', '#00E5A0', '#8B5CF6', '#F59E0B'];
const ROLE_LABELS = { client: 'Clientes', tech: 'Técnicos', store: 'Tiendas', admin: 'Admins' };

/* ─── Helper Components ──────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cls = `status-badge status-${status}`;
  return <span className={cls}>{STATUS_LABELS[status] || status}</span>;
};

const StatCard = ({ icon, label, value, desc, color, bg }) => (
  <motion.div 
    whileHover={{ y: -3 }} 
    className="p-6 rounded-2xl border shadow-sm flex items-center gap-4 transition-all"
    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
  >
    <div 
      className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 p-3"
      style={{ backgroundColor: bg, color: color }}
    >
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  </motion.div>
);

/* ─── Appointment Modal ──────────────────────────────── */
const ApptModal = ({ appt, onClose }) => {
  if (!appt) return null;
  const InfoItem = ({ label, value }) => (
    <div 
      className="rounded-xl px-4 py-3 border"
      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{value || '—'}</p>
    </div>
  );
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden border shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="px-6 py-5 flex items-center justify-between text-white"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #00C6FF 100%)' }}
        >
          <div>
            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Cita Técnica #{appt.id}</p>
            <h2 className="text-lg font-bold truncate max-w-xs">{appt.description || 'Detalle del servicio'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={appt.status} />
            {appt.price && (
              <span className="text-lg font-extrabold" style={{ color: 'var(--primary)' }}>
                S/. {parseFloat(appt.price).toFixed(2)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <InfoItem label="Cliente" value={`${appt.client_names || ''} ${appt.client_surnames || ''}`} />
            <InfoItem label="Técnico" value={appt.tech_names ? `${appt.tech_names} ${appt.tech_surnames || ''}` : '—'} />
            <InfoItem label="Fecha" value={new Date(appt.scheduled_date).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })} />
            <InfoItem label="Hora" value={appt.scheduled_time?.slice(0, 5)} />
            <InfoItem label="Tipo" value={appt.service_type === 'domicilio' ? '🏠 Domicilio' : '🏢 Local'} />
            <InfoItem label="Pago" value={appt.payment_status === 'paid' ? '✅ Pagado' : appt.payment_status === 'waiting_confirmation' ? '⏳ Por confirmar' : '⏱ Pendiente'} />
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
  const { isDark } = useTheme();

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

  const tick = { fill: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontWeight: 600 };
  const tooltipStyle = { 
    backgroundColor: 'var(--bg-card)', 
    border: '1px solid var(--border)', 
    borderRadius: 12, 
    fontWeight: 600, 
    fontSize: 12, 
    color: 'var(--text-primary)' 
  };

  const recentAppts = appointments.slice(0, 8);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-16">
      {/* Page title */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: 'var(--primary)' }}>
          <TrendingUp size={14} /> Centro de Mando
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          JyP <span style={{ color: 'var(--primary)' }}>Control Central</span>
        </h1>
        <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
          Supervisión global de operaciones técnicas, clientes y sucursales.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div 
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Calendar size={22} />}
              label="Citas Totales" 
              value={appointments.length} 
              desc="Servicios agendados"
              color="var(--primary)"
              bg="rgba(45, 107, 255, 0.1)"
            />
            <StatCard
              icon={<Users size={22} />}
              label="Usuarios Activos" 
              value={users.length} 
              desc="Ecosistema registrado"
              color="#00E5A0"
              bg="rgba(0, 229, 160, 0.1)"
            />
            <StatCard
              icon={<Store size={22} />}
              label="Sucursales" 
              value={stores.length} 
              desc="Puntos autorizados"
              color="#8B5CF6"
              bg="rgba(139, 92, 246, 0.1)"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div 
              className="lg:col-span-2 p-6 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Citas Técnicas por Estado</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={apptByStatus} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(45, 107, 255, 0.05)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {apptByStatus.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div 
              className="p-6 rounded-2xl border shadow-sm"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users size={16} style={{ color: 'var(--secondary)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Distribución de Usuarios</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={usersByRole} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={65} paddingAngle={4}>
                    {usersByRole.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>{v}</span>} />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div 
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Actividad Reciente</h3>
                <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Últimos servicios solicitados en plataforma</p>
              </div>
              <Link to="/admin/citas" className="flex items-center gap-1 text-xs font-bold hover:underline" style={{ color: 'var(--primary)' }}>
                <span>Ver todas</span>
                <ChevronRight size={13} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
                    <th className="p-4 font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ID</th>
                    <th className="p-4 font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Cliente</th>
                    <th className="p-4 font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tipo</th>
                    <th className="p-4 font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                    <th className="p-4 font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Estado</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {recentAppts.map((a, i) => (
                    <motion.tr 
                      key={a.id} 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedAppt(a)}
                      className="cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <td className="p-4 font-mono font-bold" style={{ color: 'var(--primary)' }}>#{a.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: 'var(--primary)' }}
                          >
                            {(a.client_names || '?')[0]}
                          </div>
                          <div>
                            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{a.client_names} {a.client_surnames}</div>
                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.client_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {a.service_type === 'domicilio' ? '🏠 Domicilio' : '🏢 Local'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{new Date(a.scheduled_date).toLocaleDateString('es-PE')}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.scheduled_time?.slice(0, 5)} hrs</div>
                      </td>
                      <td className="p-4"><StatusBadge status={a.status} /></td>
                      <td className="p-4 text-right">
                        <button 
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors ml-auto"
                          style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {recentAppts.length === 0 && (
                <div className="py-12 text-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  No hay citas registradas en el sistema.
                </div>
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
