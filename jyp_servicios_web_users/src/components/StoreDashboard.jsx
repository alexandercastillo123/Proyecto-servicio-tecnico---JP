import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, ShoppingCart, TrendingUp, Plus, 
  MoreVertical, Edit, Trash2, Box, Store,
  Search, Filter, ArrowUpRight, ArrowDownRight,
  Truck, Archive, Zap, MessageSquare, ChevronRight,
  CheckCircle, Clock, XCircle, X, Image as ImageIcon
} from 'lucide-react';
import { storeService, messageService } from '../services/api';
import { mediaUrl } from '../services/formatters';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { TechLoader } from './common/TechLoader';
import toast from 'react-hot-toast';

const StoreDashboard = () => {
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchId, setBranchId] = useState(user.branchId || null);
  const [hasStore, setHasStore] = useState(true);
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
    setIsLoading(true);
    try {
      /* Se resuelve la sucursal real del usuario: el endpoint my-store devuelve 404
         si aún no ha registrado su local, y evita el ID fijo que rompía el panel. */
      let branchId = user.branchId;
      let myStore = null;
      try {
        const myStoreResp = await storeService.getMyStore();
        myStore = myStoreResp.data?.resultado || null;
        if (myStore?.id) branchId = myStore.id;
      } catch (err) {
        if (err.response?.status !== 404) console.warn('No se pudo resolver my-store:', err.message);
      }

      if (!branchId) {
        const branchesResp = await storeService.getBranches().catch(() => null);
        const branches = Array.isArray(branchesResp?.data?.resultado) ? branchesResp.data.resultado : [];
        const uid = user.id || user.userId;
        myStore = branches.find((s) => String(s.user_id) === String(uid)) || null;
        branchId = myStore?.id;
      }

      if (!branchId) {
        setProducts([]);
        setOrders([]);
        setConversations([]);
        setHasStore(false);
        return;
      }

      setHasStore(true);
      setBranchId(branchId);

      if (myStore?.id) {
        const updatedUser = { ...user, branchId: myStore.id, branchName: myStore.name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('jyp:user-updated', { detail: updatedUser }));
      }

      const [productsResp, ordersResp, convsResp] = await Promise.all([
        storeService.getProducts(branchId),
        storeService.getOrders(branchId),
        messageService.getConversations()
      ]);

      if (productsResp.data?.exito) setProducts(productsResp.data.resultado || []);
      if (ordersResp.data?.exito) setOrders(ordersResp.data.resultado || []);
      if (convsResp.data?.exito) setConversations(convsResp.data.resultado || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.mensaje || 'No se pudo cargar el panel de la sucursal');
    } finally {
      setIsLoading(false);
    }
  };

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', stock: '', price: '', description: '', image_url: '', category: '', brand: '', sku: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: '', stock: '', price: '', description: '', image_url: '', category: '', brand: '', sku: '' });
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({ 
      name: product.name, 
      stock: product.stock, 
      price: product.price, 
      description: product.description || '',
      image_url: product.image_url || '',
      category: product.category || '',
      brand: product.brand || '',
      sku: product.sku || '',
    });
    setShowProductModal(true);
  };

  /* Sube la foto del repuesto (mismo flujo que la app Android con ImagePicker) */
  const handleProductImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await storeService.uploadProductImage(fd);
      const url = res.data?.resultado?.url || res.data?.resultado?.image_url;
      if (url) {
        setProductForm((p) => ({ ...p, image_url: url }));
        toast.success('Imagen cargada');
      } else {
        toast.error('No se pudo obtener la ruta de la imagen');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.mensaje || 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const resp = await storeService.deleteProduct(id);
      if (resp.data?.exito) {
        setProducts(products.filter(p => p.id !== id));
        toast.success('Producto eliminado');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.mensaje || 'No se pudo eliminar el producto');
    }
  };

  const handleSaveProduct = async () => {
    const sucursal_id = branchId;
    if (!sucursal_id) {
      toast.error('No se pudo identificar tu sucursal. Registra tu local primero.');
      return;
    }
    try {
      const data = {
        sucursal_id,
        name: productForm.name,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock, 10) || 0,
        description: productForm.description,
        image_url: productForm.image_url || null,
        category: productForm.category || null,
        brand: productForm.brand || null,
        sku: productForm.sku || null,
      };

      if (editingProduct) {
        const resp = await storeService.updateProduct(editingProduct.id, data);
        if (resp.data?.exito) {
          setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productForm } : p));
          toast.success('Producto actualizado');
        }
      } else {
        const resp = await storeService.addProduct(data);
        if (resp.data?.exito) {
          toast.success('Producto añadido al catálogo');
          fetchDashboardData();
        }
      }
      setShowProductModal(false);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar el producto');
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [orderFilter, setOrderFilter] = useState('all');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const recentChat = conversations.filter(c => c.other_user_role === 'client')[0];
  const displayedOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' }}>Pendiente</span>;
      case 'paid':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>Pagado</span>;
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}>Confirmado</span>;
      case 'in_preparation':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4' }}>En preparación</span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#A855F7' }}>Despachado</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>Entregado</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>Cancelado</span>;
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

  if (!hasStore) {
    return (
      <div className="w-full space-y-8 pb-4">
        <section className="p-12 text-center rounded-[32px] border jyp-card">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-blue-500/10 text-blue-400">
            <Store size={32} />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
            Aún no tienes una sucursal registrada
          </h1>
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--text-secondary)' }}>
            Registra tu local para poder publicar repuestos, recibir pedidos y atender a tus clientes.
          </p>
          <button
            onClick={() => navigate('/stores/create')}
            className="btn-primary px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider"
          >
            Registrar mi sucursal
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-4">
      {/* Header & Recent Activity Banner */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-slate-100">
            Sucursal <span className="text-blue-400">{user.branchName || 'Principal JyP'}</span>
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Control de inventario de repuestos y despacho de pedidos en tiempo real.
          </p>
        </div>

        {recentChat && (
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(`/chat?user=${recentChat.other_user_id}`)}
            className="flex-1 max-w-sm p-4 rounded-3xl border shadow-md flex items-center justify-between cursor-pointer transition-all hover:border-blue-500/40 jyp-card"
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-md bg-blue-600"
              >
                {recentChat.username?.[0] || 'C'}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Consulta de Cliente</p>
                <p className="font-bold text-xs truncate max-w-[200px] text-slate-100">{recentChat.last_message_text || recentChat.last_message}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </motion.div>
        )}
      </section>

      {/* Operational Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Productos Registrados', val: products.length, icon: Box, color: 'var(--primary)', bg: 'rgba(45, 107, 255, 0.1)' },
          { label: 'Pedidos Totales', val: orders.length, icon: ShoppingCart, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Por Despachar', val: pendingOrders.length, icon: Truck, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.1)' },
          { label: 'Ventas Totales', val: `S/. ${orders.reduce((acc, o) => acc + Number(o.total_price || o.price || 0), 0).toFixed(2)}`, icon: TrendingUp, color: 'var(--secondary)', bg: 'rgba(0, 229, 160, 0.1)' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="p-6 rounded-3xl border shadow-lg flex items-center gap-4 transition-all hover:-translate-y-1 jyp-card"
          >
            <div 
              className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: stat.bg, color: stat.color }}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-100">
                {stat.val}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

          {/* Order Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[{id:'all', label:'Todos'}, {id:'pending', label:'Pendientes'}, {id:'paid', label:'Pagados'}, {id:'in_preparation', label:'En preparación'}, {id:'shipped', label:'En camino'}, {id:'delivered', label:'Entregados'}].map(tab => (
              <button
                key={tab.id}
                onClick={() => setOrderFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all border shadow-sm ${
                  orderFilter === tab.id
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
            ) : displayedOrders.length === 0 ? (
              <div 
                className="p-10 text-center rounded-2xl border border-dashed"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <ShoppingCart className="mx-auto mb-3" size={36} style={{ color: 'var(--text-dim)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>No hay pedidos pendientes</p>
              </div>
            ) : (
              displayedOrders.slice(0, 8).map((order) => (
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
                      <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--text-dim)' }}>
                        {[order.client_names, order.client_surnames].filter(Boolean).join(' ').trim() || 'Cliente'}
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
                      <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                        {order.quantity ? `Cant: ${order.quantity}` : 'Cant: 1 unidad'}
                        {order.total_price ? ` · S/. ${Number(order.total_price).toFixed(2)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.payment_status === 'waiting_confirmation' && (
                      <button
                        onClick={async () => {
                          try {
                            const resp = await storeService.confirmOrderPayment(order.id);
                            if (resp.data?.exito) {
                              toast.success('Pago confirmado');
                              fetchDashboardData();
                            }
                          } catch (e) {
                            console.error(e);
                            toast.error(e.response?.data?.mensaje || 'No se pudo confirmar el pago');
                          }
                        }}
                        className="btn-primary flex-1 py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider"
                      >
                        Confirmar pago
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={async () => {
                          try {
                            const resp = await storeService.updateOrderStatus(order.id, 'in_preparation');
                            if (resp.data?.exito) {
                              toast.success('Pedido en preparación');
                              fetchDashboardData();
                            }
                          } catch (e) {
                            console.error(e);
                            toast.error(e.response?.data?.mensaje || 'No se pudo actualizar el pedido');
                          }
                        }}
                        className="flex-1 py-1.5 text-white text-[11px] font-bold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm bg-cyan-500 hover:bg-cyan-600"
                      >
                        <Package size={14} />
                        <span>Preparar</span>
                      </button>
                    )}
                    {order.status === 'in_preparation' && (
                      <button
                        onClick={async () => {
                          try {
                            const resp = await storeService.updateOrderStatus(order.id, 'shipped');
                            if (resp.data?.exito) {
                              toast.success('Pedido despachado');
                              fetchDashboardData();
                            }
                          } catch (e) {
                            console.error(e);
                            toast.error(e.response?.data?.mensaje || 'No se pudo actualizar el pedido');
                          }
                        }}
                        className="flex-1 py-1.5 text-white text-[11px] font-bold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm bg-purple-500 hover:bg-purple-600"
                      >
                        <Truck size={14} />
                        <span>Despachar</span>
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button
                        onClick={async () => {
                          try {
                            const resp = await storeService.updateOrderStatus(order.id, 'delivered');
                            if (resp.data?.exito) {
                              toast.success('Pedido entregado');
                              fetchDashboardData();
                            }
                          } catch (e) {
                            console.error(e);
                            toast.error(e.response?.data?.mensaje || 'No se pudo actualizar el pedido');
                          }
                        }}
                        className="flex-1 py-1.5 text-white text-[11px] font-bold rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm bg-emerald-500 hover:bg-emerald-600"
                      >
                        <CheckCircle size={14} />
                        <span>Entregado</span>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--text-dim)' }} />
                <input 
                  type="text"
                  placeholder="Buscar en catálogo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="jyp-form-input w-full rounded-2xl py-2.5 pl-10 pr-4 text-xs outline-none border"
                />
              </div>
              <button 
                onClick={handleAddProduct}
                className="btn-primary p-2.5 rounded-2xl shadow-md flex items-center justify-center shrink-0"
                title="Agregar producto"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div 
            className="rounded-3xl border shadow-lg overflow-hidden jyp-card"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs jyp-table">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 font-bold uppercase tracking-wider text-slate-500">Producto</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-center text-slate-500">Stock</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-center text-slate-500">Precio</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-right text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="4" className="p-4"><div className="h-6 rounded-lg" style={{ backgroundColor: 'var(--bg)' }} /></td>
                      </tr>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-12 text-center" style={{ color: 'var(--text-dim)' }}>
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
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                              style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
                            >
                              {p.image_url ? (
                                <img src={mediaUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <Box size={18} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-100 block truncate">{p.name}</span>
                              {(p.brand || p.sku) && (
                                <span className="text-[10px] text-slate-500">
                                  {[p.brand, p.sku].filter(Boolean).join(' · ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span 
                            className="font-bold text-slate-400"
                            style={{ color: p.stock < 5 ? '#EF4444' : 'var(--text-secondary)' }}
                          >
                            {p.stock} unid.
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-100">
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
                className="absolute top-5 right-5 transition-colors hover:opacity-80 text-slate-400"
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
                                <h3 className="text-lg font-bold text-slate-100">
                                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Inventario'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                  Completa la información técnica del repuesto.
                                </p>
                              </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                    <label className="jyp-form-label">
                    Fotografía del Repuesto
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center border shrink-0"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                    >
                      {productForm.image_url ? (
                        <img src={mediaUrl(productForm.image_url)} alt="Producto" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={26} className="text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-xs font-bold border"
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        <ImageIcon size={14} />
                        {uploadingImage ? 'Subiendo...' : 'Seleccionar imagen'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleProductImage} />
                      </label>
                      <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-dim)' }}>
                        JPG o PNG. Se muestra en el catálogo y en la ficha del producto.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                    <label className="jyp-form-label">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pantalla OLED iPhone 13 Pro"
                    className="jyp-form-input rounded-xl py-2.5 px-3 text-xs border outline-none"
                    value={productForm.name}
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                    <label className="jyp-form-label">
                    Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pantallas"
                    className="jyp-form-input rounded-xl py-2.5 px-3 text-xs border outline-none"
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                    <label className="jyp-form-label">
                    Marca
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Samsung"
                    className="jyp-form-input rounded-xl py-2.5 px-3 text-xs border outline-none"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                    <label className="jyp-form-label">
                    Código / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: OLED13P-BLK"
                    className="jyp-form-input rounded-xl py-2.5 px-3 text-xs border outline-none"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                    <label className="jyp-form-label">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="jyp-form-input rounded-xl py-2.5 px-3 text-xs border outline-none"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                    <label className="jyp-form-label">
                    Precio (S/.)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="jyp-form-input rounded-xl py-2.5 px-3 text-xs border outline-none"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                    <label className="jyp-form-label">
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
                  className="flex-1 py-3 border font-bold text-xs uppercase rounded-xl transition-colors hover:opacity-80 jyp-btn-ghost"
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
