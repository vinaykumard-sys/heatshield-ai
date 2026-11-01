import React, { useState } from 'react';
import { 
  Download, 
  TrendingUp, 
  CheckCircle, 
  Users, 
  Flame, 
  Building2,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import { mockDb } from '../lib/mockDb';
import { StatCard } from '../components/common/StatCard';

export const AnalyticsPage: React.FC = () => {
  const locations = mockDb.getLocations();
  const checkins = mockDb.getCheckins();
  const requests = mockDb.getRequests();
  const [isExported, setIsExported] = useState(false);

  // Neighbourhood comparison chart data
  const localityComparisonData = locations.map(l => ({
    name: l.name.split(' ')[0],
    fullName: l.name,
    vulnerability: l.baseline_vulnerability_score,
    uhi: Number((l.urban_heat_island_factor * 50).toFixed(0)),
    population: Number((l.estimated_population / 1000).toFixed(0)),
  }));

  // Weekly Trend Mock Data
  const weeklyTrendData = [
    { day: 'Mon', avgTemp: 35.5, heatRisk: 68, checkinsDone: 42 },
    { day: 'Tue', avgTemp: 36.2, heatRisk: 72, checkinsDone: 48 },
    { day: 'Wed', avgTemp: 38.0, heatRisk: 81, checkinsDone: 65 },
    { day: 'Thu', avgTemp: 39.4, heatRisk: 88, checkinsDone: 72 },
    { day: 'Fri', avgTemp: 37.8, heatRisk: 79, checkinsDone: 58 },
    { day: 'Sat', avgTemp: 36.5, heatRisk: 73, checkinsDone: 50 },
    { day: 'Sun', avgTemp: 35.8, heatRisk: 69, checkinsDone: 44 },
  ];

  const totalCheckins = checkins.length;
  const completedCheckins = checkins.filter(c => c.status === 'completed').length;
  const completionRate = totalCheckins > 0 ? ((completedCheckins / totalCheckins) * 100).toFixed(1) : '94.2';

  // Export to CSV functionality
  const handleExportCSV = () => {
    const headers = ['Resident ID', 'Resident Name', 'Age Range', 'Locality', 'Checkin Status', 'Safety Confirmed', 'Hydration Checked', 'Scheduled Date'];
    const rows = checkins.map(c => [
      c.resident_id,
      `"${c.resident_name || ''}"`,
      'Elderly',
      `"${c.locality_name || ''}"`,
      c.status,
      c.safety_confirmed ? 'YES' : 'NO',
      c.hydration_adequate ? 'YES' : 'NO',
      c.scheduled_for
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `heatshield_community_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExported(true);
    setTimeout(() => setIsExported(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Reports & Heat Risk Analytics</h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
              HEALTH INTELLIGENCE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Comprehensive statistical summaries of thermal trends, volunteer response times, and welfare completion rates.
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          {isExported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span>{isExported ? 'CSV Downloaded!' : 'Export CSV Report'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Check-in Completion Rate"
          value={`${completionRate}%`}
          subtitle="Target: >90% during heatwaves"
          icon={CheckCircle}
          colorScheme="emerald"
          trend={{ value: '+4.2% this week', isPositive: true }}
        />
        <StatCard
          title="Peak Weekly Thermal Index"
          value="39.4°C"
          subtitle="Thursday afternoon peak"
          icon={Flame}
          colorScheme="red"
          trend={{ value: 'Elevated thermal stress', isPositive: false }}
        />
        <StatCard
          title="Total Relief Requests Met"
          value={`${requests.filter(r => r.status === 'resolved').length} / ${requests.length}`}
          subtitle="Water & cooling aid"
          icon={TrendingUp}
          colorScheme="blue"
          trend={{ value: '88% resolved', isPositive: true }}
        />
        <StatCard
          title="Active Volunteer Network"
          value="18"
          subtitle="Ward coordinators"
          icon={Users}
          colorScheme="amber"
          trend={{ value: 'Full coverage', isNeutral: true }}
        />
      </div>

      {/* Weekly Trend Line Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Weekly Heat Stress & Check-in Surge</h3>
            <p className="text-xs text-slate-500">Daily average thermal stress index correlated with volunteer check-in surge</p>
          </div>
          <span className="text-xs text-blue-600 font-mono font-semibold">Past 7 Days</span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm text-xs space-y-1">
                        <p className="font-semibold text-slate-900">{label}</p>
                        <p className="text-blue-600">Avg Temp: {payload[0]?.value}°C</p>
                        <p className="text-orange-600">Heat Risk Score: {payload[1]?.value} / 100</p>
                        <p className="text-emerald-700">Check-ins: {payload[2]?.value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="avgTemp" stroke="#2563EB" strokeWidth={2} name="Avg Temp (°C)" />
              <Line type="monotone" dataKey="heatRisk" stroke="#DC2626" strokeWidth={2} strokeDasharray="3 3" name="Risk Score" />
              <Line type="monotone" dataKey="checkinsDone" stroke="#16A34A" strokeWidth={2} name="Welfare Checks" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Neighbourhood Vulnerability Comparison Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Neighbourhood Thermal Vulnerability Comparison</h3>
            <p className="text-xs text-slate-500">Baseline structural vulnerability score across major urban wards</p>
          </div>
          <Building2 className="w-4 h-4 text-slate-400" />
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={localityComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm text-xs space-y-1">
                        <p className="font-semibold text-slate-900">{d.fullName}</p>
                        <p className="text-blue-600">Vulnerability Score: {d.vulnerability}/100</p>
                        <p className="text-slate-500">Est. Population: {d.population}k</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="vulnerability" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
