import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Flame, 
  ShieldCheck, 
  User as UserIcon 
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { EmergencyModal } from '../common/EmergencyModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { FloatingAssistantWidget } from '../assistant/FloatingAssistantWidget';
import { CompulsoryPhoneAlertBanner } from '../notifications/CompulsoryPhoneAlertBanner';
import { PhoneVerificationModal } from '../auth/PhoneVerificationModal';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#E2ECF9] via-[#EDF3FB] to-[#DFEAF8] lg:p-3 xl:p-4 flex flex-col justify-center items-center font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* Floating Application Canvas (SkySense & Horizon Master Shell) */}
      <div className="w-full max-w-[1780px] h-screen lg:h-[calc(100vh-24px)] xl:h-[calc(100vh-32px)] bg-[#F4F7FE] lg:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(20,50,90,0.12),0_0_0_1px_rgba(255,255,255,0.85)] border border-[#E2EAF7] flex overflow-hidden relative">

        {/* 1. SLIM & SLEEK NAVIGATION RAIL / SIDEBAR */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        />

        {/* 2. RIGHT MASTER CONTENT AREA */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">

          {/* POLISHED TOP APPLICATION HEADER */}
          <AppHeader
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onOpenEmergency={() => setIsEmergencyModalOpen(true)}
          />

          {/* COMPULSORY RESIDENT PHONE VERIFICATION BANNER */}
          <CompulsoryPhoneAlertBanner 
            onOpenPhoneModal={() => setIsPhoneModalOpen(true)} 
          />

          {/* PAGE MAIN CONTENT SCROLL CONTAINER */}
          <main className="flex-1 overflow-y-auto bg-[#F4F7FE] p-4 sm:p-6 lg:p-7 pb-28 lg:pb-8">
            <div className="max-w-[1440px] w-full mx-auto">
              <div key={location.pathname} className="animate-page-enter">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E9F0FA] lg:hidden h-16 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(20,50,90,0.06)]"
        aria-label="Mobile bottom navigation"
      >
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link
          to="/map"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/map' || location.pathname === '/heat-map' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Map</span>
        </Link>
        <Link
          to="/heat-alerts"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/heat-alerts' || location.pathname === '/alerts' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span>Alerts</span>
        </Link>
        <Link
          to="/resident-dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/resident-dashboard' || location.pathname === '/my-safety' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Safety</span>
        </Link>
        <Link
          to="/account"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
            location.pathname === '/account' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* Global Modals & Drawers */}
      <NotificationDrawer />
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />

      {/* Persistent AI Assistant Widget */}
      <FloatingAssistantWidget />
    </div>
  );
};

export default AppLayout;
