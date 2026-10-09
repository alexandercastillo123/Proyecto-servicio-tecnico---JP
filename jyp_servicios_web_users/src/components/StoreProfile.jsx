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
    <div className="space-y-6 animate-in fade-in duration-500 pb-16 max-w-7xl mx-auto">
      <Link 
        to="/stores" 
        className="inline-flex items-center gap-2 font-semibold text-sm transition-opacity hover:opacity-80"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft size={18} />
        <span>Volver a sucursales</span>
      </Link>

      {/* Store Header Card */}
      <section 
        className="rounded-2xl border shadow-xl overflow-hidden relative"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div 
          className="h-32 opacity-20"
          style={{ background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)' }}
        />
        <div className="px-6 md:px-8 pb-8 flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 relative z-10">
          <div 
            className="w-24 h-24 rounded-2xl border shadow-xl flex items-center justify-center text-white shrink-0"
            style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, #00C6FF 100%)',
              borderColor: 'var(--bg-card)'
            }}
          >
            <Store size={40} />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {store.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-center gap-1.5">
                <MapPin size={15} style={{ color: 'var(--primary)' }} />
                <span>{store.address || 'Ubicación central'}, {store.city || 'Trujillo'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={15} style={{ color: 'var(--primary)' }} />
                <span>{store.phone || '987 654 321'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <button 
              onClick={() => navigate(`/appointments/schedule?store=${id}`)}
              className="btn-primary px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <Clock size={16} />
              <span>Agendar Cita en Local</span>
            </button>
            <button 
              onClick={() => navigate('/orders')}
              className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-colors hover:opacity-80 flex items-center justify-center gap-2"
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filter */}
        <aside className="space-y-4">
          <div 
            className="p-5 rounded-2xl border shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Filter size={15} style={{ color: 'var(--primary)' }} />
              <span>Búsqueda</span>
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar repuesto..." 
                className="w-full rounded-xl py-2 pl-9 pr-3 text-xs outline-none border transition-all"
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
            className="p-5 rounded-2xl border space-y-2.5"
            style={{ 
              backgroundColor: 'rgba(45, 107, 255, 0.05)', 
              borderColor: 'rgba(45, 107, 255, 0.2)' 
            }}
          >
            <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <ShieldCheck size={18} />
              <h4 className="font-bold text-xs uppercase tracking-wider">Garantía JyP</h4>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Todos los repuestos y componentes son 100% testeados e incluyen garantía directa autorizada.
            </p>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Catálogo de Repuestos y Productos
            </h2>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {filteredProducts.length} productos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={p.id}
                  className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all hover:border-primary/40 group"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <div 
                      className="aspect-video rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border"
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                    >
                      <Box size={44} style={{ color: 'var(--primary)', opacity: 0.6 }} className="group-hover:scale-105 transition-transform" />
                      <div 
                        className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={p.stock > 0 ? {
                          backgroundColor: 'rgba(0, 229, 160, 0.1)',
                          color: 'var(--secondary)',
                          border: '1px solid rgba(0, 229, 160, 0.25)'
                        } : {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.25)'
                        }}
                      >
                        {p.stock > 0 ? `${p.stock} en stock` : 'Sin stock'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
                        Repuesto Original
                      </p>
                      <h4 className="text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </h4>
                      <p className="text-xs line-clamp-2 mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {p.description || 'Componente certificado con garantía JyP.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Precio
                      </p>
                      <p className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        S/. {Number(p.price).toFixed(2)}
                      </p>
                    </div>
                    <button 
                      onClick={() => setOrderingProduct(p)}
                      disabled={p.stock <= 0}
                      className="btn-primary p-3 rounded-xl transition-all shadow-md hover:scale-105 disabled:opacity-40"
                      title="Solicitar producto"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div 
                className="col-span-full py-16 text-center rounded-2xl border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
              >
                <Box size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Próximamente más productos
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Esta sucursal está actualizando su inventario en línea.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {orderingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-7 rounded-2xl border shadow-2xl space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
              >
                <ShoppingCart size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Confirmar Pedido</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Estás solicitando este artículo en la sucursal.</p>
              </div>
            </div>

            <div 
              className="p-4 rounded-xl border space-y-1"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{orderingProduct.name}</p>
              <p className="font-extrabold text-lg" style={{ color: 'var(--primary)' }}>
                S/. {Number(orderingProduct.price).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setOrderingProduct(null)}
                className="flex-1 py-3 text-xs font-bold uppercase rounded-xl border transition-colors hover:opacity-80"
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
                className="btn-primary flex-1 py-3 text-xs font-bold uppercase rounded-xl shadow-lg disabled:opacity-50"
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
