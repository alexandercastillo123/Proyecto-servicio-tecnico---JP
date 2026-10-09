import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Store, Calendar, ShoppingCart, MessageSquare,
  User, LogOut, ChevronLeft, ChevronRight, Bell, Sun, Moon,
  LayoutDashboard, Package, Wrench, Cpu, Zap, Signal,
  ShieldCheck, Sparkles, Activity
} from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";

/* ──── JyP Brand Logo ───────────────────────────────────────── */
const JyPLogo = ({ collapsed }) => (
  <div className="flex items-center gap-3 overflow-hidden select-none">
    <div
      className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg"
      style={{
        background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
        boxShadow: "0 0 20px rgba(37, 99, 235, 0.4)",
      }}
    >
      <Cpu size={22} className="text-white" strokeWidth={2.3} />
      <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
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
              className="font-black text-xl tracking-tight leading-none text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              JyP
            </span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-400/25">
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
  </div>
);

/* ──── Nav badge ────────────────────────────────────────────── */
const Badge = ({ count }) =>
  count > 0 ? (
    <span
      className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full"
      style={{
        background: "var(--error)",
        color: "#ffffff",
        boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)",
      }}
    >
      {count}
    </span>
  ) : null;

/* ──── Main Layout ──────────────────────────────────────────── */
const Layout = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isConnected, unreadCount, setUnreadCount } = useSocket();
  const { theme, toggleTheme, isDark } = useTheme();

  const SIDEBAR_W = collapsed ? 76 : 260;

  const menus = {
    client: [
      { path: "/", icon: MapPin, label: "Explorar Técnicos" },
      { path: "/appointments", icon: Calendar, label: "Mis Citas" },
      { path: "/stores", icon: Store, label: "Tiendas & Talleres" },
      { path: "/orders", icon: ShoppingCart, label: "Mis Pedidos" },
      { path: "/chat", icon: MessageSquare, label: "Centro de Mensajes", badge: unreadCount },
      { path: "/profile", icon: User, label: "Mi Perfil" },
    ],
    tech: [
      { path: "/", icon: LayoutDashboard, label: "Panel de Control" },
      { path: "/appointments", icon: Calendar, label: "Citas & Reparaciones" },
      { path: "/chat", icon: MessageSquare, label: "Mensajes Clientes", badge: unreadCount },
      { path: "/profile", icon: User, label: "Mi Perfil Técnico" },
    ],
    store: [
      { path: "/", icon: LayoutDashboard, label: "Panel de Sucursal" },
      { path: "/orders", icon: ShoppingCart, label: "Pedidos & Ventas" },
      { path: "/chat", icon: MessageSquare, label: "Mensajes", badge: unreadCount },
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
    <div
      className="flex min-h-screen overflow-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--text-primary)",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* ══════════ SIDEBAR ══════════════════════════════════════ */}
      <motion.aside
        initial={false}
        animate={{ width: SIDEBAR_W }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed left-0 top-0 h-full flex flex-col z-40 select-none"
        style={{
          background: isDark ? "rgba(6, 9, 19, 0.94)" : "rgba(255, 255, 255, 0.95)",
          borderRight: "1px solid var(--border)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          overflowX: "hidden",
        }}
      >
        {/* Brand Header */}
        <div
          className="flex items-center px-4 overflow-hidden"
          style={{ height: 72, borderBottom: "1px solid var(--border)" }}
        >
          <JyPLogo collapsed={collapsed} />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Navegación Principal
            </p>
          )}

          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => item.path === "/chat" && setUnreadCount?.(0)}
                className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 relative group"
                style={{
                  color: active ? "#FFFFFF" : "var(--text-secondary)",
                  background: active 
                    ? "linear-gradient(90deg, rgba(37, 99, 235, 0.22) 0%, rgba(6, 182, 212, 0.08) 100%)" 
                    : "transparent",
                  border: active ? "1px solid rgba(59, 130, 246, 0.35)" : "1px solid transparent",
                  textDecoration: "none",
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 600,
                }}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.4 : 1.8}
                  style={{
                    color: active ? "#38BDF8" : "inherit",
                    filter: active ? "drop-shadow(0 0 6px rgba(56, 189, 248, 0.5))" : "none",
                    flexShrink: 0
                  }}
                />
                
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between flex-1 min-w-0"
                    >
                      <span className="truncate">{item.label}</span>
                      {item.badge > 0 && <Badge count={item.badge} />}
                    </motion.div>
                  )}
                </AnimatePresence>

                {collapsed && item.badge > 0 && (
                  <span
                    className="absolute top-2 right-2 w-2 h-2 rounded-full"
                    style={{ background: "var(--error)", boxShadow: "0 0 6px var(--error)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="px-3 pb-5 space-y-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          {/* Socket Connection Badge */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: isConnected ? "var(--success)" : "var(--warning)",
                      boxShadow: isConnected ? "0 0 8px var(--secondary-glow)" : "none",
                    }}
                  />
                  <span className="text-[11px]" style={{ color: isConnected ? "var(--success)" : "var(--warning)" }}>
                    {isConnected ? "Telemetría Activa" : "Reconectando..."}
                  </span>
                </div>
                <Activity size={13} className="text-slate-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse Sidebar Button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5"
            style={{ fontSize: 13, fontWeight: 600, background: "transparent" }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Contraer Menú</span>}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all duration-200 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            style={{ fontSize: 13, fontWeight: 600, background: "transparent" }}
          >
            <LogOut size={18} />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* ══════════ MAIN WORKSPACE AREA ══════════════════════════ */}
      <main
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: SIDEBAR_W }}
      >
        {/* ──── STICKY TOPBAR ─────────────────────────────────── */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 sm:px-8"
          style={{
            height: 72,
            background: isDark ? "rgba(6, 9, 19, 0.88)" : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Left: Location & System Status */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
            >
              <MapPin size={14} className="text-blue-500" />
              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                Lima Metropolitana
              </span>
            </div>

            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-300"
              style={{ background: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)" }}
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Soporte Garantizado</span>
            </div>
          </div>

          {/* Right: Actions & User Chip */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-blue-500" />}
            </button>

            {/* Notifications */}
            <Link
              to="/chat"
              className="theme-toggle relative"
              title="Notificaciones y Mensajes"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"
                  style={{ boxShadow: "0 0 6px #EF4444" }}
                />
              )}
            </Link>

            {/* User Profile Chip */}
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-1.5 rounded-2xl transition-all duration-200 hover:border-blue-500/40"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                textDecoration: "none"
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md"
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {user?.names?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <p
                  className="text-xs font-black truncate max-w-[130px]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-primary)" }}
                >
                  {user?.names || user?.username || "Usuario"}
                </p>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* ──── WORKSPACE CONTENT WITH REFINED MARGINS ────────── */}
        <div className="flex-1 p-5 sm:p-7 md:p-9 lg:p-10" style={{ minHeight: "calc(100vh - 72px)" }}>
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
      </main>
    </div>
  );
};

export default Layout;
