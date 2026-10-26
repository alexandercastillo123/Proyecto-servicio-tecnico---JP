import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, MapPin, Phone, FileText,
  ChevronRight, ChevronLeft, Save,
  CheckCircle2, AlertCircle, Eye, Check,
  Sparkles, Clock, Compass
} from "lucide-react";
import LocationPicker from "./LocationPicker";
import { storeService } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const StoreCreate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "Lima",
    state: "Lima",
    zip_code: "15001",
    country: "Perú",
    description: "Venta de repuestos y accesorios originales con soporte técnico.",
    specialties: "",
    opening_time: "09:00:00",
    closing_time: "18:00:00",
    open_days: "Lunes-Sábado",
    latitude: -12.046374,
    longitude: -77.042793,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("El nombre de la sucursal es obligatorio.");
      setStep(1);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await storeService.createBranch(formData);
      if (response.data?.exito || response.data?.success) {
        toast.success("¡Sucursal oficial registrada con éxito!");
        navigate("/");
      } else {
        setError(response.data?.mensaje || "No se pudo registrar la sucursal.");
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || "Error al crear la tienda. Verifica los datos ingresados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = (location) => {
    if (!location) return;
    setFormData((prev) => ({
      ...prev,
      latitude: location.lat ?? prev.latitude,
      longitude: location.lng ?? prev.longitude,
      address: location.address || prev.address,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25 mb-2">
            <Store size={12} /> Alta de Sucursal Homologada
          </span>
          <h1
            className="text-3xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Registrar <span className="text-cyan-400">Nueva Sucursal</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Habilita un taller o tienda en la red satelital para que los clientes puedan solicitar repuestos y agendar citas.
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? "w-10 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_#06b6d4]"
                  : step > s
                  ? "w-8 bg-emerald-400"
                  : "w-6 bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-xs font-semibold text-rose-300">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Cockpit */}
      <div className="p-8 md:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/95 shadow-2xl min-h-[500px] flex flex-col justify-between backdrop-blur-xl">
        <AnimatePresence mode="wait">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6 flex-1"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-md">
                  <Store size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Información Comercial
                  </h2>
                  <p className="text-xs text-slate-400">Datos públicos de la sucursal y horarios de operación.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Nombre de la Sucursal / Sede *
                  </label>
                  <input
                    type="text"
                    className="w-full py-3 px-4 rounded-2xl bg-[#0c1424] border border-white/10 text-white text-sm outline-none focus:border-cyan-400 transition-colors"
                    placeholder="Ej: JyP Repuestos - Miraflores Tech Hub"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Teléfono Central de Atención
                  </label>
                  <input
                    type="tel"
                    className="w-full py-3 px-4 rounded-2xl bg-[#0c1424] border border-white/10 text-white text-sm outline-none focus:border-cyan-400 transition-colors"
                    placeholder="987 654 321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Correo Electrónico de Notificaciones
                  </label>
                  <input
                    type="email"
                    className="w-full py-3 px-4 rounded-2xl bg-[#0c1424] border border-white/10 text-white text-sm outline-none focus:border-cyan-400 transition-colors"
                    placeholder="sucursal@jypservicios.pe"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Especialidades (separadas por coma)
                  </label>
                  <input
                    type="text"
                    className="w-full py-3 px-4 rounded-2xl bg-[#0c1424] border border-white/10 text-white text-sm outline-none focus:border-cyan-400 transition-colors"
                    placeholder="Repuestos Apple, Pantallas OLED, Microelectrónica"
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  />
                </div>

                {/* Operating hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Apertura
                    </label>
                    <input
                      type="time"
                      className="w-full py-3 px-4 rounded-2xl bg-[#0c1424] border border-white/10 text-white font-mono text-sm outline-none focus:border-cyan-400"
                      value={String(formData.opening_time).slice(0, 5)}
                      onChange={(e) => setFormData({ ...formData, opening_time: `${e.target.value}:00` })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Cierre
                    </label>
                    <input
                      type="time"
                      className="w-full py-3 px-4 rounded-2xl bg-[#0c1424] border border-white/10 text-white font-mono text-sm outline-none focus:border-cyan-400"
                      value={String(formData.closing_time).slice(0, 5)}
                      onChange={(e) => setFormData({ ...formData, closing_time: `${e.target.value}:00` })}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Descripción del Establecimiento y Servicios
                  </label>
                  <textarea
                    rows="3"
                    className="w-full py-3 px-4 rounded-2xl bg-[#0c1424] border border-white/10 text-white text-sm outline-none resize-none focus:border-cyan-400"
                    placeholder="Describe los tipos de repuestos y servicios técnicos que ofrece este local..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Location Map */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6 flex-1"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-md">
                  <Compass size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Ubicación Satelital
                  </h2>
                  <p className="text-xs text-slate-400">Ubica con precisión la sede en el mapa interactivo.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Dirección Física / Referencial *
                  </label>
                  <input
                    type="text"
                    className="w-full py-3 px-4 rounded-2xl bg-[#0c1424] border border-white/10 text-white text-sm outline-none focus:border-cyan-400 transition-colors"
                    placeholder="Av. José Larco 850, Miraflores, Lima"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="h-64 sm:h-72 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner">
                  <LocationPicker onLocationSelect={updateLocation} />
                  <div className="absolute bottom-3 left-3 z-[1000] p-3 rounded-2xl border border-white/10 bg-[#0a101b]/90 backdrop-blur-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Arrastra o haz clic para centrar la sede</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Review & Publish */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-6 flex-1"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-md">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Confirmación de Alta Oficial
                  </h2>
                  <p className="text-xs text-slate-400">Verifica los datos antes de sincronizar con la red.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-6 rounded-2xl bg-[#0c1424] border border-white/5 space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sucursal</span>
                    <p className="font-bold text-white text-base">{formData.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Dirección</span>
                    <p className="font-bold text-slate-300 text-sm">{formData.address}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Horario</span>
                    <p className="font-mono text-cyan-400 text-xs">
                      {String(formData.opening_time).slice(0, 5)} - {String(formData.closing_time).slice(0, 5)} hrs
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0c1424] border border-white/5 flex flex-col justify-center items-center text-center space-y-2.5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-md">
                    <Eye size={26} />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                    Tu sucursal quedará visible en el mapa metropolitano para miles de clientes y especialistas técnicos.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 flex items-start gap-3.5">
                <FileText size={20} className="shrink-0 text-cyan-400 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Al confirmar, garantizas que el local cumple con las políticas de calidad y homologación de JyP Servicios Técnicos.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Controls Footer */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/5">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-wider px-5 py-3 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!formData.name || !formData.address}
              className="jyp-btn-primary px-8 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 rounded-2xl disabled:opacity-40"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="jyp-btn-primary px-9 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 rounded-2xl disabled:opacity-50"
            >
              <Save size={16} />
              <span>{loading ? "Creando Sucursal..." : "Confirmar y Publicar Sucursal"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreCreate;
