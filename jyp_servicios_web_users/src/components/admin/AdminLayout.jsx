import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, Package,
  Store, LogOut, ChevronLeft, ChevronRight,
  Shield, Cpu, Sun, Moon, Zap, Menu, X, Activity, ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/admin',           label: 'Centro de Comando', icon: LayoutDashboard },
  { to: '/admin/citas',     label: 'Citas & Servicios', icon: Calendar },
  { to: '/admin/usuarios',  label: 'Control Usuarios',  icon: Users },
  { to: '/admin/pedidos',   label: 'Pedidos & Repuestos', icon: Package },
  { to: '/admin/sucursales',label: 'Talleres & Red',    icon: Store },
];

const AdminLayout = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (path) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const SIDEBAR_W = collapsed ? 80 : 268;

  return (
    <div
      className="flex min-h-screen overflow-hidden bg-[#080d17] text-[#f8fafc] font-sans"
    >
      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] z-50 flex flex-col bg-[#0b1220]/95 border-r border-white/10 backdrop-blur-2xl md:hidden"
            >
              <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Cpu size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight font-heading">JyP ADMIN</h3>
                    <p className="text-[9px] uppercase tracking-widest text-cyan-400 font-bold">Consola Maestra</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${
                        active
                          ? "bg-blue-600/20 text-white font-bold border-l-4 border-cyan-400 shadow-[0_0_20px_rgba(37,99,235,0.25)]"
                          : "text-slate-400 hover:text-white hover:bg-white/5 font-semibold"
                      }`}
                    >
                      <Icon size={19} className={active ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "text-slate-400"} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 text-sm font-semibold transition-all"
                >
                  <LogOut size={18} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: SIDEBAR_W }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="fixed left-0 top-0 h-full z-40 hidden md:flex flex-col overflow-hidden bg-[#090f1d]/90 border-r border-white/10 backdrop-blur-2xl"
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 h-[72px] shrink-0 border-b border-white/10">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Cpu size={20} color="white" strokeWidth={2.3} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap min-w-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight font-heading text-white">
                    JyP
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    ADMIN
                  </span>
                </div>
                <p className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-[0.16em] leading-none mt-0.5">
                  Consola Central
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Módulos Administrativos
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-200 relative group ${
                  active
                    ? 'bg-blue-600/20 text-white font-bold border-l-4 border-cyan-400 shadow-[0_0_20px_rgba(37,99,235,0.25)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent font-medium'
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={`shrink-0 ${active ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-slate-400'}`}
                />
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
        <div className="p-3.5 border-t border-white/10 space-y-2 shrink-0">
          {/* Telemetry Status */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                  <span className="text-[11px] text-emerald-400 font-extrabold">Servidor Operativo</span>
                </div>
                <Activity size={13} className="text-slate-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* User card */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-sm text-white shadow-lg shrink-0">
                  {user?.names?.[0] || user?.username?.[0] || 'A'}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-xs font-black truncate leading-tight text-white font-heading">
                    {[user?.names, user?.surnames].filter(Boolean).join(' ').trim() || user?.username || 'Admin'}
                  </p>
                  <p className="text-[9px] text-amber-400 uppercase font-bold tracking-wider mt-0.5">Super Admin</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm font-semibold"
          >
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Contraer Menú</span></>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all text-sm font-semibold"
          >
            <LogOut size={18} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Cerrar Sesión
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className="flex-1 min-h-screen flex flex-col overflow-x-hidden transition-all duration-300"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? SIDEBAR_W : 0,
          background: "radial-gradient(ellipse at 85% 5%, rgba(37, 99, 235, 0.12) 0%, transparent 45%), radial-gradient(ellipse at 15% 40%, rgba(6, 182, 212, 0.08) 0%, transparent 40%), #080d17"
        }}
      >
        {/* Topbar */}
        <header
          className="h-[72px] px-4 sm:px-6 md:px-8 flex items-center justify-between border-b border-white/10 sticky top-0 z-30 shrink-0 bg-[#080d17]/85 backdrop-blur-2xl"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-slate-300 md:hidden hover:text-white"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-cyan-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:inline">
                JyP Infraestructura —
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400">
                {NAV_ITEMS.find(n => isActive(n.to))?.label || 'Panel Admin'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-slate-300 text-xs font-bold">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Modo Root Concedido</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-xs text-white shadow-lg">
              {user?.names?.[0] || user?.username?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
