import React, { useState } from 'react';
import { 
  Code2, 
  Key, 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  FileCode2, 
  ExternalLink, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Database,
  ArrowRight,
  Server
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { DeveloperApiKey } from '../types';
import { LocationTrackerBar } from '../components/common/LocationTrackerBar';

interface EndpointDef {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  title: string;
  description: string;
  params: Record<string, string>;
  mockResponse: Record<string, any>;
}

const PUBLIC_ENDPOINTS: EndpointDef[] = [
  {
    id: 'current-risk',
    method: 'GET',
    path: '/api/v1/heat-risk/current',
    title: 'Current Hyperlocal Heat Risk',
    description: 'Retrieve real-time ambient temp, feels-like index, wet-bulb globe temperature, and composite heat danger category.',
    params: { lat: '12.9716', lon: '77.5946' },
    mockResponse: {
      status: 'success',
      data: {
        coordinates: { lat: 12.9716, lon: 77.5946 },
        location_name: 'Bengaluru Central, Karnataka',
        ambient_temp_c: 34.2,
        feels_like_c: 37.8,
        wet_bulb_temp_c: 28.1,
        humidity_percent: 62,
        risk_score: 72,
        risk_level: 'High Risk',
        heat_warning: 'Caution advised for sensitive populations during 11:30 - 15:30 IST.',
        timestamp: new Date().toISOString()
      }
    }
  },
  {
    id: 'forecast-risk',
    method: 'GET',
    path: '/api/v1/heat-risk/forecast',
    title: 'Multi-Day Heat Hazard Forecast',
    description: 'Returns 24, 48, and 72-hour thermal stress forecasts computed with geospatial solar irradiance models.',
    params: { lat: '12.9716', lon: '77.5946', days: '3' },
    mockResponse: {
      status: 'success',
      forecast_days: 3,
      data: [
        { date: '2026-11-02', peak_temp_c: 35.1, min_temp_c: 21.0, max_risk_score: 76, advisory: 'Amber Heat Watch' },
        { date: '2026-11-03', peak_temp_c: 36.4, min_temp_c: 22.2, max_risk_score: 82, advisory: 'Severe Heat Alert' },
        { date: '2026-11-04', peak_temp_c: 34.8, min_temp_c: 21.5, max_risk_score: 71, advisory: 'Amber Heat Watch' }
      ]
    }
  },
  {
    id: 'cooling-centres',
    method: 'GET',
    path: '/api/v1/cooling-centres/nearby',
    title: 'Nearby Verified Cooling Centres',
    description: 'Query municipal cooling sanctuaries, shaded public shelters, and hydration points sorted by proximity.',
    params: { lat: '12.9716', lon: '77.5946', radius_km: '5' },
    mockResponse: {
      status: 'success',
      count: 3,
      centres: [
        { id: 'cc-1', name: 'Cubbon Park Botanical Pavilion', distance_km: 0.8, open_now: true, ac_equipped: false, tree_canopy: true },
        { id: 'cc-2', name: 'Mayo Hall Community Center', distance_km: 1.4, open_now: true, ac_equipped: true, tree_canopy: false }
      ]
    }
  },
  {
    id: 'water-stations',
    method: 'GET',
    path: '/api/v1/water-stations/nearby',
    title: 'Public Water & Hydration ATMs',
    description: 'Find verified RO water dispensers, municipal taps, and free public water points with live verification status.',
    params: { lat: '12.9716', lon: '77.5946', radius_km: '3' },
    mockResponse: {
      status: 'success',
      count: 2,
      stations: [
        { id: 'wat-1', name: 'Shivajinagar Bus Terminal Water ATM', status: 'operational', water_type: 'chilled_ro', free: true },
        { id: 'wat-2', name: 'Commercial Street Public Tap', status: 'operational', water_type: 'municipal_filtered', free: true }
      ]
    }
  },
  {
    id: 'active-alerts',
    method: 'GET',
    path: '/api/v1/alerts/active',
    title: 'Active Municipal Heat Alerts',
    description: 'Get verified heat action alerts, NDMA warnings, and ward-level advisories for any Indian state or district.',
    params: { state: 'Karnataka', city: 'Bengaluru' },
    mockResponse: {
      status: 'success',
      active_alerts: [
        { id: 'alt-1', title: 'Amber Heat Watch - Northern Corridor', severity: 'warning', valid_until: '2026-11-03T18:00:00Z' }
      ]
    }
  },
  {
    id: 'heat-safe-routes',
    method: 'POST',
    path: '/api/v1/routes/heat-safe',
    title: 'Heat-Safe Route Calculation',
    description: 'Compute walking, cycling, or transit routes that optimize for tree canopy shade and water access.',
    params: { origin_lat: '12.9716', origin_lon: '77.5946', dest_lat: '12.9800', dest_lon: '77.6000' },
    mockResponse: {
      status: 'success',
      route_type: 'canopy_protected',
      shade_coverage_percent: 68,
      heat_stress_reduction_percent: 34,
      distance_meters: 1840,
      estimated_duration_minutes: 24,
      water_stations_along_route: 2
    }
  },
  {
    id: 'hospitals-nearby',
    method: 'GET',
    path: '/api/v1/hospitals/nearby',
    title: 'Emergency Hospitals & Heatstroke Wards',
    description: 'List trauma hospitals with heatstroke rapid-immersion equipment and live bed availability.',
    params: { lat: '12.9716', lon: '77.5946', speciality: 'heatstroke' },
    mockResponse: {
      status: 'success',
      hospitals: [
        { id: 'hosp-1', name: 'Bowring and Lady Curzon Hospital', heatstroke_ward: true, icu_beds_available: 4, emergency_phone: '080-25591325' }
      ]
    }
  }
];

export const DeveloperPortalPage: React.FC = () => {
  const [keys, setKeys] = useState<DeveloperApiKey[]>(() => mockDb.getDeveloperApiKeys());
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(PUBLIC_ENDPOINTS[0]);
  const [codeTab, setCodeTab] = useState<'curl' | 'javascript' | 'python'>('curl');
  
  // Interactive Tester state
  const [testParams, setTestParams] = useState<Record<string, string>>(PUBLIC_ENDPOINTS[0].params);
  const [responseResult, setResponseResult] = useState<any>(PUBLIC_ENDPOINTS[0].mockResponse);
  const [responseStatus, setResponseStatus] = useState<number>(200);
  const [responseTimeMs, setResponseTimeMs] = useState<number>(34);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Key Modal
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newKeyName, setNewKeyName] = useState('');

  const handleSelectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setTestParams(ep.params);
    setResponseResult(ep.mockResponse);
  };

  const handleRunRequest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResponseStatus(200);
      setResponseTimeMs(Math.floor(Math.random() * 40) + 20);
      setResponseResult(selectedEndpoint.mockResponse);
    }, 400);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newKeyName) return;

    mockDb.generateApiKey(newKeyName, newOrgName);

    setKeys(mockDb.getDeveloperApiKeys());
    setNewOrgName('');
    setNewKeyName('');
    setShowNewKeyModal(false);
  };

  const handleRevokeKey = (id: string) => {
    mockDb.revokeApiKey(id);
    setKeys(mockDb.getDeveloperApiKeys());
  };

  const getCodeSnippet = () => {
    const queryStr = Object.entries(testParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    const fullUrl = `https://api.heatshield.ai${selectedEndpoint.path}${queryStr ? '?' + queryStr : ''}`;

    if (codeTab === 'curl') {
      return `curl -X ${selectedEndpoint.method} "${fullUrl}" \\
  -H "Authorization: Bearer hs_live_test_7f9b8c2" \\
  -H "Content-Type: application/json"`;
    } else if (codeTab === 'javascript') {
      return `// Modern Fetch API
const response = await fetch("${fullUrl}", {
  method: "${selectedEndpoint.method}",
  headers: {
    "Authorization": "Bearer hs_live_test_7f9b8c2",
    "Content-Type": "application/json"
  }
});
const data = await response.json();
console.log(data);`;
    } else {
      return `# Python (requests)
import requests

url = "${fullUrl}"
headers = {
    "Authorization": "Bearer hs_live_test_7f9b8c2",
    "Content-Type": "application/json"
}

response = requests.${selectedEndpoint.method.toLowerCase()}(url, headers=headers)
data = response.json()
print(data)`;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadOpenApiSpec = () => {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'HeatShield AI Public Geo-Environmental Intelligence API',
        version: '1.0.0',
        description: 'Comprehensive REST API for real-time heat risk index, cooling sanctuaries, hydration infrastructure, and heat-safe navigation.'
      },
      servers: [{ url: 'https://api.heatshield.ai' }],
      paths: PUBLIC_ENDPOINTS.reduce((acc, ep) => {
        acc[ep.path] = {
          [ep.method.toLowerCase()]: {
            summary: ep.title,
            description: ep.description,
            parameters: Object.keys(ep.params).map(p => ({
              name: p,
              in: 'query',
              required: true,
              schema: { type: 'string' }
            })),
            responses: {
              '200': {
                description: 'Successful Response',
                content: { 'application/json': { example: ep.mockResponse } }
              }
            }
          }
        };
        return acc;
      }, {} as any)
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heatshield-ai-openapi.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      <LocationTrackerBar />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-600 uppercase tracking-wider">
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Ecosystem & Open APIs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            HeatShield Developer Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Integrate hyperlocal heat hazard telemetry, shaded routing, and emergency lifeline APIs into your civic applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={downloadOpenApiSpec}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-subtle transition-all"
          >
            <FileCode2 className="w-4 h-4 text-blue-600" />
            <span>Download OpenAPI Spec</span>
          </button>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Generate API Key</span>
          </button>
        </div>
      </div>

      {/* API Keys Management Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Your API Keys & Quota Usage</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Tier: Standard Developer (5,000 req/day)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="p-3 rounded-l-lg">Key Name & Org</th>
                <th className="p-3">API Token Prefix</th>
                <th className="p-3">Daily Quota Usage</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {keys.map((k) => {
                const percent = Math.min(100, Math.round((k.used_today / k.daily_quota) * 100));
                return (
                  <tr key={k.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{k.key_name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{k.organization_name}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {k.key_prefix}••••••••
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-slate-600">
                          {k.used_today} / {k.daily_quota} ({percent}%)
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        k.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {k.is_active ? 'ACTIVE' : 'REVOKED'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => copyToClipboard(k.key_prefix + 'sample_key_token_12345', k.id)}
                        className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium"
                      >
                        {copiedKey === k.id ? 'Copied' : 'Copy Token'}
                      </button>
                      {k.is_active && (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Grid: Endpoint Directory & Interactive Request Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Directory List */}
        <div className="lg:col-span-5 space-y-2.5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 px-1">
            Core Public Endpoints ({PUBLIC_ENDPOINTS.length})
          </h3>
          
          <div className="space-y-2">
            {PUBLIC_ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer card-interactive ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      ep.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-semibold text-slate-800">{ep.path}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5">{ep.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{ep.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Request Tester & Code Generator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 uppercase">Interactive API Console</span>
                <h3 className="text-base font-bold text-slate-900">{selectedEndpoint.title}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                selectedEndpoint.method === 'GET' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {selectedEndpoint.method}
              </span>
            </div>

            {/* URL Display */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700">
              <span className="text-slate-400 select-none">https://api.heatshield.ai</span>
              <span className="font-bold text-blue-600">{selectedEndpoint.path}</span>
            </div>

            {/* Editable Parameters */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-slate-500 block">Query Parameters</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(testParams).map(([paramKey, paramVal]) => (
                  <div key={paramKey} className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-600 font-semibold">{paramKey}</label>
                    <input
                      type="text"
                      value={paramVal}
                      onChange={(e) => setTestParams({ ...testParams, [paramKey]: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunRequest}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{isLoading ? 'Executing Request...' : 'Send Test Request'}</span>
            </button>

            {/* Response Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 uppercase font-bold">Response Telemetry</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 font-bold">Status: {responseStatus} OK</span>
                  <span className="text-slate-400">Time: {responseTimeMs} ms</span>
                </div>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 text-cyan-300 font-mono text-xs overflow-x-auto max-h-64 border border-slate-800">
                {JSON.stringify(responseResult, null, 2)}
              </pre>
            </div>
          </div>

          {/* Code Snippets Section */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white uppercase">Client Code Integration</span>
              </div>
              <div className="flex items-center gap-1">
                {(['curl', 'javascript', 'python'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setCodeTab(tab)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono capitalize transition-colors ${
                      codeTab === tab ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto">
                {getCodeSnippet()}
              </pre>
              <button
                onClick={() => copyToClipboard(getCodeSnippet(), 'code-snippet')}
                className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 border border-slate-700"
              >
                {copiedKey === 'code-snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'code-snippet' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-modal-enter">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Provision New API Key</h3>
              <button onClick={() => setShowNewKeyModal(false)} className="text-slate-400 hover:text-slate-600 btn-press">✕</button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Organization / Developer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bangalore Civic Tech Labs"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none input-interactive"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Key Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Mobile App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
                <span className="font-bold">Standard Tier:</span> 120 requests/min, 5,000 requests/day, non-commercial civic and emergency use.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewKeyModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperPortalPage;
