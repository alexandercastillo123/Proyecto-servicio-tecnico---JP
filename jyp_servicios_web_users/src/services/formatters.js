/* Helpers compartidos: normalizan las respuestas del backend y las rutas de medios.
   El backend responde { exito, estado, mensaje, resultado } y en algunos listados
   `resultado` es un objeto paginado ({ technicians, pagination }) y en otros un array. */

/* ── Extracción de listas tolerante a ambos formatos ── */
export const extractList = (response, ...keys) => {
  const data = response?.data;
  const payload = data?.resultado ?? data?.data ?? data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    for (const key of keys) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    const firstArray = Object.values(payload).find((v) => Array.isArray(v));
    if (firstArray) return firstArray;
  }
  return [];
};

/* Extrae technicians de GET /technicians (puede venir como { technicians:[...] } o array) */
export const extractTechnicians = (response) => extractList(response, 'technicians', 'resultado', 'data');

/* ── Rutas de archivos subidos (el backend las guarda como 'avatars/xxx.jpg') ── */
export const mediaUrl = (path) => {
  if (!path) return null;
  if (typeof path === 'string' && /^https?:\/\//i.test(path)) return path;
  const clean = String(path).replace(/^\/+/, '').replace(/^uploads\//, '');
  return `/uploads/${clean}`;
};

/* ── Fechas en zona horaria de Lima (no UTC) ── */
const LIMA_OFFSET_MINUTES = -300;

export const toLimaDate = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + LIMA_OFFSET_MINUTES * 60000);
};

export const localDateString = (date = new Date()) => {
  const d = toLimaDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* Las fechas del backend llegan como 'YYYY-MM-DD' (sin hora). new Date() las
   interpreta en UTC y en Lima (UTC-5) mostraban el día anterior, así que se
   parsean los componentes directamente. */
const parseDateValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      const [, y, m, d] = dateOnly;
      return { y: Number(y), m: Number(m), d: Number(d) };
    }
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return { y: parsed.getFullYear(), m: parsed.getMonth() + 1, d: parsed.getDate() };
};

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const formatDateLong = (value) => {
  const p = parseDateValue(value);
  if (!p) return '';
  return `${String(p.d).padStart(2, '0')} de ${MONTHS[p.m - 1]} de ${p.y}`;
};

export const formatDateShort = (value) => {
  const p = parseDateValue(value);
  if (!p) return '';
  return `${String(p.d).padStart(2, '0')} ${MONTHS_SHORT[p.m - 1]} ${p.y}`;
};

export const formatTime = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.includes(':')) return value.slice(0, 5);
  const d = toLimaDate(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};

/* ── Nombres ── */
export const fullName = (entity = {}) => {
  if (!entity) return '';
  if (entity.names || entity.surnames) {
    return `${entity.names || ''} ${entity.surnames || ''}`.trim();
  }
  return entity.company_name || entity.username || entity.name || '';
};

export const displayName = (entity = {}) =>
  fullName(entity) || entity.email || 'Usuario';

/* ── Dinero ── */
export const formatMoney = (value) => {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return 'S/ 0.00';
  return `S/ ${n.toFixed(2)}`;
};

/* ── Distancia ── */
export const formatDistance = (km) => {
  if (km === null || km === undefined) return null;
  const n = parseFloat(km);
  if (Number.isNaN(n)) return null;
  return n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1)} km`;
};

/* ── Estado de cita ── */
export const APPOINTMENT_STATUS = {
  pending: { label: 'Pendiente', tone: 'warning' },
  confirmed: { label: 'Confirmada', tone: 'info' },
  paid: { label: 'Pagada', tone: 'success' },
  on_the_way: { label: 'En camino', tone: 'cyan' },
  arrived: { label: 'En sitio', tone: 'indigo' },
  in_progress: { label: 'En servicio', tone: 'purple' },
  completed: { label: 'Completada', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'error' },
  cancellation_pending: { label: 'Cancelación pendiente', tone: 'orange' },
  expired: { label: 'Expirada', tone: 'dim' },
};

export const statusMeta = (status) =>
  APPOINTMENT_STATUS[status] || { label: status || '—', tone: 'dim' };

/* ── Especialidades del técnico ──
   El backend no tiene columna `specialties` para usuarios (solo para sucursales),
   por lo que el perfil técnico las guarda dentro de `description` con el formato
   "Especialidades: A, B, C". Esta función las recupera desde cualquier forma. */
export const extractSpecialties = (entity = {}) => {
  if (!entity) return [];
  if (entity.specialties) {
    return String(entity.specialties)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const description = String(entity.description || '');
  const match = description.match(/Especialidades:\s*(.+)/i);
  const source = match ? match[1] : description;
  return source
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && s.length < 40)
    .slice(0, 8);
};

/* Texto del perfil sin la línea de especialidades/tarifa */
export const cleanDescription = (entity = {}) =>
  String(entity.description || '')
    .split('\n')
    .filter((line) => !/^\s*(Especialidades|Tarifa base):/i.test(line))
    .join('\n')
    .trim();

/* ── Días de la semana en el formato que exige el backend (ENUM) ── */
export const WEEK_DAYS = [
  { key: 'Monday', label: 'Lunes' },
  { key: 'Tuesday', label: 'Martes' },
  { key: 'Wednesday', label: 'Miércoles' },
  { key: 'Thursday', label: 'Jueves' },
  { key: 'Friday', label: 'Viernes' },
  { key: 'Saturday', label: 'Sábado' },
  { key: 'Sunday', label: 'Domingo' },
];
