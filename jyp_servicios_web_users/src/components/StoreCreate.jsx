import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, MapPin, Phone, FileText, 
  ChevronRight, ChevronLeft, Save, 
  CheckCircle2, AlertCircle, Eye
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import { storeService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const StoreCreate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Lima',
    description: 'Venta de repuestos y accesorios originales.',
    latitude: -12.046374,
    longitude: -77.042793,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // API call to create branch
      const response = await storeService.createBranch(formData);
      if (response.data.success) {
        navigate('/store-dashboard');
      }
    } catch (err) {
      setError('Error al crear la tienda. Por favor, verifica los datos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = (lat, lng) => {
    setFormData({ ...formData, latitude: lat, longitude: lng });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black gradient-text">Registrar Mi Tienda</h1>
          <p className="text-text-secondary text-sm">Crea una sucursal para que los clientes puedan encontrarte.</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`w-10 h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary' : 'bg-white/10'}`} 
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error text-sm font-bold">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="glass-panel p-10 min-h-[500px] flex flex-col">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <Store size={24} />
                </div>
                <h2 className="text-xl font-black text-white">Información Básica</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Nombre de la Sucursal</label>
                  <input 
                    type="text" 
                    className="input-field w-full"
                    placeholder="Ej: J&P Repuestos - Centro"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Teléfono de contacto</label>
                  <input 
                    type="tel" 
                    className="input-field w-full"
                    placeholder="987 654 321"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Descripción de la tienda</label>
                  <textarea 
                    className="input-field w-full h-32 py-4 resize-none"
                    placeholder="Describe los productos y servicios que ofreces..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <MapPin size={24} />
                </div>
                <h2 className="text-xl font-black text-white">Ubicación de la Tienda</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Dirección Exacta</label>
                  <input 
                    type="text" 
                    className="input-field w-full"
                    placeholder="Av. Las Camelias 456, San Isidro"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="h-80 rounded-2xl overflow-hidden border border-white/5 relative">
                  <LocationPicker onLocationSelect={updateLocation} />
                  <div className="absolute bottom-4 left-4 z-[1000] bg-background/80 backdrop-blur-md p-3 rounded-xl border border-white/10 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Ajusta el marcador en el local</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 flex-1"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-xl font-black text-white">Confirmar Registro</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Tienda</p>
                    <p className="text-white font-bold">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Dirección</p>
                    <p className="text-white font-bold">{formData.address}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Ciudad</p>
                    <p className="text-white font-bold">{formData.city}</p>
                  </div>
                </div>
                <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center space-y-3">
                   <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center text-success">
                     <Eye size={32} />
                   </div>
                   <p className="text-xs text-text-secondary leading-relaxed px-4">
                     Tu tienda será visible para miles de técnicos y clientes en Lima de inmediato.
                   </p>
                </div>
              </div>

              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                <FileText size={20} className="text-primary mt-1 shrink-0" />
                <p className="text-[10px] text-text-secondary leading-relaxed">
                  Al confirmar, declaras que la información proporcionada es verídica y que cuentas con los permisos para operar en esta ubicación. Podrás agregar productos a tu inventario una vez creada la sucursal.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 flex justify-between items-center pt-8 border-t border-white/5">
          {step > 1 ? (
             <button 
               onClick={handleBack}
               className="flex items-center gap-2 text-text-dim hover:text-white font-bold transition-all"
             >
               <ChevronLeft size={20} />
               Atrás
             </button>
          ) : <div />}

          {step < 3 ? (
            <button 
              onClick={handleNext}
              disabled={!formData.name || !formData.address}
              className="btn-primary px-10 py-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20"
            >
              Siguiente Paso
              <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary px-12 py-5 font-black text-base shadow-2xl shadow-primary/30"
            >
              {loading ? 'Creando...' : (
                <>
                  <Save size={20} />
                  Confirmar y Crear Tienda
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreCreate;
