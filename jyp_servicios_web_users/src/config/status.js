import { Clock, CheckCircle2, Package, Truck, XCircle } from 'lucide-react';

/**
 * Fuente única de verdad para los estados de citas y pedidos.
 *
 * Cada entrada incluye la etiqueta visible, la clase del badge y los
 * colores necesarios para listas, gráficos y dots. Los componentes no
 * deben volver a declarar mapas de estados propios.
 */

export const APPOINTMENT_STATUS = {
  pending: {
    label: 'Pendiente',
    badgeClass: 'status-badge status-pending',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
    chartColor: '#FBBF24',
  },
  confirmed: {
    label: 'Confirmada',
    badgeClass: 'status-badge status-confirmed',
    dotClass: 'bg-blue-400 shadow-[0_0_8px_#3b82f6]',
    chartColor: '#3B82F6',
  },
  on_the_way: {
    label: 'En camino',
    badgeClass: 'status-badge status-on_the_way animate-pulse',
    dotClass: 'bg-cyan-400 shadow-[0_0_10px_#06b6d4]',
    chartColor: '#06B6D4',
  },
  arrived: {
    label: 'En sitio',
    badgeClass: 'status-badge status-arrived',
    dotClass: 'bg-indigo-400 shadow-[0_0_8px_#6366f1]',
    chartColor: '#6366F1',
  },
  in_progress: {
    label: 'En progreso',
    badgeClass: 'status-badge status-in_progress animate-pulse',
    dotClass: 'bg-purple-400 shadow-[0_0_10px_#8b5cf6]',
    chartColor: '#8B5CF6',
  },
  paid: {
    label: 'Pagada',
    badgeClass: 'status-badge status-paid',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
    chartColor: '#10B981',
  },
  completed: {
    label: 'Completada',
    badgeClass: 'status-badge status-completed',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
    chartColor: '#10B981',
  },
  cancelled: {
    label: 'Cancelada',
    badgeClass: 'status-badge status-cancelled',
    dotClass: 'bg-rose-400',
    chartColor: '#EF4444',
  },
  cancellation_pending: {
    label: 'Por cancelar',
    badgeClass: 'status-badge status-cancellation_pending',
    dotClass: 'bg-orange-400',
    chartColor: '#FB923C',
  },
  expired: {
    label: 'Expirada',
    badgeClass: 'status-badge status-expired',
    dotClass: 'bg-slate-400',
    chartColor: '#94A3B8',
  },
};

export const ORDER_STATUS = {
  pending: {
    label: 'Pendiente',
    badgeClass: 'status-badge status-pending',
    textClass: 'text-amber-400',
    toneClass: 'bg-amber-400/10 border-amber-400/25',
    icon: Clock,
    chartColor: '#FBBF24',
  },
  paid: {
    label: 'Pagado',
    badgeClass: 'status-badge status-paid',
    textClass: 'text-emerald-400',
    toneClass: 'bg-emerald-400/10 border-emerald-400/25',
    icon: CheckCircle2,
    chartColor: '#10B981',
  },
  confirmed: {
    label: 'Confirmado',
    badgeClass: 'status-badge status-confirmed',
    textClass: 'text-blue-400',
    toneClass: 'bg-blue-400/10 border-blue-400/25',
    icon: CheckCircle2,
    chartColor: '#3B82F6',
  },
  in_preparation: {
    label: 'En preparación',
    badgeClass: 'status-badge status-in_preparation',
    textClass: 'text-cyan-400',
    toneClass: 'bg-cyan-400/10 border-cyan-400/25',
    icon: Package,
    chartColor: '#06B6D4',
  },
  shipped: {
    label: 'En despacho',
    badgeClass: 'status-badge status-shipped',
    textClass: 'text-purple-400',
    toneClass: 'bg-purple-400/10 border-purple-400/25',
    icon: Truck,
    chartColor: '#A855F7',
  },
  delivered: {
    label: 'Entregado',
    badgeClass: 'status-badge status-delivered',
    textClass: 'text-teal-400',
    toneClass: 'bg-teal-400/10 border-teal-400/25',
    icon: CheckCircle2,
    chartColor: '#14B8A6',
  },
  completed: {
    label: 'Completado',
    badgeClass: 'status-badge status-completed',
    textClass: 'text-emerald-400',
    toneClass: 'bg-emerald-400/10 border-emerald-400/25',
    icon: CheckCircle2,
    chartColor: '#10B981',
  },
  cancelled: {
    label: 'Cancelado',
    badgeClass: 'status-badge status-cancelled',
    textClass: 'text-rose-400',
    toneClass: 'bg-rose-400/10 border-rose-400/25',
    icon: XCircle,
    chartColor: '#EF4444',
  },
};

export const PAYMENT_STATUS = {
  pending: { label: 'Pago pendiente', textClass: 'text-amber-400' },
  waiting_confirmation: { label: 'Por confirmar', textClass: 'text-cyan-400' },
  paid: { label: 'Pago confirmado', textClass: 'text-emerald-400' },
};

const FALLBACK_APPOINTMENT = {
  label: 'Registrado',
  badgeClass: 'status-badge status-neutral',
  dotClass: 'bg-slate-400',
  chartColor: '#94A3B8',
};

const FALLBACK_ORDER = {
  label: 'Registrado',
  badgeClass: 'status-badge status-neutral',
  textClass: 'text-slate-400',
  toneClass: 'bg-slate-500/10 border-slate-500/20',
  icon: Package,
  chartColor: '#94A3B8',
};

export const getAppointmentStatus = (status) =>
  APPOINTMENT_STATUS[status] || {
    ...FALLBACK_APPOINTMENT,
    label: status || FALLBACK_APPOINTMENT.label,
  };

export const getOrderStatus = (status) =>
  ORDER_STATUS[status] || {
    ...FALLBACK_ORDER,
    label: status || FALLBACK_ORDER.label,
  };

export const getPaymentStatus = (status) =>
  PAYMENT_STATUS[status] || {
    label: status || 'Pago registrado',
    textClass: 'text-slate-400',
  };
