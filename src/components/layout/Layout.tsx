import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { MedicalDisclaimerBanner } from '../common/MedicalDisclaimerBanner';

interface LayoutProps {
  children: React.ReactNode;
  showDisclaimer?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showDisclaimer = true }) => {
  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <Navbar />
      <NotificationDrawer />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showDisclaimer && <MedicalDisclaimerBanner />}
        {children}
      </main>
      <Footer />
    </div>
  );
};
