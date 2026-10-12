import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Store, MapPin, Phone, Info, ShoppingCart, 
  ArrowLeft, Search, Filter, Box, ArrowRight,
  Clock, ShieldCheck, Check
} from 'lucide-react';
import { storeService } from '../services/api';

const StoreProfile = () => {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderingProduct, setOrderingProduct] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoreData();
  }, [id]);

  const fetchStoreData = async () => {
    try {
      const branchesResp = await storeService.getBranches();
      if (branchesResp.data.exito) {
        const found = branchesResp.data.resultado.find(b => b.id == id);
        setStore(found);
      }
      
      const productsResp = await storeService.getProducts(id);
      if (productsResp.data.exito) {
        setProducts(productsResp.data.resultado || []);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderingProduct) return;
    setOrderLoading(true);
    try {
      const resp = await storeService.createOrder({
        product_id: orderingProduct.id,
        quantity: 1
      });
      if (resp.data.exito) {
        alert('Pedido realizado con éxito. Puedes verificarlo en tu lista de pedidos.');
        setOrderingProduct(null);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error al realizar el pedido.');
    } finally {
      setOrderLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div 
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm font-semibold animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          Cargando catálogo oficial...
        </p>
      </div>
    );
  }

  if (!store) {
    return (
      <div 
        className="p-12 text-center rounded-2xl border max-w-md mx-auto mt-12"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Tienda no encontrada.</p>
        <Link to="/stores" className="btn-primary inline-flex px-6 py-2.5 rounded-xl text-sm font-bold">
          Volver a tiendas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16 max-w-7xl mx-auto">
      <Link 
        to="/stores" 
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border bg-white/5 hover:bg-white/10 transition-all font-semibold text-xs tracking-wider uppercase shadow-sm"
        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
      >
        <ArrowLeft size={16} />
        <span>Volver a sucursales</span>
      </Link>

      {/* Store Header Card */}
      <section 
        className="rounded-[32px] border shadow-2xl overflow-hidden relative"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div 
          className="h-36 opacity-20"
          style={{ background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)' }}
        />
        <div className="px-8 sm:px-10 pb-10 flex flex-col md:flex-row items-start md:items-end gap-6 -mt-14 relative z-10">
          <div 
            className="w-28 h-28 rounded-3xl border-4 shadow-2xl flex items-center justify-center text-white shrink-0"
            style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, #00C6FF 100%)',
              borderColor: 'var(--bg-card)'
            }}
          >
            <Store size={44} />
          </div>
          <div className="flex-1 space-y-2.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {store.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <MapPin size={15} style={{ color: 'var(--primary)' }} />
                <span>{store.address || 'Ubicación central'}, {store.city || 'Trujillo'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Phone size={15} style={{ color: 'var(--primary)' }} />
                <span>{store.phone || '987 654 321'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate(`/appointments/schedule?store=${id}`)}
              className="btn-primary px-7 py-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Clock size={16} />
              <span>Agendar Cita en Local</span>
            </button>
            <button 
              onClick={() => navigate('/orders')}
              className="px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all hover:bg-white/5 flex items-center justify-center gap-2 shadow-sm"
              style={{ 
                backgroundColor: 'var(--bg)', 
                borderColor: 'var(--border)',
                color: 'var(--text-primary)' 
              }}
            >
              <ShoppingCart size={16} style={{ color: 'var(--primary)' }} />
              <span>Mis Pedidos</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter */}
        <aside className="space-y-6">
          <div 
            className="p-6 rounded-[32px] border shadow-lg space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Filter size={16} style={{ color: 'var(--primary)' }} />
              <span>Búsqueda</span>
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar repuesto..." 
                className="w-full rounded-2xl py-3 pl-11 pr-4 text-xs font-medium outline-none border transition-all"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div 
            className="p-6 rounded-[32px] border space-y-3 shadow-lg"
            style={{ 
              backgroundColor: 'rgba(45, 107, 255, 0.05)', 
              borderColor: 'rgba(45, 107, 255, 0.2)' 
            }}
          >
            <div className="flex items-center gap-2.5" style={{ color: 'var(--primary)' }}>
              <ShieldCheck size={20} />
              <h4 className="font-black text-xs uppercase tracking-wider">Garantía JyP</h4>
            </div>
            <p className="text-xs leading-relaxed text-slate-300" style={{ color: 'var(--text-secondary)' }}>
              Todos los repuestos y componentes son 100% testeados e incluyen garantía directa autorizada por nuestros laboratorios.
            </p>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Catálogo de Repuestos y Productos
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/5" style={{ color: 'var(--text-muted)' }}>
              {filteredProducts.length} productos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={p.id}
                  className="p-6 rounded-[32px] border shadow-lg flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-primary/40 group"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <div 
                      className="aspect-video rounded-2xl mb-5 relative overflow-hidden flex items-center justify-center border shadow-inner"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                    >
                      <Box size={48} style={{ color: 'var(--primary)', opacity: 0.6 }} className="group-hover:scale-110 transition-transform duration-300" />
                      <div 
                        className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm"
                        style={p.stock > 0 ? {
                          backgroundColor: 'rgba(0, 229, 160, 0.12)',
                          color: 'var(--secondary)',
                          border: '1px solid rgba(0, 229, 160, 0.3)'
                        } : {
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        {p.stock > 0 ? `${p.stock} en stock` : 'Sin stock'}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                        Repuesto Original
                      </p>
                      <h4 className="text-base font-bold leading-snug group-hover:text-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </h4>
                      <p className="text-xs line-clamp-2 mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {p.description || 'Componente certificado con garantía JyP.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Precio
                      </p>
                      <p className="text-2xl font-black" style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        S/. {Number(p.price).toFixed(2)}
                      </p>
                    </div>
                    <button 
                      onClick={() => setOrderingProduct(p)}
                      disabled={p.stock <= 0}
                      className="btn-primary p-3.5 rounded-2xl transition-all shadow-lg hover:scale-110 active:scale-95 disabled:opacity-40"
                      title="Solicitar producto"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div 
                className="col-span-full py-20 text-center rounded-[32px] border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <Box size={44} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Próximamente más productos
                </h3>
                <p className="text-xs text-slate-400" style={{ color: 'var(--text-secondary)' }}>
                  Esta sucursal está actualizando su inventario en línea.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {orderingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-8 sm:p-10 rounded-[36px] border shadow-2xl space-y-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
              >
                <ShoppingCart size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Confirmar Pedido</h3>
                <p className="text-xs text-slate-400" style={{ color: 'var(--text-secondary)' }}>Estás solicitando este artículo en la sucursal.</p>
              </div>
            </div>

            <div 
              className="p-5 rounded-2xl border space-y-1.5 shadow-inner"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{orderingProduct.name}</p>
              <p className="font-black text-2xl" style={{ color: 'var(--primary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                S/. {Number(orderingProduct.price).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-3.5 pt-2">
              <button 
                onClick={() => setOrderingProduct(null)}
                className="flex-1 py-4 text-xs font-black uppercase rounded-2xl border transition-all hover:bg-white/5 active:scale-95"
                style={{ 
                  backgroundColor: 'var(--bg)', 
                  borderColor: 'var(--border)', 
                  color: 'var(--text-secondary)' 
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={orderLoading}
                className="btn-primary flex-1 py-4 text-xs font-black uppercase rounded-2xl shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
              >
                {orderLoading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StoreProfile;
