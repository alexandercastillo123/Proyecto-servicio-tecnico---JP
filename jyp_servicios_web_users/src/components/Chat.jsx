import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, MoreVertical, Search,
  User, Check, CheckCheck, Clock, ShieldCheck,
  DollarSign, X, CheckCircle2, ChevronLeft, MessageSquare,
  Zap, Calendar, Smartphone, Wallet, CreditCard, Banknote,
  AlertCircle, ArrowRight, Package, MapPin, FileText,
  Mic, Square, StopCircle, Radio, Sparkles
} from "lucide-react";
import { messageService, clientService, techService, storeService } from "../services/api";
import { mediaUrl, formatDateShort } from "../services/formatters";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";

const appointmentScheduleLabel = (text = "") => {
  const match = String(text).match(/para\s+(\d{4}-\d{2}-\d{2})\s+a\s+las\s+(\d{1,2}:\d{2})/i);
  if (!match) return "Fecha por confirmar";
  return `${formatDateShort(match[1])} · ${match[2]}`;
};

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialUserId = searchParams.get("user");
  const { socketService, emitTyping, isConnected } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
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

  useEffect(() => {
    if (!socketService) return;

    const unsubMessage = socketService.on("receive_message", (data) => {
      const activeOtherId = selectedConversation?.other_user_id;
      const isRelatedToActiveChat =
        String(data.sender_id) === String(activeOtherId) ||
        String(data.receiver_id) === String(activeOtherId);

      if (isRelatedToActiveChat) {
        setMessages((prev) => {
          if (data.id && prev.some((m) => m.id === data.id)) {
            return prev;
          }
          return [...prev, data];
        });
        setIsOtherTyping(false);
        setTimeout(scrollToBottom, 50);
      }

      setConversations((prev) => {
        const otherId = String(data.sender_id) === String(currentUser.id) ? data.receiver_id : data.sender_id;
        const index = prev.findIndex((c) => String(c.other_user_id) === String(otherId));

        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            last_message: data.message_text || (data.message_type === "offer" ? `Oferta: S/ ${data.offer_price}` : "Mensaje"),
            last_message_text: data.message_text || (data.message_type === "offer" ? `Oferta: S/ ${data.offer_price}` : "Mensaje"),
            last_message_time: data.created_at || new Date().toISOString(),
          };
          const [item] = updated.splice(index, 1);
          return [item, ...updated];
        } else {
          fetchConversations();
          return prev;
        }
      });
    });

    const unsubTyping = socketService.on("user_typing", (data) => {
      if (selectedConversation && String(data.senderId) === String(selectedConversation.other_user_id)) {
        setIsOtherTyping(!!data.isTyping);
      }
    });

    const unsubOffer = socketService.on("offer_updated", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.offerId || m.offer_id === data.offerId
            ? { ...m, offer_status: data.offerStatus }
            : m
        )
      );
    });

    const unsubPrice = socketService.on("appointment_price_updated", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.appointment_id === data.appointment_id ? { ...m, appointment_price: data.price } : m
        )
      );
    });

    const unsubPaymentWaiting = socketService.on("appointment_payment_waiting", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.appointment_id === data.appointment_id
            ? { ...m, appointment_payment_status: "waiting_confirmation" }
            : m
        )
      );
    });

    const unsubPaymentConfirmed = socketService.on("appointment_payment_confirmed", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.appointment_id === data.appointment_id
            ? { ...m, appointment_payment_status: "paid", appointment_status: "confirmed" }
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
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await messageService.getConversations();
      if (response.data?.exito) {
        setConversations(response.data.resultado || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId) => {
    const existingConv = conversations.find((c) => String(c.other_user_id) === String(userId));

    if (existingConv) {
      setSelectedConversation(existingConv);
      fetchMessages(userId);
    } else {
      try {
        const profileResp = await clientService.getUserById(userId).catch(() => null);
        const profile = profileResp?.data?.resultado || {};
        setSelectedConversation({
          other_user_id: userId,
          username: profile.username || "Nuevo Chat",
          names: profile.names || profile.company_name || profile.username || "Nuevo Chat",
          surnames: profile.surnames || "",
          other_user_role: profile.role,
          isNew: true,
        });
        fetchMessages(userId);
      } catch (error) {
        console.error("Error initiating new chat:", error);
      }
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (conv.username || "").toLowerCase().includes(q) ||
      `${conv.names || ""} ${conv.surnames || ""}`.toLowerCase().includes(q) ||
      (conv.last_message_text || "").toLowerCase().includes(q)
    );
  });

  const fetchMessages = async (userId) => {
    try {
      const response = await messageService.getMessages(userId);
      if (response.data?.exito) {
        setMessages(response.data.resultado || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
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
    setNewMessage("");

    try {
      const data = {
        receiverId: selectedConversation.other_user_id,
        messageText,
      };
      const resp = await messageService.sendMessage(data);
      if (resp.data?.exito) {
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar mensaje");
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiverId", selectedConversation.other_user_id);

    try {
      const resp = await messageService.sendMediaMessage(formData);
      if (resp.data?.exito) {
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
        toast.success("Archivo transmitido");
      }
    } catch (error) {
      console.error("Error uploading chat file:", error);
      toast.error("Error al enviar archivo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Tu navegador no soporta grabación de audio");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error al iniciar grabación:", error);
      toast.error("Permiso de micrófono no disponible.");
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
    const file = new File([audioBlob], fileName, { type: "audio/webm" });

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiverId", selectedConversation.other_user_id);

    try {
      const resp = await messageService.sendMediaMessage(formData);
      if (resp.data?.exito) {
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error sending audio:", error);
      toast.error("Error al enviar audio");
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
      if (resp.data?.exito) {
        setShowOfferModal(false);
        setOfferPrice("");
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
        toast.success("Presupuesto enviado");
      }
    } catch (error) {
      console.error("Error sending offer:", error);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      const resp = await messageService.acceptOffer(offerId);
      if (resp.data?.exito) {
        toast.success("Oferta aceptada");
        fetchMessages(selectedConversation.other_user_id);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo aceptar la oferta");
    }
  };

  const handleCancelOffer = async (offerId) => {
    try {
      const resp = await messageService.cancelOffer(offerId);
      if (resp.data?.exito) {
        toast.success("Oferta cancelada");
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error("Error cancelling offer:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo cancelar la oferta");
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      const resp = await messageService.rejectOffer(offerId);
      if (resp.data?.exito) {
        toast.success("Oferta rechazada");
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error("Error rejecting offer:", error);
      toast.error("Error al rechazar oferta");
    }
  };

  const handleSetAppointmentPrice = async () => {
    if (!tempPrice || !selectedAppointment) return;
    setProcessing(true);
    try {
      const resp = await techService.setPrice(selectedAppointment.id, parseFloat(tempPrice));
      if (resp.data?.exito) {
        toast.success("Precio establecido");
        setShowPriceModal(false);
        setTempPrice("");
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error("Error setting price:", error);
      toast.error("No se pudo establecer el precio");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayAppointment = async (method) => {
    if (!selectedAppointment) return;
    setProcessing(true);
    try {
      const resp = await clientService.payAppointment(selectedAppointment.id, method);
      if (resp.data?.exito) {
        toast.success(`Pago con ${method} registrado`);
        setShowPaymentModal(false);
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error("Error paying appointment:", error);
      toast.error("Error al procesar pago");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async (appointmentId) => {
    try {
      const resp = await techService.confirmPayment(appointmentId);
      if (resp.data?.exito) {
        toast.success("Pago confirmado");
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("No se pudo confirmar el pago");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar este servicio?")) return;
    try {
      const resp = await clientService.cancelAppointment(appointmentId);
      if (resp.data?.exito) {
        toast.success("Servicio cancelado");
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.response?.data?.mensaje || "Error al cancelar el servicio");
    }
  };

  const handleEditMessage = async (messageId, currentText) => {
    const nextText = window.prompt("Editar mensaje:", currentText || "");
    if (!nextText || nextText.trim() === currentText) return;
    try {
      const resp = await messageService.updateMessage(messageId, nextText.trim());
      if (resp.data?.exito) {
        toast.success("Mensaje actualizado");
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("No se pudo editar el mensaje");
    }
  };

  const handleDeleteMessage = async (messageId, forEveryone) => {
    const confirmMsg = forEveryone
      ? "¿Eliminar este mensaje para todos?"
      : "¿Eliminar este mensaje solo para ti?";
    if (!window.confirm(confirmMsg)) return;
    try {
      const resp = await messageService.deleteMessage(messageId, forEveryone);
      if (resp.data?.exito) {
        toast.success(forEveryone ? "Mensaje eliminado para todos" : "Mensaje eliminado");
        fetchMessages(selectedConversation.other_user_id);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <div
      className="flex h-[calc(100vh-11rem)] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-[#080d17]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Left Sidebar - Conversations */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-white/10 bg-[#0a101b] ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-5 border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-lg font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Comunicaciones
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black border border-cyan-500/20">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span>{isConnected ? "Satelital Activo" : "Reconectando"}</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Buscar chats o mensajes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl py-2.5 pl-10 pr-4 text-xs bg-[#0c1424] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
          {loading ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="p-4 flex gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-white/5" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-3 rounded bg-white/5 w-2/3" />
                  <div className="h-2 rounded bg-white/5 w-1/2" />
                </div>
              </div>
            ))
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isSelected = String(selectedConversation?.other_user_id) === String(conv.other_user_id);
              const displayName = conv.username || `${conv.names || ""} ${conv.surnames || ""}`.trim() || "Usuario";

              return (
                <div
                  key={conv.other_user_id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    fetchMessages(conv.other_user_id);
                  }}
                  className={`p-4 flex gap-3.5 cursor-pointer transition-all hover:bg-white/[0.03] ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-600/15 to-cyan-600/10 border-l-4 border-cyan-400"
                      : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md"
                      style={{ background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)" }}
                    >
                      {displayName[0]?.toUpperCase() || "U"}
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-400">
                        {displayName}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {conv.last_message_time
                          ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {conv.last_message_text || "Iniciar conversación técnica..."}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center space-y-3">
              <MessageSquare size={32} className="mx-auto text-slate-600" />
              <p className="text-xs text-slate-400 italic">No hay conversaciones activas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col bg-[#080d17] ${
          !selectedConversation ? "hidden md:flex items-center justify-center" : "flex"
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Active Chat Header */}
            <div className="h-20 px-6 flex items-center justify-between border-b border-white/10 bg-[#0a101b]">
              <div
                className="flex items-center gap-3.5 cursor-pointer"
                onClick={() => {
                  const role = selectedConversation.other_user_role;
                  const id = selectedConversation.other_user_id;
                  if (role === "tech" || role === "technician") navigate(`/technician/${id}`);
                  else if (role === "store") navigate(`/store/${id}`);
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConversation(null);
                  }}
                  className="md:hidden text-slate-400 hover:text-white mr-1"
                >
                  <ChevronLeft size={22} />
                </button>

                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-md shrink-0"
                  style={{ background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)" }}
                >
                  {(selectedConversation.username || selectedConversation.names)?.[0]?.toUpperCase() || "U"}
                </div>

                <div>
                  <h3
                    className="text-sm font-black text-white hover:text-cyan-400 transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {selectedConversation.username ||
                      `${selectedConversation.names || ""} ${selectedConversation.surnames || ""}`.trim() ||
                      "Interlocutor"}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Canal Cifrado
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentUser?.role === "tech" && (
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="jyp-btn-primary px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    <DollarSign size={13} />
                    <span className="hidden sm:inline">Cotizar Servicio</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                    <Zap size={28} />
                  </div>
                  <p className="text-xs text-slate-400">Inicia la consulta técnica escribiendo a continuación.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = String(msg.sender_id) === String(currentUser.id);
                  const isOffer = msg.message_type === "offer";

                  return (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setOpenMenuId(openMenuId === (msg.id || index) ? null : msg.id || index);
                        }}
                      >
                        <div
                          className={`p-4 rounded-3xl relative shadow-xl text-xs sm:text-sm leading-relaxed ${
                            isMine
                              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none shadow-cyan-500/10"
                              : "bg-[#0c1424] border border-white/10 text-slate-200 rounded-tl-none"
                          }`}
                        >
                          {/* Offer Card */}
                          {isOffer ? (
                            <div className="space-y-3 min-w-[240px]">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-300">
                                <DollarSign size={14} /> Presupuesto Formal
                              </div>
                              <div className="text-2xl font-black font-mono text-white">S/. {msg.offer_price}</div>
                              <p className="text-xs opacity-90">{msg.message_text}</p>

                              {!isMine && msg.offer_status === "pending" && (
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => handleAcceptOffer(msg.id)}
                                    className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white text-slate-950 hover:bg-slate-100"
                                  >
                                    Aceptar
                                  </button>
                                  <button
                                    onClick={() => handleRejectOffer(msg.id)}
                                    className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-black/40 text-white hover:bg-black/60"
                                  >
                                    Rechazar
                                  </button>
                                </div>
                              )}

                              {msg.offer_status === "accepted" && (
                                <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-black uppercase">
                                  <CheckCircle2 size={13} /> Oferta Aceptada
                                </div>
                              )}
                              {msg.offer_status === "rejected" && (
                                <div className="flex items-center gap-1.5 text-rose-300 text-[10px] font-black uppercase">
                                  <X size={13} /> Oferta Declinada
                                </div>
                              )}
                            </div>
                          ) : msg.message_type === "appointment" ? (
                            <div className="space-y-3 min-w-[240px]">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                                <Calendar size={13} /> Cita Técnica
                              </div>
                              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                                <div className="flex items-center justify-between text-xs font-mono font-bold">
                                  <span>{msg.appointment_date || appointmentScheduleLabel(msg.message_text)}</span>
                                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-white/10 uppercase">
                                    {msg.appointment_status || "Pendiente"}
                                  </span>
                                </div>
                                <p className="text-xs italic text-slate-300 leading-relaxed">"{msg.message_text}"</p>
                                {msg.appointment_price > 0 && (
                                  <div className="flex justify-between items-center pt-2 border-t border-white/10 font-mono text-xs">
                                    <span className="text-slate-400">Total:</span>
                                    <span className="font-black text-white">S/. {msg.appointment_price}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : msg.message_type === "order" ? (
                            <div className="space-y-3 min-w-[240px]">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                                <Package size={13} /> Pedido de Repuestos
                              </div>
                              <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1.5">
                                <h4 className="font-black text-xs text-white">
                                  {msg.order_product_name || msg.product_name || "Producto Homologado"}
                                </h4>
                                {msg.order_price && (
                                  <p className="text-xs font-mono text-cyan-300">Total: S/. {Number(msg.order_price).toFixed(2)}</p>
                                )}
                              </div>
                            </div>
                          ) : msg.message_type === "image" ? (
                            <a href={mediaUrl(msg.message_text)} target="_blank" rel="noopener noreferrer">
                              <img
                                src={mediaUrl(msg.message_text)}
                                alt="Adjunto"
                                className="rounded-2xl max-h-60 w-full object-cover shadow-lg"
                              />
                            </a>
                          ) : msg.message_type === "audio" ? (
                            <audio controls className="w-full h-10 rounded-xl" src={mediaUrl(msg.message_text)}>
                              Tu navegador no soporta reproducción de audio.
                            </audio>
                          ) : msg.message_type === "file" ? (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20 border border-white/10">
                              <FileText size={22} className="text-cyan-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate text-white">
                                  {msg.message_text?.split("/").pop() || "Documento"}
                                </p>
                                <a
                                  href={mediaUrl(msg.message_text)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-cyan-300 font-bold uppercase hover:underline"
                                >
                                  Descargar
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p>{msg.message_text}</p>
                          )}

                          <div className={`mt-1 text-[9px] opacity-60 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
                            <span>
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                : ""}
                            </span>
                            {isMine && (msg.is_read ? <CheckCheck size={11} className="text-cyan-200" /> : <Check size={11} />)}
                          </div>
                        </div>

                        {/* Context Menu for Edit / Delete */}
                        {openMenuId === (msg.id || index) && (
                          <div className="mt-1 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0c1424] text-xs">
                            {isMine && msg.message_type === "text" && !msg.deleted_at && (
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleEditMessage(msg.id, msg.message_text);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-white/5 text-slate-200"
                              >
                                Editar mensaje
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDeleteMessage(msg.id, false);
                              }}
                              className="block w-full text-left px-4 py-2 hover:bg-white/5 text-slate-400"
                            >
                              Eliminar para mí
                            </button>
                            {isMine && !msg.deleted_at && (
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleDeleteMessage(msg.id, true);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-400"
                              >
                                Eliminar para todos
                              </button>
                            )}
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
                  className="px-6 py-2 flex items-center gap-2 text-xs font-bold text-cyan-400 bg-[#0a101b] border-t border-white/5"
                >
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-200" />
                  </div>
                  <span>{selectedConversation?.username || "El usuario"} está escribiendo...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Footer Area */}
            <div className="p-4 border-t border-white/10 bg-[#0a101b]">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                className="hidden"
              />
              <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 rounded-2xl bg-[#0c1424] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 shrink-0"
                  title="Adjuntar archivo o imagen"
                >
                  <Paperclip size={18} className={isUploading ? "animate-spin text-cyan-400" : ""} />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={isUploading ? "Subiendo archivo..." : "Escribe tu mensaje seguro..."}
                    className="w-full rounded-2xl py-3 px-5 text-sm bg-[#0c1424] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
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
                    className="p-3.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-2 shrink-0 animate-pulse"
                  >
                    <Mic size={18} />
                    <span className="text-xs font-bold hidden sm:block">Grabando</span>
                  </button>
                ) : newMessage.trim() ? (
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="jyp-btn-primary p-3.5 rounded-2xl shrink-0"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    disabled={isUploading}
                    className="p-3.5 rounded-2xl bg-[#0c1424] border border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all shrink-0"
                    title="Grabar mensaje de voz"
                  >
                    <Mic size={18} />
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <div className="text-center p-12 space-y-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto bg-blue-500/10 text-cyan-400 border border-blue-500/20 shadow-2xl">
              <MessageSquare size={36} />
            </div>
            <h3
              className="text-2xl font-black text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Centro de Mensajería Segura
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              Selecciona una conversación técnica a la izquierda para coordinar diagnósticos y servicios.
            </p>
          </div>
        )}
      </div>

      {/* Offer Modal */}
      <AnimatePresence>
        {showOfferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-8 rounded-[36px] bg-[#0a101b] border border-white/15 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/25">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Enviar Presupuesto</h3>
                    <p className="text-xs text-slate-400">Cotización formal de mano de obra y repuestos.</p>
                  </div>
                </div>
                <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black font-mono text-cyan-400">S/.</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-[#0c1424] border border-white/10 rounded-2xl pl-14 pr-4 py-3.5 text-2xl font-black font-mono text-white focus:outline-none focus:border-cyan-400"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSendOffer}
                  disabled={!offerPrice}
                  className="jyp-btn-primary w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl disabled:opacity-40"
                >
                  Confirmar y Transmitir Oferta
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
