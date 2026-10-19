import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /* El backend (POST /auth/change-password) solo valida `newPassword` con mínimo
     6 caracteres; no solicita la contraseña actual. */
  const validate = () => {
    if (newPassword.length < 6) return 'La nueva contraseña debe tener al menos 6 caracteres';
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.changePassword({ newPassword });
      if (res.data?.exito) {
        setSuccess(true);
        toast.success('Contraseña actualizada correctamente');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.data?.mensaje || 'No se pudo actualizar la contraseña');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.mensaje || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={15} />
        Volver
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] border border-white/10 bg-[#0e1424] p-7 sm:p-9 space-y-6 shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
            <KeyRound size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Cambiar contraseña</h1>
            <p className="text-xs text-slate-400 mt-0.5">Mantén tu cuenta protegida con una contraseña sólida.</p>
          </div>
        </div>

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-emerald-300">
              Tu contraseña fue actualizada. Úsala la próxima vez que inicies sesión.
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Nueva contraseña', value: newPassword, set: setNewPassword, placeholder: 'Mínimo 6 caracteres' },
            { label: 'Confirmar nueva contraseña', value: confirmPassword, set: setConfirmPassword, placeholder: 'Repite la nueva contraseña' },
          ].map((field) => (
            <div key={field.label} className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">{field.label}</label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  className="w-full rounded-2xl px-4 py-3 pr-12 text-sm outline-none border border-white/10 bg-white/5 text-white placeholder-slate-600 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Mostrar contraseña"
                >
                  {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/25 transition-all"
          >
            <ShieldCheck size={16} />
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ChangePassword;
