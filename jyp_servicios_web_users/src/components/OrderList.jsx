import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, ShoppingBag, Clock, ChevronRight, 
  MessageSquare, MapPin, Truck, CheckCircle2,
  XCircle, ArrowLeft, Search, Filter, Store
} from 'lucide-react';
import { storeService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await storeService.getMyOrders();
      if (response.data.exito) {
        setOrders(response.data.resultado || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { label: 'Pendiente', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock };
      case 'confirmed': return { label: 'Confirmado', color: 'text-primary', bg: 'bg-primary/10', icon: CheckCircle2 };
      case 'shipped': return { label: 'En Camino', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Truck };
      case 'delivered': return { label: 'Entregado', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 };
      case 'cancelled': return { label: 'Cancelado', color: 'text-error', bg: 'bg-error/10', icon: XCircle };
      default: return { label: status, color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Package };
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-outfit pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="space-y-1">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-dim hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Volver</span>
          </button>
          <h1 className="text-4xl font-black text-white tracking-tight">Mis <span className="text-primary">Pedidos</span></h1>
          <p className="text-text-dim text-sm font-medium">Rastrea tus compras de repuestos y accesorios.</p>
        </div>
        <div className="flex gap-2">
           {['all', 'pending', 'shipped', 'delivered'].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-text-dim hover:bg-white/10'
               }`}
             >
               {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'shipped' ? 'En camino' : 'Entregados'}
             </button>
           ))}
        </div>
      </header>

      {/* Orders List */}
      <div className="space-y-4 px-2">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-panel p-6 h-48 animate-pulse" />
          ))
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const status = getStatusInfo(order.status);
            return (
              <motion.div 
                key={order.id}
                layoutId={`order-${order.id}`}
                className="glass-panel p-6 flex flex-col md:flex-row gap-6 hover:border-primary/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:bg-primary/5 transition-colors" />
                
                {/* Product Info */}
                <div className="flex gap-4 flex-1">
                  <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                    <Package size={40} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">#{String(order.id).padStart(5, '0')}</span>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase ${status.bg} ${status.color}`}>
                        <status.icon size={10} />
                        {status.label}
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-white">{order.product_name || 'Producto J&P'}</h3>
                    <div className="flex items-center gap-2 text-xs text-text-dim font-medium">
                      <Store size={14} className="text-primary" />
                      {order.branch_name || 'Sucursal Principal'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-dim">
                      <Clock size={14} />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-4 md:min-w-[150px] border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                    <p className="text-2xl font-black text-white">S/.{parseFloat(order.total_price || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/chat?user=${order.branch_user_id}`)}
                      className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                      title="Chatear con la tienda"
                    >
                      <MessageSquare size={20} />
                    </button>
                    <button className="p-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Address Bar */}
                {order.delivery_address && (
                  <div className="w-full mt-2 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-text-dim font-medium">
                    <MapPin size={12} className="text-primary" />
                    <span className="uppercase tracking-wide truncate">{order.delivery_address}</span>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="glass-panel p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
              <ShoppingBag size={40} />
            </div>
            <h3 className="text-xl font-black text-white">No tienes pedidos aún</h3>
            <p className="text-text-dim text-sm max-w-xs mx-auto">Explora las tiendas para comprar los mejores repuestos para tu equipo.</p>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary px-8 py-3 text-xs font-black uppercase tracking-widest"
            >
              Ir a la tienda
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
