import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, MapPin, CreditCard, Package, Check, ChevronLeft,
  ChevronRight, Trash2, Plus, Minus, ShieldCheck, Smartphone,
  Banknote, AlertCircle, Store, Sparkles, Activity
} from "lucide-react";
import { storeService } from "../services/api";
import { mediaUrl } from "../services/formatters";
import { TechLoader } from "./common/TechLoader";
import LocationPicker from "./LocationPicker";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
  { id: "yape", name: "Yape", icon: Smartphone, color: "#a855f7", desc: "Escaneo QR o código de aprobación" },
  { id: "plin", name: "Plin", icon: Smartphone, color: "#06b6d4", desc: "Transferencia instantánea interbancaria" },
  { id: "transfer", name: "Transferencia BCP", icon: Banknote, color: "#3b82f6", desc: "BCP · CCI 00219119876543201254" },
  { id: "cash", name: "Efectivo", icon: Banknote, color: "#10b981", desc: "Liquidación contra entrega en domicilio" },
];

const OrderFlowWizard = () => {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [delivery, setDelivery] = useState({ address: "", lat: null, lng: null });
  const [payMethod, setPayMethod] = useState("yape");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await storeService.getCatalogProducts();
      let list = res.data?.resultado || res.data?.data || [];
      if (!Array.isArray(list) || list.length === 0) {
        const branchesRes = await storeService.getBranches().catch(() => null);
        const branches = Array.isArray(branchesRes?.data?.resultado) ? branchesRes.data.resultado : [];
        const aggregated = [];
        for (const b of branches) {
          const pRes = await storeService.getProducts(b.id).catch(() => null);
          const pList = Array.isArray(pRes?.data?.resultado) ? pRes.data.resultado : [];
          pList.forEach((p) => aggregated.push({ ...p, branch_name: b.name, branch_user_id: b.user_id }));
        }
        list = aggregated;
      }
      setProducts(list);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name || ""} ${p.description || ""} ${p.branch_name || ""}`.toLowerCase().includes(q)
    );
  }, [products, searchTerm]);

  const selectedBranchId = useMemo(() => {
    const ids = Object.keys(cart)
      .map((id) => products.find((p) => String(p.id) === String(id))?.sucursal_id)
      .filter(Boolean);
    return ids.length ? ids[0] : null;
  }, [cart, products]);

  const selectedItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = products.find((p) => String(p.id) === String(id));
          return product ? { ...product, quantity: qty } : null;
        })
        .filter(Boolean),
    [cart, products]
  );

  const total = selectedItems.reduce((acc, p) => acc + Number(p.price || 0) * p.quantity, 0);

  const addToCart = (product) => {
    if (selectedBranchId && product.sucursal_id && product.sucursal_id !== selectedBranchId) {
      toast.error("Todos los repuestos del pedido deben pertenecer a la misma sucursal");
      return;
    }
    setCart((prev) => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
  };

  const changeQuantity = (id, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const value = (next[id] || 0) + delta;
      if (value <= 0) delete next[id];
      else next[id] = Math.min(value, 99);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Agrega al menos un componente al pedido");
      setStep(1);
      return;
    }
    if (!delivery.address?.trim()) {
      toast.error("Selecciona la dirección de entrega");
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const res = await storeService.createOrder({
        products: selectedItems.map((p) => ({ product_id: p.id, quantity: p.quantity })),
        delivery_address: delivery.address.trim(),
        latitude: delivery.lat ?? undefined,
        longitude: delivery.lng ?? undefined,
      });
      if (res.data?.exito) {
        toast.success("¡Pedido registrado! Procede con el pago desde Mis Pedidos.");
        setStep(4);
      } else {
        toast.error(res.data?.mensaje || "No se pudo registrar el pedido");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.mensaje || "No se pudo registrar el pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: "Repuestos", icon: Package },
    { id: 2, label: "Despacho", icon: MapPin },
    { id: 3, label: "Pago & Auditoría", icon: CreditCard },
  ];

  if (loading) {
    return <TechLoader title="Iniciando Asistente de Compra" subtitle="Cargando catálogo homologado..." />;
  }

  return (
    <div className="w-full space-y-8 pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header Stepper */}
      <header className="space-y-6">
        <div>
          <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25 inline-flex items-center gap-1.5">
            <Activity size={12} className="text-cyan-400" /> Asistente de Pedido de Hardware
          </span>
          <h1
            className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Carrito de Repuestos & Suministros
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-1">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div
                  className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 rounded-2xl border transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10"
                      : isDone
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                      : "bg-white/[0.03] border-white/10 text-slate-400"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                      isDone
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : isActive
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md shadow-cyan-500/30"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {isDone ? <Check size={12} /> : s.id}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider">{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className="h-px flex-1 min-w-[20px] bg-white/10" />}
              </React.Fragment>
            );
          })}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* STEP 1: Product Selection */}
        {step === 1 && (
          <motion.div
            key="s1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre, código o sucursal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-5 pr-4 py-3.5 rounded-2xl bg-[#0a101b]/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
              />
            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-[32px] border border-white/10 bg-[#0a101b]/80 p-16 text-center space-y-3">
                <Package size={40} className="mx-auto text-slate-600" />
                <p className="text-slate-400 text-sm">No se encontraron componentes en el catálogo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((p) => {
                  const qty = cart[p.id] || 0;
                  const stock = Number(p.stock ?? 0);
                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-[28px] border bg-[#0a101b]/90 border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-4 shadow-lg group"
                    >
                      <div className="h-36 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center overflow-hidden">
                        {p.image_url ? (
                          <img src={mediaUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package size={40} className="text-cyan-400/60" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 min-h-[28px]">
                          {p.description || "Componente homologado con garantía de fábrica JyP."}
                        </p>
                        {p.branch_name && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                            <Store size={11} className="text-cyan-400" /> {p.branch_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                        <span
                          className="text-lg font-black text-white"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          S/. {Number(p.price || 0).toFixed(2)}
                        </span>
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(p)}
                            disabled={stock <= 0}
                            className="jyp-btn-primary px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider disabled:opacity-40"
                          >
                            {stock > 0 ? "Agregar" : "Agotado"}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => changeQuantity(p.id, -1)}
                              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10"
                            >
                              <Minus size={13} className="mx-auto" />
                            </button>
                            <span className="w-6 text-center text-sm font-black text-white font-mono">{qty}</span>
                            <button
                              onClick={() => changeQuantity(p.id, 1)}
                              className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-500"
                            >
                              <Plus size={13} className="mx-auto" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: Delivery Location */}
        {step === 2 && (
          <motion.div
            key="s2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-[32px] border border-white/10 bg-[#0a101b]/95 p-6 sm:p-8 shadow-2xl">
              <h2
                className="text-base font-black uppercase tracking-wider text-white mb-5 flex items-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <MapPin size={18} className="text-cyan-400" />
                <span>Punto de Entrega / Despacho</span>
              </h2>
              <LocationPicker
                onLocationSelect={(loc) => setDelivery({ address: loc.address || "", lat: loc.lat, lng: loc.lng })}
              />
            </div>
          </motion.div>
        )}

        {/* STEP 3: Payment & Summary */}
        {step === 3 && (
          <motion.div
            key="s3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="rounded-[32px] border border-white/10 bg-[#0a101b]/95 p-6 sm:p-8 space-y-4 shadow-xl">
              <h2
                className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <CreditCard size={18} className="text-cyan-400" />
                <span>Forma de Liquidación</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const selected = payMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`p-5 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                        selected
                          ? "border-cyan-400/80 bg-gradient-to-r from-blue-600/20 to-cyan-600/15 shadow-lg shadow-cyan-500/10"
                          : "border-white/10 bg-[#0c1424] hover:bg-white/5"
                      }`}
                    >
                      <span
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                        style={{ backgroundColor: `${m.color}22`, color: m.color }}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-black text-white">{m.name}</span>
                        <span className="block text-[11px] text-slate-400 truncate">{m.desc}</span>
                      </span>
                      {selected && <Check size={18} className="text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 flex items-start gap-2 pt-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-cyan-400" />
                <span>El pedido se despacha una vez validado el comprobante o confirmada la entrega en efectivo.</span>
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-[32px] border border-white/10 bg-[#0a101b]/95 p-6 sm:p-8 space-y-4 shadow-xl">
              <h2
                className="text-base font-black uppercase tracking-wider text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Resumen de la Orden
              </h2>
              <div className="space-y-2.5">
                {selectedItems.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-300 truncate">
                      {p.quantity} × {p.name}
                    </span>
                    <span
                      className="font-black text-white font-mono shrink-0"
                    >
                      S/. {(Number(p.price || 0) * p.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Total a Liquidar</span>
                <span
                  className="text-2xl font-black text-cyan-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  S/. {total.toFixed(2)}
                </span>
              </div>

              {delivery.address && (
                <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
                  <MapPin size={13} className="shrink-0 mt-0.5 text-blue-400" />
                  <span>{delivery.address}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 4: Success Screen */}
        {step === 4 && (
          <motion.div
            key="s4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[32px] border border-emerald-500/30 bg-emerald-500/10 p-16 text-center space-y-5"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <Check size={40} />
            </div>
            <h2
              className="text-2xl sm:text-3xl font-black text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              ¡Pedido Registrado con Éxito!
            </h2>
            <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
              Tu orden por S/. {total.toFixed(2)} fue transferida a la sucursal asignada. Puedes realizar el pago y monitorear el despacho desde Mis Pedidos.
            </p>
            <a
              href="/orders"
              className="jyp-btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-blue-600/30"
            >
              <ShoppingCart size={16} />
              <span>Ver Mis Pedidos</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Dock */}
      {step < 4 && (
        <footer className="sticky bottom-4 z-20 rounded-[28px] border border-white/10 bg-[#0a101b]/95 backdrop-blur-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <ShoppingCart size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {selectedItems.length} {selectedItems.length === 1 ? "artículo" : "artículos"}
              </span>
              <p
                className="text-base sm:text-lg font-black text-white leading-tight font-mono"
              >
                S/. {total.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border border-white/10 text-slate-300 hover:bg-white/5 flex items-center gap-2 transition-all"
              >
                <ChevronLeft size={15} />
                <span>Atrás</span>
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && selectedItems.length === 0) {
                    toast.error("Agrega al menos un repuesto al pedido");
                    return;
                  }
                  setStep(step + 1);
                }}
                className="flex-1 sm:flex-none jyp-btn-primary px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Continuar</span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 sm:flex-none jyp-btn-primary px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                <span>{submitting ? "Transmitiendo..." : "Confirmar Pedido"}</span>
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};

export default OrderFlowWizard;
