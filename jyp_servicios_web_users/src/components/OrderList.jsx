import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingBag, Clock, ChevronRight, 
  MessageSquare, MapPin, Truck, CheckCircle2,
  XCircle, ArrowLeft, Search, Filter, Store, RefreshCw, Check
} from 'lucide-react';
import { storeService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { TechLoader } from './common/TechLoader';
import toast from 'react-hot-toast';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : {};
  const isStore = user.role === 'store';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let data = [];
      if (isStore) {
        let branchId = user.branchId;
        if (!branchId) {
          try {
            const uid = user.id || user.userId;
            const branchesRes = await storeService.getBranches();
            const branches = branchesRes.data?.resultado || [];
            const myStore = branches.find(s => s.user_id === uid);
            branchId = myStore?.id || 1;
          } catch (e) {
            branchId = 1;
          }
        }
        const res = await storeService.getOrders(branchId);
        data = res.data?.resultado || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await storeService.getMyOrders();
        data = res.data?.resultado || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      }
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('No se pudieron cargar los pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await storeService.updateOrderStatus(orderId, newStatus);
      if (res.data?.exito || res.data?.success) {
        toast.success(`Pedido actualizado a: ${newStatus}`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        toast.error(res.data?.mensaje || 'Error al actualizar pedido');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error(err.response?.data?.mensaje || 'No se pudo actualizar el pedido');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': 
        return { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: Clock };
      case 'confirmed': 
        return { label: 'Confirmado', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: CheckCircle2 };
      case 'shipped': 
        return { label: 'En Camino', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', icon: Truck };
      case 'delivered': 
        return { label: 'Entregado', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 };
      case 'cancelled': 
        return { label: 'Cancelado', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20', icon: XCircle };
      default: 
        return { label: status || 'Desconocido', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: Package };
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  return (
    <div className="w-full space-y-10 pb-4 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
        <div className="space-y-1.5">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider">Volver</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {isStore ? 'Gestión de ' : 'Mis '}
            <span className="text-blue-500">{isStore ? 'Ventas & Despachos' : 'Pedidos'}</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            {isStore 
              ? 'Controla los pedidos de clientes, despacha productos y confirma entregas.'
              : 'Rastrea tus compras de repuestos, accesorios y suministros técnicos.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm ${
                filter === f 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30' 
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? 'Todos' : 
               f === 'pending' ? 'Pendientes' : 
               f === 'confirmed' ? 'Confirmados' : 
               f === 'shipped' ? 'En camino' : 'Entregados'}
            </button>
          ))}
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5 shadow-sm"
            title="Recargar pedidos"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* Orders List */}
      <div className="space-y-6">
        {loading ? (
          <TechLoader compact title="Cargando Pedidos" subtitle="Sincronizando estado de órdenes..." />
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const status = getStatusInfo(order.status);
            const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('es-PE', {
              day: '2-digit', month: 'short', year: 'numeric'
            }) : 'Reciente';

            return (
              <div 
                key={order.id}
                className="glass-panel p-7 sm:p-8 flex flex-col md:flex-row gap-6 hover:border-blue-500/40 transition-all rounded-3xl relative overflow-hidden bg-[#0e1424] border border-white/10 shadow-xl"
              >
                {/* Product Info */}
                <div className="flex gap-4 flex-1">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                    <Package size={34} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-slate-500 tracking-wider">
                        ORDEN #{String(order.id).padStart(5, '0')}
                      </span>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${status.bg} ${status.color}`}>
                        <status.icon size={11} />
                        {status.label}
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                      {order.product_name || order.nombre_producto || 'Repuesto / Accesorio'}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {isStore ? (
                        <span className="text-slate-300 font-bold">Cliente: {order.client_name || order.cliente_nombre || 'Cliente JyP'}</span>
                      ) : (
                        <div className="flex items-center gap-1.5 font-medium">
                          <Store size={14} className="text-blue-400" />
                          <span>{order.branch_name || 'Sucursal Principal'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {order.delivery_address && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                        <MapPin size={13} className="text-blue-400 shrink-0" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 md:min-w-[190px] border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-5">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                    <p className="text-xl sm:text-2xl font-black text-white">
                      S/. {parseFloat(order.total_price || order.price || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="flex flex-wrap gap-2 justify-end">
                    {/* Chat button */}
                    <button 
                      onClick={() => {
                        const targetId = isStore ? order.client_id : order.branch_user_id;
                        navigate(targetId ? `/chat?user=${targetId}` : '/chat');
                      }}
                      className="p-2.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title={isStore ? "Contactar al cliente" : "Chatear con la tienda"}
                    >
                      <MessageSquare size={17} />
                    </button>

                    {/* Store management buttons */}
                    {isStore && order.status === 'pending' && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Confirmar</span>
                      </button>
                    )}

                    {isStore && order.status === 'confirmed' && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Truck size={14} />
                        <span>Despachar</span>
                      </button>
                    )}

                    {isStore && order.status === 'shipped' && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>Entregado</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-16 text-center space-y-4 rounded-3xl bg-[#0e1424] border border-white/10">
            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-400">
              <ShoppingBag size={38} />
            </div>
            <h3 className="text-xl font-black text-white">
              {filter === 'all' ? 'No hay pedidos registrados' : `No hay pedidos en estado "${filter}"`}
            </h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              {isStore 
                ? 'Los pedidos realizados por los clientes para tus productos aparecerán aquí.' 
                : 'Explora nuestra tienda de repuestos y accesorios originales para tus equipos.'}
            </p>
            {!isStore && (
              <button 
                onClick={() => navigate('/shop')}
                className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-wider"
              >
                Ver Tienda de Repuestos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
