import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, MoreVertical, Search, 
  User, Check, CheckCheck, Clock, ShieldCheck,
  DollarSign, X, CheckCircle2, ChevronLeft
} from 'lucide-react';
import { messageService } from '../services/api';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get('user');
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')));

  const scrollRef = useRef();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (initialUserId) {
      // Find or create conversation with this user
      fetchMessages(initialUserId);
    }
  }, [initialUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await messageService.getConversations();
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await messageService.getMessages(userId);
      if (response.data.success) {
        setMessages(response.data.data);
        // Find conversation details
        const conv = conversations.find(c => c.other_user_id == userId);
        if (conv) setSelectedConversation(conv);
        else {
           // Basic placeholder for new conv
           setSelectedConversation({ other_user_id: userId, names: 'Cargando...', surnames: '' });
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const data = {
        receiverId: selectedConversation.other_user_id,
        messageText: newMessage,
      };
      await messageService.sendMessage(data);
      setNewMessage('');
      fetchMessages(selectedConversation.other_user_id);
    } catch (error) {
      console.error('Error sending message:', error);
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
      await messageService.sendOffer(data);
      setShowOfferModal(false);
      setOfferPrice('');
      fetchMessages(selectedConversation.other_user_id);
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await messageService.acceptOffer(offerId);
      fetchMessages(selectedConversation.other_user_id);
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] glass-panel overflow-hidden border border-white/5 shadow-2xl">
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
                onClick={() => fetchMessages(conv.other_user_id)}
                className={`p-4 border-b border-white/5 flex gap-4 cursor-pointer transition-all hover:bg-white/[0.03] ${selectedConversation?.other_user_id === conv.other_user_id ? 'bg-primary/10 border-r-2 border-r-primary' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-tr from-primary/50 to-primary rounded-2xl flex items-center justify-center text-white font-black">
                    {conv.names?.[0]}
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-white truncate">{conv.names} {conv.surnames}</h3>
                    <span className="text-[10px] text-text-dim whitespace-nowrap">
                      {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-dim truncate">
                    {conv.last_message_text || 'Inicia una conversación...'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-dim text-sm italic">
              No tienes mensajes aún.
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
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden text-text-dim hover:text-white"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-black">
                  {selectedConversation.names?.[0]}
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">{selectedConversation.names} {selectedConversation.surnames}</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-[10px] text-success font-black uppercase tracking-wider">En línea</span>
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
              {messages.map((msg, index) => {
                const isMine = msg.sender_id === currentUser.id;
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
                          <div className="space-y-4 min-w-[200px]">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80">
                              <DollarSign size={14} />
                              Presupuesto de Servicio
                            </div>
                            <div className="text-2xl font-black">S/.{msg.offer_price}</div>
                            <p className="text-[11px] opacity-70">{msg.message_text}</p>
                            
                            {/* Offer Status Actions */}
                            {!isMine && msg.offer_status === 'pending' && (
                              <div className="flex gap-2 pt-2">
                                <button 
                                  onClick={() => handleAcceptOffer(msg.id)}
                                  className="flex-1 bg-white text-primary py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/90"
                                >
                                  Aceptar
                                </button>
                                <button className="flex-1 bg-white/10 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/20">
                                  Rechazar
                                </button>
                              </div>
                            )}
                            {msg.offer_status === 'accepted' && (
                              <div className="flex items-center gap-2 text-white/80 text-[10px] font-black uppercase pt-2">
                                <CheckCircle2 size={12} />
                                Presupuesto Aceptado
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{msg.message_text}</p>
                        )}
                        
                        <div className={`absolute bottom-1 ${isMine ? 'right-2' : 'left-2'} text-[8px] opacity-40`}>
                           {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              })}
              <div ref={scrollRef} />
            </div>

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
                    onChange={(e) => setNewMessage(e.target.value)}
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
