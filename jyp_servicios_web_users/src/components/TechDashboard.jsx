import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, CheckCircle, Clock, AlertCircle, 
  DollarSign, TrendingUp, User, MapPin, Edit3,
  Power, Bell, ChevronRight, Zap, Target, Star
} from 'lucide-react';
import { techService } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const TechDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ totalEarnings: 0, completedJobs: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  // Mock data for the chart
  const data = [
    { name: 'Lun', earnings: 400 },
    { name: 'Mar', earnings: 300 },
    { name: 'Mie', earnings: 600 },
    { name: 'Jue', earnings: 800 },
    { name: 'Vie', earnings: 500 },
    { name: 'Sab', earnings: 900 },
    { name: 'Dom', earnings: 200 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const resp = await techService.getAppointments();
      if (resp.success) {
        setAppointments(resp.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-outfit pb-20">
      {/* Hero Header */}
      <section className="relative h-[300px] rounded-[40px] overflow-hidden flex items-end p-10 group">
        <img 
          src="/assets/hero_tech.png" 
          alt="Tech Hero" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-[#05060A]/40 to-transparent" />
        
        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
                Panel de <span className="gradient-text">Especialista</span>
              </h1>
              <p className="text-slate-300 text-lg">Gestiona tus servicios, ingresos y disponibilidad en un solo lugar.</p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl p-4 rounded-[28px] border border-white/10"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isAvailable ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              <Power size={24} />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado de Red</p>
              <p className={`font-black text-sm ${isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                {isAvailable ? 'ESTÁS EN LÍNEA' : 'FUERA DE LÍNEA'}
              </p>
            </div>
            <button 
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative w-14 h-8 rounded-full transition-colors ${isAvailable ? 'bg-[#3B28FF]' : 'bg-slate-700'}`}
            >
              <motion.div 
                animate={{ x: isAvailable ? 26 : 4 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
              />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Totales', val: '$2,450.00', icon: DollarSign, color: 'text-[#3B28FF]', bg: 'bg-[#3B28FF]/10' },
          { label: 'Trabajos Realizados', val: '48', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Rating Promedio', val: '4.95', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Citas Hoy', val: '5', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-8 group overflow-hidden relative"
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
              <stat.icon size={28} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white">{stat.val}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 glass-panel p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Rendimiento Semanal</h3>
              <p className="text-slate-500 text-sm">Resumen de tus ingresos netos este mes</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none">
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B28FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B28FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" axisLine={false} tickLine={false} tick={{fontSize: 12}} dy={10} />
                <YAxis stroke="#64748B" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="earnings" stroke="#3B28FF" strokeWidth={4} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Schedule */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8 text-white">
            <h3 className="text-xl font-black tracking-tight">Citas Próximas</h3>
            <button className="text-[#3B28FF] hover:bg-[#3B28FF]/10 p-2 rounded-xl transition-colors">
              <Calendar size={20} />
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
            {isLoading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)
            ) : appointments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-500">
                  <Clock size={32} />
                </div>
                <p className="text-slate-400 text-sm">No tienes citas programadas para hoy.</p>
              </div>
            ) : (
              appointments.map((appt) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={appt.id} 
                  className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all group pointer-events-auto cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#3B28FF] rounded-xl flex items-center justify-center text-white font-black text-sm">
                        {appt.clientName?.[0] || 'C'}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm tracking-tight">{appt.clientName || 'Cliente No Identificado'}</p>
                        <p className="text-xs text-slate-500">{appt.serviceType || 'Servicio General'}</p>
                      </div>
                    </div>
                    <span className="bg-[#3B28FF]/20 text-[#3B28FF] text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                      {appt.time || '10:00 AM'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={12} />
                      <span className="text-[10px] font-bold truncate max-w-[120px]">{appt.address || 'Ubicación remota'}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <button className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/5 transition-all text-sm">
            Ver Todo el Calendario
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechDashboard;
