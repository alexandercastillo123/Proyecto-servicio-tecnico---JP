import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ShieldCheck, AlertCircle, Check, X } from 'lucide-react';
import { culqiService } from '../../services/api';
import toast from 'react-hot-toast';

/**
 * Pago con tarjeta vía Culqi.
 * El token se genera en el navegador contra secure.culqi.com (igual que en la app
 * Android) y luego se envía al backend, que realiza el charge con su llave privada.
 */
const CulqiPaymentModal = ({ open, onClose, amount, type, entityId, onSuccess }) => {
  const [publicKey, setPublicKey] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiry, setExpiry] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    culqiService.getPublicKey()
      .then((res) => setPublicKey(res.data?.resultado?.publicKey || null))
      .catch(() => setError('No se pudo obtener la clave pública de Culqi'));

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.email) setEmail(user.email);
    if (user?.names) setName(`${user.names} ${user.surnames || ''}`.trim());
  }, [open]);

  if (!open) return null;

  const formatCardNumber = (value) =>
    value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const tokenizeCard = async () => {
    const rawNumber = cardNumber.replace(/\s/g, '');
    const [month, year] = expiry.split('/');
    if (!rawNumber || rawNumber.length < 13) throw new Error('Número de tarjeta inválido');
    if (!cvv || cvv.length < 3) throw new Error('CVV inválido');
    if (!month || !year) throw new Error('Fecha de expiración inválida');
    if (!email.includes('@')) throw new Error('Correo inválido');

    const response = await fetch('https://secure.culqi.com/v2/tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${publicKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card_number: rawNumber,
        cvv: cvv.trim(),
        expiration_month: month.trim(),
        expiration_year: `20${year.trim()}`,
        email: email.trim(),
      }),
    });
    const data = await response.json();
    if (data.object === 'token') return data.id;
    throw new Error(data.user_message || 'Error al tokenizar la tarjeta');
  };

  const handlePay = async () => {
    setProcessing(true);
    setError('');
    try {
      if (!publicKey) throw new Error('Culqi no está disponible en este momento');
      const token = await tokenizeCard();

      const res = type === 'appointment'
        ? await culqiService.payAppointment(entityId, token)
        : await culqiService.payOrder(entityId, token);

      if (res.data?.exito) {
        toast.success('¡Pago exitoso! El pago fue confirmado automáticamente.');
        onSuccess?.();
        onClose?.();
      } else {
        throw new Error(res.data?.mensaje || 'No se pudo completar el pago');
      }
    } catch (err) {
      console.error('Culqi payment error:', err);
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0e1424] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Pagar con tarjeta</h3>
              <p className="text-[11px] text-slate-400">Procesado por Culqi (modo prueba)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="px-7 pb-7 space-y-4">
          <div className="rounded-2xl bg-blue-600/10 border border-blue-500/25 px-5 py-3.5 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Total a pagar</span>
            <span className="text-xl font-black text-blue-400">S/. {Number(amount || 0).toFixed(2)}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Número de tarjeta</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="4111 1111 1111 1111"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vencimiento</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM/AA"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">CVV</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Correo para el recibo</label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nombre en la tarjeta</label>
            <input
              type="text"
              placeholder="NOMBRE APELLIDO"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-300">{error}</p>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/25 transition-all"
          >
            {processing ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Procesando pago...
              </>
            ) : (
              <>
                <Lock size={15} />
                Pagar S/. {Number(amount || 0).toFixed(2)}
              </>
            )}
          </button>

          <p className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <ShieldCheck size={13} className="text-emerald-400" />
            Pago seguro · No almacenamos tu tarjeta
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CulqiPaymentModal;
