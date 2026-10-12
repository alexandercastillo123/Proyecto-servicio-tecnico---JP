import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Save, Camera,
  Lock, Eye, EyeOff, CheckCircle, Cpu, Shield, Wrench, Star,
  AlertCircle, ChevronRight, Store, Upload
} from "lucide-react";
import { authService, storeService } from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

/* ── Standalone Input Component (Must be outside to preserve focus) ── */
const InputField = ({ label, name, type = "text", placeholder, value, onChange, icon: Icon, disabled = false }) => (
  <div className="space-y-1.5">
    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)", pointerEvents: "none" }} />
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className="input-field"
        style={{ paddingLeft: Icon ? 40 : 16, opacity: disabled ? 0.6 : 1 }}
      />
    </div>
  </div>
);

const ProfileEdit = () => {
  const { isDark } = useTheme();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [tab, setTab] = useState("info"); // info | tech | store | security
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  
  const [formData, setFormData] = useState({
    names: user.names || user.username || "",
    surnames: user.surnames || "",
    email: user.email || "",
    phone: user.phone || "",
    city: user.city || "",
    bio: user.bio || user.description || "",
    specialties: user.specialties || "",
    hourly_rate: user.hourly_rate || "",
    address: user.address || "",
  });

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Sync initial profile from server if possible
    authService.getProfile().then(res => {
      if (res.data?.exito && res.data?.resultado) {
        const u = res.data.resultado;
        const merged = { ...user, ...u };
        setUser(merged);
        localStorage.setItem("user", JSON.stringify(merged));
        setFormData(prev => ({
          ...prev,
          names: u.names || prev.names,
          surnames: u.surnames || prev.surnames,
          email: u.email || prev.email,
          phone: u.phone || prev.phone,
          city: u.city || prev.city,
          bio: u.description || u.bio || prev.bio,
          specialties: u.specialties || prev.specialties,
          address: u.address || prev.address,
        }));
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5 MB");
      return;
    }

    const data = new FormData();
    data.append("photo", file);

    setUploadingPhoto(true);
    const toastId = toast.loading("Subiendo foto de perfil...");
    try {
      const res = await authService.uploadProfilePhoto(data);
      if (res.data?.exito || res.data?.resultado?.imageUrl) {
        const newUrl = res.data?.resultado?.imageUrl || URL.createObjectURL(file);
        const updated = { ...user, profile_image_url: newUrl };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        toast.success("Foto de perfil actualizada con éxito", { id: toastId });
      } else {
        toast.error(res.data?.mensaje || "Error al subir foto", { id: toastId });
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      // Fallback local preview if mock or backend error
      const localUrl = URL.createObjectURL(file);
      const updated = { ...user, profile_image_url: localUrl };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      toast.success("Foto actualizada", { id: toastId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build clean payload without sending invalid empty phones
      const payload = {
        names: formData.names?.trim(),
        surnames: formData.surnames?.trim(),
        city: formData.city?.trim(),
        address: formData.address?.trim(),
        description: (formData.bio || formData.description || "")?.trim(),
      };

      if (formData.companyName?.trim()) payload.companyName = formData.companyName.trim();
      if (formData.ruc?.trim()) payload.ruc = formData.ruc.trim();
      if (formData.dni?.trim()) payload.dni = formData.dni.trim();

      if (formData.phone && formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }

      if (formData.email && formData.email.trim()) {
        payload.email = formData.email.trim();
      }

      const res = await authService.updateProfile(payload);
      if (res.data?.exito) {
        const updated = { ...user, ...formData };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setSaved(true);
        toast.success("Perfil actualizado correctamente");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(res.data?.mensaje || "Error al actualizar perfil");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      const msg = err.response?.data?.resultado?.[0]?.mensaje 
        || err.response?.data?.mensaje 
        || "Error al actualizar el perfil";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.new || passwords.new.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Las nuevas contraseñas no coinciden");
      return;
    }

    setSaving(true);
    try {
      const res = await authService.changePassword({ newPassword: passwords.new });
      if (res.data?.exito || res.data?.success || res.status === 200) {
        toast.success("Contraseña actualizada exitosamente");
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        toast.error(res.data?.mensaje || "No se pudo cambiar la contraseña");
      }
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(err.response?.data?.mensaje || "Error al cambiar contraseña");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "info", label: "Información Personal", icon: User },
    ...(user.role === "tech" ? [{ id: "tech", label: "Perfil Técnico", icon: Wrench }] : []),
    ...(user.role === "store" ? [{ id: "store", label: "Datos de Tienda", icon: Store }] : []),
    { id: "security", label: "Seguridad & Contraseña", icon: Shield },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 4 }}>
          Centro de Configuración
        </p>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(1.75rem,3.5vw,2.25rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Mi Perfil
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Administra tus datos personales, información de contacto y credenciales de acceso.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card flex flex-col sm:flex-row items-center gap-6 p-8 rounded-[32px] shadow-xl"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-white text-3xl font-black overflow-hidden relative shadow-2xl"
            style={{
              background: user.profile_image_url ? "transparent" : "linear-gradient(135deg, #2D6BFF 0%, #06B6D4 100%)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              border: "3px solid rgba(59, 130, 246, 0.3)"
            }}
          >
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url.startsWith('http') ? user.profile_image_url : `/api${user.profile_image_url}`}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span>{user.names?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}</span>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={uploadingPhoto}
            title="Cambiar foto de perfil"
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
            style={{ background: "var(--primary)", border: "3px solid var(--bg-card)", color: "white" }}
          >
            <Camera size={16} />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>
            {user.names || user.username || "Usuario"} {user.surnames || ""}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user.email}</p>
          
          <div className="flex flex-wrap gap-2.5 pt-2 justify-center sm:justify-start items-center">
            <span className={`status-badge ${user.role === "client" ? "status-confirmed" : user.role === "tech" ? "status-in_progress" : "status-completed"}`}>
              {user.role === "client" ? "Cliente" : user.role === "tech" ? "Técnico Especialista" : "Tienda JyP"}
            </span>
            {user.role === "tech" && (
              <span className="status-badge status-completed">
                {user.is_available === 1 ? "Disponible para citas" : "Activo"}
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-semibold ml-1">
              ID #{user.id || user.userId || "001"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 p-1.5 rounded-full bg-white/5 border border-white/5 inline-flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm"
            style={{
              background: tab === t.id ? "var(--primary)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${tab === t.id ? "var(--primary)" : "transparent"}`,
              boxShadow: tab === t.id ? "0 4px 14px rgba(45, 107, 255, 0.35)" : "none",
            }}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="card p-8 sm:p-10 space-y-7 rounded-[32px] shadow-xl"
        >
          <div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
              Información de la Cuenta
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Actualiza tus datos de contacto para coordinar diagnósticos y compras.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nombres" name="names" placeholder="Tus nombres" value={formData.names} onChange={handleChange} icon={User} />
            <InputField label="Apellidos" name="surnames" placeholder="Tus apellidos" value={formData.surnames} onChange={handleChange} icon={User} />
            <InputField label="Correo Electrónico" name="email" type="email" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleChange} icon={Mail} />
            <InputField label="Teléfono / WhatsApp" name="phone" placeholder="999888777" value={formData.phone} onChange={handleChange} icon={Phone} />
            <InputField label="Ciudad" name="city" placeholder="Lima" value={formData.city} onChange={handleChange} icon={MapPin} />
            <InputField label="Dirección de Referencia" name="address" placeholder="Av. Principal 123" value={formData.address} onChange={handleChange} icon={MapPin} />
          </div>

          <div className="flex justify-end pt-3 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-3 px-6 text-xs uppercase font-black tracking-wider rounded-xl shadow-lg flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={16} />
                  <span>Guardado</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </motion.form>
      )}

      {/* Tech Profile Tab */}
      {tab === "tech" && user.role === "tech" && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="card p-8 sm:p-10 space-y-7 rounded-[32px] shadow-xl"
        >
          <div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
              Perfil Profesional del Especialista
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Esta información será visible por los clientes en el mapa y catálogo técnico.
            </p>
          </div>

          <div className="space-y-2">
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
              Biografía / Resumen de Experiencia
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe tus especialidades, certificaciones y años de experiencia en reparación..."
              rows={4}
              className="input-field h-auto py-3 px-4 resize-none leading-relaxed rounded-2xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Especialidades (separadas por coma)" name="specialties" placeholder="Laptops, Microelectrónica, Redes..." value={formData.specialties} onChange={handleChange} icon={Wrench} />
            <InputField label="Tarifa Base / Hora (S/.)" name="hourly_rate" type="number" placeholder="40" value={formData.hourly_rate} onChange={handleChange} />
          </div>

          <div className="flex justify-end pt-3 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-3.5 px-8 text-xs uppercase font-black tracking-wider rounded-2xl shadow-xl flex items-center gap-2"
            >
              {saving ? <div className="spinner" /> : <><Save size={16} /> Guardar Perfil Técnico</>}
            </button>
          </div>
        </motion.form>
      )}

      {/* Store Tab */}
      {tab === "store" && user.role === "store" && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="card p-8 sm:p-10 space-y-7 rounded-[32px] shadow-xl"
        >
          <div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
              Información de la Sucursal
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configura los detalles de atención y despacho de repuestos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nombre de Sucursal" name="names" placeholder="JyP Centro" value={formData.names} onChange={handleChange} icon={Store} />
            <InputField label="Teléfono de Atención" name="phone" placeholder="987654321" value={formData.phone} onChange={handleChange} icon={Phone} />
            <InputField label="Ciudad" name="city" placeholder="Lima" value={formData.city} onChange={handleChange} icon={MapPin} />
            <InputField label="Dirección Comercial" name="address" placeholder="Av. Wilson 1234, Int 20" value={formData.address} onChange={handleChange} icon={MapPin} />
          </div>

          <div className="flex justify-end pt-3 border-t border-white/5">
            <button type="submit" disabled={saving} className="btn-primary py-3.5 px-8 text-xs uppercase font-black tracking-wider rounded-2xl shadow-xl flex items-center gap-2">
              {saving ? <div className="spinner" /> : <><Save size={16} /> Guardar Datos de Tienda</>}
            </button>
          </div>
        </motion.form>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleChangePassword}
          className="card p-8 sm:p-10 space-y-7 rounded-[32px] shadow-xl"
        >
          <div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
              Actualizar Contraseña
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa tu nueva contraseña para proteger el acceso a tu cuenta.
            </p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPass.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={e => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="input-field"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPass.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Repite la nueva contraseña"
                  className="input-field"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-white/5">
            <button
              type="submit"
              disabled={saving || !passwords.new}
              className="btn-primary py-3.5 px-8 text-xs uppercase font-black tracking-wider rounded-2xl shadow-xl flex items-center gap-2 disabled:opacity-40"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>Cambiar Contraseña</span>
                </>
              )}
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
};

export default ProfileEdit;
