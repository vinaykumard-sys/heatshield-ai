import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-12 shadow-card space-y-8">
        <div>
          <span className="text-xs font-mono font-semibold text-blue-600 uppercase tracking-wider">
            Operational Agreement
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Terms of Service & Platform Governance
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Effective: October 2026 • HeatShield AI Community Defense Network
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing HeatShield AI, you agree to these Terms of Service. If you are registering on behalf of a municipal body or community volunteer network, you represent that you have the authority to coordinate non-clinical humanitarian heat relief.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Permitted Use</h2>
            <p>
              HeatShield AI is provided for community protection, monitoring of extreme heat events, and voluntary check-in coordination. Users may not abuse the assistance ticket system, submit fraudulent emergency requests, or attempt to bypass role-based security access controls.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Emergency Protocols</h2>
            <p>
              Submitting an assistance request on HeatShield AI coordinates community volunteers for hydration and shaded cooling center transit. It does not replace direct notification to fire, police, or ambulance rescue services. Always call <strong>108</strong> or <strong>112</strong> for life-threatening medical situations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
