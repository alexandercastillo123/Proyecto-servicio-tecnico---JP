import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, MoreVertical, Search, 
  User, Check, CheckCheck, Clock, ShieldCheck,
  DollarSign, X, CheckCircle2, ChevronLeft, MessageSquare,
  Zap, Calendar, Smartphone, Wallet, CreditCard, Banknote,
  AlertCircle, ArrowRight, Package, MapPin, FileText,
  Mic, Square, StopCircle
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
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedConversation.other_user_id);

    try {
      const resp = await messageService.sendMediaMessage(formData);
      if (resp.data.exito) {
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
        toast.success('Archivo enviado correctamente');
      }
    } catch (error) {
      console.error('Error uploading chat file:', error);
      toast.error('Error al enviar archivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Tu navegador no soporta grabación de audio');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioMessage(audioBlob);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Permiso de micrófono denegado. Habilita el permiso en tu navegador.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No se encontró un micrófono. Conéctalo e intenta de nuevo.');
      } else {
        toast.error('No se pudo grabar audio. Verifica tu micrófono y permisos.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (audioBlob) => {
    if (!selectedConversation) return;

    const timestamp = Date.now();
    const fileName = `audio_${timestamp}.webm`;
    const file = new File([audioBlob], fileName, { type: 'audio/webm' });

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', selectedConversation.other_user_id);

    try {
      const resp = await messageService.sendMediaMessage(formData);
      if (resp.data.exito) {
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      toast.error('Error al enviar audio');
    } finally {
      setIsUploading(false);
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
    <div className="flex h-[calc(100vh-12rem)] glass-panel overflow-hidden shadow-2xl font-outfit" style={{ border: '1px solid var(--border)' }}>
      {/* Sidebar - Conversations */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}
        style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="p-6 space-y-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar conversaciones..." 
              className="w-full rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loading ? (
             Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-12 h-12 rounded-2xl shrink-0" style={{ background: 'var(--bg-card)' }} />
                  <div className="flex-1 space-y-2 mt-1">
                    <div className="h-3 rounded-full w-2/3" style={{ background: 'var(--bg-card)' }} />
                    <div className="h-2 rounded-full w-1/2" style={{ background: 'var(--bg-card)' }} />
                  </div>
                </div>
             ))
          ) : conversations.length > 0 ? (
            conversations.map((conv) => {
              const isSelected = String(selectedConversation?.other_user_id) === String(conv.other_user_id);
              return (
                <div 
                  key={conv.other_user_id}
                  onClick={() => {
                     setSelectedConversation(conv);
                     fetchMessages(conv.other_user_id);
                  }}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isSelected ? 'rgba(45, 107, 255, 0.08)' : 'transparent',
                    borderRight: isSelected ? '3px solid var(--primary)' : 'none'
                  }}
                  className="p-4 flex gap-4 cursor-pointer transition-all hover:brightness-105"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md"
                      style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)' }}>
                      {(conv.username || conv.names)?.[0]?.toUpperCase()}
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 shadow-sm"
                        style={{ background: 'var(--primary)', borderColor: 'var(--bg-surface)' }}>
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{conv.username || `${conv.names} ${conv.surnames}`}</h3>
                      <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {conv.last_message_text || 'Inicia una conversación...'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
               <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} />
               </div>
               <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No tienes mensajes aún.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col backdrop-blur-sm ${!selectedConversation ? 'hidden md:flex items-center justify-center' : 'flex'}`}
        style={{ background: 'var(--bg-card)' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-20 px-6 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <div 
                className="flex items-center gap-4 cursor-pointer p-2 rounded-xl transition-all hover:brightness-110"
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
                  className="md:hidden"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm"
                  style={{ background: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}>
                  {(selectedConversation.username || selectedConversation.names)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{selectedConversation.username || `${selectedConversation.names} ${selectedConversation.surnames}`}</h2>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isConnected ? 'text-emerald-500' : 'text-amber-400'}`}>
                      {isConnected ? 'En vivo' : 'Conectando...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {currentUser?.role === 'tech' && (
                  <button 
                    onClick={() => setShowOfferModal(true)}
                    style={{ background: 'rgba(45, 107, 255, 0.1)', border: '1px solid rgba(45, 107, 255, 0.2)', color: 'var(--primary)' }}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-125 transition-all shadow-sm"
                  >
                    <DollarSign size={14} />
                    Enviar Presupuesto
                  </button>
                )}
                <button style={{ color: 'var(--text-muted)' }}>
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(45, 107, 255, 0.1)', color: 'var(--primary)' }}>
                       <Zap size={32} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Di hola para iniciar la consulta técnica.</p>
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
                        <div 
                          className={`p-4 rounded-2xl relative shadow-md ${isMine ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                          style={
                            isMine 
                              ? { background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)', color: '#ffffff' }
                              : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                          }
                        >
                          {isOffer ? (
                            <div className="space-y-4 min-w-[220px]">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                                <DollarSign size={14} className="text-yellow-400" />
                                Presupuesto Propuesto
                              </div>
                              <div className="text-2xl font-black">S/.{msg.offer_price}</div>
                              <p className="text-[11px] opacity-80 leading-relaxed">{msg.message_text}</p>
                              
                              {!isMine && msg.offer_status === 'pending' && (
                                <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={() => handleAcceptOffer(msg.id)}
                                    className="flex-1 bg-white text-blue-700 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/90 shadow-lg"
                                  >
                                    Aceptar
                                  </button>
                                  <button 
                                    onClick={() => handleRejectOffer(msg.id)}
                                    className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff' }}
                                  >
                                    Rechazar
                                  </button>
                                </div>
                              )}
                              
                              {msg.offer_status === 'accepted' && (
                                <div className="flex items-center gap-2 bg-emerald-500/20 p-2 rounded-lg text-emerald-400 text-[10px] font-black uppercase">
                                  <CheckCircle2 size={12} />
                                  Presupuesto Aceptado
                                </div>
                              )}
                              {msg.offer_status === 'rejected' && (
                                <div className="flex items-center gap-2 bg-rose-500/20 p-2 rounded-lg text-rose-400 text-[10px] font-black uppercase">
                                  <X size={12} />
                                  Presupuesto Rechazado
                                </div>
                              )}
                            </div>
                          ) : msg.message_type === 'appointment' ? (
                            <div className="space-y-4 min-w-[240px]">
                               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                 style={{ color: 'var(--text-muted)' }}>
                                  <Calendar size={14} style={{ color: 'var(--primary)' }} />
                                  Detalles del Servicio
                               </div>
                               <div className="p-4 rounded-2xl space-y-3"
                                 style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-2 text-xs font-black"
                                       style={{ color: 'var(--text-primary)' }}>
                                        <Clock size={14} style={{ color: 'var(--primary)' }} />
                                        {msg.appointment_date || 'Fecha pendiente'}
                                     </div>
                                     <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md" style={{
                                       background: msg.appointment_status === 'pending' ? 'rgba(234,179,8,0.15)' :
                                                   msg.appointment_status === 'confirmed' ? 'rgba(45,107,255,0.15)' :
                                                   msg.appointment_status === 'paid' ? 'rgba(16,185,129,0.15)' :
                                                   'rgba(239,68,68,0.15)',
                                       color: msg.appointment_status === 'pending' ? '#ca8a04' :
                                              msg.appointment_status === 'confirmed' ? 'var(--primary)' :
                                              msg.appointment_status === 'paid' ? '#10b981' : '#ef4444'
                                     }}>
                                       {msg.appointment_status || 'Pendiente'}
                                     </span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>"{msg.message_text}"</p>
                                  
                                  {msg.appointment_price > 0 && (
                                    <div className="flex items-center justify-between pt-2"
                                      style={{ borderTop: '1px solid var(--border)' }}>
                                      <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Costo del servicio</span>
                                      <span className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>S/.{msg.appointment_price}</span>
                                    </div>
                                  )}
                               </div>

                               {/* ACTIONS BASED ON ROLE AND STATUS */}
                               <div className="space-y-2 pt-1">
                                  {/* TECH ACTIONS */}
                                  {currentUser.role === 'tech' && msg.appointment_status === 'pending' && !msg.appointment_price && (
                                    <button 
                                      onClick={() => { setSelectedAppointment(msg); setShowPriceModal(true); }}
                                      className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                      style={{ background: 'var(--primary)', color: '#fff' }}
                                    >
                                      Establecer Monto
                                    </button>
                                  )}
                                  {currentUser.role === 'tech' && msg.appointment_status === 'paid' && (
                                    <button 
                                      onClick={() => handleConfirmPayment(msg.appointment_id)}
                                      className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                                      style={{ background: '#10b981', color: '#fff' }}
                                    >
                                      Confirmar Pago Recibido
                                    </button>
                                  )}

                                  {/* CLIENT ACTIONS */}
                                  {currentUser.role === 'client' && msg.appointment_status === 'confirmed' && msg.appointment_price > 0 && (
                                    <button 
                                      onClick={() => { setSelectedAppointment(msg); setShowPaymentModal(true); }}
                                      className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                                      style={{ background: 'var(--primary)', color: '#fff' }}
                                    >
                                      Pagar Servicio
                                    </button>
                                  )}
                                  
                                  {msg.appointment_status !== 'completed' && msg.appointment_status !== 'cancelled' && msg.appointment_payment_status !== 'paid' && (
                                    <button 
                                      onClick={() => handleCancelAppointment(msg.appointment_id)}
                                      className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                      style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                                    >
                                      Cancelar
                                    </button>
                                  )}
                               </div>
                            </div>
                          ) : msg.message_type === 'order' ? (
                            <div className="space-y-4 min-w-[240px]">
                               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                 style={{ color: 'var(--text-muted)' }}>
                                  <Package size={14} style={{ color: 'var(--primary)' }} />
                                  Pedido de Producto
                               </div>
                               <div className="p-4 rounded-2xl space-y-3"
                                 style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                  <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                       style={{ background: 'rgba(45,107,255,0.1)', color: 'var(--primary)' }}>
                                        <Package size={20} />
                                     </div>
                                     <div className="flex-1">
                                        <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{msg.product_name || 'Producto'}</h4>
                                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cantidad: {msg.quantity || 1}</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] pt-2"
                                    style={{ borderTop: '1px solid var(--border)' }}>
                                     <span className="font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Estado</span>
                                     <span className="font-black uppercase" style={{ color: 'var(--primary)' }}>{msg.order_status || 'Pendiente'}</span>
                                  </div>
                                  {msg.delivery_address && (
                                    <div className="flex items-start gap-2 pt-1">
                                      <MapPin size={12} className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                                      <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>{msg.delivery_address}</p>
                                    </div>
                                  )}
                               </div>
                               <button 
                                 onClick={() => navigate('/orders')}
                                 className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                                 style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                               >
                                 Ver detalles del pedido
                               </button>
                            </div>
                           ) : msg.message_type === 'image' ? (
                            <div className="space-y-2 max-w-[280px]">
                              <a 
                                href={msg.message_text?.startsWith('http') ? msg.message_text : `http://localhost:3000/uploads/${msg.message_text}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <img 
                                  src={msg.message_text?.startsWith('http') ? msg.message_text : `http://localhost:3000/uploads/${msg.message_text}`} 
                                  alt="Adjunto" 
                                  className="rounded-2xl max-h-60 w-full object-cover shadow-lg hover:opacity-90 transition-opacity"
                                  style={{ border: '1px solid var(--border)' }}
                                />
                              </a>
                            </div>
                          ) : msg.message_type === 'audio' ? (
                            <div className="space-y-2 min-w-[240px]">
                              <audio 
                                controls 
                                className="w-full h-10 rounded-xl" 
                                src={msg.message_text?.startsWith('http') ? msg.message_text : `http://localhost:3000/uploads/${msg.message_text}`}
                              >
                                Tu navegador no soporta el reproductor de audio.
                              </audio>
                            </div>
                          ) : msg.message_type === 'video' ? (
                            <div className="space-y-2 max-w-[280px]">
                              <video 
                                controls 
                                className="rounded-2xl w-full max-h-60 shadow-lg"
                                style={{ border: '1px solid var(--border)' }}
                                src={msg.message_text?.startsWith('http') ? msg.message_text : `http://localhost:3000/uploads/${msg.message_text}`}
                              >
                                Tu navegador no soporta el reproductor de video.
                              </video>
                            </div>
                          ) : msg.message_type === 'file' ? (
                            <div className="flex items-center gap-3 p-3 rounded-2xl min-w-[220px]"
                              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                              <FileText size={24} style={{ color: 'var(--primary)' }} className="shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{msg.message_text?.split('/').pop() || 'Documento adjunto'}</p>
                                <a 
                                  href={msg.message_text?.startsWith('http') ? msg.message_text : `http://localhost:3000/uploads/${msg.message_text}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] font-bold uppercase tracking-wider block mt-1 hover:underline"
                                  style={{ color: 'var(--primary)' }}
                                >
                                  Descargar archivo
                                </a>
                              </div>
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
                  className="px-6 py-2 flex items-center gap-2 text-xs font-bold"
                  style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', color: 'var(--primary)' }}
                >
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--primary)', animationDelay: '300ms' }} />
                  </div>
                  <span>{selectedConversation?.username || 'El usuario'} está escribiendo...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 backdrop-blur-md" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" 
                className="hidden" 
              />
               <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                 <button 
                   type="button" 
                   disabled={isUploading}
                   onClick={() => fileInputRef.current?.click()}
                   className="p-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                   style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                   title="Adjuntar imagen, audio, video o documento"
                 >
                   <Paperclip size={18} className={isUploading ? 'animate-spin' : ''} />
                 </button>
                 <div className="flex-1 relative">
                   <input 
                     type="text" 
                     placeholder={isUploading ? "Subiendo archivo..." : "Escribe tu mensaje aquí..."} 
                     className="w-full rounded-xl py-3 px-4 text-sm focus:outline-none transition-all"
                     style={{ 
                       background: 'var(--bg-card)', 
                       border: '1px solid var(--border)', 
                       color: 'var(--text-primary)'
                     }}
                     value={newMessage}
                     onChange={handleInputChange}
                     disabled={isUploading || isRecording}
                   />
                 </div>
                  {isRecording ? (
                    <button 
                      type="button"
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      className="p-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                      title="Grabando... suelta para enviar"
                    >
                      <Mic size={18} className="animate-pulse" />
                      <span className="text-xs font-bold hidden sm:block">Grabando</span>
                    </button>
                  ) : newMessage.trim() ? (
                    <button 
                      type="submit" 
                      disabled={isUploading}
                      className="p-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-lg"
                      style={{ background: 'var(--primary)', color: '#fff' }}
                    >
                      <Send size={18} />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      disabled={isUploading}
                      className="p-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      title="Grabar mensaje de voz"
                    >
                      <Mic size={18} />
                    </button>
                  )}
               </form>
            </div>
          </>
        ) : (
          <div className="text-center p-12">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              style={{ background: 'rgba(45,107,255,0.1)', color: 'var(--primary)' }}>
              <MessageSquare size={48} className="animate-pulse" />
            </div>
            <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Tus Conversaciones</h3>
            <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>Selecciona una conversación a la izquierda para empezar a chatear.</p>
          </div>
        )}
      </div>

      {/* Price Modal */}
      <AnimatePresence>
        {showPriceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm p-8 relative rounded-2xl shadow-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <button 
                onClick={() => setShowPriceModal(false)} 
                className="absolute top-6 right-6 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={24} />
              </button>
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(45,107,255,0.1)', color: 'var(--primary)' }}>
                  <DollarSign size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Costo del Servicio</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Indica el monto a cobrar por este trabajo.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black" style={{ color: 'var(--primary)' }}>S/.</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full rounded-xl text-2xl font-black pl-14 pr-6 py-4 focus:outline-none transition-all"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleSetAppointmentPrice}
                  disabled={processing}
                  className="w-full py-4 font-black text-sm rounded-xl transition-all hover:brightness-110 disabled:opacity-60 shadow-lg"
                  style={{ background: 'var(--primary)', color: '#fff' }}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md p-8 relative rounded-2xl shadow-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="absolute top-6 right-6 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <Wallet size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Pagar Servicio</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Monto a pagar: <span className="font-black" style={{ color: 'var(--text-primary)' }}>S/.{selectedAppointment?.appointment_price}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'yape', name: 'Yape', icon: Smartphone, bg: '#742284' },
                  { id: 'plin', name: 'Plin', icon: Smartphone, bg: '#00c3b8' },
                  { id: 'transfer', name: 'Transferencia', icon: Banknote, bg: 'var(--primary)' },
                  { id: 'cash', name: 'Efectivo', icon: Banknote, bg: '#10b981' }
                ].map((method) => (
                  <button 
                    key={method.id}
                    onClick={() => handlePayAppointment(method.id)}
                    disabled={processing}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all group"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ background: method.bg }}>
                      <method.icon size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-black block" style={{ color: 'var(--text-primary)' }}>{method.name}</span>
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Pago inmediato</span>
                    </div>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-all" style={{ color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl flex gap-3"
                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                <AlertCircle size={20} className="shrink-0" style={{ color: '#ca8a04' }} />
                <p className="text-[10px] leading-relaxed italic" style={{ color: '#ca8a04' }}>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md p-8 relative rounded-2xl shadow-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <button 
                onClick={() => setShowOfferModal(false)}
                className="absolute top-6 right-6 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(45,107,255,0.1)', color: 'var(--primary)' }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Enviar Presupuesto</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Propón una tarifa para este servicio.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest pl-1" style={{ color: 'var(--text-muted)' }}>Monto en Soles (S/.)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full rounded-xl text-2xl font-black px-6 py-4 focus:outline-none transition-all"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                </div>

                <div className="p-4 rounded-xl"
                  style={{ background: 'rgba(45,107,255,0.05)', border: '1px solid rgba(45,107,255,0.15)' }}>
                  <p className="text-[10px] leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                    * El cliente recibirá una notificación y podrá aceptar o rechazar tu oferta de inmediato. Una vez aceptada, el servicio quedará confirmado con este precio.
                  </p>
                </div>

                <button 
                  onClick={handleSendOffer}
                  className="w-full py-5 font-black text-base rounded-xl shadow-xl transition-all hover:brightness-110"
                  style={{ background: 'var(--primary)', color: '#fff' }}
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
