import React, { useState, useMemo } from 'react';
import { 
  Laptop, 
  Monitor, 
  Apple, 
  Printer, 
  Wifi, 
  Camera, 
  HardDrive, 
  Calculator, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { DEVICE_OPTIONS, COMMON_PROBLEMS_BY_DEVICE, DISTRICTS_COVERAGE } from '../data/servicesData';
import { DeviceType } from '../types';

interface QuoteCalculatorProps {
  onSelectServiceForBooking: (data: { device: DeviceType; issue: string; district: string; mode: 'domicilio' | 'taller' }) => void;
}

export const QuoteCalculator: React.FC<QuoteCalculatorProps> = ({ onSelectServiceForBooking }) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('laptop');
  const [selectedIssueKey, setSelectedIssueKey] = useState<string>('mantenimiento');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Miraflores');
  const [serviceMode, setServiceMode] = useState<'domicilio' | 'taller'>('domicilio');

  // When device changes, set default issue
  const handleDeviceChange = (device: DeviceType) => {
    setSelectedDevice(device);
    const problems = COMMON_PROBLEMS_BY_DEVICE[device];
    if (problems && problems.length > 0) {
      setSelectedIssueKey(problems[0].key);
    }
  };

  const currentProblems = useMemo(() => {
    return COMMON_PROBLEMS_BY_DEVICE[selectedDevice] || [];
  }, [selectedDevice]);

  const activeIssue = useMemo(() => {
    return currentProblems.find(p => p.key === selectedIssueKey) || currentProblems[0];
  }, [currentProblems, selectedIssueKey]);

  const activeDistrictInfo = useMemo(() => {
    return DISTRICTS_COVERAGE.find(d => d.name === selectedDistrict) || DISTRICTS_COVERAGE[0];
  }, [selectedDistrict]);

  const deliveryFee = serviceMode === 'domicilio' ? (activeDistrictInfo?.deliveryFee || 0) : 0;
  const minPrice = (activeIssue?.min || 70) + deliveryFee;
  const maxPrice = (activeIssue?.max || 100) + deliveryFee;

  const handleBookWithQuote = () => {
    onSelectServiceForBooking({
      device: selectedDevice,
      issue: activeIssue?.label || 'Diagnóstico y reparación',
      district: selectedDistrict,
      mode: serviceMode
    });
  };

  const getDeviceIcon = (device: DeviceType) => {
    switch (device) {
      case 'laptop': return <Laptop className="w-5 h-5" />;
      case 'desktop': return <Monitor className="w-5 h-5" />;
      case 'mac': return <Apple className="w-5 h-5" />;
      case 'printer': return <Printer className="w-5 h-5" />;
      case 'network': return <Wifi className="w-5 h-5" />;
      case 'cctv': return <Camera className="w-5 h-5" />;
      case 'data_recovery': return <HardDrive className="w-5 h-5" />;
      default: return <Laptop className="w-5 h-5" />;
    }
  };

  return (
    <section id="cotizador" className="py-16 sm:py-24 bg-slate-50/60 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-xs font-bold text-[#1226AA] tracking-wider uppercase mb-2 font-mono">
            Transparencia y Cero Sorpresas
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight [text-wrap:balance]">
            Cotizador y Diagnóstico Rápido en Línea
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Calcula el costo aproximado de tu reparación o mantenimiento técnico en segundos con precios justos y reales en Soles (S/).
          </p>
        </div>

        {/* Interactive Calculator Surface */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Options Configurator (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200">
              
              {/* Step 1: Device Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Paso 1: ¿Qué equipo deseas revisar o reparar?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DEVICE_OPTIONS.map((dev) => {
                    const isSelected = selectedDevice === dev.id;
                    return (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => handleDeviceChange(dev.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col items-start gap-2 ${
                          isSelected
                            ? 'bg-blue-50/80 border-[#1226AA] text-[#1226AA] shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#1226AA] text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {getDeviceIcon(dev.id)}
                        </div>
                        <div>
                          <p className="font-bold text-xs leading-tight">{dev.name}</p>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{dev.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Problem / Symptom Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Paso 2: ¿Cuál es el síntoma o falla principal?
                </label>
                <div className="space-y-2">
                  {currentProblems.map((prob) => {
                    const isSelected = selectedIssueKey === prob.key;
                    return (
                      <button
                        key={prob.key}
                        type="button"
                        onClick={() => setSelectedIssueKey(prob.key)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 border-[#1226AA] text-[#1226AA] font-bold shadow-xs'
                            : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{prob.label}</span>
                        <span className="text-xs font-mono font-extrabold text-[#1226AA] shrink-0 tabular-nums">
                          S/ {prob.min} - S/ {prob.max}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Service Mode & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Modalidad del servicio
                  </label>
                  <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setServiceMode('domicilio')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        serviceMode === 'domicilio'
                          ? 'bg-[#1226AA] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      A Domicilio
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceMode('taller')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        serviceMode === 'taller'
                          ? 'bg-[#1226AA] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      En Taller Central
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Distrito en Lima / Callao
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1226AA]"
                  >
                    {DISTRICTS_COVERAGE.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.eta}) {d.deliveryFee > 0 ? `+ S/${d.deliveryFee}` : 'Sin costo adicional'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Right Result Summary Panel (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-[#0c1868] text-white p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300">Presupuesto Estimado</span>
                  </div>
                  <span className="text-[10px] text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                    Precios con IGV
                  </span>
                </div>

                {/* Big Price Range Display */}
                <div className="py-6 space-y-1">
                  <div className="text-xs text-slate-400 font-medium">Rango estimado de inversión:</div>
                  <div className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight tabular-nums">
                    S/ {minPrice} <span className="text-xl sm:text-2xl text-slate-400 font-normal">—</span> S/ {maxPrice}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {serviceMode === 'domicilio' 
                      ? `Incluye traslado de técnico especializado a ${selectedDistrict}` 
                      : 'Atención directa en Sede Central (Av. Bolivia 148, Centro de Lima)'}
                  </p>
                </div>

                {/* Estimate Parameters */}
                <div className="bg-slate-800/80 rounded-xl p-4 space-y-2.5 border border-slate-700/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" /> Tiempo estimado:
                    </span>
                    <span className="font-bold text-white font-mono">{activeIssue?.time || '1 - 2 hrs'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Llegada a tu zona:
                    </span>
                    <span className="font-bold text-white font-mono">{activeDistrictInfo?.eta}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Garantía oficial:
                    </span>
                    <span className="font-bold text-emerald-400">90 Días por escrito</span>
                  </div>
                </div>

                {/* What's Included */}
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Tu servicio incluye:</p>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Diagnóstico minucioso en tu presencia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Limpieza y pasta térmica de alta conductividad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Boleta o Factura electrónica oficial de J&P</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleBookWithQuote}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-[#0000FE] hover:from-blue-600 hover:to-blue-700 font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all"
                >
                  <span>Agendar Visita con esta Cotización</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  No se realiza ningún cobro hasta que el técnico complete el servicio a tu entera satisfacción.
                </p>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
