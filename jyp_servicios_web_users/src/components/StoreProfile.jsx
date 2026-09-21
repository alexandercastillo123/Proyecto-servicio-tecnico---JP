import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Store, MapPin, Phone, Info, ShoppingCart, 
  ArrowLeft, Search, Filter, Box, ArrowRight,
  Clock, ShieldCheck
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
      // In a real scenario, we might need a getStoreById. 
      // For now, we fetch branches and find the one.
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
        alert('Pedido realizado con éxito. Puedes verlo en tu lista de pedidos.');
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

  if (loading) return <div className="h-96 flex items-center justify-center animate-pulse font-black text-text-dim">Cargando catálogo...</div>;
  if (!store) return <div className="p-12 text-center text-white font-black">Tienda no encontrada.</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <Link to="/stores" className="inline-flex items-center gap-2 text-text-dim hover:text-white transition-all font-bold text-sm">
        <ArrowLeft size={18} />
        Volver a tiendas
      </Link>

      {/* Store Header Card */}
      <section className="glass-panel overflow-hidden relative">
        <div className="h-40 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border-b border-white/5" />
        <div className="px-10 pb-10 flex flex-col md:flex-row items-end gap-8 -mt-16 relative z-10">
          <div className="w-40 h-40 bg-surface rounded-[40px] border-4 border-surface shadow-2xl flex items-center justify-center text-primary relative overflow-hidden group">
             <Store size={64} className="group-hover:scale-110 transition-transform" />
             <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1 space-y-3 pb-2">
            <h1 className="text-4xl font-black text-white">{store.name}</h1>
            <div className="flex flex-wrap gap-6 text-text-dim text-sm font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                {store.address}, {store.city}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-primary" />
                {store.phone || '987 654 321'}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate(`/appointments/schedule?store=${id}`)}
              className="btn-primary px-10 py-4 shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
               <Clock size={20} />
               Agendar Cita
            </button>
            <button 
              onClick={() => navigate('/orders')}
              className="bg-white/5 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
               <ShoppingCart size={20} />
               Ver Pedidos
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Filter */}
        <aside className="space-y-8">
           <div className="glass-card p-8 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Filter size={16} className="text-primary" />
                Filtros
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar producto..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Categorías</p>
                 {['Todos', 'Repuestos', 'Accesorios', 'Herramientas'].map(cat => (
                    <label key={cat} className="flex items-center gap-3 group cursor-pointer">
                       <div className="w-5 h-5 rounded-md border border-white/10 group-hover:border-primary transition-all" />
                       <span className="text-xs text-text-secondary group-hover:text-white transition-all">{cat}</span>
                    </label>
                 ))}
              </div>
           </div>

           <div className="p-6 bg-primary/5 border border-primary/20 rounded-[32px] space-y-4">
              <div className="flex items-center gap-3 text-primary">
                 <ShieldCheck size={20} />
                 <h4 className="font-bold text-sm">Compra Protegida</h4>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Todos los productos en J&P Services son verificados para garantizar su calidad y compatibilidad.
              </p>
           </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-black text-white">Catálogo de Productos</h2>
            <span className="text-text-dim text-xs font-bold">{filteredProducts.length} resultados encontrados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={p.id}
                  className="glass-card p-6 flex flex-col group hover:border-primary/50 transition-all border border-white/5"
                >
                  <div className="aspect-square bg-white/[0.03] rounded-3xl mb-6 relative overflow-hidden flex items-center justify-center text-primary/30 group-hover:text-primary transition-colors">
                     <Box size={64} className="group-hover:scale-110 transition-transform duration-500" />
                     <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-primary border border-primary/20">
                        {p.stock > 0 ? `${p.stock} DISPONIBLES` : 'SIN STOCK'}
                     </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Repuestos Originales</p>
                    <h4 className="text-lg font-bold text-white leading-tight">{p.name}</h4>
                    <p className="text-xs text-text-dim line-clamp-2">{p.description || 'Descripción del producto no disponible.'}</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                     <div>
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">Precio</p>
                        <p className="text-2xl font-black text-white">S/.{p.price}</p>
                     </div>
                     <button 
                        onClick={() => setOrderingProduct(p)}
                        className="bg-primary text-white p-4 rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 group-hover:scale-110"
                      >
                        <ShoppingCart size={20} />
                     </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center glass-panel">
                 <Box size={48} className="mx-auto text-text-dim mb-4" />
                 <h3 className="text-xl font-black text-white">Próximamente más productos</h3>
                 <p className="text-text-dim text-sm">Esta tienda está actualizando su catálogo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Order Confirmation Modal */}
      {orderingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel max-w-md w-full p-8 space-y-6"
          >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                 <ShoppingCart size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-black text-white">Confirmar Pedido</h3>
                 <p className="text-text-dim text-xs">Estás por solicitar este producto.</p>
               </div>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
               <p className="text-white font-bold">{orderingProduct.name}</p>
               <p className="text-primary font-black text-lg">S/.{orderingProduct.price}</p>
            </div>

            <div className="flex gap-4">
               <button 
                onClick={() => setOrderingProduct(null)}
                className="flex-1 py-4 bg-white/5 text-white font-black text-xs uppercase rounded-xl hover:bg-white/10 transition-all"
               >
                 Cancelar
               </button>
               <button 
                onClick={handleCreateOrder}
                disabled={orderLoading}
                className="flex-1 py-4 bg-primary text-white font-black text-xs uppercase rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
               >
                 {orderLoading ? 'Procesando...' : 'Confirmar'}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Plus = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

export default StoreProfile;
