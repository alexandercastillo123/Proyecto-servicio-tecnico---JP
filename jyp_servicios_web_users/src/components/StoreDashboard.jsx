import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, ShoppingCart, TrendingUp, Plus, 
  MoreVertical, Edit, Trash2, Box, Store,
  Search, Filter, ArrowUpRight, ArrowDownRight,
  Truck, Archive, Zap, MessageSquare, ChevronRight,
  CheckCircle, Clock, XCircle, X
} from 'lucide-react';
import { storeService, messageService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { TechLoader } from './common/TechLoader';

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
      
      const uid = user.id || user.userId;
      const myStore = await storeService.getBranches().then(r => r.data.resultado?.find(s => s.user_id === uid));
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' }}>Pendiente</span>;
      case 'confirmed': 
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}>Confirmado</span>;
      case 'shipped': 
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' }}>Despachado</span>;
      case 'delivered': 
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>Entregado</span>;
      default: 
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8' }}>{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <TechLoader 
        title="Iniciando Panel de Sucursal" 
        subtitle="Sincronizando inventario de repuestos y órdenes..." 
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header & Recent Activity Banner */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Sucursal <span style={{ color: 'var(--primary)' }}>{user.branchName || 'Principal JyP'}</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Control de inventario de repuestos y despacho de pedidos en tiempo real.
          </p>
        </div>

        {recentChat && (
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(`/chat?user=${recentChat.other_user_id}`)}
            className="flex-1 max-w-sm p-3.5 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all hover:border-primary/40"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {recentChat.username?.[0] || 'C'}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>Consulta de Cliente</p>
                <p className="font-bold text-xs truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{recentChat.last_message}</p>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </motion.div>
        )}
      </section>

      {/* Operational Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Productos Registrados', val: products.length, icon: Box, color: 'var(--primary)', bg: 'rgba(45, 107, 255, 0.1)' },
          { label: 'Pedidos Totales', val: orders.length, icon: ShoppingCart, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Por Despachar', val: pendingOrders.length, icon: Truck, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.1)' },
          { label: 'Ventas del Mes', val: `S/. ${orders.reduce((acc, o) => acc + Number(o.price || 0), 0) || '1,240'}`, icon: TrendingUp, color: 'var(--secondary)', bg: 'rgba(0, 229, 160, 0.1)' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="p-5 rounded-2xl border shadow-sm flex items-center gap-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
              <h3 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {stat.val}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Management Section */}
        <section className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>Gestión de Pedidos</span>
              {pendingOrders.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </h2>
            <button 
              className="text-xs font-bold hover:underline" 
              style={{ color: 'var(--primary)' }}
              onClick={() => navigate('/orders')}
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="h-28 rounded-2xl border animate-pulse"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                />
              ))
            ) : orders.length === 0 ? (
              <div 
                className="p-10 text-center rounded-2xl border border-dashed"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <ShoppingCart className="mx-auto mb-3" size={36} style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>No hay pedidos pendientes</p>
              </div>
            ) : (
              orders.slice(0, 6).map((order) => (
                <div 
                  key={order.id} 
                  className="p-4 rounded-2xl border shadow-sm space-y-3 transition-all hover:border-primary/40"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-extrabold text-sm" style={{ color: 'var(--text-primary)' }}>
                        #{String(order.id).padStart(5, '0')}
                      </p>
                      <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                        {order.client_name || 'Cliente'}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="flex items-center gap-2.5 py-2 border-y text-xs" style={{ borderColor: 'var(--border)' }}>
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--primary)' }}
                    >
                      <Package size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {order.product_name || 'Repuesto certificado'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cant: 1 unidad</p>
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
                        className="btn-primary flex-1 py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider"
                      >
                        Confirmar
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
                        className="flex-1 py-1.5 text-white text-[11px] font-bold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
                        style={{ backgroundColor: '#A855F7' }}
                      >
                        <Truck size={14} /> 
                        <span>Despachar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Product Catalog Section */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Catálogo de Inventario
            </h2>
            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Buscar en catálogo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl py-2 pl-9 pr-3 text-xs outline-none border transition-all"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <button 
                onClick={handleAddProduct}
                className="btn-primary p-2.5 rounded-xl shadow-md flex items-center justify-center shrink-0"
                title="Agregar producto"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div 
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
                    <th className="p-4 font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Producto</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>Stock</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>Precio</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="4" className="p-4"><div className="h-6 rounded-lg" style={{ backgroundColor: 'var(--bg)' }} /></td>
                      </tr>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
                        <Archive size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-xs">No hay productos registrados</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
                            >
                              <Box size={18} />
                            </div>
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span 
                            className="font-bold"
                            style={{ color: p.stock < 5 ? '#EF4444' : 'var(--text-secondary)' }}
                          >
                            {p.stock} unid.
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold" style={{ color: 'var(--text-primary)' }}>
                          S/. {parseFloat(p.price || 0).toFixed(2)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleEditProduct(p)}
                              className="p-1.5 rounded-lg border transition-colors hover:border-primary"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg border text-red-500 transition-colors hover:bg-red-500/10"
                              style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
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
        </section>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg p-7 rounded-2xl border shadow-2xl relative"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <button 
                onClick={() => setShowProductModal(false)} 
                className="absolute top-5 right-5 transition-colors hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
                >
                  {editingProduct ? <Edit size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Inventario'}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Completa la información técnica del repuesto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Nombre del Producto
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej: Pantalla OLED iPhone 13 Pro"
                    className="w-full py-2.5 px-3 rounded-xl border text-xs outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Stock Disponible
                  </label>
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full py-2.5 px-3 rounded-xl border text-xs outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Precio (S/.)
                  </label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full py-2.5 px-3 rounded-xl border text-xs outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Descripción
                  </label>
                  <textarea 
                    placeholder="Detalles técnicos, compatibilidad, garantía..."
                    rows="3"
                    className="w-full py-2.5 px-3 rounded-xl border text-xs outline-none resize-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 border font-bold text-xs uppercase rounded-xl transition-colors hover:opacity-80"
                  style={{ 
                    backgroundColor: 'var(--bg)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text-secondary)' 
                  }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveProduct}
                  className="btn-primary flex-1 py-3 font-bold text-xs uppercase rounded-xl shadow-lg"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
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
