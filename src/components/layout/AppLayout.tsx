import React, { useState, useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Home, 
  Compass, 
  Flame, 
  ShieldCheck, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { AppHeader } from './AppHeader';
import { EmergencyModal } from '../common/EmergencyModal';
import { AppDownloadModal } from '../common/AppDownloadModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { FloatingAssistantWidget } from '../assistant/FloatingAssistantWidget';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const mobilePillId = useId();

  // Mobile Bottom Navigation link definitions
  const mobileNavItems = [
    {
      to: '/dashboard',
      label: 'Home',
      icon: Home,
      isActive: location.pathname === '/dashboard',
    },
    {
      to: '/map',
      label: 'Heat Map',
      icon: Compass,
      isActive: location.pathname === '/map' || location.pathname === '/heat-map',
      badge: '3D',
    },
    {
      to: '/heat-alerts',
      label: 'Alerts',
      icon: Flame,
      isActive: location.pathname === '/heat-alerts' || location.pathname === '/alerts',
      hasAlert: true,
    },
    {
      to: '/resident-dashboard',
      label: 'My Safety',
      icon: ShieldCheck,
      isActive: location.pathname === '/resident-dashboard' || location.pathname === '/my-safety',
    },
    {
      to: '/account',
      label: 'Profile',
      icon: UserIcon,
      isActive: location.pathname === '/account',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#DFEAF8] via-[#EDF3FB] to-[#D9E6F6] lg:p-3 xl:p-4 flex flex-col justify-center items-center font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      
      {/* Accessibility: Skip to Main Content Link for Keyboard & Screen Readers */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-2xl focus:font-bold focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Subtle 3D Ambient Depth Atmosphere (Hardware-accelerated) */}
      <div 
        className="pointer-events-none absolute inset-0 overflow-hidden z-0" 
        aria-hidden="true"
      >
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-blue-400/10 blur-[90px] transform-gpu" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-indigo-400/10 blur-[100px] transform-gpu" />
        <div className="absolute top-[40%] right-[25%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] rounded-full bg-amber-300/10 blur-[110px] transform-gpu" />
      </div>

      {/* Floating 3D Application Canvas (SkySense & Horizon Master Shell) */}
      <div className="w-full max-w-[1780px] h-screen lg:h-[calc(100vh-24px)] xl:h-[calc(100vh-32px)] bg-[#F4F7FE] lg:rounded-[32px] shadow-[0_24px_70px_-15px_rgba(15,35,70,0.12),0_0_0_1px_rgba(255,255,255,0.95),0_1px_3px_rgba(0,0,0,0.04)] border border-[#E2EAF7] flex overflow-hidden relative z-10">

        {/* 1. SLIM & SLEEK 3D-AWARE NAVIGATION RAIL / SIDEBAR */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onOpenEmergency={() => setIsEmergencyModalOpen(true)}
          onOpenDownload={() => setIsDownloadModalOpen(true)}
        />

        {/* 2. RIGHT MASTER CONTENT AREA */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">

          {/* POLISHED TOP APPLICATION HEADER */}
          <AppHeader
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onOpenEmergency={() => setIsEmergencyModalOpen(true)}
            onOpenDownload={() => setIsDownloadModalOpen(true)}
          />

          {/* PAGE MAIN CONTENT SCROLL CONTAINER WITH SILKY TRANSITIONS */}
          <main 
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto bg-[#F4F7FE] p-4 sm:p-6 lg:p-7 pb-24 lg:pb-8 overscroll-contain focus:outline-none"
          >
            <div className="max-w-[1440px] w-full mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.995 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{
                    duration: shouldReduceMotion ? 0.05 : 0.22,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="w-full"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* 3D-ELEVATED MOBILE BOTTOM NAVIGATION BAR */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-[#E8EFF9] lg:hidden h-16 flex items-center justify-around px-2 shadow-[0_-8px_30px_rgba(15,35,70,0.08)] select-none"
        aria-label="Mobile bottom navigation"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={item.isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] font-medium transition-colors active:scale-95 duration-100 ${
                item.isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active 3D-styled indicator pill */}
              {item.isActive && (
                <motion.div
                  layoutId={`mobileNavActivePill-${mobilePillId}`}
                  className="absolute inset-x-2 inset-y-1 rounded-2xl bg-blue-50/90 -z-10 border border-blue-100 shadow-2xs"
                  transition={{
                    type: shouldReduceMotion ? false : 'spring',
                    stiffness: 400,
                    damping: 35
                  }}
                />
              )}

              <div className="relative mb-0.5">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${
                  item.isActive ? 'text-blue-600 scale-110' : 'text-slate-500'
                }`} />

                {/* Badge or Alert Dot */}
                {item.hasAlert && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
                {item.badge && !item.isActive && (
                  <span className="absolute -top-1.5 -right-3 px-1 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[8px] font-extrabold leading-none">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`tracking-tight ${item.isActive ? 'text-blue-700 font-bold' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Global Modals & Drawers */}
      <NotificationDrawer />
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Persistent AI Assistant Widget */}
      <FloatingAssistantWidget />
    </div>
  );
};

export default AppLayout;