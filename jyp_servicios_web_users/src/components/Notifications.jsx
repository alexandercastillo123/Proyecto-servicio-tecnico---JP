import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Check, CheckCheck, Calendar, MessageSquare,
  ShoppingCart, Wrench, Settings2, X, Zap, ChevronRight,
  Activity, Sparkles
} from "lucide-react";
import { notificationService } from "../services/api";
import { formatDateShort, formatTime } from "../services/formatters";
import { TechLoader } from "./common/TechLoader";
import toast from "react-hot-toast";

const TYPE_META = {
  appointment: { icon: Calendar, color: "#3B82F6", label: "Cita Técnica" },
  chat: { icon: MessageSquare, color: "#06B6D4", label: "Mensaje Seguro" },
  order: { icon: ShoppingCart, color: "#10B981", label: "Pedido de Repuestos" },
  promotion: { icon: Zap, color: "#F59E0B", label: "Aviso Promocional" },
  system: { icon: Wrench, color: "#6366F1", label: "Telemetría Sistema" },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    push_enabled: true,
    appointment_reminders: true,
    chat_notifications: true,
    order_updates: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      const list = res.data?.resultado;
      setNotifications(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await notificationService.getSettings();
      const s = res.data?.resultado;
      if (s) {
        setSettings({
          push_enabled: Boolean(s.push_enabled),
          appointment_reminders: Boolean(s.appointment_reminders),
          chat_notifications: Boolean(s.chat_notifications),
          order_updates: Boolean(s.order_updates),
        });
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
    }
  };

  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error(error);
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
      toast.success("Todas las notificaciones fueron marcadas como leídas");
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron marcar las notificaciones");
      fetchNotifications();
    }
  };

  const handleToggleSetting = async (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      const res = await notificationService.updateSettings({ [key]: next[key] });
      if (!res.data?.exito) throw new Error("fallback");
      toast.success("Preferencia guardada");
    } catch (error) {
      console.error(error);
      setSettings(settings);
      toast.error("No se pudo guardar la preferencia");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return <TechLoader compact title="Cargando Notificaciones" subtitle="Sincronizando telemetría de avisos..." />;
  }

  return (
    <div className="w-full space-y-8 pb-10" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] p-8 sm:p-10 border border-white/10 bg-gradient-to-br from-[#0c1322] via-[#080d17] to-[#0a1829] shadow-2xl flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25 inline-flex items-center gap-1.5">
              <Activity size={12} className="text-cyan-400" />
              <span>Centro de Notificaciones en Vivo</span>
            </span>
            {unreadCount > 0 && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                {unreadCount} sin leer
              </span>
            )}
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Avisos & Telemetría
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Historial de citas técnicas, mensajes cifrados, despacho de repuestos y actualizaciones de la red.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${
              showSettings
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-lg shadow-blue-600/30"
                : "bg-white/[0.03] text-slate-300 border-white/10 hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Settings2 size={15} />
            <span>Preferencias</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <CheckCheck size={15} />
              <span>Marcar todas leídas</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Drawer Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-[28px] border border-cyan-500/20 bg-[#0a101b]/95 p-6 sm:p-7 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2
                className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Settings2 size={14} />
                <span>Preferencias de Alertas en Tiempo Real</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "push_enabled", label: "Alertas Satelitales Push", desc: "Recibir notificaciones inmediatas en el navegador." },
                { key: "appointment_reminders", label: "Recordatorios de Citas", desc: "Avisos 1 hora antes de la visita técnica." },
                { key: "chat_notifications", label: "Mensajes Entrantes", desc: "Notificar cuando un técnico o cliente escribe." },
                { key: "order_updates", label: "Despacho de Pedidos", desc: "Avisos de confirmación, embalaje y entrega de repuestos." },
              ].map((opt) => (
                <div
                  key={opt.key}
                  className="p-4 rounded-2xl bg-[#0c1424] border border-white/5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{opt.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting(opt.key)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
                      settings[opt.key]
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md shadow-cyan-500/30"
                        : "bg-slate-800"
                    }`}
                    aria-label={opt.label}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                        settings[opt.key] ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-[#0a101b]/80 p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <BellOff size={32} />
          </div>
          <h3
            className="text-xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Bandeja de Avisos Vacía
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            Aquí se archivarán los estados de citas, mensajes, facturación y confirmaciones de despacho.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            const Icon = meta.icon;

            return (
              <motion.button
                key={n.id}
                layout
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`w-full text-left p-5 sm:p-6 rounded-[28px] border transition-all flex items-start gap-4 ${
                  n.is_read
                    ? "bg-[#0a101b]/80 border-white/5 hover:bg-[#0c1424]"
                    : "bg-gradient-to-r from-blue-600/15 via-[#0c1424] to-[#0a101b] border-cyan-500/35 hover:border-cyan-400 shadow-lg shadow-cyan-500/5"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                  style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                >
                  <Icon size={22} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-white">{n.title || meta.label}</p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] shrink-0 mt-1.5" />
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-wider">
                    {meta.label} · {formatDateShort(n.created_at)} {formatTime(n.created_at)}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
