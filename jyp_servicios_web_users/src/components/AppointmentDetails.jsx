import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, MapPin, User, Phone,
  Mail, FileText, DollarSign, CheckCircle2,
  XCircle, ChevronLeft, AlertCircle, MessageSquare,
  ShieldCheck, CreditCard, Truck, Navigation, Wrench, Check,
  Activity, Sparkles, Send, ArrowRight
} from "lucide-react";
import { clientService, techService } from "../services/api";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-hot-toast";
import { formatDateLong } from "../services/formatters";
import CulqiPaymentModal from "./common/CulqiPaymentModal";
import { TechLoader } from "./common/TechLoader";

const TIMELINE_STEPS = [
  { key: "pending", label: "Solicitud", icon: Calendar },
  { key: "confirmed", label: "Confirmada", icon: ShieldCheck },
  { key: "on_the_way", label: "En Camino", icon: Truck },
  { key: "arrived", label: "En Sitio", icon: MapPin },
  { key: "in_progress", label: "En Reparación", icon: Wrench },
  { key: "completed", label: "Finalizado", icon: CheckCircle2 },
];

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socketService, isConnected } = useSocket();
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCulqiModal, setShowCulqiModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("yape");
  const [currentUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (!socketService) return;

    const unsubProgress = socketService.on("appointment_progress", (data) => {
      if (String(data.appointment_id) === String(id)) fetchDetails();
    });
    const unsubPrice = socketService.on("appointment_price_updated", (data) => {
      if (String(data.appointment_id) === String(id)) fetchDetails();
    });
    const unsubWaiting = socketService.on("appointment_payment_waiting", (data) => {
      if (String(data.appointment_id) === String(id)) fetchDetails();
    });
    const unsubConfirmed = socketService.on("appointment_payment_confirmed", (data) => {
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
        setPriceInput(payload?.price || "");
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrice = async () => {
    if (!priceInput) return;
    setActionLoading(true);
    try {
      await techService.setPrice(id, priceInput);
      toast.success("Presupuesto enviado al cliente");
      fetchDetails();
    } catch (error) {
      console.error("Error setting price:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo guardar el presupuesto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await techService.updateStatus(id, newStatus);
      toast.success("Estado de la cita actualizado");
      fetchDetails();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo actualizar el estado");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    setActionLoading(true);
    try {
      await clientService.payAppointment(id, paymentMethod);
      toast.success("Pago registrado. Esperando confirmación del técnico.");
      setShowPaymentModal(false);
      fetchDetails();
    } catch (error) {
      console.error("Error paying:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo registrar el pago");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setActionLoading(true);
    try {
      await techService.confirmPayment(id);
      toast.success("Pago confirmado");
      fetchDetails();
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo confirmar el pago");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    setActionLoading(true);
    try {
      await clientService.confirmCompletion(id);
      toast.success("Trabajo confirmado. ¡Gracias por tu confianza!");
      fetchDetails();
    } catch (error) {
      console.error("Error confirming completion:", error);
      toast.error(error.response?.data?.mensaje || "No se pudo confirmar la finalización");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    setActionLoading(true);
    try {
      await clientService.cancelAppointment(id);
      navigate("/appointments");
    } catch (error) {
      console.error("Error cancelling:", error);
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
      <div className="p-12 text-center rounded-[32px] border border-white/10 bg-[#0a101b] max-w-md mx-auto mt-12 space-y-4">
        <p className="font-bold text-lg text-white">Cita no encontrada.</p>
        <Link to="/appointments" className="jyp-btn-primary inline-flex px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider">
          Volver a mis citas
        </Link>
      </div>
    );
  }

  const userRole = currentUser?.role;
  const isTech = userRole === "tech" || userRole === "store";
  const isClient = userRole === "client";

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
    [otherUser.names, otherUser.surnames].filter(Boolean).join(" ").trim() ||
    otherUser.username ||
    (isClient ? "Técnico Especialista" : "Cliente");

  const serviceAddress = appt.service_address || appt.address || null;

  // Determine current step index in timeline
  const stepKeys = ["pending", "confirmed", "on_the_way", "arrived", "in_progress", "completed"];
  let activeStepIndex = stepKeys.indexOf(appt.status);
  if (activeStepIndex === -1 && appt.status === "paid") activeStepIndex = 5;

  return (
    <div className="w-full space-y-8 pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Top Cockpit Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 sm:p-7 rounded-[32px] bg-gradient-to-r from-[#0c1424] via-[#090f1a] to-[#0a1829] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <Link
            to="/appointments"
            className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-300 hover:text-white px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={16} />
            <span>Volver</span>
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400 font-black text-sm">#ORD-{appt.id}</span>
              {isConnected && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  EN VIVO
                </span>
              )}
            </div>
            <h2 className="text-white font-black text-lg tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {appt.serviceType || appt.service_type || "Mantenimiento Hardware"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
            {appt.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Timeline Stepper Visualizer */}
      {appt.status !== "cancelled" && (
        <div className="p-6 sm:p-8 rounded-[32px] bg-[#0a101b]/90 border border-white/10 shadow-xl overflow-x-auto no-scrollbar">
          <div className="min-w-[620px] flex items-center justify-between relative">
            {/* Connecting Track */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-white/10 -z-0" />
            <div
              className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500 -z-0"
              style={{
                width: `${Math.max(0, Math.min(100, (activeStepIndex / (TIMELINE_STEPS.length - 1)) * 100))}%`,
              }}
            />

            {TIMELINE_STEPS.map((st, idx) => {
              const isPast = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              const IconComp = st.icon;

              return (
                <div key={st.key} className="flex flex-col items-center gap-2 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isCurrent
                        ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/40 ring-4 ring-cyan-500/20 scale-110"
                        : isPast
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : "bg-[#0c1424] text-slate-500 border border-white/10"
                    }`}
                  >
                    <IconComp size={20} />
                  </div>
                  <span
                    className={`text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${
                      isCurrent ? "text-cyan-400" : isPast ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Details & Pricing Left, Interlocutor & Actions Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Service Specs Card */}
          <div className="p-8 sm:p-9 rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3
                className="text-xl font-black text-white flex items-center gap-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <FileText size={22} className="text-cyan-400" />
                <span>Especificaciones del Diagnóstico</span>
              </h3>
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/5 text-slate-400 border border-white/5">
                Certificación ISO / JyP
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "{appt.description || "Sin descripción proporcionada."}"
              </p>

              <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Fecha de Atención
                  </span>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Calendar size={15} className="text-blue-400" />
                    <span>{formatDateLong(appt.scheduled_date)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Horario Estimado
                  </span>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Clock size={15} className="text-cyan-400" />
                    <span>{appt.scheduled_time?.slice(0, 5)} hrs</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Modalidad & Ubicación
                  </span>
                  <div className="flex items-center gap-2 text-white font-bold text-sm truncate">
                    <MapPin size={15} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{serviceAddress || "En Taller Autorizado"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Telemetry HUD */}
          <div className="p-8 sm:p-9 rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-6">
            <h3
              className="text-xl font-black text-white flex items-center gap-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <DollarSign size={22} className="text-cyan-400" />
              <span>Presupuesto y Certificación de Pago</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Presupuesto input or display */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Costo Total del Servicio
                </span>
                {isTech && appt.status === "pending" ? (
                  <div className="flex gap-2.5 mt-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">S/.</span>
                      <input
                        type="number"
                        className="w-full bg-[#0c1424] border border-white/10 rounded-2xl pl-10 pr-3 py-2.5 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-400"
                        placeholder="0.00"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleSetPrice}
                      disabled={actionLoading || !priceInput}
                      className="jyp-btn-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-2xl disabled:opacity-50"
                    >
                      Enviar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-white font-mono">
                      S/. {Number(appt.price || 0).toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">PEN</span>
                  </div>
                )}
              </div>

              {/* Estado del Pago */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Estado Financiero
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${
                      appt.payment_status === "paid"
                        ? "bg-emerald-400 shadow-[0_0_12px_#10b981]"
                        : appt.payment_status === "waiting_confirmation"
                        ? "bg-cyan-400 shadow-[0_0_12px_#06b6d4] animate-pulse"
                        : "bg-amber-400 shadow-[0_0_12px_#f59e0b]"
                    }`}
                  />
                  <span
                    className="font-black text-sm uppercase tracking-wider"
                    style={{
                      color:
                        appt.payment_status === "paid"
                          ? "#34d399"
                          : appt.payment_status === "waiting_confirmation"
                          ? "#38bdf8"
                          : "#fbbf24",
                    }}
                  >
                    {appt.payment_status === "paid"
                      ? "PAGADO Y AUDITADO"
                      : appt.payment_status === "waiting_confirmation"
                      ? "VERIFICACIÓN PENDIENTE"
                      : "PAGO PENDIENTE"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interlocutor card & Operational Actions */}
        <div className="space-y-8">
          {/* User profile card */}
          <div className="p-8 text-center rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-blue-600/15 to-transparent pointer-events-none" />

            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-2xl text-white mb-4 mx-auto shadow-xl relative z-10 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)" }}
              onClick={() => {
                if (!isTech && appt.technician_id) navigate(`/technician/${appt.technician_id}`);
              }}
            >
              {otherUser?.names?.[0]?.toUpperCase() || otherUserName?.[0]?.toUpperCase() || "U"}
            </div>

            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block mb-1">
              {isTech ? "Cliente de la Orden" : "Especialista Certificado"}
            </span>
            <h3
              className="text-lg font-black text-white mb-3"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {otherUserName}
            </h3>

            <div className="space-y-2 text-left pt-4 border-t border-white/5 text-xs text-slate-400">
              {otherUser?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-cyan-400 shrink-0" />
                  <span>{otherUser.phone}</span>
                </div>
              )}
              {otherUser?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail size={14} className="text-blue-400 shrink-0" />
                  <span className="truncate">{otherUser.email}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-white/5">
              <Link
                to={`/chat?user=${otherUser?.id}`}
                className="w-full jyp-btn-primary py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-600/25"
              >
                <MessageSquare size={16} />
                <span>Iniciar Chat Seguro</span>
              </Link>
            </div>
          </div>

          {/* Action Cockpit Controller */}
          <div className="p-8 rounded-[32px] border border-white/10 bg-[#0a101b]/90 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" />
              <span>Consola Operativa</span>
            </h3>

            {isTech ? (
              <div className="flex flex-col gap-3">
                {appt.status === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus("confirmed")}
                    disabled={actionLoading || !appt.price}
                    className="jyp-btn-primary w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg disabled:opacity-40"
                  >
                    Confirmar Servicio
                  </button>
                )}
                {appt.status === "confirmed" && (
                  <button
                    onClick={() => handleUpdateStatus("on_the_way")}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Truck size={16} /> Marcar En Camino
                  </button>
                )}
                {appt.status === "on_the_way" && (
                  <button
                    onClick={() => handleUpdateStatus("arrived")}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg bg-cyan-600 hover:bg-cyan-500 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin size={16} /> Confirmar Llegada en Sitio
                  </button>
                )}
                {appt.status === "arrived" && (
                  <button
                    onClick={() => handleUpdateStatus("in_progress")}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-black shadow-lg bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Wrench size={16} /> Iniciar Reparación
                  </button>
                )}
                {appt.status === "in_progress" && (
                  <button
                    onClick={() => handleUpdateStatus("completed")}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Finalizar Intervención
                  </button>
                )}
                {appt.payment_status === "waiting_confirmation" && (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Confirmar Pago Recibido
                  </button>
                )}
                {appt.status !== "completed" && appt.status !== "cancelled" && (
                  <button
                    onClick={() => handleUpdateStatus("cancelled")}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-2xl font-bold text-xs text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  >
                    Cancelar Orden
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {!appt.price && (
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-300 flex items-start gap-3">
                    <AlertCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span>El técnico está preparando la cotización de los repuestos y mano de obra.</span>
                  </div>
                )}
                {appt.price && appt.payment_status === "pending" && appt.status !== "cancelled" && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-xl shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                  >
                    <CreditCard size={18} />
                    <span>Pagar S/. {Number(appt.price).toFixed(2)}</span>
                  </button>
                )}
                {appt.status === "confirmed" && appt.service_type === "local" && (
                  <button
                    onClick={() => handleUpdateStatus("on_the_way")}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg bg-blue-600 hover:bg-blue-500"
                  >
                    Estoy en Camino al Taller
                  </button>
                )}
                {appt.status === "on_the_way" && appt.service_type === "local" && (
                  <button
                    onClick={() => handleUpdateStatus("arrived")}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg bg-cyan-600 hover:bg-cyan-500"
                  >
                    He Llegado al Taller
                  </button>
                )}
                {appt.status === "completed" && !appt.client_confirmed_completion && (
                  <button
                    onClick={handleConfirmCompletion}
                    disabled={actionLoading}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg bg-emerald-600 hover:bg-emerald-500 transition-all"
                  >
                    Confirmar Recepción Conforme
                  </button>
                )}
                {appt.status === "completed" && appt.client_confirmed_completion && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3 text-xs text-slate-300">
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>Servicio cerrado y certificado por ambas partes.</span>
                  </div>
                )}
                {appt.payment_status === "waiting_confirmation" && (
                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3 text-xs text-slate-300">
                    <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span>Tu pago está en proceso de validación por el especialista.</span>
                  </div>
                )}
                {appt.status !== "completed" && appt.status !== "cancelled" && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-2xl font-bold text-xs text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  >
                    Cancelar Cita
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cyber-Tech Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full p-8 rounded-[36px] border border-white/10 bg-[#0a101b] shadow-2xl space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                  <CreditCard size={32} />
                </div>
                <h3
                  className="text-2xl font-black text-white tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Confirmación de Pago
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Monto a liquidar: <span className="font-mono font-bold text-cyan-400">S/. {Number(appt.price).toFixed(2)}</span>
                </p>
              </div>

              {/* Payment methods selector */}
              <div className="grid grid-cols-2 gap-2.5">
                {["yape", "plin", "transfer", "cash"].map((method) => {
                  const isSel = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
                        isSel
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white shadow-lg shadow-blue-600/30"
                          : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {method === "transfer" ? "Transferencia" : method === "cash" ? "Efectivo" : method}
                    </button>
                  );
                })}
              </div>

              {/* Culqi Gateway Trigger */}
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowCulqiModal(true);
                }}
                className="w-full py-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-600/10 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan-600/20 transition-all"
              >
                <CreditCard size={15} />
                <span>Pagar con Tarjeta (Pasarela Culqi)</span>
              </button>

              {/* Account Data Display */}
              <div className="p-5 rounded-2xl bg-[#070c14] border border-white/5 text-center">
                {paymentMethod === "yape" || paymentMethod === "plin" ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Número Receptor Certificado
                    </span>
                    <p className="text-2xl font-black text-cyan-400 font-mono tracking-wider">987 654 321</p>
                    <p className="text-xs font-semibold text-slate-300">JyP Servicios Técnicos SAC</p>
                  </div>
                ) : paymentMethod === "transfer" ? (
                  <div className="space-y-2 text-xs text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Banco:</span>
                      <span className="font-bold text-white">BCP Soles</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cuenta:</span>
                      <span className="font-mono font-bold text-white">191-98765432-0-12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">CCI:</span>
                      <span className="font-mono font-bold text-white">00219119876543201254</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-sm text-white">Pago Contra Entrega</p>
                    <p className="text-xs text-slate-400 mt-1">Paga directamente en efectivo al técnico en el sitio.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3.5 font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePay}
                  disabled={actionLoading}
                  className="flex-1 py-3.5 font-black text-xs uppercase tracking-wider rounded-2xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/25 disabled:opacity-50 transition-transform hover:scale-[1.02]"
                >
                  {actionLoading ? "Registrando..." : "Confirmar Envío"}
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
