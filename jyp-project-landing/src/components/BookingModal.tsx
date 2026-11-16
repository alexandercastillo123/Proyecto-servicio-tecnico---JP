import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  Laptop, 
  Phone, 
  User, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { DEVICE_OPTIONS, DISTRICTS_COVERAGE } from '../data/servicesData';
import { DeviceType } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    device?: DeviceType;
    issue?: string;
    district?: string;
    mode?: 'domicilio' | 'taller';
  } | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialData
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Miraflores');
  const [address, setAddress] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType>('laptop');
  const [issueDescription, setIssueDescription] = useState('');
  const [serviceMode, setServiceMode] = useState<'domicilio' | 'taller'>('domicilio');
  const [preferredDate, setPreferredDate] = useState('Hoy');
  const [preferredSlot, setPreferredSlot] = useState('Lo antes posible (30-50 min)');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      if (initialData.device) setDeviceType(initialData.device);
      if (initialData.issue) setIssueDescription(initialData.issue);
      if (initialData.district) setDistrict(initialData.district);
      if (initialData.mode) setServiceMode(initialData.mode);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setFormError('Por favor ingresa un número de teléfono o celular válido.');
      return;
    }
    if (serviceMode === 'domicilio' && !address.trim()) {
      setFormError('Por favor ingresa tu dirección para la llegada del técnico.');
      return;
    }

    setFormError('');
    const randomTicket = 'JYP-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(randomTicket);
    setIsSubmitted(true);
  };

  const getWhatsAppBookingUrl = () => {
    const text = `*SOLICITUD DE SERVICIO TÉCNICO A DOMICILIO - J&P PERIFÉRICOS*
Ticket: *#${ticketId}*
Cliente: ${fullName}
Teléfono: ${phone}
Modalidad: ${serviceMode === 'domicilio' ? 'A Domicilio' : 'En Sede Taller Central'}
Distrito: ${district}
Dirección: ${address || 'No especificada'}
Equipo: ${deviceType.toUpperCase()}
Falla / Requerimiento: ${issueDescription || 'Revisión y diagnóstico'}
Fecha deseada: ${preferredDate} - ${preferredSlot}`;

    return `https://wa.me/51997662381?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Modal Header */}
            <div className="mb-6">
              <span className="text-xs font-mono font-bold text-[#1226AA] uppercase tracking-wider">
                Solicitud de Visita Técnica · Web
              </span>
              <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
                Agenda tu técnico especializado
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Completa tus datos para despachar un especialista verificado hasta tu domicilio o coordinar en taller.
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Service Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Modalidad de atención
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setServiceMode('domicilio')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      serviceMode === 'domicilio'
                        ? 'bg-blue-50/80 border-[#1226AA] text-[#1226AA]'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🏠 A Domicilio (En tu puerta)</span>
                    {serviceMode === 'domicilio' && <CheckCircle2 className="w-4 h-4 text-[#1226AA]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceMode('taller')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      serviceMode === 'taller'
                        ? 'bg-blue-50/80 border-[#1226AA] text-[#1226AA]'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>🏢 Sede Central (Galería Lima)</span>
                    {serviceMode === 'taller' && <CheckCircle2 className="w-4 h-4 text-[#1226AA]" />}
                  </button>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Carlos Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1226AA] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="999 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1226AA] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* District & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Distrito en Lima / Callao *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1226AA] focus:outline-none bg-white font-medium"
                  >
                    {DISTRICTS_COVERAGE.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.eta})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {serviceMode === 'domicilio' ? 'Dirección exacta (Calle, Dpto, Ref) *' : 'Referencia de visita'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required={serviceMode === 'domicilio'}
                      placeholder={serviceMode === 'domicilio' ? "Av. Larco 450, Dpto 302" : "Dejaré el equipo a las 11 AM"}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1226AA] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Device Type & Date Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de equipo *
                  </label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value as DeviceType)}
                    className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1226AA] focus:outline-none bg-white font-medium"
                  >
                    {DEVICE_OPTIONS.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ¿Cuándo deseas la atención?
                  </label>
                  <select
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1226AA] focus:outline-none bg-white font-medium"
                  >
                    <option value="Lo antes posible (30-50 min)">Urgente: Lo antes posible (30-50 min)</option>
                    <option value="Hoy turno mañana (9:00 - 13:00)">Hoy turno mañana (9:00 - 13:00)</option>
                    <option value="Hoy turno tarde (14:00 - 18:30)">Hoy turno tarde (14:00 - 18:30)</option>
                    <option value="Mañana a primera hora">Mañana a primera hora (9:00 AM)</option>
                    <option value="Coordinar por WhatsApp">Coordinar fecha específica por WhatsApp</option>
                  </select>
                </div>
              </div>

              {/* Description of Issue */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Describe la falla o lo que necesita el equipo
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: La laptop no enciende luego de una actualización, o requiero mantenimiento preventivo y limpieza..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1226AA] focus:outline-none resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#1226AA] to-[#0d1c82] hover:from-[#0d1c82] hover:to-[#09145c] text-white font-bold text-sm shadow-md hover:shadow transition-all flex items-center justify-center gap-2"
                >
                  <span>Confirmar Solicitud de Visita Técnica</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sin pago por adelantado · Pagas al terminar a tu entera satisfacción</span>
                </div>
              </div>

            </form>
          </div>
        ) : (
          /* Confirmation Success View */
          <div className="py-4 space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ¡Solicitud Registrada con Éxito!
              </span>
              <h3 className="text-2xl font-display font-extrabold text-slate-900 mt-2">
                Ticket #{ticketId}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Tu solicitud ha sido ingresada a nuestra mesa de despacho de J&P Periféricos S.A.C.
              </p>
            </div>

            {/* Summary Ticket Card */}
            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Distrito & Modo:</span>
                <span className="font-bold text-slate-900">{district} ({serviceMode === 'domicilio' ? 'A Domicilio' : 'En Sede'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Equipo:</span>
                <span className="font-bold text-slate-900">{deviceType.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Horario previsto:</span>
                <span className="font-bold text-[#1226AA]">{preferredSlot}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 max-w-md mx-auto pt-2">
              <a
                href={getWhatsAppBookingUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>Confirmar Inmediatamente por WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/70" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cerrar y volver a la página
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
