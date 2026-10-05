import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, MapPin, Phone, FileText, 
  ChevronRight, ChevronLeft, Save, 
  CheckCircle2, AlertCircle, Eye, Check
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
    city: 'Trujillo',
    description: 'Venta de repuestos y accesorios originales.',
    latitude: -8.1116,
    longitude: -79.0287,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await storeService.createBranch(formData);
      if (response.data.success || response.data.exito) {
        navigate('/store-dashboard');
      }
    } catch (err) {
      setError('Error al crear la tienda. Por favor, verifica los datos ingresados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = (lat, lng) => {
    setFormData({ ...formData, latitude: lat, longitude: lng });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Registrar <span style={{ color: 'var(--primary)' }}>Nueva Sucursal</span>
          </h1>
          <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Configura una tienda o taller para que los clientes puedan encontrarte y solicitar repuestos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className="w-8 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: step >= s ? 'var(--primary)' : 'var(--border)'
              }}
            />
          ))}
        </div>
      </div>

      {error && (
        <div 
          className="p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold"
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            borderColor: 'rgba(239, 68, 68, 0.25)', 
            color: '#EF4444' 
          }}
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div 
        className="p-7 md:p-9 rounded-2xl border shadow-xl min-h-[460px] flex flex-col justify-between"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-5 flex-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
                >
                  <Store size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Información Básica
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Datos comerciales de la tienda.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Nombre de la Sucursal
                  </label>
                  <input 
                    type="text" 
                    className="w-full py-2.5 px-3 rounded-xl border text-xs outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Ej: JyP Repuestos - Trujillo Centro"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Teléfono de Contacto
                  </label>
                  <input 
                    type="tel" 
                    className="w-full py-2.5 px-3 rounded-xl border text-xs outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="987 654 321"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Descripción del Local y Servicios
                  </label>
                  <textarea 
                    rows="3"
                    className="w-full py-2.5 px-3 rounded-xl border text-xs outline-none resize-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Describe los tipos de repuestos y soporte ofrecidos en este local..."
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
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-5 flex-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}
                >
                  <MapPin size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Ubicación Geográfica
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ubica tu taller o tienda en el mapa interactivo.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                    Dirección Referencial
                  </label>
                  <input 
                    type="text" 
                    className="w-full py-2.5 px-3 rounded-xl border text-xs outline-none transition-all"
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder="Av. España 123, Trujillo"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="h-64 rounded-xl overflow-hidden border relative" style={{ borderColor: 'var(--border)' }}>
                  <LocationPicker onLocationSelect={updateLocation} />
                  <div 
                    className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-xl border backdrop-blur-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider shadow-lg"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                    <span>Ajusta el marcador en el local</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-5 flex-1"
            >
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0, 229, 160, 0.1)', color: 'var(--secondary)' }}
                >
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Confirmar Registro de Tienda
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Revisa los datos antes de publicar la sucursal.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="p-5 rounded-xl border space-y-3"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tienda</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Dirección</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{formData.address}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ciudad</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{formData.city}</p>
                  </div>
                </div>
                <div 
                  className="p-5 rounded-xl border flex flex-col justify-center items-center text-center space-y-2"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0, 229, 160, 0.15)', color: 'var(--secondary)' }}
                  >
                    <Eye size={24} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Tu sucursal aparecerá de inmediato en el mapa de tiendas oficiales para miles de clientes.
                  </p>
                </div>
              </div>

              <div 
                className="p-4 rounded-xl border flex items-start gap-3"
                style={{ 
                  backgroundColor: 'rgba(45, 107, 255, 0.05)', 
                  borderColor: 'rgba(45, 107, 255, 0.2)' 
                }}
              >
                <FileText size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Al confirmar, declaras que la información proporcionada es verídica y que la tienda cumple los estándares de calidad de la red de JyP Servicios Técnicos.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex justify-between items-center pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
          {step > 1 ? (
            <button 
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </button>
          ) : <div />}

          {step < 3 ? (
            <button 
              onClick={handleNext}
              disabled={!formData.name || !formData.address}
              className="btn-primary px-7 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-xl shadow-lg disabled:opacity-40"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary px-8 py-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-xl shadow-lg disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? 'Creando Tienda...' : 'Confirmar y Crear Tienda'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreCreate;
