import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, ChevronRight, 
  Search, Filter, CheckCircle2, XCircle, 
  AlertCircle, DollarSign, MessageSquare
} from 'lucide-react';
import { clientService, techService } from '../services/api';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const AppointmentList = () => {
  const { socketService } = useSocket();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [currentUser] = useState(JSON.parse(localStorage.getItem('user')));

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  // Real-time socket updates for appointments
  useEffect(() => {
    if (!socketService) return;

    const unsubProgress = socketService.on('appointment_progress', () => {
      fetchAppointments();
    });

    const unsubCreated = socketService.on('appointment_created', () => {
      fetchAppointments();
    });

    const unsubPrice = socketService.on('appointment_price_updated', () => {
      fetchAppointments();
    });

    const unsubConfirmed = socketService.on('appointment_payment_confirmed', () => {
      fetchAppointments();
    });

    return () => {
      unsubProgress();
      unsubCreated();
      unsubPrice();
      unsubConfirmed();
    };
  }, [socketService, filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = currentUser.role === 'client' 
        ? await clientService.getMyAppointments()
        : await techService.getAppointments();
        
      if (response.data.exito) {
        let data = response.data.resultado;
        if (filter !== 'all') {
          data = data.filter(a => a.status === filter);
        }
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'confirmed': return 'bg-primary/10 text-primary border-primary/20';
      case 'arrived': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'in_progress': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-error/10 text-error border-error/20';
      case 'expired': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-white/5 text-text-dim border-white/10';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'arrived': return 'En el sitio';
      case 'in_progress': return 'En progreso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'expired': return 'Expirada';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black gradient-text">Gestión de Citas</h1>
          <p className="text-text-secondary text-sm">Administra tus servicios programados y su estado.</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl gap-1 border border-white/5">
          {['all', 'pending', 'confirmed', 'completed'].map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-lg' : 'text-text-dim hover:text-white'}`}
            >
              {f === 'all' ? 'Ver Todo' : getStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-card h-32 animate-pulse" />
          ))
        ) : appointments.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {appointments.map((appt) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={appt.id}
                className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-tr from-primary/50 to-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                      {currentUser.role === 'client' ? appt.technician?.names?.[0] : appt.client?.names?.[0]}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">
                        {currentUser.role === 'client' ? `${appt.technician?.names} ${appt.technician?.surnames}` : `${appt.client?.names} ${appt.client?.surnames}`}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${getStatusStyles(appt.status)}`}>
                        {getStatusLabel(appt.status)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-text-dim text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-primary" />
                        {new Date(appt.scheduled_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-primary" />
                        {appt.scheduled_time.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary" />
                        {appt.address || 'Ubicación remota'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="text-right hidden md:block px-6">
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">Monto Estimado</p>
                    <p className="text-xl font-black text-white">S/.{appt.price || '0.00'}</p>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    <Link 
                      to={`/chat?user=${currentUser.role === 'client' ? appt.technician_id : appt.client_id}`}
                      className="flex-1 md:flex-none p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/5"
                    >
                      <MessageSquare size={18} />
                    </Link>
                    <Link 
                      to={`/appointments/${appt.id}`}
                      className="flex-[2] md:flex-none btn-primary px-8 py-4 text-sm"
                    >
                      Ver Detalle
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="glass-panel p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-dim">
              <Calendar size={32} />
            </div>
            <h3 className="text-xl font-black text-white">No hay citas</h3>
            <p className="text-text-dim text-sm max-w-xs mx-auto">No tienes servicios programados en esta categoría actualmente.</p>
            {currentUser.role === 'client' && (
              <Link to="/technicians" className="btn-primary inline-flex mt-6">Buscar Técnico Ahora</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;
