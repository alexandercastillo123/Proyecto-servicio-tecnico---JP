import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Store, 
  LogOut, 
  ChevronRight,
  MapPin,
  Plus,
  X,
  Home,
  Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from './services/api';

import Login from './Login';
import StoreManagement from './StoreManagement';

// --- Dashboard Component (Summary) ---
const Dashboard = () => {
  const [stats, setStats] = useState({ appointments: 0, users: 0, stores: 0 });
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, userRes, storeRes] = await Promise.all([
          adminService.getAppointments({ limit: 8 }),
          adminService.getUsers({ role: 'client' }),
          adminService.getBranches()
        ]);
        setStats({
          appointments: appRes.data.resultado.length,
          users: userRes.data.resultado.length,
          stores: storeRes.data.resultado.length
        });
        setAppointments(appRes.data.resultado.slice(0, 8));
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
    };
    fetchData();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="stats-grid">
        <StatCard icon={<Calendar size={28} />} label="Citas Totales" value={stats.appointments} color="blue" description="Programadas este mes" />
        <StatCard icon={<Users size={28} />} label="Base de Clientes" value={stats.users} color="indigo" description="Usuarios registrados" />
        <StatCard icon={<Store size={28} />} label="Sucursales" value={stats.stores} color="emerald" description="Puntos de atención" />
      </div>

      <div className="table-container">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/40">
          <div>
            <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Actividad Reciente</h3>
            <p className="text-xs text-slate-500 font-medium">Últimas 8 citas registradas en el sistema</p>
          </div>
          <Link to="/appointments" className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition-all">
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Identificador</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Asignado a</th>
                <th>Fecha y Hora</th>
                <th>Estado Actual</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app, index) => (
                <motion.tr 
                  key={app.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="font-mono text-xs font-bold text-blue-600"># {app.id}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                        {app.client_names[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 leading-tight">{app.client_names} {app.client_surnames}</div>
                        <div className="text-[10px] text-slate-400 font-medium">@{app.client_username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                      {app.service_type === 'domicilio' ? (
                        <><Map size={14} className="text-orange-500" /> Domicilio</>
                      ) : (
                        <><Home size={14} className="text-blue-500" /> Local</>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                       <Store size={14} className="text-blue-400" />
                       <span className="font-medium">{app.store_name || `${app.tech_names} ${app.tech_surnames}`}</span>
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-700">{new Date(app.scheduled_date).toLocaleDateString()}</div>
                    <div className="text-[11px] text-slate-400">{app.scheduled_time}</div>
                  </td>
                  <td>
                    <span className={`status-badge status-${app.status}`}>
                      {app.status === 'confirmed' ? 'Confirmada' : 
                       app.status === 'pending' ? 'Pendiente' :
                       app.status === 'completed' ? 'Completado' : 'Cancelado'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, color, description }) => (
  <div className="stat-card">
    <div className={`stat-icon bg-${color}-600/10 text-${color}-600`}>
      {icon}
    </div>
    <div className="stat-info">
      <h4>{label}</h4>
      <p>{value}</p>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{description}</span>
    </div>
  </div>
);

// --- User Management Component ---
const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    adminService.getUsers().then(res => setUsers(res.data.resultado));
  }, []);

  return (
    <div className="table-container">
      <div className="px-8 py-6 border-b border-slate-100 bg-white/40">
        <h3 className="font-black text-xl text-slate-800 tracking-tight">Directorio de Usuarios</h3>
        <p className="text-xs text-slate-500 font-medium mt-1">Gestión integral de clientes y personal técnico</p>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th>Nombre y Email</th>
            <th>Nivel de Acceso</th>
            <th>Categoría</th>
            <th>Ubicación</th>
            <th>Fecha Registro</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <motion.tr 
              key={u.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-slate-50/80 transition-colors"
            >
              <td>
                <div className="font-black text-slate-800">{u.names || u.username} {u.surnames}</div>
                <div className="text-[11px] text-blue-500 font-bold">{u.email}</div>
              </td>
              <td>
                 <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                   u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                   u.role === 'tech' ? 'bg-orange-100 text-orange-700' :
                   u.role === 'store' ? 'bg-pink-100 text-pink-700' :
                   'bg-blue-100 text-blue-700'
                 }`}>
                   {u.role}
                 </span>
              </td>
              <td>
                <span className="text-xs font-semibold text-slate-500">
                  {u.person_type === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin size={12} className="text-slate-400" /> {u.city || 'S/E'}
                </div>
              </td>
              <td className="font-medium text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
    </div>
  );
};

// --- Main Layout ---
const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar shadow-2xl">
      <div className="logo-container border-b border-white/10 pb-8">
        <div className="bg-white p-2 rounded-xl shadow-lg ring-1 ring-white/20">
          <img src="/assets/logo.png" alt="JyP Logo" className="logo-img" />
        </div>
        <div className="flex flex-col">
          <span className="logo-text">JyP Dashboard</span>
          <span className="text-[10px] text-blue-400 font-black tracking-widest uppercase">Admin Panel</span>
        </div>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-2">
          <li>
            <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/appointments" className={`nav-item ${isActive('/appointments') ? 'active' : ''}`}>
              <Calendar size={20} /> Gestión de Citas
            </Link>
          </li>
          <li>
            <Link to="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`}>
              <Users size={20} /> Clientes y Técnicos
            </Link>
          </li>
          <li>
            <Link to="/stores" className={`nav-item ${isActive('/stores') ? 'active' : ''}`}>
              <Store size={20} /> Sucursales
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-auto">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg ring-1 ring-white/20">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-white truncate">{user?.username || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.2em] text-center">
          v2.4 Premium Enterprise
        </p>
      </div>
    </aside>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-blue-400 font-black text-xs uppercase tracking-widest">Cargando Ecosistema...</p>
    </div>
  );

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1 text-slate-400">
                <LayoutDashboard size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Workspace</span>
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                Panel de <span className="text-blue-600">Control</span>
              </h1>
              <p className="text-slate-500 font-medium mt-2">Monitorea el crecimiento y operaciones de JyP</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="glass-card px-6 py-3 flex items-center gap-4 border-none shadow-slate-200">
                 <div className="bg-blue-600/10 p-2.5 rounded-xl text-blue-600">
                   <Calendar size={22} strokeWidth={2.5} />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fecha Actual</p>
                   <span className="font-extrabold text-slate-800 text-sm">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                 </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors border border-slate-100">
                <div className="relative">
                  <Calendar size={20} />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></div>
                </div>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/stores" element={<StoreManagement />} />
              <Route path="/appointments" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}

export default App;
