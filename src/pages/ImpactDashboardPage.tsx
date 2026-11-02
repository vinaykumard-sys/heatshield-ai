import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  HeartHandshake, 
  ShieldCheck, 
  Droplets, 
  Building2, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Award, 
  FileSpreadsheet, 
  Flame,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';
import { computeDynamicImpactMetrics } from '../lib/unifiedDataService';

export const ImpactDashboardPage: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | 'ytd'>('30d');

  // Dynamically computed Impact Metrics from registered residents, check-ins, stations, and requests
  const dynamicMetrics = computeDynamicImpactMetrics();

  const metrics = {
    wardsMonitored: dynamicMetrics.wardsMonitored,
    residentsProtected: dynamicMetrics.residentsProtected,
    volunteersActive: dynamicMetrics.volunteersActive,
    welfareCheckinsDone: dynamicMetrics.welfareCheckinsDone,
    checkinSuccessRate: dynamicMetrics.checkinSuccessRate,
    emergencyRequestsResolved: dynamicMetrics.emergencyRequestsResolved,
    waterDispensedLiters: dynamicMetrics.waterDispensedLiters,
    workerRestCyclesEnforced: dynamicMetrics.workerRestCyclesEnforced,
    academyCertificationsIssued: dynamicMetrics.academyCertificationsIssued
  };

  // Ward performance table
  const wardBreakdown = [
    { ward: 'Ward 7 - Chokkanahalli', zone: 'Yelahanka', residents: 1240, checkins: 88, riskLevel: 'Severe', waterPoints: 4, status: 'Protected' },
    { ward: 'Ward 8 - Kodigehalli', zone: 'Yelahanka', residents: 980, checkins: 62, riskLevel: 'High', waterPoints: 3, status: 'Protected' },
    { ward: 'Ward 19 - Hebbal', zone: 'Hebbal', residents: 2150, checkins: 142, riskLevel: 'High', waterPoints: 6, status: 'Protected' },
    { ward: 'Ward 80 - Hoysala Nagar', zone: 'Indiranagar', residents: 3400, checkins: 195, riskLevel: 'Moderate', waterPoints: 8, status: 'Protected' },
    { ward: 'Ward 82 - Shivajinagar', zone: 'Central', residents: 2890, checkins: 210, riskLevel: 'High', waterPoints: 7, status: 'Protected' },
    { ward: 'Ward 112 - Domlur', zone: 'East', residents: 1450, checkins: 94, riskLevel: 'Moderate', waterPoints: 5, status: 'Protected' }
  ];

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Ward,Zone,Residents Protected,Checkins Completed,Risk Level,Water Points,Status\n" +
      wardBreakdown.map(e => `"${e.ward}","${e.zone}",${e.residents},${e.checkins},"${e.riskLevel}",${e.waterPoints},"${e.status}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `heatshield_impact_report_${selectedTimeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-600 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Civic Resilience & Outcomes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            HeatShield Impact Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quantifiable community protection metrics, welfare check-in success rates, and municipal heat vulnerability mitigation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-medium">
            {(['30d', '90d', 'ytd'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg uppercase font-mono transition-colors ${
                  selectedTimeframe === tf ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all btn-interact hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Key Stats Hero Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle card-interactive hover-elevate">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Protected Residents</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{metrics.residentsProtected}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18% from last month</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle card-interactive hover-elevate">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Welfare Check-Ins</span>
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{metrics.welfareCheckinsDone}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{metrics.checkinSuccessRate} confirmed safe</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle card-interactive hover-elevate">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Water Distributed</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{metrics.waterDispensedLiters} L</div>
          <div className="text-[11px] text-slate-400 mt-1">Across 24 verified public ATMs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle card-interactive hover-elevate">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Worker Safety Rest</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{metrics.workerRestCyclesEnforced}</div>
          <div className="text-[11px] text-orange-600 font-medium mt-1">NDMA cycles enforced</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Resolution Velocity */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Check-in and Assistance Resolution Velocity</h3>
            <span className="text-xs font-mono text-emerald-600 font-semibold">Avg Response: 14 mins</span>
          </div>

          {/* Pure SVG Bar visualization */}
          <div className="h-56 w-full flex items-end gap-3 pt-4 px-2">
            {[
              { day: 'Mon', val: 120, height: '60%' },
              { day: 'Tue', val: 160, height: '80%' },
              { day: 'Wed', val: 195, height: '95%' },
              { day: 'Thu', val: 145, height: '72%' },
              { day: 'Fri', val: 180, height: '88%' },
              { day: 'Sat', val: 90, height: '45%' },
              { day: 'Sun', val: 75, height: '38%' }
            ].map(col => (
              <div key={col.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-mono font-semibold text-slate-500">{col.val}</span>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all duration-500 hover:brightness-110"
                  style={{ height: col.height }}
                />
                <span className="text-[11px] font-mono text-slate-600 font-medium">{col.day}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Welfare check-ins peak mid-week during maximum ambient heat hours (12:00 - 15:30 IST).
          </p>
        </div>

        {/* Heat Mitigation Summary Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-navy-900 text-white rounded-3xl p-6 shadow-lg border border-slate-800 space-y-5">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Heat Health Impact Scorecard</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] font-mono text-cyan-300 uppercase">Emergency Ambulance Interventions Avoided</span>
              <div className="text-2xl font-extrabold text-white">43 Incidents</div>
              <p className="text-[11px] text-slate-400">Through early hydration, volunteer shade relocation, and pre-cooling.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[11px] font-mono text-emerald-300 uppercase">Public Awareness Reach</span>
              <div className="text-2xl font-extrabold text-white">125,000+ SMS & WhatsApp Alerts</div>
              <p className="text-[11px] text-slate-400">Broadcasted across BBMP wards during Severe Heatwave advisories.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ward Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Ward-by-Ward Community Protection Coverage</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Showing Top 6 Monitored Zones</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-lg">BBMP Ward & Zone</th>
                <th className="p-3">Protected Residents</th>
                <th className="p-3">Check-Ins Completed</th>
                <th className="p-3">Hazard Risk Level</th>
                <th className="p-3">Water Points</th>
                <th className="p-3 text-right rounded-r-lg">Protection Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wardBreakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-900">
                    <div>{row.ward}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{row.zone} Zone</div>
                  </td>
                  <td className="p-3 font-mono text-slate-700">{row.residents.toLocaleString()}</td>
                  <td className="p-3 font-mono text-emerald-600 font-bold">{row.checkins}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.riskLevel === 'Severe' ? 'bg-red-100 text-red-800' :
                      row.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {row.riskLevel}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-blue-600 font-bold">{row.waterPoints} active</td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboardPage;
