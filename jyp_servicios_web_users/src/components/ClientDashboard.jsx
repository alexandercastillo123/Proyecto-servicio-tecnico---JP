import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Star, Calendar, ArrowRight, ShieldCheck, 
  Store, MessageSquare, Target, Clock,
  Cpu, Monitor, Server, Wrench, HardDrive, Sparkles,
  CheckCircle2, Package, ArrowUpRight, ChevronRight, X, Phone
} from 'lucide-react';
import { clientService, messageService, storeService } from '../services/api';
import LocationPicker from './LocationPicker';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { TechLoader } from './common/TechLoader';

const SERVICE_CATEGORIES = [
  { id: 'all', label: 'Todos los Servicios', icon: Sparkles },
  { id: 'pc', label: 'Laptops & PCs', icon: Monitor },
  { id: 'electronics', label: 'Microelectrónica', icon: Cpu },
  { id: 'servers', label: 'Servidores & Redes', icon: Server },
  { id: 'storage', label: 'Recuperación de Datos', icon: HardDrive },
  { id: 'maintenance', label: 'Mantenimiento Preventivo', icon: Wrench },
];

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [featuredTechs, setFeaturedTechs] = useState([]);
  const [featuredStores, setFeaturedStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('user_location');
    return saved ? JSON.parse(saved) : { 
      address: 'Lima Centro, Perú',
      lat: -12.046374, 
      lng: -77.042793 
    };
  });

  useEffect(() => {
    fetchDashboardData();
    if (userLocation.lat === -12.046374 && userLocation.lng === -77.042793) {
      detectLocation();
    }
  }, []);

  useEffect(() => {
    if (!socketService) return;

    const unsubApptProgress = socketService.on('appointment_progress', () => {
      fetchDashboardData();
    });

    const unsubApptCreated = socketService.on('appointment_created', () => {
      fetchDashboardData();
    });

    const unsubMsg = socketService.on('receive_message', () => {
      messageService.getConversations().then(r => {
        if (r.data?.exito) setConversations(r.data.resultado || []);
      }).catch(() => {});
    });

    return () => {
      unsubApptProgress();
      unsubApptCreated();
      unsubMsg();
    };
  }, [socketService]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Ubicación Detectada (GPS)'
          };
          updateLocation(newLoc);
          reverseGeocode(newLoc.lat, newLoc.lng);
        },
        () => console.log('Geolocation auto-detect failed'),
        { enableHighAccuracy: true }
      );
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        const shortAddr = data.display_name.split(',').slice(0, 2).join(',');
        const newLoc = { lat, lng, address: shortAddr || data.display_name };
        updateLocation(newLoc);
      }
    } catch (e) {}
  };

  const updateLocation = (loc) => {
    setUserLocation(loc);
    localStorage.setItem('user_location', JSON.stringify(loc));
    fetchNearbyData(loc);
  };

  const fetchNearbyData = async (loc = userLocation) => {
    try {
      const [techsResp, storesResp] = await Promise.all([
        clientService.getNearbyTechnicians({ lat: loc.lat, lng: loc.lng, radius: 25 }).catch(() => ({ data: {} })),
        storeService.getNearbyBranches({ lat: loc.lat, lng: loc.lng, radius: 25 }).catch(() => ({ data: {} }))
      ]);

      let techs = techsResp.data?.resultado || [];
      // Si el filtro de proximidad por radio devuelve vacío (ej. técnicos sin coordenadas exactas),
      // cargamos los técnicos verificados de la plataforma para no dejar la vista vacía
      if (techs.length === 0) {
        const allTechs = await clientService.getTechnicians({ limit: 12 }).catch(() => ({ data: {} }));
        if (allTechs.data?.exito) {
          techs = allTechs.data.resultado || [];
        }
      }
      setFeaturedTechs(techs);

      let stores = storesResp.data?.resultado || [];
      if (stores.length === 0) {
        const allStores = await storeService.getBranches().catch(() => ({ data: {} }));
        if (allStores.data?.exito) {
          stores = allStores.data.resultado || [];
        }
      }
      setFeaturedStores(stores);
    } catch (e) {
      console.error('Error fetching nearby items:', e);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [convsResp, apptsResp] = await Promise.all([
        messageService.getConversations().catch(() => ({ data: {} })),
        clientService.getMyAppointments().catch(() => ({ data: {} })),
      ]);
      
      if (convsResp.data?.exito) {
        setConversations(convsResp.data.resultado || []);
      }
      if (apptsResp.data?.exito) {
        const appts = apptsResp.data.resultado || [];
        const active = appts.find(a => 
          ['confirmed', 'paid', 'in_progress', 'on_the_way'].includes(a.status)
        );
        setActiveAppointment(active);
      }

      await fetchNearbyData(userLocation);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado de especialistas destacados por especialidad seleccionada
  const displayedTechs = featuredTechs.filter(tech => {
    if (selectedCategory === 'all') return true;
    const specialties = (tech.specialties || tech.description || '').toLowerCase();
    if (selectedCategory === 'pc') return specialties.includes('laptop') || specialties.includes('pc') || specialties.includes('computadora') || specialties.includes('hardware');
    if (selectedCategory === 'electronics') return specialties.includes('electronica') || specialties.includes('placa') || specialties.includes('chip') || specialties.includes('micro');
    if (selectedCategory === 'servers') return specialties.includes('servidor') || specialties.includes('red') || specialties.includes('cisco');
    if (selectedCategory === 'storage') return specialties.includes('disco') || specialties.includes('dato') || specialties.includes('almacenamiento') || specialties.includes('ssd');
    if (selectedCategory === 'maintenance') return specialties.includes('mantenimiento') || specialties.includes('limpieza') || specialties.includes('pasta');
    return true;
  });

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <TechLoader 
          title="Iniciando Plataforma JyP" 
          subtitle="Sincronizando especialistas y servicios verificados..." 
        />
      </div>
    );
  }

  const clientFirstName = user?.names?.split(' ')[0] || user?.username || 'Cliente';

  return (
    <div className="jyp-page">
      
      {/* ── 1. HERO INSTITUCIONAL (Look & Feel Idéntico al Login) ── */}
      <section className="jyp-hero-card">
        <div className="jyp-hero-glow-1" />
        <div className="jyp-hero-glow-2" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Fila superior: Ubicación activa + Garantía escrita */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="jyp-eyebrow hover:border-blue-400 cursor-pointer transition-all"
            >
              <span className="jyp-status-dot" />
              <span>{userLocation.address.split(',')[0]}</span>
              <span className="text-[10px] text-blue-300 font-extrabold uppercase underline ml-1">Cambiar</span>
            </button>

            <div className="jyp-badge-success">
              <ShieldCheck size={14} />
              <span>Garantía Escrita JyP 7 Días</span>
            </div>
          </div>

          {/* Saludo y descripción */}
          <div className="max-w-3xl space-y-3">
            <h1 className="jyp-hero-title">
              Hola, <span className="jyp-gradient-text">{clientFirstName}</span> 👋
            </h1>
            <p className="jyp-hero-desc">
              Bienvenido al centro de servicios. Conectamos tu requerimiento de reparación de computadoras, 
              laptops y servidores con técnicos verificados y garantía directa en Lima Metropolitana.
            </p>
          </div>

          {/* Botones de acción institucional (Balanceados, elegantes, sin bloques gigantes) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate('/appointments/schedule')}
              className="jyp-btn-primary"
            >
              <Calendar size={16} />
              <span>Agendar Reparación</span>
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/technicians')}
              className="jyp-btn-cyan"
            >
              <MapPin size={16} />
              <span>Explorar Técnicos en Mapa</span>
            </button>

            <Link
              to="/stores"
              className="jyp-btn-ghost"
            >
              <Store size={16} />
              <span>Ver Tiendas & Talleres</span>
            </Link>
          </div>

          {/* Barra de Especialidades Técnicas (Pills limpias) */}
          <div className="pt-5 border-t border-slate-700/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-cyan-400" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Especialidades Técnicas Disponibles
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {SERVICE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`jyp-pill ${isSelected ? 'is-active' : ''}`}
                  >
                    <Icon size={14} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SERVICIO ACTIVO (SI EXISTE CITA EN PROGRESO) ── */}
      {activeAppointment && (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="jyp-card border-blue-500/40"
          style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shrink-0">
                <Clock size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
                    Servicio Activo en Progreso
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h3 className="text-lg font-extrabold text-white font-heading mt-0.5">
                  {activeAppointment.serviceType || activeAppointment.service_type || 'Mantenimiento Especializado'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Especialista: <span className="text-white font-bold">{activeAppointment.techName || activeAppointment.tech_name || 'Técnico JyP'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                type="button"
                onClick={() => navigate(`/appointments/${activeAppointment.id}`)}
                className="jyp-btn-ghost flex-1 sm:flex-none text-xs"
              >
                Ver Detalle & Ruta
              </button>
              <button 
                type="button"
                onClick={() => navigate(`/chat?user=${activeAppointment.techId || activeAppointment.technician_id}`)}
                className="jyp-btn-primary flex-1 sm:flex-none text-xs"
              >
                <MessageSquare size={14} />
                <span>Chat Directo</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── 3. RESUMEN DE INDICADORES / METRICAS (Estilo Login.css) ── */}
      <section className="jyp-stats-grid">
        <div className="jyp-stat-card">
          <div className="jyp-stat-icon" style={{ background: 'rgba(37, 99, 235, 0.14)', color: '#60a5fa', border: '1px solid rgba(37, 99, 235, 0.28)' }}>
            <ShieldCheck size={22} />
          </div>
          <div className="jyp-stat-body">
            <span className="jyp-stat-label">Garantía Escrita</span>
            <span className="jyp-stat-value">7 Días</span>
            <span className="jyp-stat-sublabel">100% Cobertura técnica</span>
          </div>
        </div>

        <div className="jyp-stat-card">
          <div className="jyp-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.14)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.28)' }}>
            <Wrench size={22} />
          </div>
          <div className="jyp-stat-body">
            <span className="jyp-stat-label">Especialistas</span>
            <span className="jyp-stat-value">{featuredTechs.length ? `${featuredTechs.length}+` : '15+'}</span>
            <span className="jyp-stat-sublabel">Técnicos verificados</span>
          </div>
        </div>

        <div className="jyp-stat-card">
          <div className="jyp-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.14)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.28)' }}>
            <Store size={22} />
          </div>
          <div className="jyp-stat-body">
            <span className="jyp-stat-label">Tiendas & Talleres</span>
            <span className="jyp-stat-value">{featuredStores.length ? `${featuredStores.length}` : '3'} Oficiales</span>
            <span className="jyp-stat-sublabel">Lima Centro y Wilson</span>
          </div>
        </div>

        <div className="jyp-stat-card">
          <div className="jyp-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.28)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="jyp-stat-body">
            <span className="jyp-stat-label">Satisfacción</span>
            <span className="jyp-stat-value">4.9 / 5.0 ★</span>
            <span className="jyp-stat-sublabel">Diagnósticos con éxito</span>
          </div>
        </div>
      </section>

      {/* ── 4. ESPECIALISTAS DESTACADOS ── */}
      <section className="jyp-section">
        <div className="jyp-section-header jyp-section-header-row">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="jyp-section-title">Especialistas Destacados</h2>
              <span className="jyp-eyebrow text-[10px] py-0.5 px-2.5">Certificados</span>
            </div>
            <p className="jyp-section-subtitle">
              Técnicos verificados con laboratorio, banco de pruebas y herramientas de diagnóstico.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/technicians')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Ver Mapa Completo</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {displayedTechs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedTechs.slice(0, 6).map((tech) => {
              const name = `${tech.names || ''} ${tech.surnames || ''}`.trim() || tech.company_name || tech.username || 'Especialista Técnico';
              const rating = tech.rating ? parseFloat(tech.rating).toFixed(1) : '5.0';
              const isAvailable = tech.is_available === 1 || tech.is_available === true || tech.is_available == null;
              const distanceKm = tech.distance_km ? `${parseFloat(tech.distance_km).toFixed(1)} km` : null;

              return (
                <div 
                  key={tech.id} 
                  className="jyp-card flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Avatar con inicial y estado de disponibilidad */}
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shrink-0 relative shadow-md"
                      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
                    >
                      {name[0]?.toUpperCase() || 'T'}
                      <span 
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900"
                        style={{
                          background: isAvailable ? '#10B981' : '#94A3B8',
                          boxShadow: isAvailable ? '0 0 8px #10B981' : 'none'
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-white truncate">{name}</h4>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0">
                          <Star size={11} fill="currentColor" />
                          <span className="text-[10px] font-black">{rating}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={11} className="text-blue-400" />
                          {tech.city || tech.address || 'Lima Centro'}
                        </span>
                        {distanceKm && (
                          <span className="text-[10px] font-bold text-cyan-400">· {distanceKm}</span>
                        )}
                      </div>

                      {/* Especialidades */}
                      {(tech.specialties || tech.description) && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {String(tech.specialties || tech.description).split(',').slice(0, 2).map((sp, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 truncate"
                            >
                              {sp.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => navigate(`/appointments/schedule?tech=${tech.id}`)}
                      className="jyp-btn-primary flex-1 py-2 px-3 text-xs"
                    >
                      <Calendar size={13} />
                      <span>Agendar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/technician/${tech.id}`)}
                      className="jyp-btn-ghost py-2 px-3 text-xs"
                    >
                      Perfil
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="jyp-empty-state">
            <div className="jyp-empty-icon">
              <Wrench size={24} />
            </div>
            <h4 className="jyp-empty-title">Sin especialistas en esta especialidad</h4>
            <p className="jyp-empty-text">
              No encontramos técnicos registrados específicamente bajo este filtro en este momento.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="jyp-btn-ghost mt-4 text-xs"
            >
              Ver todas las especialidades
            </button>
          </div>
        )}
      </section>

      {/* ── 5. TIENDAS & SUCURSALES OFICIALES (Estructura Equilibrada sin Vacíos) ── */}
      <section className="jyp-section">
        <div className="jyp-section-header jyp-section-header-row">
          <div>
            <h2 className="jyp-section-title">Tiendas & Talleres Oficiales</h2>
            <p className="jyp-section-subtitle">
              Centros autorizados para compras de repuestos, diagnósticos y recojo físico con garantía JyP.
            </p>
          </div>
          <Link
            to="/stores"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors self-start sm:self-auto"
          >
            <span>Ver Todas</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sucursales Físicas */}
          {featuredStores.slice(0, 1).map((st) => (
            <div 
              key={st.id}
              onClick={() => navigate(`/store/${st.id}`)}
              className="jyp-card hover:border-purple-500/40 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-500/30 text-purple-300 shrink-0">
                    <Store size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">
                      {st.name || 'Sucursal Central Wilson'}
                    </h4>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-purple-400" />
                      {st.address || 'Av. Wilson 456, Cercado de Lima'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Taller central de diagnóstico y punto oficial para adquisición de repuestos y recepción de equipos.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400 mt-4">
                <span>Horario: 9:00 AM - 7:00 PM</span>
                <span className="text-purple-400 font-bold flex items-center gap-1">
                  Ver Taller <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          ))}

          {/* Tarjeta Destacada: Tienda Virtual de Repuestos Oficiales */}
          <div className="jyp-card flex flex-col justify-between hover:border-blue-500/40">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Tienda de Repuestos</h4>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Originales Garantizados</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pantallas, baterías, cargadores, discos NVMe y componentes para laptops y computadoras.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 mt-4">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="jyp-btn-primary w-full text-xs py-2.5"
              >
                <Package size={14} />
                <span>Explorar Catálogo</span>
              </button>
            </div>
          </div>

          {/* Tarjeta Destacada: Diagnóstico y Laboratorio */}
          <div className="jyp-card flex flex-col justify-between hover:border-cyan-500/40">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shrink-0">
                  <Cpu size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Laboratorio JyP</h4>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Microelectrónica</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reballing de GPU, reparación de pistas en placas madre y recuperación forense de datos en laboratorio.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 mt-4">
              <button
                type="button"
                onClick={() => navigate('/appointments/schedule')}
                className="jyp-btn-cyan w-full text-xs py-2.5"
              >
                <Wrench size={14} />
                <span>Solicitar Diagnóstico</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODAL DE SELECCIÓN DE UBICACIÓN EN MAPA ── */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="jyp-modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="jyp-modal max-w-2xl"
            >
              <button 
                type="button"
                onClick={() => setShowLocationModal(false)} 
                className="jyp-modal-close"
              >
                <X size={18} />
              </button>

              <div className="jyp-modal-header">
                <div className="jyp-modal-icon">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="jyp-modal-title">Fijar Ubicación de Servicio</h3>
                  <p className="jyp-modal-subtitle">Ubica tu punto de referencia en el mapa interactivo.</p>
                </div>
              </div>
              
              <div className="rounded-2xl overflow-hidden border border-white/10 my-4">
                <LocationPicker 
                  onLocationSelect={(loc) => updateLocation(loc)}
                  initialLocation={{ lat: userLocation.lat, lng: userLocation.lng }}
                />
              </div>
              
              <button 
                type="button"
                onClick={() => setShowLocationModal(false)} 
                className="jyp-btn-primary w-full"
              >
                Confirmar y Actualizar Radar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientDashboard;
