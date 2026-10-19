import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingBag, Clock, ChevronRight, 
  MessageSquare, MapPin, Truck, CheckCircle2,
  XCircle, ArrowLeft, Search, Filter, Store, RefreshCw, Check,
  CreditCard
} from 'lucide-react';
import { storeService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { TechLoader } from './common/TechLoader';
import CulqiPaymentModal from './common/CulqiPaymentModal';
import toast from 'react-hot-toast';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [culqiTarget, setCulqiTarget] = useState(null);
  const [payMethod, setPayMethod] = useState('yape');

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
            const myStoreRes = await storeService.getMyStore();
            branchId = myStoreRes.data?.resultado?.id;
          } catch (e) {
            branchId = null;
          }
        }
        if (!branchId) {
          const branchesRes = await storeService.getBranches().catch(() => null);
          const branches = Array.isArray(branchesRes?.data?.resultado) ? branchesRes.data.resultado : [];
          const uid = user.id || user.userId;
          branchId = branches.find(s => String(s.user_id) === String(uid))?.id;
        }
        if (!branchId) {
          setOrders([]);
          return;
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
      case 'paid':
        return { label: 'Pagado', color: 'text-teal-400', bg: 'bg-teal-400/10 border-teal-400/20', icon: CheckCircle2 };
      case 'confirmed':
        return { label: 'Confirmado', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: CheckCircle2 };
      case 'in_preparation':
        return { label: 'En preparación', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20', icon: Package };
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

  const PAYMENT_STATUS = {
    pending: { label: 'Pago pendiente', color: 'text-amber-400' },
    waiting_confirmation: { label: 'Pago por confirmar', color: 'text-cyan-400' },
    paid: { label: 'Pago confirmado', color: 'text-emerald-400' },
  };

  const handlePayOrder = async () => {
    if (!payTarget) return;
    setPayingId(payTarget.id);
    try {
      const res = await storeService.payOrder(payTarget.id, payMethod);
      if (res.data?.exito) {
        toast.success('Pago registrado. La tienda lo confirmará en breve.');
        setShowPayModal(false);
        setPayTarget(null);
        fetchOrders();
      } else {
        toast.error(res.data?.mensaje || 'No se pudo registrar el pago');
      }
    } catch (err) {
      console.error('Error paying order:', err);
      toast.error(err.response?.data?.mensaje || 'No se pudo registrar el pago');
    } finally {
      setPayingId(null);
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
          {['all', 'pending', 'paid', 'confirmed', 'in_preparation', 'shipped', 'delivered'].map((f) => (
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
               f === 'paid' ? 'Pagados' :
               f === 'confirmed' ? 'Confirmados' :
               f === 'in_preparation' ? 'En preparación' :
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
                        <span className="text-slate-300 font-bold">
                          Cliente: {[order.client_names, order.client_surnames].filter(Boolean).join(' ').trim() || 'Cliente JyP'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 font-medium">
                          <Store size={14} className="text-blue-400" />
                          <span>{order.branch_name || order.sucursal_name || 'Sucursal JyP'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{dateStr}</span>
                      </div>
                      {order.payment_status && PAYMENT_STATUS[order.payment_status] && (
                        <span className={`font-bold ${PAYMENT_STATUS[order.payment_status].color}`}>
                          · {PAYMENT_STATUS[order.payment_status].label}
                        </span>
                      )}
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

                    {/* Client: pay the order */}
                    {!isStore && order.payment_status === 'pending' && order.status !== 'cancelled' && (
                      <button
                        disabled={payingId === order.id}
                        onClick={() => {
                          setPayTarget(order);
                          setShowPayModal(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <CreditCard size={14} />
                        <span>Pagar S/. {parseFloat(order.total_price || 0).toFixed(2)}</span>
                      </button>
                    )}

                    {/* Store management buttons */}
                    {isStore && order.payment_status === 'waiting_confirmation' && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={async () => {
                          setUpdatingId(order.id);
                          try {
                            const res = await storeService.confirmOrderPayment(order.id);
                            if (res.data?.exito) {
                              toast.success('Pago confirmado');
                              fetchOrders();
                            }
                          } catch (err) {
                            toast.error(err.response?.data?.mensaje || 'No se pudo confirmar el pago');
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Confirmar pago</span>
                      </button>
                    )}

                    {isStore && order.status === 'confirmed' && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, 'in_preparation')}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Package size={14} />
                        <span>Preparar</span>
                      </button>
                    )}

                    {isStore && order.status === 'in_preparation' && (
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

      {/* Payment Modal */}
      {showPayModal && payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e1424] p-8 space-y-6 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-emerald-500/15 text-emerald-400">
                <CreditCard size={26} />
              </div>
              <h3 className="text-lg font-black text-white">Método de pago</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pedido #{String(payTarget.id).padStart(5, '0')} · S/. {parseFloat(payTarget.total_price || 0).toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['yape', 'plin', 'transfer', 'cash'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPayMethod(method)}
                  className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                    payMethod === method
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {method === 'transfer' ? 'Transferencia' : method === 'cash' ? 'Efectivo' : method}
                </button>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-black/20 border border-white/5 text-center">
              {payMethod === 'yape' || payMethod === 'plin' ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Número receptor</p>
                  <p className="text-2xl font-black text-blue-400 mt-1">987 654 321</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">JyP Servicios Técnicos</p>
                </>
              ) : payMethod === 'transfer' ? (
                <div className="space-y-1.5 text-xs text-left">
                  <div className="flex justify-between"><span className="text-slate-500">Banco:</span><span className="font-bold text-white">BCP</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cuenta:</span><span className="font-bold text-white">191-98765432-0-12</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">CCI:</span><span className="font-bold text-white">00219119876543201254</span></div>
                </div>
              ) : (
                <p className="text-xs text-slate-300">Pagas en efectivo al recibir el pedido.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPayModal(false); setPayTarget(null); }}
                className="flex-1 py-3 text-xs font-black uppercase rounded-xl border border-white/10 text-slate-400 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayOrder}
                disabled={payingId === payTarget.id}
                className="flex-1 py-3 text-xs font-black uppercase rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {payingId === payTarget.id ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </div>

            <button
              onClick={() => {
                setShowPayModal(false);
                setCulqiTarget(payTarget);
              }}
              className="w-full py-3 text-xs font-black uppercase rounded-xl border border-blue-500/30 bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard size={15} />
              Pagar con tarjeta (Culqi)
            </button>
          </div>
        </div>
      )}

      <CulqiPaymentModal
        open={!!culqiTarget}
        onClose={() => setCulqiTarget(null)}
        amount={culqiTarget?.total_price}
        type="order"
        entityId={culqiTarget?.id}
        onSuccess={fetchOrders}
      />
    </div>
  );
};

export default OrderList;
