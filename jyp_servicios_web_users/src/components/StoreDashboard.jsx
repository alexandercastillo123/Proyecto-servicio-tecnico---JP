import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, ShoppingCart, TrendingUp, Plus, 
  MoreVertical, Edit, Trash2, Box, Store,
  Search, Filter, ArrowUpRight, ArrowDownRight,
  Truck, Archive, Zap, MessageSquare, ChevronRight,
  CheckCircle, Clock, XCircle
} from 'lucide-react';
import { storeService, messageService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const StoreDashboard = () => {
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to socket events in StoreDashboard
  useEffect(() => {
    if (!socketService) return;

    const unsubMsg = socketService.on('receive_message', () => {
      fetchDashboardData();
    });

    const unsubAppt = socketService.on('appointment_created', () => {
      fetchDashboardData();
    });

    return () => {
      unsubMsg();
      unsubAppt();
    };
  }, [socketService]);

  const fetchDashboardData = async () => {
    try {
      const branchId = user.branchId || 1; 
      const [productsResp, ordersResp, convsResp] = await Promise.all([
        storeService.getProducts(branchId),
        storeService.getOrders(branchId),
        messageService.getConversations()
      ]);

      if (productsResp.data.exito) setProducts(productsResp.data.resultado || []);
      if (ordersResp.data.exito) setOrders(ordersResp.data.resultado || []);
      if (convsResp.data.exito) setConversations(convsResp.data.resultado || []);
      
      // Update local storage user with actual branch info if missing
      const myStore = await storeService.getBranches().then(r => r.data.resultado?.find(s => s.user_id === user.id));
      if (myStore) {
        const updatedUser = { ...user, branchId: myStore.id, branchName: myStore.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', stock: '', price: '', description: '' });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', stock: '', price: '', description: '' });
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ 
      name: product.name, 
      stock: product.stock, 
      price: product.price, 
      description: product.description || '' 
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const resp = await storeService.deleteProduct(id);
      if (resp.data.exito) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const sucursal_id = user.branchId || 1;
      const data = { ...productForm, sucursal_id };
      
      if (editingProduct) {
        const resp = await storeService.updateProduct(editingProduct.id, data);
        if (resp.data.exito) {
          setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productForm } : p));
        }
      } else {
        const resp = await storeService.addProduct(data);
        if (resp.data.exito) {
          fetchDashboardData();
        }
      }
      setShowProductModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const recentChat = conversations.filter(c => c.other_user_role === 'client')[0];

  const getStatusStyle = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500';
      case 'confirmed': return 'bg-blue-500/10 text-blue-500';
      case 'shipped': return 'bg-purple-500/10 text-purple-500';
      case 'delivered': return 'bg-green-500/10 text-green-500';
      default: return 'bg-slate-500/10 text-slate-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-outfit pb-20">
      {/* Header & Recent Activity Banner */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="w-full md:w-auto">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Sucursal <span className="gradient-text">{user.branchName || 'J&P'}</span></h1>
          <p className="text-slate-400 font-medium">Control de inventario y pedidos en tiempo real.</p>
        </div>

        {recentChat && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(`/chat?user=${recentChat.other_user_id}`)}
            className="flex-1 max-w-md bg-white/5 border border-white/10 p-4 rounded-[28px] flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-black">
                {recentChat.username?.[0]}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Consulta Reciente</p>
                <p className="text-white font-bold text-sm line-clamp-1">{recentChat.last_message}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-all" />
          </motion.div>
        )}
      </section>

      {/* Operational Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Productos', val: products.length, icon: Box, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Pedidos Hoy', val: orders.length, icon: ShoppingCart, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Por Despachar', val: pendingOrders.length, icon: Truck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Ventas (S/.)', val: '1,240', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 flex flex-col items-center text-center group hover:bg-white/[0.03] transition-all">
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-inner`}>
              <stat.icon size={28} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white">{stat.val}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Orders Management Section (Core mobile parity) */}
        <section className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
              Gestión de Pedidos
              <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingOrders.length}
              </span>
            </h2>
            <button className="text-primary text-xs font-black hover:underline" onClick={() => navigate('/orders')}>Ver todos</button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
            {isLoading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-[32px] animate-pulse" />)
            ) : orders.length === 0 ? (
              <div className="p-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[32px] text-center">
                <ShoppingCart className="mx-auto text-slate-700 mb-4" size={48} />
                <p className="text-slate-500 font-bold">No hay pedidos pendientes</p>
              </div>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className="glass-panel p-6 space-y-4 hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-black">#{String(order.id).padStart(5, '0')}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{order.client_name || 'Cliente'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 py-2 border-y border-white/5">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white font-bold line-clamp-1">{order.product_name || 'Repuesto de Celular'}</p>
                      <p className="text-[10px] text-slate-500">Cantidad: 1</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button 
                        onClick={async () => {
                          try {
                            const resp = await storeService.updateOrderStatus(order.id, 'confirmed');
                            if (resp.data.exito) fetchDashboardData();
                          } catch (e) { console.error(e); }
                        }}
                        className="flex-1 py-2 bg-primary text-white text-[10px] font-black rounded-xl hover:bg-primary/90 transition-all"
                      >
                        CONFIRMAR
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button 
                        onClick={async () => {
                          try {
                            const resp = await storeService.updateOrderStatus(order.id, 'shipped');
                            if (resp.data.exito) fetchDashboardData();
                          } catch (e) { console.error(e); }
                        }}
                        className="flex-1 py-2 bg-purple-500 text-white text-[10px] font-black rounded-xl hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Truck size={14} /> DESPACHAR
                      </button>
                    )}
                    <button className="p-2 bg-white/5 text-slate-400 rounded-xl hover:bg-white/10 hover:text-white transition-all">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Product Catalog Section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-black text-white tracking-tight">Catálogo de Productos</h2>
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <button 
                onClick={handleAddProduct}
                className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Producto</th>
                    <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Stock</th>
                    <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Precio</th>
                    <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="4" className="p-5"><div className="h-10 bg-white/5 rounded-xl" /></td>
                      </tr>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-20 text-center">
                        <Archive size={40} className="mx-auto text-slate-800 mb-4" />
                        <p className="text-slate-500 font-bold">No hay productos disponibles</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-tr from-primary/20 to-primary/5 rounded-xl flex items-center justify-center text-primary">
                              <Box size={20} />
                            </div>
                            <span className="text-sm text-white font-bold tracking-tight">{p.name}</span>
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`text-xs font-black ${p.stock < 10 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {p.stock} unid.
                          </span>
                        </td>
                        <td className="p-5 text-center text-sm font-black text-white">S/.{parseFloat(p.price).toFixed(2)}</td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEditProduct(p)}
                              className="p-2 bg-white/5 text-slate-500 hover:text-white rounded-lg transition-all"
                            ><Edit size={14} /></button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 bg-red-500/5 text-red-500/50 hover:text-red-500 rounded-lg transition-all"
                            ><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-lg p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
              <button 
                onClick={() => setShowProductModal(false)} 
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                  {editingProduct ? <Edit size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                  <p className="text-slate-500 text-xs font-medium">Completa los datos del repuesto.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Nombre del Producto</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Pantalla iPhone 13 Pro"
                    className="input-field w-full"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Stock Disponible</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    className="input-field w-full"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Precio (S/.)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="input-field w-full"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Descripción</label>
                  <textarea 
                    placeholder="Detalles técnicos, garantía, etc."
                    className="input-field w-full h-24 resize-none"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-4 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveProduct}
                  className="flex-1 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreDashboard;
