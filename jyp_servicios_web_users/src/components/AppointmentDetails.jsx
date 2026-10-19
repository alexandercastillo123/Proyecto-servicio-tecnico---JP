import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, User, Phone, 
  Mail, FileText, DollarSign, CheckCircle2, 
  XCircle, ChevronLeft, AlertCircle, MessageSquare,
  ShieldCheck, CreditCard, Truck, Navigation, Wrench, Check
} from 'lucide-react';
import { clientService, techService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';
import { formatDateLong } from '../services/formatters';
import CulqiPaymentModal from './common/CulqiPaymentModal';

import { TechLoader } from './common/TechLoader';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socketService, isConnected } = useSocket();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCulqiModal, setShowCulqiModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('yape');
  const [currentUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (!socketService) return;

    const unsubProgress = socketService.on('appointment_progress', (data) => {
      if (String(data.appointment_id) === String(id)) fetchDetails();
    });
    const unsubPrice = socketService.on('appointment_price_updated', (data) => {
      if (String(data.appointment_id) === String(id)) fetchDetails();
    });
    const unsubWaiting = socketService.on('appointment_payment_waiting', (data) => {
      if (String(data.appointment_id) === String(id)) fetchDetails();
    });
    const unsubConfirmed = socketService.on('appointment_payment_confirmed', (data) => {
      if (String(data.appointment_id) === String(id)) fetchDetails();
    });

    return () => {
      unsubProgress();
      unsubPrice();
      unsubWaiting();
      unsubConfirmed();
    };
  }, [socketService, id]);

  const fetchDetails = async () => {
    try {
      const response = await clientService.getAppointmentDetails(id);
      const payload = response.data?.resultado || response.data?.data;
      if (payload || response.data?.exito || response.data?.success) {
        setAppt(payload);
        setPriceInput(payload?.price || '');
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrice = async () => {
    if (!priceInput) return;
    setActionLoading(true);
    try {
      await techService.setPrice(id, priceInput);
      toast.success('Presupuesto enviado al cliente');
      fetchDetails();
    } catch (error) {
      console.error('Error setting price:', error);
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar el presupuesto');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await techService.updateStatus(id, newStatus);
      toast.success('Estado de la cita actualizado');
      fetchDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.mensaje || 'No se pudo actualizar el estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    setActionLoading(true);
    try {
      await clientService.payAppointment(id, paymentMethod);
      toast.success('Pago registrado. Esperando confirmación del técnico.');
      setShowPaymentModal(false);
      fetchDetails();
    } catch (error) {
      console.error('Error paying:', error);
      toast.error(error.response?.data?.mensaje || 'No se pudo registrar el pago');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setActionLoading(true);
    try {
      await techService.confirmPayment(id);
      toast.success('Pago confirmado');
      fetchDetails();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error(error.response?.data?.mensaje || 'No se pudo confirmar el pago');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    setActionLoading(true);
    try {
      await clientService.confirmCompletion(id);
      toast.success('Trabajo confirmado. ¡Gracias por tu confianza!');
      fetchDetails();
    } catch (error) {
      console.error('Error confirming completion:', error);
      toast.error(error.response?.data?.mensaje || 'No se pudo confirmar la finalización');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;
    setActionLoading(true);
    try {
      await clientService.cancelAppointment(id);
      navigate('/appointments');
    } catch (error) {
      console.error('Error cancelling:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <TechLoader 
        title="Consultando Orden de Servicio" 
        subtitle="Obteniendo telemetría y estado de la cita..." 
      />
    );
  }

  if (!appt) {
    return (
      <div 
        className="p-12 text-center rounded-2xl border max-w-md mx-auto mt-12"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Cita no encontrada.</p>
        <Link to="/appointments" className="btn-primary inline-flex px-6 py-2.5 rounded-xl text-sm font-bold">
          Volver a mis citas
        </Link>
      </div>
    );
  }

  const userRole = currentUser?.role;
  const isTech = userRole === 'tech' || userRole === 'store';
  const isClient = userRole === 'client';

  /* El backend devuelve los datos del otro usuario "aplanados" (client_names, tech_names…),
     no como objetos anidados, por eso se reconstruyen aquí. */
  const otherUser = isClient
    ? {
        id: appt.technician_id,
        names: appt.tech_names,
        surnames: appt.tech_surnames,
        username: appt.tech_username,
        phone: appt.tech_phone,
        email: appt.tech_email,
      }
    : {
        id: appt.client_id,
        names: appt.client_names,
        surnames: appt.client_surnames,
        username: appt.client_username,
        phone: appt.client_phone,
        email: appt.client_email,
      };

  const otherUserName =
    [otherUser.names, otherUser.surnames].filter(Boolean).join(' ').trim() ||
    otherUser.username ||
    (isClient ? 'Técnico Especialista' : 'Cliente');

  const serviceAddress = appt.service_address || appt.address || null;

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pendiente', bg: 'rgba(234, 179, 8, 0.1)', color: '#EAB308', border: 'rgba(234, 179, 8, 0.25)' },
      confirmed: { label: 'Confirmada', bg: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)', border: 'rgba(45, 107, 255, 0.25)' },
      on_the_way: { label: 'En camino 🚚', bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.25)' },
      arrived: { label: 'En el sitio 📍', bg: 'rgba(6, 182, 212, 0.1)', color: '#06B6D4', border: 'rgba(6, 182, 212, 0.25)' },
      in_progress: { label: 'En progreso 🛠', bg: 'rgba(0, 229, 160, 0.1)', color: 'var(--secondary)', border: 'rgba(0, 229, 160, 0.25)' },
      completed: { label: 'Terminado 🎉', bg: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: 'rgba(34, 197, 94, 0.25)' },
      cancelled: { label: 'Cancelado', bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.25)' }
    };
    const c = config[status] || config.pending;
    return (
      <span 
        className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}` }}
      >
        {c.label}
      </span>
    );
  };

  return (
    <div className="w-full space-y-8 pb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex justify-between items-center p-6 sm:p-7 rounded-[32px] bg-gradient-to-r from-blue-900/20 via-slate-900/30 to-purple-900/20 border border-white/5 backdrop-blur-xl">
        <Link 
          to="/appointments" 
          className="inline-flex items-center gap-2 font-semibold text-sm transition-colors hover:text-white px-4 py-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={18} />
          <span>Volver a mis citas</span>
        </Link>
        <div>
          {getStatusBadge(appt.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <section 
            className="p-8 sm:p-9 rounded-[32px] border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
              <FileText size={22} style={{ color: 'var(--primary)' }} />
              <span>Detalles del Servicio</span>
            </h2>
            <div 
              className="p-6 rounded-2xl border space-y-5"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                "{appt.description}"
              </p>
              <div className="pt-4 border-t flex flex-wrap gap-8" style={{ borderColor: 'var(--border)' }}>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                    Fecha Programada
                  </p>
                  <p className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Calendar size={15} style={{ color: 'var(--primary)' }} />
                    {formatDateLong(appt.scheduled_date)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                    Hora
                  </p>
                  <p className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Clock size={15} style={{ color: 'var(--primary)' }} />
                    {appt.scheduled_time?.slice(0, 5)} hrs
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                    Ubicación
                  </p>
                  <p className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <MapPin size={15} style={{ color: 'var(--primary)' }} />
                    {serviceAddress || 'Servicio en Taller / Local'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Action History / Pricing */}
          <section 
            className="p-8 sm:p-9 rounded-[32px] border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
              <DollarSign size={22} style={{ color: 'var(--primary)' }} />
              <span>Presupuesto y Pago</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div 
                className="p-6 rounded-2xl border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-dim)' }}>
                  Monto del Servicio
                </p>
                {isTech && appt.status === 'pending' ? (
                  <div className="flex gap-2.5">
                    <input 
                      type="number" 
                      className="w-full py-2.5 px-4 text-base font-bold rounded-2xl border outline-none"
                      style={{ 
                        backgroundColor: 'var(--bg-card)', 
                        borderColor: 'var(--border)', 
                        color: 'var(--text-primary)' 
                      }}
                      placeholder="0.00"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                    />
                    <button 
                      onClick={handleSetPrice}
                      disabled={actionLoading || !priceInput}
                      className="btn-primary px-5 py-2.5 text-xs font-bold rounded-2xl disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <p className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    S/. {Number(appt.price || 0).toFixed(2)}
                  </p>
                )}
              </div>

              <div 
                className="p-6 rounded-2xl border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-dim)' }}>
                  Estado del Pago
                </p>
                <div className="flex items-center gap-2.5 mt-2">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: appt.payment_status === 'paid' ? '#22C55E' : appt.payment_status === 'waiting_confirmation' ? '#06B6D4' : '#EAB308'
                    }}
                  />
                  <p 
                    className="font-bold text-sm uppercase tracking-wider"
                    style={{
                      color: appt.payment_status === 'paid' ? '#22C55E' : appt.payment_status === 'waiting_confirmation' ? '#06B6D4' : '#EAB308'
                    }}
                  >
                    {appt.payment_status === 'paid' ? 'PAGADO' : appt.payment_status === 'waiting_confirmation' ? 'POR CONFIRMAR' : 'PENDIENTE'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div 
            className="p-8 text-center rounded-[32px] border shadow-xl relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div 
              className="flex flex-col items-center cursor-pointer p-2 rounded-2xl transition-all"
              onClick={() => {
                if (!isTech && appt.technician_id) {
                  navigate(`/technician/${appt.technician_id}`);
                }
              }}
            >
              <div 
                className="w-20 h-20 rounded-3xl flex items-center justify-center font-bold text-2xl text-white mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #00C6FF 100%)' }}
              >
                {otherUser?.names?.[0]?.toUpperCase() || otherUserName?.[0]?.toUpperCase() || 'U'}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
                {isTech ? 'Cliente' : 'Técnico Especialista'}
              </p>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {otherUserName}
              </h3>
            </div>
            
            <div className="space-y-2.5 text-left pt-4 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {otherUser?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={15} style={{ color: 'var(--primary)' }} />
                  <span>{otherUser.phone}</span>
                </div>
              )}
              {otherUser?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail size={15} style={{ color: 'var(--primary)' }} />
                  <span className="truncate">{otherUser.email}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <Link 
                to={`/chat?user=${otherUser?.id}`} 
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-xs font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
              >
                <MessageSquare size={16} />
                <span>Ir al Chat</span>
              </Link>
            </div>
          </div>

          <div 
            className="p-8 rounded-[32px] border space-y-4 shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-[11px] font-black uppercase tracking-wider mb-2 text-slate-400">
              Control de Estado
            </h3>

            {isTech ? (
              <div className="flex flex-col gap-3">
                {appt.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateStatus('confirmed')}
                    disabled={actionLoading || !appt.price}
                    className="btn-primary w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg disabled:opacity-40"
                  >
                    Confirmar Servicio
                  </button>
                )}
                {appt.status === 'confirmed' && (
                  <button 
                    onClick={() => handleUpdateStatus('on_the_way')}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    Marcar En Camino
                  </button>
                )}
                {appt.status === 'on_the_way' && (
                  <button 
                    onClick={() => handleUpdateStatus('arrived')}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: '#06B6D4' }}
                  >
                    Confirmar Llegada
                  </button>
                )}
                {appt.status === 'arrived' && (
                  <button 
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-black shadow-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--secondary)' }}
                  >
                    Iniciar Trabajo
                  </button>
                )}
                {appt.status === 'in_progress' && (
                  <button 
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: '#16A34A' }}
                  >
                    Finalizar Trabajo
                  </button>
                )}
                {appt.payment_status === 'waiting_confirmation' && (
                  <button 
                    onClick={handleConfirmPayment}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: '#16A34A' }}
                  >
                    Confirmar Pago Recibido
                  </button>
                )}
                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-2xl font-bold text-xs transition-colors hover:bg-red-500/10 text-red-500 border border-transparent hover:border-red-500/20"
                  >
                    Cancelar Cita
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {!appt.price && (
                  <div 
                    className="p-4 rounded-2xl border flex items-start gap-3 text-xs"
                    style={{ 
                      backgroundColor: 'rgba(45, 107, 255, 0.05)', 
                      borderColor: 'rgba(45, 107, 255, 0.2)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                    <span>Esperando a que el técnico proporcione el presupuesto.</span>
                  </div>
                )}
                {appt.price && appt.payment_status === 'pending' && appt.status !== 'cancelled' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: '#16A34A' }}
                  >
                    <CreditCard size={18} />
                    <span>Pagar S/. {Number(appt.price).toFixed(2)}</span>
                  </button>
                )}
                {appt.status === 'confirmed' && appt.service_type === 'local' && (
                  <button 
                    onClick={() => handleUpdateStatus('on_the_way')}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    Estoy En Camino al Local
                  </button>
                )}
                {appt.status === 'on_the_way' && appt.service_type === 'local' && (
                  <button
                    onClick={() => handleUpdateStatus('arrived')}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg"
                    style={{ backgroundColor: '#06B6D4' }}
                  >
                    He Llegado al Local
                  </button>
                )}
                {appt.status === 'completed' && !appt.client_confirmed_completion && (
                  <button
                    onClick={handleConfirmCompletion}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: '#16A34A' }}
                  >
                    Confirmar Trabajo Terminado
                  </button>
                )}
                {appt.status === 'completed' && appt.client_confirmed_completion && (
                  <div
                    className="p-4 rounded-2xl border flex items-start gap-3 text-xs"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.08)',
                      borderColor: 'rgba(34, 197, 94, 0.25)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5" style={{ color: '#22C55E' }} />
                    <span>Trabajo finalizado y confirmado por el cliente.</span>
                  </div>
                )}
                {appt.payment_status === 'waiting_confirmation' && (
                  <div
                    className="p-4 rounded-2xl border flex items-start gap-3 text-xs"
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.08)',
                      borderColor: 'rgba(6, 182, 212, 0.25)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <ShieldCheck size={18} className="shrink-0 mt-0.5" style={{ color: '#06B6D4' }} />
                    <span>Tu pago fue registrado y está esperando la confirmación del técnico.</span>
                  </div>
                )}
                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-2xl font-bold text-xs text-red-500 transition-colors hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                  >
                    Cancelar Cita
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full p-8 sm:p-10 rounded-[36px] border shadow-2xl space-y-6"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}
                >
                  <CreditCard size={32} />
                </div>
                <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Método de Pago</h3>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Selecciona cómo realizarás el pago de S/. {Number(appt.price).toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['yape', 'plin', 'transfer', 'cash'].map(method => {
                  const isSel = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className="p-3.5 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: isSel ? 'var(--primary)' : 'var(--bg)',
                        borderColor: isSel ? 'var(--primary)' : 'var(--border)',
                        color: isSel ? '#FFFFFF' : 'var(--text-primary)',
                        boxShadow: isSel ? '0 4px 15px rgba(37,99,235,0.25)' : 'none'
                      }}
                    >
                      {method === 'transfer' ? 'Transferencia' : method === 'cash' ? 'Efectivo' : method}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowCulqiModal(true);
                }}
                className="w-full py-3.5 rounded-2xl border border-blue-500/30 bg-blue-600/10 text-blue-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:bg-blue-600/20"
              >
                <CreditCard size={15} />
                Pagar con tarjeta (Culqi)
              </button>

              <div 
                className="p-6 rounded-2xl border text-center"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                {paymentMethod === 'yape' || paymentMethod === 'plin' ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                      Número receptor
                    </p>
                    <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>987 654 321</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>JyP Servicios Técnicos</p>
                  </div>
                ) : paymentMethod === 'transfer' ? (
                  <div className="space-y-2 text-xs text-left">
                    <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Banco:</span> <span className="font-bold" style={{ color: 'var(--text-primary)' }}>BCP</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>Cuenta:</span> <span className="font-bold" style={{ color: 'var(--text-primary)' }}>191-98765432-0-12</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-dim)' }}>CCI:</span> <span className="font-bold" style={{ color: 'var(--text-primary)' }}>00219119876543201254</span></div>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Pago en Efectivo</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Paga directamente al técnico al finalizar la visita.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3.5 font-bold text-xs uppercase rounded-2xl border transition-colors hover:bg-white/5"
                  style={{ 
                    backgroundColor: 'var(--bg)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text-secondary)' 
                  }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePay}
                  disabled={actionLoading}
                  className="flex-1 py-3.5 font-bold text-xs uppercase rounded-2xl text-white shadow-xl shadow-emerald-600/25 disabled:opacity-50 hover:scale-[1.02] transition-transform"
                  style={{ backgroundColor: '#16A34A' }}
                >
                  {actionLoading ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CulqiPaymentModal
        open={showCulqiModal}
        onClose={() => setShowCulqiModal(false)}
        amount={appt?.price}
        type="appointment"
        entityId={id}
        onSuccess={fetchDetails}
      />
    </div>
  );
};

export default AppointmentDetails;
