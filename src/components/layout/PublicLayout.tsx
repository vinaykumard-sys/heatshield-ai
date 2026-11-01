import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, PhoneCall } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useLocationTracker } from '../../context/LocationContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { currentLocation } = useLocationTracker();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-[#0F172A]">
      {/* Enterprise Public Header */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <BrandLogo size="md" showBadge={true} />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-slate-900 transition-colors">Platform</Link>
            <Link to="/map" className="hover:text-slate-900 transition-colors">Heat Risk Radar</Link>
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy & Consent</Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Clean Enterprise Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] text-xs text-slate-500 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showBadge={false} />
            <span className="text-slate-400">|</span>
            <span>Healthcare Technology & Urban Heat Resilience Platform</span>
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-xs">
            <Link to="/privacy" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
            <Link to="/login" className="hover:text-slate-800 transition-colors">Authorized Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
