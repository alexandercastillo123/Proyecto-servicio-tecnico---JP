import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, MoreVertical, Search, 
  User, Check, CheckCheck, Clock, ShieldCheck,
  DollarSign, X, CheckCircle2, ChevronLeft, MessageSquare,
  Zap, Calendar, Smartphone, Wallet, CreditCard, Banknote,
  AlertCircle, ArrowRight, Package, MapPin
} from 'lucide-react';
import { messageService, clientService, techService, storeService } from '../services/api';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialUserId = searchParams.get('user');
  const { socketService, emitTyping, isConnected } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [currentUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  // New States for Parity
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [processing, setProcessing] = useState(false);

  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Socket.IO Real-time listeners
  useEffect(() => {
    if (!socketService) return;

    // Escuchar mensajes entrantes
    const unsubMessage = socketService.on('receive_message', (data) => {
      const activeOtherId = selectedConversation?.other_user_id;
      const isRelatedToActiveChat = 
        String(data.sender_id) === String(activeOtherId) || 
        String(data.receiver_id) === String(activeOtherId);

      if (isRelatedToActiveChat) {
        setMessages((prev) => {
          // Evitar duplicados por id
          if (data.id && prev.some(m => m.id === data.id)) {
            return prev;
          }
          return [...prev, data];
        });
        setIsOtherTyping(false);
        setTimeout(scrollToBottom, 50);
      }

      // Actualizar lista de conversaciones en tiempo real
      setConversations((prev) => {
        const otherId = String(data.sender_id) === String(currentUser.id) ? data.receiver_id : data.sender_id;
        const index = prev.findIndex(c => String(c.other_user_id) === String(otherId));
        
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            last_message: data.message_text || (data.message_type === 'offer' ? `Oferta: S/ ${data.offer_price}` : 'Mensaje'),
            last_message_time: data.created_at || new Date().toISOString()
          };
          // Mover al principio
          const [item] = updated.splice(index, 1);
          return [item, ...updated];
        } else {
          // Si es nueva conversación, refrescar desde API
          fetchConversations();
          return prev;
        }
      });
    });

    // Escuchar indicador de escribiendo
    const unsubTyping = socketService.on('user_typing', (data) => {
      if (selectedConversation && String(data.senderId) === String(selectedConversation.other_user_id)) {
        setIsOtherTyping(!!data.isTyping);
      }
    });

    // Escuchar actualización de ofertas
    const unsubOffer = socketService.on('offer_updated', (data) => {
      setMessages((prev) => 
        prev.map(m => (m.id === data.offerId || m.offer_id === data.offerId) 
          ? { ...m, offer_status: data.offerStatus } 
          : m
        )
      );
    });

    // Escuchar actualización de precios de cita
    const unsubPrice = socketService.on('appointment_price_updated', (data) => {
      setMessages((prev) =>
        prev.map(m => m.appointment_id === data.appointment_id
          ? { ...m, appointment_price: data.price }
          : m
        )
      );
    });

    // Escuchar pagos de citas
    const unsubPaymentWaiting = socketService.on('appointment_payment_waiting', (data) => {
      setMessages((prev) =>
        prev.map(m => m.appointment_id === data.appointment_id
          ? { ...m, appointment_payment_status: 'waiting_confirmation' }
          : m
        )
      );
    });

    const unsubPaymentConfirmed = socketService.on('appointment_payment_confirmed', (data) => {
      setMessages((prev) =>
        prev.map(m => m.appointment_id === data.appointment_id
          ? { ...m, appointment_payment_status: 'paid', appointment_status: 'confirmed' }
          : m
        )
      );
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubOffer();
      unsubPrice();
      unsubPaymentWaiting();
      unsubPaymentConfirmed();
    };
  }, [socketService, selectedConversation, currentUser.id]);

  useEffect(() => {
    if (initialUserId && conversations.length >= 0) {
      handleSelectUser(initialUserId);
    }
  }, [initialUserId, conversations.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await messageService.getConversations();
      if (response.data.exito) {
        setConversations(response.data.resultado || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId) => {
    // Try to find existing conversation
    const existingConv = conversations.find(c => String(c.other_user_id) === String(userId));
    
    if (existingConv) {
      setSelectedConversation(existingConv);
      fetchMessages(userId);
    } else {
      // It's a new chat, try to fetch user info to show in header
      try {
        // Placeholder until we get messages
        setSelectedConversation({ 
          other_user_id: userId, 
          username: 'Nuevo Chat', 
          names: 'Cargando...',
          isNew: true 
        });
        fetchMessages(userId);
      } catch (error) {
        console.error('Error initiating new chat:', error);
      }
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await messageService.getMessages(userId);
      if (response.data.exito) {
        setMessages(response.data.resultado || []);
        
        // If we don't have the user name in the header, try to get it from the first message
        if (response.data.resultado?.length > 0 && selectedConversation?.isNew) {
           const firstMsg = response.data.resultado[0];
           // In our backend, the message object might not have the other user's name directly
           // But usually conversations list has it.
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (selectedConversation && emitTyping) {
      emitTyping(selectedConversation.other_user_id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(selectedConversation.other_user_id, false);
      }, 1500);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTyping(selectedConversation.other_user_id, false);

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const data = {
        receiverId: selectedConversation.other_user_id,
        messageText,
      };
      const resp = await messageService.sendMessage(data);
      if (resp.data.exito) {
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    }
  };

  const handleSendOffer = async () => {
    if (!offerPrice || !selectedConversation) return;
    try {
      const data = {
        receiverId: selectedConversation.other_user_id,
        offerPrice: parseFloat(offerPrice),
        messageText: `Presupuesto estimado: S/.${offerPrice}`,
      };
      const resp = await messageService.sendOffer(data);
      if (resp.data.exito) {
        setShowOfferModal(false);
        setOfferPrice('');
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      const resp = await messageService.rejectOffer(offerId);
      if (resp.data.exito) {
        toast.success('Oferta rechazada');
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error('Error rejecting offer:', error);
      toast.error('Error al rechazar oferta');
    }
  };

  const handleSetAppointmentPrice = async () => {
    if (!tempPrice || !selectedAppointment) return;
    setProcessing(true);
    try {
      const resp = await techService.setPrice(selectedAppointment.id, parseFloat(tempPrice));
      if (resp.data.exito) {
        toast.success('Precio establecido correctamente');
        setShowPriceModal(false);
        setTempPrice('');
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error('Error setting price:', error);
      toast.error('No se pudo establecer el precio');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayAppointment = async (method) => {
    if (!selectedAppointment) return;
    setProcessing(true);
    try {
      const resp = await clientService.payAppointment(selectedAppointment.id, method);
      if (resp.data.exito) {
        toast.success(`Pago con ${method} registrado`);
        setShowPaymentModal(false);
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error('Error paying appointment:', error);
      toast.error('Error al procesar pago');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async (appointmentId) => {
    try {
      const resp = await techService.confirmPayment(appointmentId);
      if (resp.data.exito) {
        toast.success('Pago confirmado correctamente');
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('No se pudo confirmar el pago');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este servicio?')) return;
    try {
      const resp = await clientService.cancelAppointment(appointmentId);
      if (resp.data.exito) {
        toast.success('Servicio cancelado');
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      const errorMsg = error.response?.data?.mensaje || 'Error al cancelar el servicio';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] glass-panel overflow-hidden border border-white/5 shadow-2xl font-outfit">
      {/* Sidebar - Conversations */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/5 space-y-4">
          <h2 className="text-xl font-black text-white">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
            <input 
              type="text" 
              placeholder="Buscar conversaciones..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
             Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 border-b border-white/5 animate-pulse flex gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2 mt-1">
                    <div className="h-3 bg-white/5 rounded-full w-2/3" />
                    <div className="h-2 bg-white/5 rounded-full w-1/2" />
                  </div>
                </div>
             ))
          ) : conversations.length > 0 ? (
            conversations.map((conv) => (
              <div 
                key={conv.other_user_id}
                onClick={() => {
                   setSelectedConversation(conv);
                   fetchMessages(conv.other_user_id);
                   // Update URL without full reload if possible, or just stay
                }}
                className={`p-4 border-b border-white/5 flex gap-4 cursor-pointer transition-all hover:bg-white/[0.03] ${String(selectedConversation?.other_user_id) === String(conv.other_user_id) ? 'bg-primary/10 border-r-2 border-r-primary' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-tr from-primary/50 to-primary rounded-2xl flex items-center justify-center text-white font-black">
                    {(conv.username || conv.names)?.[0]}
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-white truncate">{conv.username || `${conv.names} ${conv.surnames}`}</h3>
                    <span className="text-[10px] text-text-dim whitespace-nowrap">
                      {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-dim truncate">
                    {conv.last_message_text || 'Inicia una conversación...'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-text-dim">
                  <MessageSquare size={32} />
               </div>
               <p className="text-text-dim text-xs italic">No tienes mensajes aún.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-background/30 backdrop-blur-sm ${!selectedConversation ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-surface/50">
              <div 
                className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all"
                onClick={() => {
                  const role = selectedConversation.other_user_role;
                  const id = selectedConversation.other_user_id;
                  if (role === 'tech' || role === 'technician') {
                    navigate(`/technician/${id}`);
                  } else if (role === 'store') {
                    navigate(`/store/${id}`);
                  }
                }}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConversation(null);
                  }}
                  className="md:hidden text-text-dim hover:text-white"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black">
                  {(selectedConversation.username || selectedConversation.names)?.[0]}
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">{selectedConversation.username || `${selectedConversation.names} ${selectedConversation.surnames}`}</h2>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-amber-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isConnected ? 'text-success' : 'text-amber-400'}`}>
                      {isConnected ? 'En vivo' : 'Conectando...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {currentUser?.role === 'tech' && (
                  <button 
                    onClick={() => setShowOfferModal(true)}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                  >
                    <DollarSign size={14} />
                    Enviar Presupuesto
                  </button>
                )}
                <button className="text-text-dim hover:text-white">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-primary/30">
                       <Zap size={32} />
                    </div>
                    <p className="text-text-dim text-xs">Di hola para iniciar la consulta técnica.</p>
                 </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = String(msg.sender_id) === String(currentUser.id);
                  const isOffer = msg.message_type === 'offer';

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      key={msg.id || index} 
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`p-4 rounded-2xl relative ${
                          isMine 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                        }`}>
                          {isOffer ? (
                            <div className="space-y-4 min-w-[220px]">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                                <DollarSign size={14} className="text-yellow-400" />
                                Presupuesto Propuesto
                              </div>
                              <div className="text-2xl font-black">S/.{msg.offer_price}</div>
                              <p className="text-[11px] opacity-70 leading-relaxed">{msg.message_text}</p>
                              
                              {!isMine && msg.offer_status === 'pending' && (
                                <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={() => handleAcceptOffer(msg.id)}
                                    className="flex-1 bg-white text-primary py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 shadow-lg"
                                  >
                                    Aceptar
                                  </button>
                                  <button 
                                    onClick={() => handleRejectOffer(msg.id)}
                                    className="flex-1 bg-white/10 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20"
                                  >
                                    Rechazar
                                  </button>
                                </div>
                              )}
                              
                              {msg.offer_status === 'accepted' && (
                                <div className="flex items-center gap-2 bg-success/20 p-2 rounded-lg text-success text-[10px] font-black uppercase">
                                  <CheckCircle2 size={12} />
                                  Presupuesto Aceptado
                                </div>
                              )}
                              {msg.offer_status === 'rejected' && (
                                <div className="flex items-center gap-2 bg-error/20 p-2 rounded-lg text-error text-[10px] font-black uppercase">
                                  <X size={12} />
                                  Presupuesto Rechazado
                                </div>
                              )}
                            </div>
                          ) : msg.message_type === 'appointment' ? (
                            <div className="space-y-4 min-w-[240px]">
                               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                                  <Calendar size={14} className="text-primary" />
                                  Detalles del Servicio
                               </div>
                               <div className="bg-white/10 p-4 rounded-2xl border border-white/5 space-y-3">
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-2 text-white font-black text-xs">
                                        <Clock size={14} className="text-primary" />
                                        {msg.appointment_date || 'Fecha pendiente'}
                                     </div>
                                     <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                                       msg.appointment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                       msg.appointment_status === 'confirmed' ? 'bg-primary/20 text-primary' :
                                       msg.appointment_status === 'paid' ? 'bg-success/20 text-success' :
                                       'bg-error/20 text-error'
                                     }`}>
                                       {msg.appointment_status || 'Pendiente'}
                                     </span>
                                  </div>
                                  <p className="text-[11px] text-white/70 leading-relaxed italic">"{msg.message_text}"</p>
                                  
                                  {msg.appointment_price > 0 && (
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                      <span className="text-[10px] text-text-dim uppercase font-bold">Costo del servicio</span>
                                      <span className="text-sm font-black text-white">S/.{msg.appointment_price}</span>
                                    </div>
                                  )}
                               </div>

                               {/* ACTIONS BASED ON ROLE AND STATUS */}
                               <div className="space-y-2 pt-1">
                                  {/* TECH ACTIONS */}
                                  {currentUser.role === 'tech' && msg.appointment_status === 'pending' && !msg.appointment_price && (
                                    <button 
                                      onClick={() => { setSelectedAppointment(msg); setShowPriceModal(true); }}
                                      className="w-full bg-primary text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                    >
                                      Establecer Monto
                                    </button>
                                  )}
                                  {currentUser.role === 'tech' && msg.appointment_status === 'paid' && (
                                    <button 
                                      onClick={() => handleConfirmPayment(msg.appointment_id)}
                                      className="w-full bg-success text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                                    >
                                      Confirmar Pago Recibido
                                    </button>
                                  )}

                                  {/* CLIENT ACTIONS */}
                                  {currentUser.role === 'client' && msg.appointment_status === 'confirmed' && msg.appointment_price > 0 && (
                                    <button 
                                      onClick={() => { setSelectedAppointment(msg); setShowPaymentModal(true); }}
                                      className="w-full bg-primary text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                                    >
                                      Pagar Servicio
                                    </button>
                                  )}
                                  
                                  {msg.appointment_status !== 'completed' && msg.appointment_status !== 'cancelled' && msg.appointment_payment_status !== 'paid' && (
                                    <button 
                                      onClick={() => handleCancelAppointment(msg.appointment_id)}
                                      className="w-full bg-white/5 text-white/50 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-error/10 hover:text-error transition-all"
                                    >
                                      Cancelar
                                    </button>
                                  )}
                               </div>
                            </div>
                          ) : msg.message_type === 'order' ? (
                            <div className="space-y-4 min-w-[240px]">
                               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                                  <Package size={14} className="text-primary" />
                                  Pedido de Producto
                               </div>
                               <div className="bg-white/10 p-4 rounded-2xl border border-white/5 space-y-3">
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                                        <Package size={20} />
                                     </div>
                                     <div className="flex-1">
                                        <h4 className="text-xs font-black text-white">{msg.product_name || 'Producto'}</h4>
                                        <p className="text-[10px] text-text-dim">Cantidad: {msg.quantity || 1}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/5">
                                     <span className="text-text-dim font-bold uppercase">Estado</span>
                                     <span className="text-primary font-black uppercase">{msg.order_status || 'Pendiente'}</span>
                                  </div>
                                  {msg.delivery_address && (
                                    <div className="flex items-start gap-2 pt-1">
                                      <MapPin size={12} className="text-text-dim shrink-0 mt-0.5" />
                                      <p className="text-[10px] text-text-dim leading-tight">{msg.delivery_address}</p>
                                    </div>
                                  )}
                               </div>
                               <button 
                                 onClick={() => navigate('/orders')}
                                 className="w-full bg-white/5 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                               >
                                 Ver detalles del pedido
                               </button>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed">{msg.message_text}</p>
                          )}
                          
                          <div className={`absolute bottom-1 ${isMine ? 'right-2' : 'left-2'} text-[8px] opacity-40`}>
                             {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                        
                        {isMine && (
                          <div className="flex items-center gap-1 text-primary">
                            {msg.is_read ? <CheckCheck size={12} /> : <Check size={12} />}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Typing Indicator */}
            <AnimatePresence>
              {isOtherTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 5 }}
                  className="px-6 py-1 bg-surface/20 flex items-center gap-2 text-xs text-primary font-bold"
                >
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>{selectedConversation?.username || 'El usuario'} está escribiendo...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-6 bg-surface/30 backdrop-blur-md border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <button type="button" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-text-dim transition-all">
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Escribe tu mensaje aquí..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    value={newMessage}
                    onChange={handleInputChange}
                  />
                </div>
                <button type="submit" className="p-3 bg-primary hover:bg-primary-dark rounded-xl text-white shadow-lg shadow-primary/30 transition-all">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center p-12">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6 shadow-2xl">
              <MessageSquare size={48} className="animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Tus Conversaciones</h3>
            <p className="text-text-dim text-sm max-w-xs mx-auto">Selecciona una conversación a la izquierda para empezar a chatear.</p>
          </div>
        )}
      </div>

      {/* Price Modal */}
      <AnimatePresence>
        {showPriceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-sm p-8 relative"
            >
              <button onClick={() => setShowPriceModal(false)} className="absolute top-6 right-6 text-text-dim hover:text-white">
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                  <DollarSign size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Costo del Servicio</h3>
                  <p className="text-text-dim text-xs">Indica el monto a cobrar por este trabajo.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-primary">S/.</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="input-field w-full text-2xl font-black pl-14 pr-6 py-4"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleSetAppointmentPrice}
                  disabled={processing}
                  className="btn-primary w-full py-4 font-black text-sm"
                >
                  {processing ? 'Procesando...' : 'Establecer y Notificar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-md p-8 relative"
            >
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 text-text-dim hover:text-white">
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-success/20 rounded-2xl flex items-center justify-center text-success">
                  <Wallet size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Pagar Servicio</h3>
                  <p className="text-text-dim text-xs">Monto a pagar: <span className="text-white font-black">S/.{selectedAppointment?.appointment_price}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'yape', name: 'Yape', icon: Smartphone, color: 'bg-[#742284]' },
                  { id: 'plin', name: 'Plin', icon: Smartphone, color: 'bg-[#00d0c3]' },
                  { id: 'transfer', name: 'Transferencia', icon: Banknote, color: 'bg-primary' },
                  { id: 'cash', name: 'Efectivo', icon: Banknote, color: 'bg-success' }
                ].map((method) => (
                  <button 
                    key={method.id}
                    onClick={() => handlePayAppointment(method.id)}
                    disabled={processing}
                    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all group"
                  >
                    <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-white`}>
                      <method.icon size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-black text-white block">{method.name}</span>
                      <span className="text-[10px] text-text-dim uppercase tracking-widest">Pago inmediato</span>
                    </div>
                    <ArrowRight size={18} className="text-text-dim group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                <AlertCircle size={20} className="text-yellow-500 shrink-0" />
                <p className="text-[10px] text-yellow-500/80 leading-relaxed italic">
                  Una vez realizado el pago por el medio seleccionado, el técnico deberá confirmar la recepción para finalizar el servicio oficialmente.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Offer Modal */}
      <AnimatePresence>
        {showOfferModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-md p-8 relative"
            >
              <button 
                onClick={() => setShowOfferModal(false)}
                className="absolute top-6 right-6 text-text-dim hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Enviar Presupuesto</h3>
                  <p className="text-text-dim text-xs">Propón una tarifa para este servicio.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest pl-1">Monto en Soles (S/.)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="input-field w-full text-2xl font-black px-6 py-4"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-[10px] text-text-secondary leading-relaxed italic">
                    * El cliente recibirá una notificación y podrá aceptar o rechazar tu oferta de inmediato. Una vez aceptada, el servicio quedará confirmado con este precio.
                  </p>
                </div>

                <button 
                  onClick={handleSendOffer}
                  className="btn-primary w-full py-5 font-black text-base shadow-xl"
                >
                  Confirmar y Enviar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
