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

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socketService, isConnected } = useSocket();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
      if (response.data.success) {
        setAppt(response.data.data);
        setPriceInput(response.data.data.price || '');
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
      fetchDetails();
    } catch (error) {
      console.error('Error setting price:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await techService.updateStatus(id, newStatus);
      fetchDetails();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    setActionLoading(true);
    try {
      await clientService.payAppointment(id, paymentMethod);
      setShowPaymentModal(false);
      fetchDetails();
    } catch (error) {
      console.error('Error paying:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setActionLoading(true);
    try {
      await techService.confirmPayment(id);
      fetchDetails();
    } catch (error) {
      console.error('Error confirming payment:', error);
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
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div 
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm font-semibold animate-pulse" style={{ color: 'var(--text-secondary)' }}>
          Cargando detalles de la cita...
        </p>
      </div>
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

  const otherUser = currentUser?.role === 'client' ? appt.technician : appt.client;
  const isTech = currentUser?.role === 'tech';

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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <Link 
          to="/appointments" 
          className="inline-flex items-center gap-2 font-semibold text-sm transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={18} />
          <span>Volver a mis citas</span>
        </Link>
        <div>
          {getStatusBadge(appt.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <section 
            className="p-7 rounded-2xl border shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              <span>Detalles del Servicio</span>
            </h2>
            <div 
              className="p-5 rounded-xl border space-y-4"
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
            >
              <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                "{appt.description}"
              </p>
              <div className="pt-4 border-t flex flex-wrap gap-6" style={{ borderColor: 'var(--border)' }}>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Fecha Programada
                  </p>
                  <p className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Calendar size={14} style={{ color: 'var(--primary)' }} />
                    {new Date(appt.scheduled_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Hora
                  </p>
                  <p className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <Clock size={14} style={{ color: 'var(--primary)' }} />
                    {appt.scheduled_time?.slice(0, 5)} hrs
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Ubicación
                  </p>
                  <p className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} />
                    {appt.address || 'Servicio en Taller / Local'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Action History / Pricing */}
          <section 
            className="p-7 rounded-2xl border shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
              <DollarSign size={20} style={{ color: 'var(--primary)' }} />
              <span>Presupuesto y Pago</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="p-5 rounded-xl border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Monto del Servicio
                </p>
                {isTech && appt.status === 'pending' ? (
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="w-full py-2 px-3 text-base font-bold rounded-xl border outline-none"
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
                      className="btn-primary px-4 py-2 text-xs font-bold rounded-xl disabled:opacity-50"
                    >
                      Guardar
                    </button>
                  </div>
                ) : (
                  <p className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    S/. {Number(appt.price || 0).toFixed(2)}
                  </p>
                )}
              </div>

              <div 
                className="p-5 rounded-xl border"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Estado del Pago
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0"
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
        <div className="space-y-6">
          <div 
            className="p-6 text-center rounded-2xl border shadow-lg relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div 
              className="flex flex-col items-center cursor-pointer p-2 rounded-xl transition-all"
              onClick={() => {
                if (!isTech && appt.technician_id) {
                  navigate(`/technician/${appt.technician_id}`);
                }
              }}
            >
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white mb-3 shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #00C6FF 100%)' }}
              >
                {otherUser?.names?.[0] || 'U'}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--primary)' }}>
                {isTech ? 'Cliente' : 'Técnico Especialista'}
              </p>
              <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {otherUser?.names} {otherUser?.surnames}
              </h3>
            </div>
            
            <div className="space-y-2 text-left pt-3 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {otherUser?.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} style={{ color: 'var(--primary)' }} />
                  <span>{otherUser.phone}</span>
                </div>
              )}
              {otherUser?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} style={{ color: 'var(--primary)' }} />
                  <span className="truncate">{otherUser.email}</span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <Link 
                to={`/chat?user=${otherUser?.id}`} 
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-xs font-bold rounded-xl shadow-md"
              >
                <MessageSquare size={15} />
                <span>Ir al Chat</span>
              </Link>
            </div>
          </div>

          <div 
            className="p-6 rounded-2xl border space-y-3 shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Control de Estado
            </h3>

            {isTech ? (
              <div className="flex flex-col gap-2.5">
                {appt.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateStatus('confirmed')}
                    disabled={actionLoading || !appt.price}
                    className="btn-primary w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md disabled:opacity-40"
                  >
                    Confirmar Servicio
                  </button>
                )}
                {appt.status === 'confirmed' && (
                  <button 
                    onClick={() => handleUpdateStatus('on_the_way')}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    Marcar En Camino
                  </button>
                )}
                {appt.status === 'on_the_way' && (
                  <button 
                    onClick={() => handleUpdateStatus('arrived')}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90"
                    style={{ backgroundColor: '#06B6D4' }}
                  >
                    Confirmar Llegada
                  </button>
                )}
                {appt.status === 'arrived' && (
                  <button 
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-black shadow-md transition-all hover:opacity-90"
                    style={{ backgroundColor: 'var(--secondary)' }}
                  >
                    Iniciar Trabajo
                  </button>
                )}
                {appt.status === 'in_progress' && (
                  <button 
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90"
                    style={{ backgroundColor: '#16A34A' }}
                  >
                    Finalizar Trabajo
                  </button>
                )}
                {appt.payment_status === 'waiting_confirmation' && (
                  <button 
                    onClick={handleConfirmPayment}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90"
                    style={{ backgroundColor: '#16A34A' }}
                  >
                    Confirmar Pago Recibido
                  </button>
                )}
                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs transition-colors hover:bg-red-500/10 text-red-500"
                  >
                    Cancelar Cita
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {!appt.price && (
                  <div 
                    className="p-3.5 rounded-xl border flex items-start gap-2.5 text-xs"
                    style={{ 
                      backgroundColor: 'rgba(45, 107, 255, 0.05)', 
                      borderColor: 'rgba(45, 107, 255, 0.2)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
                    <span>Esperando a que el técnico proporcione el presupuesto.</span>
                  </div>
                )}
                {appt.status !== 'pending' && appt.price && appt.payment_status === 'pending' && (
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#16A34A' }}
                  >
                    <CreditCard size={16} />
                    <span>Pagar S/. {Number(appt.price).toFixed(2)}</span>
                  </button>
                )}
                {appt.status === 'confirmed' && appt.service_type === 'local' && (
                  <button 
                    onClick={() => handleUpdateStatus('on_the_way')}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    Estoy En Camino al Local
                  </button>
                )}
                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <button 
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-red-500 transition-colors hover:bg-red-500/10"
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
              className="max-w-md w-full p-8 rounded-2xl border shadow-2xl space-y-6"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="text-center">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}
                >
                  <CreditCard size={28} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Método de Pago</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Selecciona cómo realizarás el pago de S/. {Number(appt.price).toFixed(2)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {['yape', 'plin', 'transfer', 'cash'].map(method => {
                  const isSel = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className="p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all"
                      style={{
                        backgroundColor: isSel ? 'var(--primary)' : 'var(--bg)',
                        borderColor: isSel ? 'var(--primary)' : 'var(--border)',
                        color: isSel ? '#FFFFFF' : 'var(--text-primary)'
                      }}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>

              <div 
                className="p-5 rounded-xl border text-center"
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              >
                {paymentMethod === 'yape' || paymentMethod === 'plin' ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Número receptor
                    </p>
                    <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>987 654 321</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>JyP Servicios Técnicos</p>
                  </div>
                ) : paymentMethod === 'transfer' ? (
                  <div className="space-y-2 text-xs text-left">
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Banco:</span> <span className="font-bold" style={{ color: 'var(--text-primary)' }}>BCP</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Cuenta:</span> <span className="font-bold" style={{ color: 'var(--text-primary)' }}>191-98765432-0-12</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>CCI:</span> <span className="font-bold" style={{ color: 'var(--text-primary)' }}>00219119876543201254</span></div>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Pago en Efectivo</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Paga directamente al técnico al finalizar la visita.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 font-bold text-xs uppercase rounded-xl border transition-colors hover:opacity-80"
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
                  className="flex-1 py-3 font-bold text-xs uppercase rounded-xl text-white shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: '#16A34A' }}
                >
                  {actionLoading ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentDetails;
