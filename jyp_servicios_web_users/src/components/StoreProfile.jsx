import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Store, MapPin, Phone, Info, ShoppingCart,
  ArrowLeft, Search, Filter, Box, ArrowRight,
  Clock, ShieldCheck, Check, Star, MessageCircle,
  Package, Zap, Sparkles
} from "lucide-react";
import { storeService } from "../services/api";
import { mediaUrl } from "../services/formatters";
import toast from "react-hot-toast";

const StoreProfile = () => {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderingProduct, setOrderingProduct] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [sendingReview, setSendingReview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoreData();
  }, [id]);

  const fetchStoreData = async () => {
    try {
      const storeResp = await storeService.getBranchDetails(id).catch(() => null);
      if (storeResp?.data?.exito) {
        setStore(storeResp.data.resultado);
      } else {
        const branchesResp = await storeService.getBranches().catch(() => null);
        const branches = Array.isArray(branchesResp?.data?.resultado) ? branchesResp.data.resultado : [];
        setStore(branches.find((b) => String(b.id) === String(id)) || null);
      }

      const productsResp = await storeService.getProducts(id);
      if (productsResp.data?.exito) {
        setProducts(productsResp.data.resultado || []);
      }

      const reviewsResp = await storeService.getStoreReviews(id).catch(() => null);
      const list = reviewsResp?.data?.resultado;
      setReviews(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching store data:", error);
      toast.error("No se pudo cargar la información de la sucursal");
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = (product) => {
    setOrderingProduct(product);
    setQuantity(1);
    setDeliveryAddress("");
    setDeliveryLat(null);
    setDeliveryLng(null);
  };

  const handleCreateOrder = async () => {
    if (!orderingProduct) return;
    setOrderLoading(true);
    try {
      const resp = await storeService.createOrder({
        product_id: orderingProduct.id,
        quantity,
        delivery_address: deliveryAddress.trim() || undefined,
        latitude: deliveryLat ?? undefined,
        longitude: deliveryLng ?? undefined,
      });
      if (resp.data?.exito) {
        toast.success("¡Pedido registrado! Puedes verificar su estado en Mis Pedidos.");
        setOrderingProduct(null);
      } else {
        toast.error(resp.data?.mensaje || "No se pudo realizar el pedido");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.mensaje || "Error al realizar el pedido");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    setSendingReview(true);
    try {
      const res = await storeService.addStoreReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      if (res.data?.exito) {
        toast.success("¡Gracias por tu reseña!");
        setShowReviewForm(false);
        setReviewComment("");
        setReviewRating(5);
        const reviewsResp = await storeService.getStoreReviews(id).catch(() => null);
        const list = reviewsResp?.data?.resultado;
        setReviews(Array.isArray(list) ? list : []);
      } else {
        toast.error(res.data?.mensaje || "No se pudo registrar la reseña");
      }
    } catch (error) {
      console.error("Error sending review:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo registrar la reseña");
    } finally {
      setSendingReview(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-slate-400 animate-pulse">
          Cargando catálogo oficial de la sucursal...
        </p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-12 text-center rounded-[32px] border border-white/10 bg-[#0a101b] max-w-md mx-auto mt-12 space-y-4">
        <p className="font-bold text-lg text-white">Sucursal no encontrada.</p>
        <Link to="/stores" className="jyp-btn-primary inline-flex px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider">
          Volver a tiendas
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Back button */}
      <div>
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-wider text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          <span>Volver a Sucursales</span>
        </Link>
      </div>

      {/* Store Header Card */}
      <section className="rounded-[32px] border border-white/10 bg-[#0a101b]/95 shadow-2xl overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-blue-600/20 via-cyan-500/15 to-transparent pointer-events-none" />

        <div className="px-8 sm:px-10 pb-8 flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 relative z-10">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-[#0a101b] shadow-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)" }}
          >
            <Store size={44} />
          </div>

          <div className="flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              <ShieldCheck size={13} />
              <span>Sede Homologada JyP</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {store.name}
            </h1>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <MapPin size={13} className="text-cyan-400" />
                <span>{store.address || "Ubicación central"}, {store.city || "Lima"}</span>
              </span>
              {store.phone && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                  <Phone size={13} className="text-blue-400" />
                  <span>{store.phone}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate(`/appointments/schedule?store=${id}`)}
              className="jyp-btn-primary px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <Clock size={16} />
              <span>Agendar Cita en Local</span>
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingCart size={16} className="text-cyan-400" />
              <span>Mis Pedidos</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid: Sidebar filter & Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6">
          <div className="p-6 rounded-[28px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Filter size={15} className="text-cyan-400" />
              <span>Filtrar Catálogo</span>
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input
                type="text"
                placeholder="Buscar componente..."
                className="w-full rounded-2xl py-2.5 pl-10 pr-3 text-xs bg-[#0c1424] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="p-6 rounded-[28px] border border-cyan-500/20 bg-cyan-500/5 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <ShieldCheck size={18} />
              <h4 className="font-black text-xs uppercase tracking-wider">Certificación JyP</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Todos los componentes disponibles en esta sucursal cuentan con sellos de garantía y soporte técnico local.
            </p>
          </div>
        </aside>

        {/* Product Grid & Reviews */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2
              className="text-xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Inventario de Repuestos & Suministros
            </h2>
            <span className="text-xs font-mono font-bold text-slate-400 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              {filteredProducts.length} productos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-6 rounded-[28px] border border-white/10 bg-[#0a101b]/90 shadow-lg flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="space-y-4">
                    <div className="aspect-video rounded-2xl overflow-hidden flex items-center justify-center border border-white/5 bg-[#0c1424] relative">
                      {p.image_url ? (
                        <img
                          src={mediaUrl(p.image_url)}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Box size={40} className="text-cyan-400/60" />
                      )}
                      <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          p.stock > 0
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {p.stock > 0 ? `${p.stock} unid.` : "Sin stock"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                        Repuesto Homologado
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description || "Componente testeado con garantía oficial JyP."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Precio
                      </span>
                      <span
                        className="text-xl font-black text-white"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        S/. {Number(p.price).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => openOrderModal(p)}
                      disabled={p.stock <= 0}
                      className="jyp-btn-primary p-3 rounded-xl disabled:opacity-40 transition-transform hover:scale-105"
                      title="Solicitar producto"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center rounded-[32px] border border-white/10 bg-[#0a101b]/80">
                <Box size={40} className="mx-auto mb-2 text-slate-500" />
                <h3 className="text-base font-bold text-white">Sin componentes listados</h3>
                <p className="text-xs text-slate-400">Esta sucursal está actualizando su stock digital.</p>
              </div>
            )}
          </div>

          {/* Branch Reviews Section */}
          <section className="p-7 sm:p-8 rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <MessageCircle size={16} className="text-cyan-400" />
                <span>Reseñas de la Sucursal</span>
              </h3>
              <button
                onClick={() => setShowReviewForm((v) => !v)}
                className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border border-white/10 text-cyan-400 hover:bg-white/5 transition-colors"
              >
                {showReviewForm ? "Cancelar" : "Escribir Reseña"}
              </button>
            </div>

            {showReviewForm && (
              <div className="p-5 rounded-2xl border border-cyan-500/25 bg-[#0c1424] space-y-4">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} estrellas`}>
                      <Star
                        size={22}
                        className={n <= reviewRating ? "text-amber-400" : "text-slate-600"}
                        fill={n <= reviewRating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  placeholder="¿Cómo fue la atención y el stock de esta sucursal?..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-2xl p-3.5 text-xs bg-[#070c14] border border-white/10 text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitReview}
                    disabled={sendingReview}
                    className="jyp-btn-primary px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider disabled:opacity-50"
                  >
                    {sendingReview ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-xs py-6 text-center text-slate-400">
                Aún no se han registrado reseñas para este local.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 no-scrollbar">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={12}
                          className={n <= Number(r.rating) ? "text-amber-400" : "text-slate-600"}
                          fill={n <= Number(r.rating) ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                    {r.comment && <p className="text-xs text-slate-300 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {orderingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full p-8 rounded-[36px] border border-white/15 bg-[#0a101b] shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h3
                  className="text-xl font-black text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Solicitar Repuesto
                </h3>
                <p className="text-xs text-slate-400">Despacho desde sucursal oficial</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0c1424] border border-white/5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-sm text-white truncate">{orderingProduct.name}</p>
                <p
                  className="font-black text-xl text-cyan-400 shrink-0"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  S/. {Number(orderingProduct.price).toFixed(2)}
                </p>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-white font-black"
                  >
                    −
                  </button>
                  <span className="font-black text-sm w-10 text-center text-white font-mono">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(orderingProduct.stock || 99, q + 1))}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-white font-black"
                  >
                    +
                  </button>
                  <span className="text-[11px] ml-auto text-cyan-400 font-mono font-bold">
                    Subtotal: S/. {(Number(orderingProduct.price) * quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  placeholder="Ej: Av. Benavides 1234, Miraflores"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-[#070c14] border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error("Tu navegador no soporta geolocalización");
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setDeliveryLat(pos.coords.latitude);
                        setDeliveryLng(pos.coords.longitude);
                        setDeliveryAddress(
                          (prev) => prev || `Mi ubicación (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
                        );
                        toast.success("Ubicación GPS capturada");
                      },
                      () => toast.error("No se pudo obtener la ubicación GPS")
                    );
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 pt-1"
                >
                  <MapPin size={13} /> Usar mi ubicación GPS actual
                </button>
              </div>
            </div>

            <div className="flex gap-3.5 pt-2">
              <button
                onClick={() => setOrderingProduct(null)}
                className="flex-1 py-3.5 text-xs font-black uppercase rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={orderLoading}
                className="jyp-btn-primary flex-1 py-3.5 text-xs font-black uppercase rounded-2xl disabled:opacity-50"
              >
                {orderLoading ? "Procesando..." : "Confirmar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreProfile;
