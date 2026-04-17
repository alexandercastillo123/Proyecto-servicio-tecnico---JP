import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, ShoppingCart, TrendingUp, Plus, 
  MoreVertical, Edit, Trash2, Box, Store,
  Search, Filter, ArrowUpRight, ArrowDownRight,
  Truck, Archive, Zap
} from 'lucide-react';
import { storeService } from '../services/api';

const StoreDashboard = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const resp = await storeService.getProducts();
      if (resp.success) {
        setProducts(resp.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 font-outfit pb-20">
      {/* Hero Header */}
      <section className="relative h-[300px] rounded-[40px] overflow-hidden flex items-end p-10 group">
        <img 
          src="/assets/hero_store.png" 
          alt="Store Hero" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-[#05060A]/40 to-transparent" />
        
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
                Gestión de <span className="gradient-text">Inventario</span>
              </h1>
              <p className="text-slate-300 text-lg">Controla tus productos, pedidos y ventas en tiempo real.</p>
            </motion.div>
          </div>

          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-[#3B28FF] hover:bg-[#1E0ED6] text-white px-8 py-5 rounded-[28px] font-black shadow-[0_8px_30px_rgb(59,40,255,0.3)] transition-all"
          >
            <Plus size={24} />
            Nuevo Producto
          </motion.button>
        </div>
      </section>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Productos Totales', val: products.length, icon: Box, color: 'text-[#3B28FF]', bg: 'bg-[#3B28FF]/10', trend: '+4 esta semana' },
          { label: 'Pedidos Pendientes', val: '12', icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: '-2 desde ayer' },
          { label: 'Ingresos Mensuales', val: '$12,850', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', trend: '+12.5%' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-white mb-2">{stat.val}</h3>
              <p className={`text-xs font-bold ${stat.trend.includes('+') ? 'text-green-500' : 'text-amber-500'}`}>
                {stat.trend}
              </p>
            </div>
            <div className={`${stat.bg} ${stat.color} w-16 h-16 rounded-3xl flex items-center justify-center shadow-sm`}>
              <stat.icon size={32} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Product Management Section */}
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Catálogo de Productos
              <span className="bg-[#3B28FF]/10 text-[#3B28FF] text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Premium</span>
            </h3>
            <p className="text-slate-500">Mantén tu stock actualizado para los clientes.</p>
          </div>

          <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text"
                placeholder="Buscar en catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#3B28FF]/50 transition-all"
              />
            </div>
            <button className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/10 text-white transition-all">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-6 text-xs font-black text-slate-500 uppercase tracking-widest pl-4">Producto</th>
                <th className="pb-6 text-xs font-black text-slate-500 uppercase tracking-widest">Categoría</th>
                <th className="pb-6 text-xs font-black text-slate-500 uppercase tracking-widest">Precio</th>
                <th className="pb-6 text-xs font-black text-slate-500 uppercase tracking-widest">Stock</th>
                <th className="pb-6 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="pb-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="py-8"><div className="h-8 bg-white/5 rounded-xl w-full" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="inline-flex flex-col items-center">
                      <Archive size={64} className="text-slate-700 mb-6" />
                      <p className="text-slate-500 text-lg font-bold">No hay productos que coincidan</p>
                      <p className="text-slate-600 text-sm">Prueba con otra búsqueda o agrega uno nuevo.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-6 pl-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-tr from-[#3B28FF]/20 to-[#6E5FFF]/10 rounded-2xl flex items-center justify-center text-[#3B28FF] shadow-inner">
                          <Box size={24} />
                        </div>
                        <div>
                          <p className="text-white font-bold tracking-tight">{p.name}</p>
                          <p className="text-xs text-slate-500">SKU: {String(p.id).padStart(6, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className="text-sm text-slate-400 font-medium">Repuestos</span>
                    </td>
                    <td className="py-6">
                      <p className="text-white font-black">${parseFloat(p.price).toFixed(2)}</p>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${parseInt(p.stock) < 10 ? 'text-amber-500' : 'text-slate-300'}`}>
                          {p.stock} units
                        </span>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Activo
                      </span>
                    </td>
                    <td className="py-6 text-right pr-4">
                      <div className="flex justify-end gap-2">
                        <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                          <Edit size={18} />
                        </button>
                        <button className="p-2.5 bg-red-500/5 hover:bg-red-500/20 rounded-xl text-red-500/50 hover:text-red-500 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreDashboard;
