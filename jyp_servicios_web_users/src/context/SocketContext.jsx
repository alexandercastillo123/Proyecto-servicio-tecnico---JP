import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import socketService from '../services/socketService';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const SocketContext = createContext(null);

export const SocketProvider = ({ user, children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const activeChatUserIdRef = useRef(null);

  // Mantener actualizado el usuario activo en el chat según los query params
  useEffect(() => {
    if (location.pathname === '/chat') {
      const params = new URLSearchParams(location.search);
      activeChatUserIdRef.current = params.get('user');
    } else {
      activeChatUserIdRef.current = null;
    }
  }, [location]);

  useEffect(() => {
    if (!user || !user.id) {
      socketService.disconnect();
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('token');
    socketService.connect(user.id, token);

    // Listener de estado de conexión
    const unsubConnection = socketService.on('connection_status', ({ connected }) => {
      setIsConnected(connected);
    });

    // Listener de mensajes entrantes para notificaciones globales
    const unsubMessages = socketService.on('receive_message', (data) => {
      const isFromOther = String(data.sender_id) !== String(user.id);
      const isViewingThisChat = location.pathname === '/chat' && String(activeChatUserIdRef.current) === String(data.sender_id);

      if (isFromOther) {
        setUnreadCount((prev) => prev + 1);

        // Si no está viendo este chat actualmente, mostrar toast interactivo
        if (!isViewingThisChat) {
          toast((t) => (
            <div 
              onClick={() => {
                toast.dismiss(t.id);
                navigate(`/chat?user=${data.sender_id}`);
              }}
              className="cursor-pointer flex items-start gap-3 p-1"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-base shrink-0 shadow-lg shadow-primary/30">
                💬
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-primary">Nuevo Mensaje</p>
                <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                  {data.message_text || (data.message_type === 'offer' ? `Oferta por S/ ${data.offer_price}` : 'Nuevo mensaje')}
                </p>
                <span className="text-[10px] text-slate-400 font-bold">Haz clic para responder</span>
              </div>
            </div>
          ), { duration: 4000 });
        }
      }
    });

    // Listener de progreso de citas para notificaciones globales
    const unsubAppointment = socketService.on('appointment_progress', (data) => {
      toast.success(`📅 Estado de Cita: ${data.message || 'Actualizado a ' + data.status}`, {
        duration: 5000,
        icon: '🔔'
      });
    });

    // Listener de nueva cita creada
    const unsubNewAppointment = socketService.on('appointment_created', (data) => {
      if (user.role === 'tech' || user.role === 'store') {
        toast.success(`🎉 ¡Nueva solicitud de servicio recibida para el ${data.scheduled_date}!`, {
          duration: 6000,
          icon: '🛠️'
        });
      }
    });

    // Listener de ofertas actualizadas
    const unsubOffer = socketService.on('offer_updated', (data) => {
      const statusText = data.offerStatus === 'accepted' ? '¡Oferta aceptada! ✅' :
                         data.offerStatus === 'rejected' ? 'Oferta rechazada ❌' : 'Oferta cancelada';
      toast(statusText, { icon: '🏷️' });
    });

    return () => {
      unsubConnection();
      unsubMessages();
      unsubAppointment();
      unsubNewAppointment();
      unsubOffer();
    };
  }, [user, location.pathname]);

  const value = {
    socketService,
    isConnected,
    unreadCount,
    setUnreadCount,
    emitTyping: (receiverId, isTyping) => socketService.emitTyping(receiverId, isTyping),
    sendMessage: (msg) => socketService.sendMessage(msg)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
};
