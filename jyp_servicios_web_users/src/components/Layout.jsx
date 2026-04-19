import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Search, Calendar, User, LogOut, 
  Menu, X, Bell, LayoutDashboard, Package,
  Settings, ChevronLeft, ChevronRight, Zap,
  MessageSquare, ShoppingCart, MapPin, Store
} from 'lucide-react';

const Layout = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = {
    client: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/technicians', icon: Search, label: 'Buscar Técnico' },
      { path: '/stores', icon: Store, label: 'Tiendas' },
      { path: '/appointments', icon: Calendar, label: 'Mis Citas' },
      { path: '/chat', icon: MessageSquare, label: 'Mensajes' },
      { path: '/profile', icon: User, label: 'Mi Perfil' },
    ],
    tech: [
      { path: '/', icon: LayoutDashboard, label: 'Panel' },
      { path: '/appointments', icon: Calendar, label: 'Agenda' },
      { path: '/chat', icon: MessageSquare, label: 'Chat' },
      { path: '/profile', icon: User, label: 'Perfil' },
    ],
    store: [
      { path: '/', icon: Package, label: 'Productos' },
      { path: '/orders', icon: ShoppingCart, label: 'Órdenes' },
      { path: '/stores/create', icon: Store, label: 'Mi Tienda' },
      { path: '/profile', icon: User, label: 'Ajustes' },
    ],
  };

  const navItems = menuItems[user?.role] || [];

  return (
    <div className="flex min-h-screen bg-background text-white font-outfit overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? '280px' : '90px' }}
        className="fixed left-0 top-0 h-full glass-panel z-40 rounded-none border-y-0 border-l-0 border-white/5 flex flex-col transition-all duration-500 ease-in-out"
      >
        <div className="p-8 flex items-center gap-4 overflow-hidden h-24">
          <div className="bg-primary p-2.5 rounded-2xl shrink-0 shadow-[0_0_20px_rgba(59,40,255,0.3)]">
            <Zap size={24} fill="white" stroke="white" />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-black text-2xl tracking-tighter"
              >
                JyP <span className="text-primary italic">Services</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 relative group ${
                  isActive ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={22} className={isActive ? 'animate-pulse' : ''} />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-bold whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute right-2 w-1.5 h-6 bg-white rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-4 p-4 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            {isSidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
            {isSidebarOpen && <span className="font-bold">Colapsar</span>}
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-4 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-bold">Salir</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Container */}
      <main 
        className="flex-1 transition-all duration-500 ease-in-out"
        style={{ marginLeft: isSidebarOpen ? '280px' : '90px' }}
      >
        {/* Navbar */}
        <header className="h-24 px-8 md:px-12 flex items-center justify-between sticky top-0 z-30 bg-background/60 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <MapPin size={14} className="text-primary" />
              Lima, Perú
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-white/5 p-2 pr-4 rounded-xl border border-white/5">
              <div className="bg-gradient-to-tr from-primary to-[#6E5FFF] w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shadow-lg">
                {user?.names?.[0] || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-black tracking-tight leading-none">{user?.names || 'Usuario'}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user?.role}</p>
              </div>
            </div>
            <div className="relative cursor-pointer">
              <div className="bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-all text-slate-400 hover:text-white">
                <Bell size={20} />
              </div>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary border border-background rounded-full" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="p-8 md:p-12 relative min-h-[calc(100vh-6rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
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
