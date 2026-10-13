import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Eye, MapPin, Filter } from 'lucide-react';
import { adminService } from '../../services/api';

/* ─── Role Config ────────────────────────────────────── */
const ROLE_LABELS  = { client: 'Cliente', tech: 'Técnico', store: 'Tienda', admin: 'Admin' };
const ROLE_COLORS  = {
  admin:  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  tech:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  store:  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  client: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

const RoleBadge = ({ role }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${ROLE_COLORS[role] || 'bg-white/5 text-slate-400'}`}>
    {ROLE_LABELS[role] || role}
  </span>
);

/* ─── User Detail Modal ──────────────────────────────── */
const UserModal = ({ user, onClose }) => {
  if (!user) return null;
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
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="px-8 py-8 text-center relative" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)' }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm font-bold transition-all">
            ✕
          </button>
          <div className="w-20 h-20 rounded-full bg-white/15 border-4 border-white/30 flex items-center justify-center mx-auto mb-4 shadow-xl text-white font-black text-3xl">
            {(user.names || user.username || '?')[0].toUpperCase()}
          </div>
          <h2 className="text-white font-black text-xl">
            {user.names ? `${user.names} ${user.surnames || ''}` : user.username}
          </h2>
          <p className="text-blue-100 text-sm mt-1">{user.email}</p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-4">
          <div className="flex justify-center mb-2">
            <RoleBadge role={user.role} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Username"    value={user.username} />
            <InfoItem label="Tipo"        value={user.person_type === 'natural' ? 'Persona Natural' : 'Persona Jurídica'} />
            <InfoItem label="Ciudad"      value={user.city} />
            <InfoItem label="Teléfono"    value={user.phone} />
            {user.dni          && <InfoItem label="DNI"          value={user.dni} />}
            {user.ruc          && <InfoItem label="RUC"          value={user.ruc} />}
            {user.company_name && <InfoItem label="Empresa"      value={user.company_name} />}
            <InfoItem label="Registro" value={new Date(user.created_at).toLocaleDateString('es-PE')} />
          </div>
          {user.address && <InfoItem label="Dirección" value={user.address} />}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Component ─────────────────────────────────── */
const AdminUsers = () => {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected,   setSelected]   = useState(null);

  useEffect(() => {
    adminService.getUsers()
      .then(r => { setUsers(r.data.resultado || []); setLoading(false); })
      .catch(()  => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${u.names || ''} ${u.surnames || ''} ${u.email} ${u.username}`.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
          <Users size={12} /> Directorio
        </p>
        <h1 className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
          Gestión de <span className="italic" style={{ color: 'var(--primary)' }}>Usuarios</span>
        </h1>
        <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>Administra clientes, técnicos, tiendas y administradores.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre, email o username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-input pl-10"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="admin-select">
          <option value="all">Todos los roles</option>
          <option value="client">Clientes</option>
          <option value="tech">Técnicos</option>
          <option value="store">Tiendas</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
            </span>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuario</th><th>Rol</th><th>Tipo Persona</th><th>Ciudad</th><th>Registro</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                    onClick={() => setSelected(u)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                          style={{ background: 'rgba(45, 107, 255, 0.1)', border: '1px solid rgba(45, 107, 255, 0.2)', color: 'var(--primary)' }}>
                          {(u.names || u.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                            {u.names ? `${u.names} ${u.surnames || ''}` : u.username}
                          </div>
                          <div className="text-[10px] font-bold" style={{ color: 'var(--primary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {u.person_type === 'natural' ? 'Natural' : 'Jurídica'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                        {u.city || '—'}
                      </div>
                    </td>
                    <td className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td>
                      <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-125"
                        style={{ background: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}>
                        <Eye size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center font-bold text-sm" style={{ color: 'var(--text-muted)' }}>No se encontraron usuarios.</div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && <UserModal user={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminUsers;
