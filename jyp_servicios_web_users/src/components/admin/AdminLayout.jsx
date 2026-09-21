import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, Package,
  Store, LogOut, ChevronLeft, ChevronRight,
  Shield, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin',           label: 'Dashboard',        icon: LayoutDashboard, color: 'text-[#3B28FF]' },
  { to: '/admin/citas',     label: 'Citas & Servicios',icon: Calendar,        color: 'text-blue-400' },
  { to: '/admin/usuarios',  label: 'Usuarios',         icon: Users,           color: 'text-indigo-400' },
  { to: '/admin/pedidos',   label: 'Pedidos',          icon: Package,         color: 'text-emerald-400' },
  { to: '/admin/sucursales',label: 'Sucursales J&P',   icon: Store,           color: 'text-rose-400' },
];

const AdminLayout = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#020306] text-white font-[Plus_Jakarta_Sans] overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 268 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="fixed left-0 top-0 h-full z-40 flex flex-col border-r border-white/5 overflow-hidden"
        style={{ background: 'rgba(6,6,18,0.97)', backdropFilter: 'blur(24px)' }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-white/5 h-20 shrink-0">
          <div className="w-10 h-10 bg-[#3B28FF] rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(59,40,255,0.4)]">
            <Shield size={20} fill="white" stroke="white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="font-black text-lg tracking-tight">
                  JyP <span className="text-[#3B28FF] italic">Admin</span>
                </span>
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.25em]">Panel de Control</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative group ${
                  active
                    ? 'bg-[#3B28FF]/15 text-white'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* Active bar */}
                {active && (
                  <motion.span
                    layoutId="admin-active"
                    className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#3B28FF] rounded-full"
                  />
                )}
                <div className={`shrink-0 ${active ? item.color : ''}`}>
                  <item.icon size={20} />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-bold text-sm whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/5 space-y-2 shrink-0">
          {/* User card */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-3 rounded-xl bg-white/3 border border-white/5 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3B28FF] to-indigo-700 flex items-center justify-center font-black text-sm shadow-lg shrink-0">
                  {user?.names?.[0] || user?.username?.[0] || 'A'}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-black truncate leading-tight">{user?.names || user?.username || 'Admin'}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Administrador</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-bold"
          >
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Colapsar</span></>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/8 rounded-xl transition-all text-sm font-bold"
          >
            <LogOut size={18} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Salir
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main
        className="flex-1 overflow-x-hidden transition-all duration-300"
        style={{ marginLeft: collapsed ? 80 : 268 }}
      >
        {/* Topbar */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 sticky top-0 z-30"
          style={{ background: 'rgba(2,3,6,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-[#3B28FF]" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
              JyP Services —
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#3B28FF]">
              {NAV_ITEMS.find(n => isActive(n.to))?.label || 'Panel Admin'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-600 font-bold">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B28FF] to-indigo-700 flex items-center justify-center font-black text-xs shadow-lg">
              {user?.names?.[0] || user?.username?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 min-h-[calc(100vh-5rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
