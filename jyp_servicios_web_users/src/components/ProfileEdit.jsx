import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Save, Camera,
  Lock, Eye, EyeOff, CheckCircle, Cpu, Shield, Wrench, Star,
  AlertCircle, ChevronRight, Store, Upload, Sparkles, Activity
} from "lucide-react";
import { authService, storeService } from "../services/api";
import { mediaUrl } from "../services/formatters";
import toast from "react-hot-toast";

const InputField = ({ label, name, type = "text", placeholder, value, onChange, icon: Icon, disabled = false }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-2xl py-3 pr-4 text-xs bg-[#0c1424] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
        style={{ paddingLeft: Icon ? 42 : 16, opacity: disabled ? 0.6 : 1 }}
      />
    </div>
  </div>
);

const SPECIALTIES_TAG = "Especialidades:";
const RATE_TAG = "Tarifa base:";

export const buildDescription = (formData) => {
  const bio = (formData.bio || formData.description || "").trim();
  const specs = (formData.specialties || "").trim();
  const rate = (formData.hourly_rate || "").toString().trim();
  const extras = [];
  if (specs) extras.push(`${SPECIALTIES_TAG} ${specs}`);
  if (rate) extras.push(`${RATE_TAG} S/ ${rate}`);
  if (!extras.length) return bio;
  return bio ? `${bio}\n\n${extras.join("\n")}` : extras.join("\n");
};

export const parseDescription = (description = "") => {
  const text = String(description || "");
  const lines = text.split("\n");
  const clean = [];
  let specialties = "";
  let hourly_rate = "";
  lines.forEach((line) => {
    const t = line.trim();
    if (t.startsWith(SPECIALTIES_TAG)) {
      specialties = t.slice(SPECIALTIES_TAG.length).trim();
    } else if (t.startsWith(RATE_TAG)) {
      hourly_rate = t.slice(RATE_TAG.length).replace("S/", "").trim();
    } else {
      clean.push(line);
    }
  });
  return { bio: clean.join("\n").trim(), specialties, hourly_rate };
};

const ProfileEdit = () => {
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [tab, setTab] = useState("info");
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
    authService
      .getProfile()
      .then((res) => {
        if (res.data?.exito && res.data?.resultado) {
          const u = res.data.resultado;
          const parsed = parseDescription(u.description || "");
          const merged = { ...user, ...u };
          setUser(merged);
          localStorage.setItem("user", JSON.stringify(merged));
          setFormData((prev) => ({
            ...prev,
            names: u.names || prev.names,
            surnames: u.surnames || prev.surnames,
            email: u.email || prev.email,
            phone: u.phone || prev.phone,
            city: u.city || prev.city,
            bio: parsed.bio || prev.bio,
            specialties: parsed.specialties || prev.specialties,
            hourly_rate: parsed.hourly_rate || prev.hourly_rate,
            address: u.address || prev.address,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    const toastId = toast.loading("Transmitiendo foto de perfil...");
    try {
      const res = await authService.uploadProfilePhoto(data);
      if (res.data?.exito || res.data?.resultado?.imageUrl) {
        const newUrl = res.data?.resultado?.imageUrl || URL.createObjectURL(file);
        const updated = { ...user, profile_image_url: newUrl };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        window.dispatchEvent(new CustomEvent("jyp:user-updated", { detail: updated }));
        toast.success("Foto de perfil actualizada", { id: toastId });
      } else {
        toast.error(res.data?.mensaje || "Error al subir foto", { id: toastId });
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error(err.response?.data?.mensaje || "No se pudo subir la foto de perfil", { id: toastId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        names: formData.names?.trim(),
        surnames: formData.surnames?.trim(),
        city: formData.city?.trim(),
        address: formData.address?.trim(),
        description: buildDescription(formData),
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
        const updated = {
          ...user,
          ...formData,
          description: payload.description,
          profile_image_url: user.profile_image_url,
        };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        window.dispatchEvent(new CustomEvent("jyp:user-updated", { detail: updated }));
        setSaved(true);
        toast.success("Perfil actualizado con éxito");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(res.data?.mensaje || "Error al actualizar perfil");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      const msg =
        err.response?.data?.resultado?.[0]?.mensaje ||
        err.response?.data?.mensaje ||
        "Error al actualizar el perfil";
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
      toast.error("Las contraseñas no coinciden");
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
    { id: "security", label: "Seguridad & Cifrado", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] p-8 border border-white/10 bg-gradient-to-br from-[#0c1322] via-[#080d17] to-[#0a1829] shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25">
            <Activity size={13} className="text-cyan-400" />
            <span>Centro de Identidad Digital</span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Mi Perfil de Usuario
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Administra tus credenciales, datos de facturación, cobertura geográfica y parámetros de cuenta.
          </p>
        </div>
      </div>

      {/* Profile HUD Card */}
      <div className="rounded-[32px] border border-white/10 bg-[#0a101b]/95 p-8 flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center text-white text-3xl font-black overflow-hidden relative shadow-2xl border-4 border-[#0c1424]"
            style={{
              background: user.profile_image_url ? "transparent" : "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
            }}
          >
            {user.profile_image_url ? (
              <img
                src={mediaUrl(user.profile_image_url)}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <span>{user.names?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}</span>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={uploadingPhoto}
            title="Cambiar foto de perfil"
            className="absolute -bottom-1 -right-1 w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 bg-cyan-500 text-slate-950 font-bold border-2 border-[#0a101b]"
          >
            <Camera size={16} />
          </button>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <h2
              className="text-2xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {user.names || user.username || "Usuario"} {user.surnames || ""}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-cyan-400 border border-white/5">
              ID #{user.id || user.userId || "001"}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">{user.email}</p>

          <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start items-center">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-cyan-400 border border-blue-500/25">
              {user.role === "client" ? "Cliente Certificado" : user.role === "tech" ? "Técnico Especialista" : "Sucursal / Tienda"}
            </span>
            {user.role === "tech" && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {user.is_available === 1 ? "Disponible para asignaciones" : "En línea"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((t) => {
          const isSel = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSel
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                  : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <t.icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal Info */}
      {tab === "info" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="p-8 sm:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/95 shadow-xl space-y-6"
        >
          <div>
            <h3
              className="text-lg font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Información de la Cuenta
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Datos personales y de contacto para coordinación técnica y logística.
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

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="jyp-btn-primary py-3.5 px-8 text-xs uppercase font-black tracking-wider rounded-2xl flex items-center gap-2 shadow-xl shadow-blue-600/30"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Transmitiendo...</span>
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={16} />
                  <span>Sincronizado</span>
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

      {/* Tab 2: Tech Profile */}
      {tab === "tech" && user.role === "tech" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="p-8 sm:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/95 shadow-xl space-y-6"
        >
          <div>
            <h3
              className="text-lg font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Perfil Profesional del Especialista
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Esta información será consultada por los clientes al momento de agendar visitas técnicas.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Biografía y Experiencia Certificada
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe tus especialidades, certificaciones y años en soporte de microelectrónica..."
              rows={4}
              className="w-full rounded-2xl p-4 text-xs bg-[#0c1424] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Especialidades (separadas por coma)" name="specialties" placeholder="Laptops, Microelectrónica, Redes..." value={formData.specialties} onChange={handleChange} icon={Wrench} />
            <InputField label="Tarifa Base Estimada (S/.)" name="hourly_rate" type="number" placeholder="40" value={formData.hourly_rate} onChange={handleChange} />
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="jyp-btn-primary py-3.5 px-8 text-xs uppercase font-black tracking-wider rounded-2xl flex items-center gap-2"
            >
              <Save size={16} />
              <span>{saving ? "Guardando..." : "Guardar Perfil Técnico"}</span>
            </button>
          </div>
        </motion.form>
      )}

      {/* Tab 3: Store Info */}
      {tab === "store" && user.role === "store" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="p-8 sm:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/95 shadow-xl space-y-6"
        >
          <div>
            <h3
              className="text-lg font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Información de la Sucursal
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configura los detalles de atención presencial y despacho de componentes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nombre de Sucursal" name="names" placeholder="JyP Centro" value={formData.names} onChange={handleChange} icon={Store} />
            <InputField label="Teléfono de Atención" name="phone" placeholder="987654321" value={formData.phone} onChange={handleChange} icon={Phone} />
            <InputField label="Ciudad" name="city" placeholder="Lima" value={formData.city} onChange={handleChange} icon={MapPin} />
            <InputField label="Dirección Comercial" name="address" placeholder="Av. Principal 123" value={formData.address} onChange={handleChange} icon={MapPin} />
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving}
              className="jyp-btn-primary py-3.5 px-8 text-xs uppercase font-black tracking-wider rounded-2xl flex items-center gap-2"
            >
              <Save size={16} />
              <span>{saving ? "Guardando..." : "Guardar Datos de Tienda"}</span>
            </button>
          </div>
        </motion.form>
      )}

      {/* Tab 4: Security */}
      {tab === "security" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleChangePassword}
          className="p-8 sm:p-10 rounded-[32px] border border-white/10 bg-[#0a101b]/95 shadow-xl space-y-6"
        >
          <div>
            <h3
              className="text-lg font-black text-white tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Cifrado & Contraseña de Acceso
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa una nueva contraseña segura para proteger tus registros y transacciones.
            </p>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                <input
                  type={showPass.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, new: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-2xl py-3 pl-11 pr-11 text-xs bg-[#0c1424] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((prev) => ({ ...prev, new: !prev.new }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                <input
                  type={showPass.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Repite la nueva contraseña"
                  className="w-full rounded-2xl py-3 pl-11 pr-11 text-xs bg-[#0c1424] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={saving || !passwords.new}
              className="jyp-btn-primary py-3.5 px-8 text-xs uppercase font-black tracking-wider rounded-2xl flex items-center gap-2 disabled:opacity-40"
            >
              <Shield size={16} />
              <span>{saving ? "Actualizando..." : "Cambiar Contraseña"}</span>
            </button>
          </div>
        </motion.form>
      )}
    </div>
  );
};

export default ProfileEdit;
