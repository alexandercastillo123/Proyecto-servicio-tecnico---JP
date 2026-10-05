import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Save, Camera,
  Lock, Eye, EyeOff, CheckCircle, Cpu, Shield, Wrench, Star,
  AlertCircle, ChevronRight
} from "lucide-react";
import { authService, techService } from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

const ProfileEdit = () => {
  const { isDark } = useTheme();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("info"); // info | security | schedule
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [formData, setFormData] = useState({
    names: user.names || "",
    surnames: user.surnames || "",
    email: user.email || "",
    phone: user.phone || "",
    city: user.city || "",
    bio: user.bio || "",
    specialties: user.specialties || "",
    hourly_rate: user.hourly_rate || "",
  });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile(formData);
      if (res.data.exito) {
        const updated = { ...user, ...formData };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setSaved(true);
        toast.success("Perfil actualizado correctamente");
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: passwords.current, newPassword: passwords.new });
      toast.success("Contraseña cambiada correctamente");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.mensaje || "Error al cambiar contraseña");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "info", label: "Información Personal", icon: User },
    ...(user.role === "tech" ? [{ id: "tech", label: "Perfil Técnico", icon: Wrench }] : []),
    { id: "security", label: "Seguridad", icon: Shield },
  ];

  const InputField = ({ label, name, type = "text", placeholder, value, onChange, icon: Icon }) => (
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
          value={value}
          onChange={onChange}
          className="input-field"
          style={{ paddingLeft: Icon ? 40 : 16 }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-6" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--primary)", marginBottom: 4 }}>
          Configuración
        </p>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Mi Perfil
        </h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card flex flex-col sm:flex-row items-center gap-5"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
          >
            {user.names?.[0]?.toUpperCase() || "U"}
          </div>
          <button
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--primary)", border: "2px solid var(--bg)", color: "white" }}
          >
            <Camera size={13} />
          </button>
        </div>
        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
            {user.names || "Usuario"} {user.surnames || ""}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{user.email}</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
            <span className={`status-badge ${user.role === "client" ? "status-confirmed" : user.role === "tech" ? "status-in_progress" : "status-completed"}`}>
              {user.role === "client" ? "Cliente" : user.role === "tech" ? "Técnico" : "Tienda"}
            </span>
            {user.is_available === 1 && (
              <span className="status-badge status-completed">Disponible</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all"
            style={{
              background: tab === t.id ? "var(--primary)" : "var(--bg-input)",
              color: tab === t.id ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${tab === t.id ? "var(--primary)" : "var(--border)"}`,
              boxShadow: tab === t.id ? "var(--shadow-primary)" : "none",
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="card space-y-5"
        >
          <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Información Personal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Nombres" name="names" placeholder="Tus nombres" value={formData.names} onChange={handleChange} icon={User} />
            <InputField label="Apellidos" name="surnames" placeholder="Tus apellidos" value={formData.surnames} onChange={handleChange} icon={User} />
            <InputField label="Correo Electrónico" name="email" type="email" placeholder="correo@ejemplo.com" value={formData.email} onChange={handleChange} icon={Mail} />
            <InputField label="Teléfono" name="phone" placeholder="+51 999 999 999" value={formData.phone} onChange={handleChange} icon={Phone} />
            <InputField label="Ciudad" name="city" placeholder="Lima" value={formData.city} onChange={handleChange} icon={MapPin} />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ marginLeft: "auto", display: "flex" }}
          >
            {saving ? <div className="spinner" /> : saved ? <><CheckCircle size={16} /> Guardado</> : <><Save size={16} /> Guardar Cambios</>}
          </button>
        </motion.form>
      )}

      {/* Tech Profile Tab */}
      {tab === "tech" && user.role === "tech" && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="card space-y-5"
        >
          <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Perfil Profesional
          </h3>
          <div className="space-y-1.5">
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
              Biografía / Descripción
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe tu experiencia y especialidades..."
              rows={4}
              className="input-field"
              style={{ height: "auto", padding: "12px 16px", resize: "vertical", lineHeight: 1.6 }}
            />
          </div>
          <InputField label="Especialidades (separadas por coma)" name="specialties" placeholder="Hardware, Redes, Laptops..." value={formData.specialties} onChange={handleChange} icon={Wrench} />
          <InputField label="Tarifa por Hora (S/.)" name="hourly_rate" type="number" placeholder="35" value={formData.hourly_rate} onChange={handleChange} />
          <button type="submit" disabled={saving} className="btn-primary" style={{ marginLeft: "auto", display: "flex" }}>
            {saving ? <div className="spinner" /> : <><Save size={16} /> Guardar Perfil</>}
          </button>
        </motion.form>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleChangePassword}
          className="card space-y-5"
        >
          <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Cambiar Contraseña
          </h3>
          {[
            { id: "current", label: "Contraseña Actual" },
            { id: "new", label: "Nueva Contraseña" },
            { id: "confirm", label: "Confirmar Nueva Contraseña" },
          ].map(f => (
            <div key={f.id} className="space-y-1.5">
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                {f.label}
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)", pointerEvents: "none" }} />
                <input
                  type={showPass[f.id] ? "text" : "password"}
                  name={f.id}
                  value={passwords[f.id]}
                  onChange={e => setPasswords(prev => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: 40, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPass[f.id] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={saving} className="btn-primary" style={{ marginLeft: "auto", display: "flex" }}>
            {saving ? <div className="spinner" /> : <><Shield size={16} /> Actualizar Contraseña</>}
          </button>
        </motion.form>
      )}
    </div>
  );
};

export default ProfileEdit;
