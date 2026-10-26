import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Store, Calendar, ShoppingCart, MessageSquare,
  User, LogOut, ChevronLeft, ChevronRight, Bell, Sun, Moon,
  LayoutDashboard, Package, Wrench, Cpu, Zap, Signal,
  ShieldCheck, Sparkles, Activity, CheckCheck, ExternalLink,
  Clock, Truck, CalendarCheck, AlertCircle, Home, Menu, X
} from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { notificationService } from "../services/api";

/* ──── JyP Brand Logo ───────────────────────────────────────── */
const JyPLogo = ({ collapsed }) => (
  <Link to="/" className="flex items-center gap-3 overflow-hidden select-none text-decoration-none group">
    <div
      className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105"
      style={{
        background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
        boxShadow: "0 0 24px rgba(37, 99, 235, 0.45)",
      }}
    >
      <Cpu size={22} className="text-white" strokeWidth={2.3} />
      <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
    </div>

    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="min-w-0"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="font-black text-xl tracking-tight leading-none text-white font-heading"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              JyP
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
              PRO
            </span>
          </div>
          <span
            className="block text-[9px] font-extrabold uppercase tracking-[0.16em] leading-none mt-1 text-cyan-400 truncate"
          >
            Servicios Técnicos
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  </Link>
);

/* ──── Nav badge ────────────────────────────────────────────── */
const Badge = ({ count }) =>
  count > 0 ? (
    <span
      className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{
        background: "var(--error, #EF4444)",
        color: "#ffffff",
        boxShadow: "0 0 10px rgba(239, 68, 68, 0.5)",
      }}
    >
      {count}
    </span>
  ) : null;

/* ──── Main Layout ──────────────────────────────────────────── */
const Layout = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected, unreadCount, setUnreadCount } = useSocket();
  const { theme, toggleTheme, isDark } = useTheme();

  const SIDEBAR_W = collapsed ? 80 : 264;

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ── Notifications Logic ──────────────────────────────────
  const unreadNotifCount = notifications.filter(n => !n.read && !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await notificationService.getNotifications();
      const list = res.data?.resultado || res.data?.data || [];
      setNotifications(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Notifications error:', e);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
    } catch (e) { console.error(e); }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
    } catch (e) { console.error(e); }
  };

  const getNotifIcon = (type) => {
    if (type?.includes('appointment') || type?.includes('cita')) return CalendarCheck;
    if (type?.includes('order') || type?.includes('pedido')) return Truck;
    if (type?.includes('message') || type?.includes('mensaje')) return MessageSquare;
    return AlertCircle;
  };

  // ── Navigation Menus ─────────────────────────────────────
  const menus = {
    client: [
      { path: "/", icon: Home, label: "Inicio" },
      { path: "/technicians", icon: MapPin, label: "Explorar Técnicos" },
      { path: "/appointments", icon: Calendar, label: "Mis Citas" },
      { path: "/shop", icon: Package, label: "Tienda de Repuestos" },
      { path: "/order/new", icon: ShoppingCart, label: "Nuevo Pedido" },
      { path: "/stores", icon: Store, label: "Tiendas & Talleres" },
      { path: "/orders", icon: ShoppingCart, label: "Mis Pedidos" },
      { path: "/chat", icon: MessageSquare, label: "Centro de Mensajes", badge: unreadCount },
      { path: "/notifications", icon: Bell, label: "Notificaciones", badge: unreadNotifCount },
      { path: "/profile", icon: User, label: "Mi Perfil" },
    ],
    tech: [
      { path: "/", icon: Home, label: "Inicio" },
      { path: "/appointments", icon: Calendar, label: "Citas & Reparaciones" },
      { path: "/schedule", icon: Clock, label: "Mi Horario" },
      { path: "/chat", icon: MessageSquare, label: "Mensajes Clientes", badge: unreadCount },
      { path: "/notifications", icon: Bell, label: "Notificaciones", badge: unreadNotifCount },
      { path: "/profile", icon: User, label: "Mi Perfil Técnico" },
    ],
    store: [
      { path: "/", icon: Home, label: "Inicio" },
      { path: "/shop", icon: Package, label: "Catálogo & Repuestos" },
      { path: "/orders", icon: ShoppingCart, label: "Pedidos & Ventas" },
      { path: "/chat", icon: MessageSquare, label: "Mensajes", badge: unreadCount },
      { path: "/notifications", icon: Bell, label: "Notificaciones", badge: unreadNotifCount },
      { path: "/profile", icon: User, label: "Perfil Empresa" },
    ],
  };

  const navItems = menus[user?.role] || menus.client;

  const roleLabels = {
    client: { label: "Cliente", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    tech: { label: "Técnico Certificado", color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
    store: { label: "Tienda Oficial", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
    admin: { label: "Administrador", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  };
  const roleBadge = roleLabels[user?.role] || roleLabels.client;

  return (
    <div className="flex min-h-screen overflow-hidden jyp-page bg-[#080d17] text-[#f8fafc]">
      {/* ══════════ MOBILE OVERLAY DRAWER ══════════════════════ */}
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
                <JyPLogo collapsed={false} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Menú Principal
                </p>
                {navItems.map((item) => {
                  const active = item.path === '/'
                    ? location.pathname === '/'
                    : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        setMobileOpen(false);
                        if (item.path === "/chat") setUnreadCount?.(0);
                      }}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 ${
                        active
                          ? "text-white bg-blue-600/20 border-l-4 border-blue-500 font-bold shadow-[0_0_20px_rgba(37,99,235,0.25)]"
                          : "text-slate-400 hover:text-white hover:bg-white/5 font-semibold"
                      }`}
                    >
                      <Icon
                        size={19}
                        className={active ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "text-slate-400"}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge > 0 && <Badge count={item.badge} />}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={onLogout}
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

      {/* ══════════ DESKTOP SIDEBAR ══════════════════════════ */}
      <motion.aside
        initial={false}
        animate={{ width: SIDEBAR_W }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed left-0 top-0 h-full hidden md:flex flex-col z-40 select-none bg-[#090f1d]/90 border-r border-white/10 backdrop-blur-2xl overflow-x-hidden"
      >
        {/* Brand Header */}
        <div
          className="flex items-center px-4 overflow-hidden border-b border-white/10 shrink-0"
          style={{ height: 72 }}
        >
          <JyPLogo collapsed={collapsed} />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Navegación
            </p>
          )}

          {navItems.map((item) => {
            const active = item.path === '/'
              ? location.pathname === '/'
              : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => item.path === "/chat" && setUnreadCount?.(0)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all duration-200 relative group ${
                  active
                    ? "text-white bg-blue-600/20 border-l-4 border-blue-500 font-bold shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent font-medium"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={`shrink-0 ${active ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "text-slate-400"}`}
                />
                
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between flex-1 min-w-0"
                    >
                      <span className="truncate text-sm">{item.label}</span>
                      {item.badge > 0 && <Badge count={item.badge} />}
                    </motion.div>
                  )}
                </AnimatePresence>

                {collapsed && item.badge > 0 && (
                  <span
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Controls */}
        <div className="px-3 pb-5 space-y-2 border-t border-white/10 pt-4 shrink-0">
          {/* Socket Connection Badge */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? "bg-emerald-400 shadow-[0_0_10px_#10B981]" : "bg-amber-400 animate-pulse"}`}
                  />
                  <span className={`text-[11px] ${isConnected ? "text-emerald-400" : "text-amber-400"}`}>
                    {isConnected ? "Telemetría Activa" : "Reconectando..."}
                  </span>
                </div>
                <Activity size={13} className="text-slate-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold bg-transparent"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Contraer Menú</span>}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all duration-200 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-sm font-semibold bg-transparent"
          >
            <LogOut size={18} />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* ══════════ MAIN WORKSPACE AREA ══════════════════════════ */}
      <main
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 pb-20 md:pb-0"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? SIDEBAR_W : 0,
          background: isDark
            ? "radial-gradient(ellipse at 85% 5%, rgba(37, 99, 235, 0.12) 0%, transparent 45%), radial-gradient(ellipse at 15% 40%, rgba(6, 182, 212, 0.08) 0%, transparent 40%), #080d17"
            : "#F8FAFC"
        }}
      >
        {/* ──── STICKY HEADER ─────────────────────────────────── */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-8 border-b border-white/10 bg-[#080d17]/85 backdrop-blur-2xl"
          style={{ height: 72 }}
        >
          {/* Mobile menu button + Brand for mobile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-slate-300 md:hidden hover:text-white"
            >
              <Menu size={20} />
            </button>

            {/* Left: Location & System Status */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-white/10 bg-white/5"
              >
                <MapPin size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-slate-200 truncate max-w-[140px] sm:max-w-none">
                  Lima Metropolitana
                </span>
              </div>

              <div
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] font-bold text-slate-300 shadow-sm border border-blue-500/25 bg-blue-500/10"
              >
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Soporte Garantizado</span>
              </div>
            </div>
          </div>

          {/* Right: Actions & User Chip */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="-btn"
              title={isDark ? "Activar modo claro" : "Activar modo oscuro"}
              aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            >
              {isDark ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-blue-500" />
              )}
            </button>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
                className="-btn relative"
                title="Notificaciones"
              >
                <Bell size={18} />
                {(unreadNotifCount > 0 || unreadCount > 0) && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-black rounded-full bg-rose-500 text-white border-2"
                    style={{ borderColor: isDark ? '#060913' : '#fff', boxShadow: '0 0 8px #EF4444' }}
                  >
                    {unreadNotifCount + (unreadCount || 0)}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-3 w-[370px] max-h-[480px] rounded-2xl overflow-hidden shadow-2xl z-50"
                    style={{
                      background: isDark ? '#0c1225' : '#ffffff',
                      border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
                    }}
                  >
                    {/* Popover Header */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                      <h4 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>Notificaciones</h4>
                      <div className="flex items-center gap-2">
                        {unreadNotifCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <CheckCheck size={14} />
                            <span>Leer todo</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Popover Content */}
                    <div className="overflow-y-auto max-h-[360px] no-scrollbar">
                      {notifLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.slice(0, 20).map((n) => {
                          const NIcon = getNotifIcon(n.type);
                          const isRead = n.is_read || n.read;
                          return (
                            <button
                              key={n.id}
                              onClick={() => {
                                handleMarkOneRead(n.id);
                                setShowNotifications(false);
                                if (n.link) navigate(n.link);
                              }}
                              className="w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/5 border-b"
                              style={{
                                borderColor: 'var(--border)',
                                background: isRead ? 'transparent' : (isDark ? 'rgba(45,107,255,0.04)' : 'rgba(45,107,255,0.03)'),
                              }}
                            >
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                style={{
                                  background: isRead ? 'var(--bg-input)' : 'rgba(45,107,255,0.12)',
                                  color: isRead ? 'var(--text-dim)' : '#2D6BFF',
                                }}
                              >
                                <NIcon size={17} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs leading-snug ${isRead ? 'font-medium' : 'font-bold'}`} style={{ color: 'var(--text-primary)' }}>
                                  {n.message || n.title || 'Notificación'}
                                </p>
                                <span className="text-[11px] mt-1 block" style={{ color: 'var(--text-dim)' }}>
                                  {n.created_at ? new Date(n.created_at).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              {!isRead && (
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-2" style={{ boxShadow: '0 0 8px rgba(45,107,255,0.5)' }} />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-12 text-center space-y-2">
                          <Bell size={28} className="mx-auto" style={{ color: 'var(--text-dim)' }} />
                          <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>Sin notificaciones</p>
                          <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>Aquí verás citas, pedidos y alertas.</p>
                        </div>
                      )}
                    </div>

                    {/* Popover Footer */}
                    {notifications.length > 0 && (
                      <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                        <button
                          onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink size={13} />
                          <span>Ver todas las notificaciones</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Chip */}
            <Link
              to="/profile"
              className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full transition-all duration-200 hover:border-blue-500/40 shadow-sm"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                textDecoration: "none"
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md"
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {user?.names?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p
                  className="text-xs font-black truncate max-w-[130px] font-heading text-slate-100"
                >
                  {[user?.names, user?.surnames].filter(Boolean).join(' ').trim() || user?.username || "Usuario"}
                </p>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* ──── WORKSPACE CONTENT WITH REFINED MARGINS & MAX-WIDTH ────────── */}
        <div className="flex-1 px-6 sm:px-8 md:px-10 lg:px-12 pt-8 sm:pt-10 md:pt-12 pb-8">
          <div className="max-w-[1350px] mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ══════════ MOBILE BOTTOM DOCK ════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#080d17]/95 border-t border-white/10 backdrop-blur-2xl px-4 py-2 flex items-center justify-around md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          {[
            { path: "/", icon: Home, label: "Inicio" },
            { path: "/appointments", icon: Calendar, label: "Citas" },
            { path: user?.role === 'client' ? "/technicians" : "/shop", icon: user?.role === 'client' ? MapPin : Package, label: user?.role === 'client' ? "Técnicos" : "Tienda" },
            { path: "/chat", icon: MessageSquare, label: "Chat", badge: unreadCount },
            { path: "/profile", icon: User, label: "Perfil" },
          ].map((item) => {
            const active = item.path === '/'
              ? location.pathname === '/'
              : (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => item.path === "/chat" && setUnreadCount?.(0)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl relative transition-all ${
                  active ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
                {active && (
                  <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5 shadow-[0_0_6px_#06B6D4]" />
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Layout;
