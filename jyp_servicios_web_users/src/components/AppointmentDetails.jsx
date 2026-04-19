import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, User, Phone, 
  Mail, FileText, DollarSign, CheckCircle2, 
  XCircle, ChevronLeft, AlertCircle, MessageSquare,
  ShieldCheck, CreditCard
} from 'lucide-react';
import { clientService, techService } from '../services/api';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [currentUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    fetchDetails();
  }, [id]);

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

  const handleSetPrice = async () => {
    if (!priceInput) return;
    setActionLoading(true);
    try {
      await techService.setPrice(id, parseFloat(priceInput));
      fetchDetails();
    } catch (error) {
      console.error('Error setting price:', error);
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

  if (loading) return <div className="h-96 flex items-center justify-center animate-pulse font-bold text-text-dim">Cargando detalles de la cita...</div>;
  if (!appt) return <div className="glass-card p-12 text-center text-white font-bold">Cita no encontrada.</div>;

  const otherUser = currentUser.role === 'client' ? appt.technician : appt.client;
  const isTech = currentUser.role === 'tech';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <Link to="/appointments" className="inline-flex items-center gap-2 text-text-dim hover:text-white transition-all font-bold text-sm">
          <ChevronLeft size={18} />
          Volver a mis citas
        </Link>
        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
          appt.status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' :
          appt.status === 'confirmed' ? 'bg-primary/10 text-primary border-primary/20' :
          appt.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
          'bg-error/10 text-error border-error/20'
        }`}>
          {appt.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-panel p-8">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              Detalles del Servicio
            </h2>
            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
              <p className="text-text-secondary leading-relaxed italic">"{appt.description}"</p>
              <div className="pt-4 border-t border-white/5 flex flex-wrap gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-widest leading-none">Fecha Programada</p>
                  <p className="text-white font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {new Date(appt.scheduled_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-widest leading-none">Hora Seleccionada</p>
                  <p className="text-white font-bold flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    {appt.scheduled_time.slice(0, 5)}
                  </p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-text-dim uppercase tracking-widest leading-none">Ubicación</p>
                   <p className="text-white font-bold flex items-center gap-2">
                     <MapPin size={14} className="text-primary" />
                     {appt.address || 'Remoto/No especificado'}
                   </p>
                </div>
              </div>
            </div>
          </section>

          {/* Action History / Pricing */}
          <section className="glass-panel p-8">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <DollarSign size={20} className="text-primary" />
              Presupuesto y Pago
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2">Monto del Servicio</p>
                {isTech && appt.status === 'pending' ? (
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="input-field w-full py-2 px-3 text-lg font-black"
                      placeholder="0.00"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                    />
                    <button 
                      onClick={handleSetPrice}
                      disabled={actionLoading}
                      className="btn-primary px-4 py-2"
                    >
                      Establecer
                    </button>
                  </div>
                ) : (
                  <p className="text-3xl font-black text-white">S/.{appt.price || '0.00'}</p>
                )}
              </div>

              <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2">Estado del Pago</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${appt.payment_status === 'paid' ? 'bg-success' : 'bg-warning animate-pulse'}`} />
                  <p className={`font-black uppercase text-sm ${appt.payment_status === 'paid' ? 'text-success' : 'text-warning'}`}>
                    {appt.payment_status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar - Other User Info & Status Control */}
        <div className="space-y-6">
          <div className="glass-panel p-8 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
             <div className="w-20 h-20 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center text-primary font-black text-3xl mb-4">
               {otherUser?.names?.[0]}
             </div>
             <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">
               {isTech ? 'Cliente' : 'Técnico Especialista'}
             </p>
             <h3 className="text-lg font-bold text-white mb-6">{otherUser?.names} {otherUser?.surnames}</h3>
             
             <div className="space-y-3 text-left">
               <div className="flex items-center gap-3 text-text-secondary text-sm">
                 <Phone size={16} className="text-primary" />
                 {otherUser?.phone}
               </div>
               <div className="flex items-center gap-3 text-text-secondary text-sm">
                 <Mail size={16} className="text-primary" />
                 <span className="truncate">{otherUser?.email}</span>
               </div>
             </div>

             <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
               <Link to={`/chat?user=${otherUser?.id}`} className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-xs">
                 <MessageSquare size={16} />
                 Ir al Chat
               </Link>
             </div>
          </div>

          <div className="glass-card p-8 space-y-4">
            <h3 className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-4">Control de Estado</h3>
            {isTech ? (
              <div className="flex flex-col gap-3">
                {appt.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateStatus('confirmed')}
                    disabled={actionLoading || !appt.price}
                    className="w-full bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    Confirmar Servicio
                  </button>
                )}
                {appt.status === 'confirmed' && (
                  <button 
                    onClick={() => handleUpdateStatus('completed')}
                    disabled={actionLoading}
                    className="w-full bg-success text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-success/20 hover:brightness-110 transition-all"
                  >
                    Finalizar Trabajo
                  </button>
                )}
                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={actionLoading}
                    className="w-full bg-white/5 text-error px-4 py-3 rounded-xl font-bold text-xs hover:bg-error/10 transition-all"
                  >
                    Cancelar Cita
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {!appt.price && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                    <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-text-secondary leading-normal">
                      Esperando a que el técnico proporcione un presupuesto detallado.
                    </p>
                  </div>
                )}
                {appt.status === 'confirmed' && appt.price && appt.payment_status === 'pending' && (
                  <button className="w-full bg-success text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-success/20 hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <CreditCard size={16} />
                    Pagar Ahora S/.{appt.price}
                  </button>
                )}
                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <button 
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full bg-white/5 text-error px-4 py-4 rounded-xl font-bold text-xs hover:bg-error/10 transition-all border border-error/10"
                  >
                    Citas / Cancelar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
