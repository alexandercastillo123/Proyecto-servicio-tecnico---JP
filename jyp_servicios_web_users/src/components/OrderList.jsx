import React, { useState, useEffect } from "react";
import {
  Package, ShoppingBag, Clock, ChevronRight,
  MessageSquare, MapPin, Truck, CheckCircle2,
  XCircle, ArrowLeft, Search, Filter, Store, RefreshCw, Check,
  CreditCard, Sparkles, Activity
} from "lucide-react";
import { storeService } from "../services/api";
import { useNavigate } from "react-router-dom";
import { TechLoader } from "./common/TechLoader";
import CulqiPaymentModal from "./common/CulqiPaymentModal";
import toast from "react-hot-toast";

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [culqiTarget, setCulqiTarget] = useState(null);
  const [payMethod, setPayMethod] = useState("yape");

  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : {};
  const isStore = user.role === "store";

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
          branchId = branches.find((s) => String(s.user_id) === String(uid))?.id;
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
      console.error("Error fetching orders:", error);
      toast.error("No se pudieron cargar los pedidos");
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
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      } else {
        toast.error(res.data?.mensaje || "Error al actualizar pedido");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      toast.error(err.response?.data?.mensaje || "No se pudo actualizar el pedido");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/25", icon: Clock };
      case "paid":
        return { label: "Pagado", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/25", icon: CheckCircle2 };
      case "confirmed":
        return { label: "Confirmado", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/25", icon: CheckCircle2 };
      case "in_preparation":
        return { label: "En Preparación", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/25", icon: Package };
      case "shipped":
        return { label: "En Despacho", color: "text-indigo-400", bg: "bg-indigo-400/10 border-indigo-400/25", icon: Truck };
      case "delivered":
        return { label: "Entregado", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/25", icon: CheckCircle2 };
      case "cancelled":
        return { label: "Cancelado", color: "text-rose-400", bg: "bg-rose-400/10 border-rose-400/25", icon: XCircle };
      default:
        return { label: status || "Registrado", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: Package };
    }
  };

  const PAYMENT_STATUS = {
    pending: { label: "Pago pendiente", color: "text-amber-400" },
    waiting_confirmation: { label: "Por confirmar", color: "text-cyan-400" },
    paid: { label: "Pago confirmado", color: "text-emerald-400" },
  };

  const handlePayOrder = async () => {
    if (!payTarget) return;
    setPayingId(payTarget.id);
    try {
      const res = await storeService.payOrder(payTarget.id, payMethod);
      if (res.data?.exito) {
        toast.success("Pago registrado. La sucursal lo auditará en breve.");
        setShowPayModal(false);
        setPayTarget(null);
        fetchOrders();
      } else {
        toast.error(res.data?.mensaje || "No se pudo registrar el pago");
      }
    } catch (err) {
      console.error("Error paying order:", err);
      toast.error(err.response?.data?.mensaje || "No se pudo registrar el pago");
    } finally {
      setPayingId(null);
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="w-full space-y-8 pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[32px] p-8 sm:p-10 border border-white/10 bg-gradient-to-br from-[#0c1322] via-[#080d17] to-[#0a1829] shadow-2xl flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25">
            <Activity size={13} className="text-cyan-400 animate-pulse" />
            <span>{isStore ? "Consola de Ventas & Logística" : "Historial de Pedidos"}</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {isStore ? "Despacho de Repuestos" : "Mis Pedidos de Hardware"}
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            {isStore
              ? "Supervisa pedidos de repuestos, gestiona envíos a domicilio y confirma liquidaciones."
              : "Rastreo en tiempo real de componentes adquiridos en las sucursales oficiales."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10 text-xs font-bold flex items-center gap-2"
            title="Recargar pedidos"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-cyan-400" : ""} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "all", label: "Todos" },
          { id: "pending", label: "Pendientes" },
          { id: "paid", label: "Pagados" },
          { id: "confirmed", label: "Confirmados" },
          { id: "in_preparation", label: "En Preparación" },
          { id: "shipped", label: "En Despacho" },
          { id: "delivered", label: "Entregados" },
        ].map((f) => {
          const isSel = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSel
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                  : "bg-white/[0.03] text-slate-400 border-white/10 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <TechLoader compact title="Cargando Pedidos" subtitle="Sincronizando órdenes con el servidor central..." />
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const status = getStatusInfo(order.status);
            const dateStr = order.created_at
              ? new Date(order.created_at).toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Reciente";

            return (
              <div
                key={order.id}
                className="p-6 sm:p-7 flex flex-col md:flex-row gap-6 hover:border-cyan-500/40 transition-all rounded-[28px] relative overflow-hidden bg-[#0a101b]/90 border border-white/10 shadow-xl"
              >
                {/* Product & Branch Info */}
                <div className="flex gap-4 sm:gap-5 flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 bg-cyan-500/10 border border-cyan-500/25 rounded-2xl flex items-center justify-center text-cyan-400 shrink-0 shadow-md">
                    <Package size={32} />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-cyan-400 font-mono tracking-wider">
                        #ORD-{String(order.id).padStart(5, "0")}
                      </span>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${status.bg} ${status.color}`}>
                        <status.icon size={11} />
                        <span>{status.label}</span>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white leading-snug truncate">
                      {order.product_name || order.nombre_producto || "Repuesto / Accesorio de Precisión"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {isStore ? (
                        <span className="text-slate-200 font-bold">
                          Cliente: {[order.client_names, order.client_surnames].filter(Boolean).join(" ").trim() || "Cliente JyP"}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 font-medium text-slate-300">
                          <Store size={13} className="text-cyan-400" />
                          <span>{order.branch_name || order.sucursal_name || "Sucursal JyP"}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                        <Clock size={12} />
                        <span>{dateStr}</span>
                      </div>
                      {order.payment_status && PAYMENT_STATUS[order.payment_status] && (
                        <span className={`font-mono font-bold text-[11px] ${PAYMENT_STATUS[order.payment_status].color}`}>
                          · {PAYMENT_STATUS[order.payment_status].label}
                        </span>
                      )}
                    </div>

                    {order.delivery_address && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 truncate">
                        <MapPin size={12} className="text-blue-400 shrink-0" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price & Actions Right */}
                <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 md:min-w-[190px] border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-5">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Liquidación</span>
                    <span
                      className="text-xl sm:text-2xl font-black text-white"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      S/. {parseFloat(order.total_price || order.price || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    {/* Chat button */}
                    <button
                      onClick={() => {
                        const targetId = isStore ? order.client_id : order.branch_user_id;
                        navigate(targetId ? `/chat?user=${targetId}` : "/chat");
                      }}
                      className="p-2.5 bg-white/5 text-cyan-400 border border-white/10 rounded-xl hover:bg-white/10 transition-all shadow-sm"
                      title={isStore ? "Contactar al cliente" : "Chatear con la tienda"}
                    >
                      <MessageSquare size={16} />
                    </button>

                    {/* Client pay button */}
                    {!isStore && order.payment_status === "pending" && order.status !== "cancelled" && (
                      <button
                        disabled={payingId === order.id}
                        onClick={() => {
                          setPayTarget(order);
                          setShowPayModal(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <CreditCard size={14} />
                        <span>Pagar</span>
                      </button>
                    )}

                    {/* Store management buttons */}
                    {isStore && order.payment_status === "waiting_confirmation" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={async () => {
                          setUpdatingId(order.id);
                          try {
                            const res = await storeService.confirmOrderPayment(order.id);
                            if (res.data?.exito) {
                              toast.success("Pago confirmado");
                              fetchOrders();
                            }
                          } catch (err) {
                            toast.error(err.response?.data?.mensaje || "No se pudo confirmar el pago");
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1"
                      >
                        <Check size={13} />
                        <span>Confirmar Pago</span>
                      </button>
                    )}

                    {isStore && order.status === "confirmed" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "in_preparation")}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1"
                      >
                        <Package size={13} />
                        <span>Preparar</span>
                      </button>
                    )}

                    {isStore && order.status === "in_preparation" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "shipped")}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1"
                      >
                        <Truck size={13} />
                        <span>Despachar</span>
                      </button>
                    )}

                    {isStore && order.status === "shipped" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => handleUpdateStatus(order.id, "delivered")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        <span>Entregado</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center space-y-4 rounded-[32px] bg-[#0a101b]/80 border border-white/10">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto text-cyan-400">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-black text-white">
              {filter === "all" ? "No hay pedidos registrados" : `No hay pedidos en estado "${filter}"`}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
              {isStore
                ? "Los pedidos realizados por clientes para tus repuestos se mostrarán aquí."
                : "Explora nuestro catálogo de componentes homologados para tus equipos."}
            </p>
            {!isStore && (
              <button
                onClick={() => navigate("/shop")}
                className="jyp-btn-primary px-7 py-3 text-xs font-black uppercase tracking-wider rounded-2xl"
              >
                Ir a la Tienda de Repuestos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cyber-Tech Payment Modal */}
      {showPayModal && payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[36px] border border-white/15 bg-[#0a101b] p-8 space-y-6 shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <CreditCard size={26} />
              </div>
              <h3
                className="text-xl font-black text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Método de Pago
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Orden #ORD-{String(payTarget.id).padStart(5, "0")} · S/. {parseFloat(payTarget.total_price || 0).toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {["yape", "plin", "transfer", "cash"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPayMethod(method)}
                  className={`p-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
                    payMethod === method
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white shadow-lg shadow-blue-600/30"
                      : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {method === "transfer" ? "Transferencia" : method === "cash" ? "Efectivo" : method}
                </button>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-[#0c1424] border border-white/5 text-center">
              {payMethod === "yape" || payMethod === "plin" ? (
                <>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Número Receptor Certificado
                  </span>
                  <p className="text-2xl font-black text-cyan-400 font-mono mt-1">987 654 321</p>
                  <p className="text-xs font-semibold text-slate-300 mt-0.5">JyP Servicios Técnicos SAC</p>
                </>
              ) : payMethod === "transfer" ? (
                <div className="space-y-1.5 text-xs text-left">
                  <div className="flex justify-between"><span className="text-slate-400">Banco:</span><span className="font-bold text-white">BCP Soles</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Cuenta:</span><span className="font-mono font-bold text-white">191-98765432-0-12</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">CCI:</span><span className="font-mono font-bold text-white">00219119876543201254</span></div>
                </div>
              ) : (
                <p className="text-xs text-slate-300">Pagas en efectivo al momento de recibir el repuesto.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setPayTarget(null);
                }}
                className="flex-1 py-3.5 text-xs font-black uppercase rounded-2xl border border-white/10 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayOrder}
                disabled={payingId === payTarget.id}
                className="flex-1 py-3.5 text-xs font-black uppercase rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 shadow-xl shadow-emerald-600/25"
              >
                {payingId === payTarget.id ? "Registrando..." : "Confirmar Envío"}
              </button>
            </div>

            <button
              onClick={() => {
                setShowPayModal(false);
                setCulqiTarget(payTarget);
              }}
              className="w-full py-3.5 text-xs font-black uppercase rounded-2xl border border-cyan-500/30 bg-cyan-600/10 text-cyan-300 hover:bg-cyan-600/20 transition-all flex items-center justify-center gap-2"
            >
              <CreditCard size={15} />
              <span>Pagar con Tarjeta (Pasarela Culqi)</span>
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
