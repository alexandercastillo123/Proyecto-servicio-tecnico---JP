import React, { useState, useEffect } from 'react';
import { 
  Package, Search, ShoppingCart, Store, MapPin, 
  Tag, ShieldCheck, ArrowRight, Check, X, Filter,
  Star, Truck, Zap, AlertCircle
} from 'lucide-react';
import { storeService, messageService } from '../services/api';
import { mediaUrl } from '../services/formatters';
import { useNavigate } from 'react-router-dom';
import { TechLoader } from './common/TechLoader';
import toast from 'react-hot-toast';

const StoreMarketplace = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : {};

  useEffect(() => {
    fetchProducts();
    if (user.address) {
      setDeliveryAddress(user.address);
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await storeService.getCatalogProducts();
      let list = res.data?.resultado || res.data?.data || [];
      
      // Fallback: if catalog is empty, fetch branches and products from branches
      if (!list || list.length === 0) {
        const branchesRes = await storeService.getBranches();
        const branches = branchesRes.data?.resultado || [];
        const aggregated = [];
        for (const b of branches) {
          try {
            const pRes = await storeService.getProducts(b.id);
            const pList = pRes.data?.resultado || [];
            pList.forEach(p => {
              aggregated.push({
                ...p,
                branch_name: b.name,
                branch_city: b.city || 'Lima',
                branch_address: b.address,
                branch_user_id: b.user_id
              });
            });
          } catch (_) {}
        }
        list = aggregated;
      }

      setProducts(list);
    } catch (error) {
      console.error('Error fetching catalog products:', error);
      toast.error('No se pudo cargar el catálogo de productos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBuyModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOrderNotes('');
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduct) return;
    if (!deliveryAddress.trim()) {
      toast.error('Por favor ingresa tu dirección de entrega');
      return;
    }

    setPurchasing(true);
    try {
      const payload = {
        product_id: selectedProduct.id,
        quantity: quantity,
        delivery_address: deliveryAddress,
      };

      const res = await storeService.createOrder(payload);
      if (res.data?.exito || res.data?.success) {
        /* El backend no guarda `notes` en el pedido, así que se envía como
           mensaje al chat con la tienda (igual que en la app Android). */
        if (orderNotes.trim()) {
          const storeUserId = selectedProduct.branch_user_id || selectedProduct.user_id;
          if (storeUserId) {
            await messageService.sendMessage({
              receiverId: storeUserId,
              messageText: `📝 Nota del pedido #${res.data?.resultado?.orderId ?? ''}: ${orderNotes.trim()}`,
            }).catch(() => {});
          }
        }
        toast.success('¡Pedido realizado con éxito!');
        setSelectedProduct(null);
        navigate('/orders');
      } else {
        toast.error(res.data?.mensaje || 'Error al procesar el pedido');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.mensaje || 'Error al procesar el pedido');
    } finally {
      setPurchasing(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Todos los Productos' },
    { id: 'pantallas', label: 'Pantallas & Displays' },
    { id: 'baterias', label: 'Baterías' },
    { id: 'cables', label: 'Cargadores & Cables' },
    { id: 'placas', label: 'Repuestos de Placa' },
    { id: 'herramientas', label: 'Herramientas' },
  ];

  const filteredProducts = (Array.isArray(products) ? products : []).filter((p) => {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const branch = (p.branch_name || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = name.includes(query) || desc.includes(query) || branch.includes(query) || category.includes(query);
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;

    /* Si el producto tiene categoría registrada se usa como criterio principal;
       si no, se cae al filtro por palabras clave. */
    if (category) return category.includes(selectedCategory);

    if (selectedCategory === 'pantallas') return name.includes('pantalla') || name.includes('display') || name.includes('screen') || desc.includes('pantalla');
    if (selectedCategory === 'baterias') return name.includes('bater') || desc.includes('bater');
    if (selectedCategory === 'cables') return name.includes('cable') || name.includes('cargador') || desc.includes('cable');
    if (selectedCategory === 'placas') return name.includes('placa') || name.includes('flex') || name.includes('conector');
    if (selectedCategory === 'herramientas') return name.includes('herramienta') || name.includes('cautin') || name.includes('kit');

    return true;
  });

  return (
    <div className="w-full space-y-8 pb-4 animate-in fade-in duration-500">
      
      {/* Hero Banner with Stitch Cobalt & Emerald Glow */}
      <div className="relative overflow-hidden rounded-[32px] p-10 sm:p-14 border border-white/10 bg-gradient-to-br from-[#0c1427] via-[#091020] to-[#060a14] shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-wider shadow-sm">
            <Zap size={14} className="text-blue-400" />
            <span>Tienda Oficial JyP</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Repuestos & Accesorios <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              100% Certificados
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-normal max-w-xl leading-relaxed">
            Adquiere componentes originales directamente de nuestras sucursales y talleres asociados con entrega garantizada.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Garantía de Fábrica</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-blue-400" />
              <span>Despacho Rápido en Lima</span>
            </div>
            <div className="flex items-center gap-2">
              <Package size={16} className="text-cyan-400" />
              <span>Stock en Tiempo Real</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/order/new')}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/25 transition-all"
            >
              <ShoppingCart size={15} />
              Pedido por pasos
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0e1424] p-6 rounded-3xl border border-white/10 shadow-lg">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar repuestos, pantallas, baterías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border shadow-sm ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <TechLoader title="Cargando Tienda" subtitle="Obteniendo catálogo de componentes certificados..." />
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
          {filteredProducts.map((p) => {
            const price = parseFloat(p.price || 0).toFixed(2);
            const stock = Number(p.stock ?? 0);
            const hasStock = stock > 0;

            return (
              <div
                key={p.id}
                className="group flex flex-col justify-between rounded-3xl bg-[#0e1424] border border-white/10 hover:border-blue-500/40 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/10 relative overflow-hidden"
              >
                {/* Visual Header / Badge */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                      hasStock 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      {hasStock ? `${stock} en stock` : 'Agotado'}
                    </span>

                    {p.branch_name && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 truncate max-w-[130px]">
                        <Store size={12} className="text-blue-400 shrink-0" />
                        <span className="truncate">{p.branch_name}</span>
                      </span>
                    )}
                  </div>

                  {/* Product Image */}
                  <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-500 shadow-inner overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={mediaUrl(p.image_url)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={56} strokeWidth={1.5} />
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed">
                      {p.description || 'Repuesto certificado con garantía y control de calidad JyP.'}
                    </p>
                  </div>
                </div>

                {/* Price and Buy Button */}
                <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Precio</span>
                    <span className="text-xl font-black text-white">S/. {price}</span>
                  </div>

                  <button
                    disabled={!hasStock}
                    onClick={() => handleOpenBuyModal(p)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 flex items-center gap-2"
                  >
                    <ShoppingCart size={14} />
                    <span>Comprar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center rounded-3xl bg-[#0e1424] border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-black text-white">No se encontraron productos</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            {searchTerm 
              ? `No hay repuestos que coincidan con "${searchTerm}". Intenta con otros términos.` 
              : 'Pronto se cargarán más repuestos y suministros en esta categoría.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all"
            >
              Limpiar Búsqueda
            </button>
          )}
        </div>
      )}

      {/* Buy Confirmation Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[36px] bg-[#0f172a] border border-white/15 p-8 sm:p-10 space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Confirmación de Compra</span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{selectedProduct.name}</h3>
                {selectedProduct.branch_name && (
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Store size={13} className="text-blue-400" />
                    <span>Despacha: <strong>{selectedProduct.branch_name}</strong></span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Cantidad</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-white/10 rounded-2xl bg-white/5 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2.5 text-slate-300 hover:bg-white/10 font-black text-sm"
                  >
                    -
                  </button>
                  <span className="px-5 py-2.5 text-white font-black text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedProduct.stock || 99, quantity + 1))}
                    className="px-4 py-2.5 text-slate-300 hover:bg-white/10 font-black text-sm"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm font-semibold text-slate-400">
                  Total unitario: <span className="text-white font-bold">S/. {parseFloat(selectedProduct.price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-400" />
                <span>Dirección de Entrega / Envío *</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Av. Arequipa 1234, Dpto 501, Miraflores"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Order Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Indicaciones adicionales (opcional)</label>
              <textarea
                rows={2}
                placeholder="Horario preferido, referencia o modelo específico de tu equipo..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Total calculation */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Monto Total a Pagar</span>
                <span className="text-2xl font-black text-white">
                  S/. {(parseFloat(selectedProduct.price || 0) * quantity).toFixed(2)}
                </span>
              </div>
              <div className="text-right text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck size={14} />
                <span>Pago coordinado seguro</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={purchasing}
                onClick={handleConfirmOrder}
                className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirmar Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreMarketplace;
