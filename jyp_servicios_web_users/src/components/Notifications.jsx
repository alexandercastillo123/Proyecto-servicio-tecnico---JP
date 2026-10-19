import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, BellOff, Check, CheckCheck, Calendar, MessageSquare,
  ShoppingCart, Wrench, Settings2, X, Zap, ChevronRight
} from 'lucide-react';
import { notificationService } from '../services/api';
import { formatDateShort, formatTime } from '../services/formatters';
import { TechLoader } from './common/TechLoader';
import toast from 'react-hot-toast';

const TYPE_META = {
  appointment: { icon: Calendar, color: '#3B82F6', label: 'Cita' },
  chat: { icon: MessageSquare, color: '#06B6D4', label: 'Mensaje' },
  order: { icon: ShoppingCart, color: '#A855F7', label: 'Pedido' },
  promotion: { icon: Zap, color: '#F59E0B', label: 'Promoción' },
  system: { icon: Wrench, color: '#94A3B8', label: 'Sistema' },
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
      console.error('Error fetching notifications:', error);
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
      console.error('Error fetching notification settings:', error);
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
      toast.success('Todas las notificaciones fueron marcadas como leídas');
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron marcar las notificaciones');
      fetchNotifications();
    }
  };

  const handleToggleSetting = async (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      const res = await notificationService.updateSettings({ [key]: next[key] });
      if (!res.data?.exito) throw new Error('fallback');
      toast.success('Preferencia guardada');
    } catch (error) {
      console.error(error);
      setSettings(settings);
      toast.error('No se pudo guardar la preferencia');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return <TechLoader compact title="Cargando Notificaciones" subtitle="Sincronizando tus avisos..." />;
  }

  return (
    <div className="w-full space-y-8 pb-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Centro de Avisos
            </span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {unreadCount} sin leer
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Notificaciones</h1>
          <p className="text-sm text-slate-400 mt-1">
            Citas, mensajes, pedidos y promociones de JyP en un solo lugar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${
              showSettings
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
            }`}
          >
            <Settings2 size={15} />
            Preferencias
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border border-white/5 bg-white/5 text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <CheckCheck size={15} />
              Marcar leídas
            </button>
          )}
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-[#0e1424] p-6 sm:p-7 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Preferencias de notificación</h2>
            {savingSettings && <span className="text-[11px] text-slate-400">Guardando...</span>}
          </div>

          {[
            { key: 'push_enabled', label: 'Notificaciones push', desc: 'Recibe avisos en tiempo real en este dispositivo' },
            { key: 'appointment_reminders', label: 'Recordatorios de citas', desc: 'Avisos antes de cada cita agendada' },
            { key: 'chat_notifications', label: 'Mensajes nuevos', desc: 'Avisos cuando un técnico o tienda te responde' },
            { key: 'order_updates', label: 'Estado de pedidos', desc: 'Avisos de pagos, envíos y entregas' },
          ].map((opt) => (
            <div key={opt.key} className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm font-bold text-white">{opt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
              </div>
              <button
                onClick={() => handleToggleSetting(opt.key)}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${settings[opt.key] ? 'bg-blue-600' : 'bg-white/10'}`}
                aria-label={opt.label}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings[opt.key] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </motion.section>
      )}

      {/* List */}
      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0e1424] p-16 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <BellOff size={36} />
          </div>
          <h3 className="text-xl font-black text-white">No tienes notificaciones</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Aquí verás los avisos de tus citas, mensajes, pedidos y promociones.
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
                className={`w-full text-left p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                  n.is_read
                    ? 'bg-[#0e1424] border-white/10'
                    : 'bg-blue-500/[0.07] border-blue-500/30 hover:border-blue-500/50'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-white">{n.title || meta.label}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />}
                  </div>
                  {n.message && (
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-2 font-semibold uppercase tracking-wider">
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
