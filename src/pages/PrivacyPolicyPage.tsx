import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-12 shadow-card space-y-8">
        <div>
          <span className="text-xs font-mono font-semibold text-blue-600 uppercase tracking-wider">
            Legal & Governance
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Privacy Policy & Citizen Consent Framework
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Last revised: October 2026 • HeatShield AI Public Health Resilience Initiative
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Overview and Purpose</h2>
            <p>
              HeatShield AI is an autonomous public health and climate intelligence platform. We collect and process environmental observations and voluntary resident welfare information strictly for extreme heat risk mitigation, cooling assistance dispatch, and preventative welfare checks.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Data We Collect</h2>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><strong>Environmental Telemetry:</strong> Hyperlocal ambient temperature, relative humidity, apparent temperature, and solar irradiance.</li>
              <li><strong>Voluntary Citizen Profiles:</strong> Contact phone numbers, age ranges, general locality/ward, and housing vulnerabilities (such as tin/asbestos roof exposure).</li>
              <li><strong>Welfare Audit Logs:</strong> Timestamps of volunteer check-ins and relief assistance request resolutions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Non-Medical Disclaimer</h2>
            <p>
              HeatShield AI evaluates ambient meteorological data and vulnerability indices. It is not a clinical medical diagnostic system. Any urgent health emergency or acute heatstroke symptom requires immediate dispatch via <strong>108</strong> (Ambulance) or <strong>112</strong> (National Emergency).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Data Security & Row Level Security</h2>
            <p>
              Sensitive resident profiles and phone numbers are protected by Supabase PostgreSQL Row Level Security (RLS) policies. Only authorized administrators and assigned grassroots volunteers can access resident welfare cards. Private records are never sold or shared publicly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
