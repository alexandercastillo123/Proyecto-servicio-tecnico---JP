import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { QuoteCalculator } from './components/QuoteCalculator';
import { ServicesGrid } from './components/ServicesGrid';
import { PlatformShowcase } from './components/PlatformShowcase';
import { CoverageMap } from './components/CoverageMap';
import { SecurityAndGuarantee } from './components/SecurityAndGuarantee';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { DeviceType, ServiceDetail } from './types';
import { MessageCircle, Smartphone, ArrowUp } from 'lucide-react';

export default function App() {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState<{
    device?: DeviceType;
    issue?: string;
    district?: string;
    mode?: 'domicilio' | 'taller';
  } | null>(null);

  const handleOpenBooking = (initial?: {
    device?: DeviceType;
    issue?: string;
    district?: string;
    mode?: 'domicilio' | 'taller';
  }) => {
    setBookingInitialData(initial || null);
    setBookingModalOpen(true);
  };

  const handleSelectServiceFromGrid = (service: ServiceDetail) => {
    // Map service category to device
    let dev: DeviceType = 'laptop';
    if (service.id === 'impresoras') dev = 'printer';
    else if (service.id === 'redes') dev = 'network';
    else if (service.id === 'seguridad-electronica') dev = 'cctv';
    else if (service.id === 'recuperacion-datos') dev = 'data_recovery';

    handleOpenBooking({
      device: dev,
      issue: `${service.title} - ${service.tagline}`
    });
  };

  const handleSelectDistrictFromCoverage = (districtName: string) => {
    handleOpenBooking({
      district: districtName
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#111111]">
      {/* Top Navbar */}
      <Navbar 
        onOpenBooking={() => handleOpenBooking()} 
        onOpenDownload={() => setDownloadModalOpen(true)} 
      />

      <main className="flex-1">
        {/* 1. Hero Section with Live Mockups */}
        <Hero 
          onOpenBooking={() => handleOpenBooking()} 
          onOpenDownload={() => setDownloadModalOpen(true)} 
        />

        {/* 2. 3-Step Process (Cómo Funciona el Servicio a Domicilio) */}
        <HowItWorks 
          onOpenBooking={() => handleOpenBooking()} 
          onOpenDownload={() => setDownloadModalOpen(true)} 
        />

        {/* 3. Interactive Quick Quote Calculator */}
        <QuoteCalculator 
          onSelectServiceForBooking={(data) => handleOpenBooking(data)} 
        />

        {/* 4. Official 8 Services Bento Grid */}
        <ServicesGrid 
          onSelectService={handleSelectServiceFromGrid} 
        />

        {/* 5. Android App (APK) & Web Platform Showcase */}
        <PlatformShowcase 
          onOpenDownloadModal={() => setDownloadModalOpen(true)} 
          onOpenBooking={() => handleOpenBooking()} 
        />

        {/* 6. Lima Districts Coverage & Physical Branches */}
        <CoverageMap 
          onSelectDistrict={handleSelectDistrictFromCoverage} 
        />

        {/* 7. Security, Trust & 90-Day Guarantee */}
        <SecurityAndGuarantee />

        {/* 8. Verified Testimonials */}
        <Testimonials />

        {/* 9. FAQs */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer 
        onOpenBooking={() => handleOpenBooking()} 
        onOpenDownload={() => setDownloadModalOpen(true)} 
      />

      {/* Interactive Booking Modal */}
      <BookingModal 
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialData={bookingInitialData}
      />

      {/* Interactive Android App & Web Download Modal */}
      <DownloadAppModal 
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        onOpenBooking={() => {
          setDownloadModalOpen(false);
          handleOpenBooking();
        }}
      />

      {/* Discrete Floating Contact Pill */}
      <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2">
        <a
          href="https://wa.me/51997662381?text=Hola%20J%26P%20Perif%C3%A9ricos%2C%20quisiera%20solicitar%20un%20t%C3%A9cnico%20a%20domicilio."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-white/20" />
          <span className="hidden sm:inline">WhatsApp Técnico</span>
        </a>
      </div>
    </div>
  );
}
