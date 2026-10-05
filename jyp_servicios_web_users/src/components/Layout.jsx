import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Store, Calendar, ShoppingCart, MessageSquare,
  User, LogOut, ChevronLeft, ChevronRight, Bell, Sun, Moon,
  LayoutDashboard, Package, Wrench, Cpu, Zap, Signal, SignalHigh,
  CircleDot, Menu
} from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";

/* ──── JyP Brand Icon (circuit tech mark) ──────────────────── */
const JyPLogo = ({ collapsed }) => (
  <div className="flex items-center gap-3 overflow-hidden">
    <div
      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
      style={{ background: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
    >
      <Cpu size={20} color="white" strokeWidth={2.5} />
    </div>
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.22 }}
        >
          <span
            className="font-black text-xl tracking-tight leading-none"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-primary)" }}
          >
            JyP
          </span>
          <span
            className="block text-[9px] font-bold uppercase tracking-[0.14em] leading-none mt-0.5"
            style={{ color: "var(--primary)" }}
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
      className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse"
      style={{ background: "var(--error)", color: "#fff" }}
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

  const SIDEBAR_W = collapsed ? 80 : 280;

  const menus = {
    client: [
      { path: "/", icon: MapPin, label: "Explorar Técnicos" },
      { path: "/stores", icon: Store, label: "Tiendas Oficiales" },
      { path: "/appointments", icon: Calendar, label: "Mis Citas" },
      { path: "/orders", icon: ShoppingCart, label: "Mis Pedidos" },
      { path: "/chat", icon: MessageSquare, label: "Mensajes", badge: unreadCount },
      { path: "/profile", icon: User, label: "Mi Perfil" },
    ],
    tech: [
      { path: "/", icon: LayoutDashboard, label: "Dashboard" },
      { path: "/chat", icon: MessageSquare, label: "Mensajes", badge: unreadCount },
      { path: "/appointments", icon: Calendar, label: "Mis Citas" },
      { path: "/profile", icon: User, label: "Mi Perfil" },
    ],
    store: [
      { path: "/", icon: LayoutDashboard, label: "Panel" },
      { path: "/products", icon: Package, label: "Catálogo" },
      { path: "/orders", icon: ShoppingCart, label: "Pedidos" },
      { path: "/chat", icon: MessageSquare, label: "Mensajes", badge: unreadCount },
      { path: "/profile", icon: User, label: "Perfil" },
    ],
  };

  const navItems = menus[user?.role] || [];

  return (
    <div
      className="flex min-h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text-primary)", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ══════════ SIDEBAR ══════════════════════════════════════ */}
      <motion.aside
        initial={false}
        animate={{ width: SIDEBAR_W }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="fixed left-0 top-0 h-full flex flex-col z-40"
        style={{
          background: isDark ? "rgba(5,7,15,0.97)" : "rgba(240,244,255,0.97)",
          borderRight: "1px solid var(--border)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          overflowX: "hidden",
        }}
      >
        {/* Brand */}
        <div
          className="flex items-center px-5 overflow-hidden"
          style={{ height: 72, borderBottom: "1px solid var(--border)" }}
        >
          <JyPLogo collapsed={collapsed} />
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => item.path === "/chat" && setUnreadCount?.(0)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative group"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-dim)",
                  background: active ? "var(--primary-subtle)" : "transparent",
                  boxShadow: active ? "inset 3px 0 0 var(--primary)" : "none",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-dim)";
                  }
                }}
              >
                <item.icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? "var(--primary)" : "inherit", flexShrink: 0 }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between flex-1 min-w-0"
                    >
                      <span className="whitespace-nowrap truncate">{item.label}</span>
                      {item.badge > 0 && <Badge count={item.badge} />}
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Badge when collapsed */}
                {collapsed && item.badge > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ background: "var(--error)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Controls */}
        <div className="px-3 pb-5 space-y-1" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          {/* Connection Status */}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl mb-1"
                style={{ background: "var(--bg-hover)", fontSize: 11, fontWeight: 700 }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: isConnected ? "var(--success)" : "var(--warning)",
                    boxShadow: isConnected ? "0 0 8px var(--secondary-glow)" : "none",
                    animation: isConnected ? "pulse 2s infinite" : "none",
                  }}
                />
                <span style={{ color: isConnected ? "var(--success)" : "var(--warning)" }}>
                  {isConnected ? "En línea" : "Conectando..."}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all duration-200"
            style={{ color: "var(--text-dim)", fontSize: 14, fontWeight: 600, background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-dim)";
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Colapsar</span>}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all duration-200"
            style={{ color: "var(--error)", fontSize: 14, fontWeight: 600, background: "transparent", opacity: 0.8 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--error-bg)";
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.opacity = "0.8";
            }}
          >
            <LogOut size={18} />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* ══════════ MAIN AREA ════════════════════════════════════ */}
      <main
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: SIDEBAR_W }}
      >
        {/* ──── TOP HEADER ──────────────────────────────────── */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-8"
          style={{
            height: 72,
            background: isDark ? "rgba(5,7,15,0.85)" : "rgba(240,244,255,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Left: location + status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 700 }}>
              <MapPin size={13} style={{ color: "var(--primary)" }} />
              Lima, Perú
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isConnected ? "var(--success)" : "var(--warning)",
                  boxShadow: isConnected ? "0 0 6px var(--secondary-glow)" : "none",
                  animation: isConnected ? "pulse 2s infinite" : "none",
                }}
              />
              <span style={{ color: isConnected ? "var(--success)" : "var(--warning)" }}>
                {isConnected ? "Socket en vivo" : "Reconectando..."}
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                className="theme-toggle"
                title="Notificaciones"
              >
                <Bell size={17} />
              </button>
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "var(--primary)", border: "2px solid var(--bg)" }}
              />
            </div>

            {/* User chip */}
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, var(--tertiary) 100%)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {user?.names?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:block leading-none">
                <p
                  className="text-sm font-bold truncate max-w-[120px]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-primary)" }}
                >
                  {user?.names || "Usuario"}
                </p>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider mt-0.5"
                  style={{ color: "var(--primary)" }}
                >
                  {user?.role === "client" ? "Cliente" : user?.role === "tech" ? "Técnico" : user?.role === "store" ? "Tienda" : user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ──── PAGE CONTENT ────────────────────────────────── */}
        <div className="flex-1 p-8 md:p-10" style={{ minHeight: "calc(100vh - 72px)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
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
