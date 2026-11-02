import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  Play, 
  RotateCcw, 
  Save, 
  Flame, 
  Trees, 
  Users, 
  PowerOff, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Sparkles,
  History,
  TrendingUp,
  Info
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { LocationZone, SimulationParameters, HeatSimulationResult } from '../types';
import { SIMULATION_PRESETS, runHeatSimulation } from '../lib/simulationEngine';
import { useAuth } from '../context/AuthContext';

export const HeatSimulatorPage: React.FC = () => {
  const { user } = useAuth();
  const [locations] = useState<LocationZone[]>(() => mockDb.getLocations());

  // Simulation parameter state
  const [params, setParams] = useState<SimulationParameters>({
    temperature_delta_c: 3.5,
    humidity_delta_pct: 0,
    wind_speed_kmh: 12,
    vegetation_coverage_pct: 20,
    cooling_centres_offline: false,
    additional_volunteers: 0
  });

  const [activePresetName, setActivePresetName] = useState<string>('Custom Scenario');
  const [scenarioNameInput, setScenarioNameInput] = useState<string>('Urban Heatwave +3.5°C Stress Test');
  const [isSaved, setIsSaved] = useState(false);

  // Run simulation reactively or on demand
  const currentResult = useMemo<HeatSimulationResult>(() => {
    return runHeatSimulation(locations, params, activePresetName);
  }, [locations, params, activePresetName]);

  const [savedSimulations, setSavedSimulations] = useState<HeatSimulationResult[]>(() => {
    return mockDb.getSimulations();
  });

  const handleApplyPreset = (preset: typeof SIMULATION_PRESETS[0]) => {
    setParams({ ...preset.params });
    setActivePresetName(preset.name);
    setScenarioNameInput(preset.name);
    setIsSaved(false);
  };

  const handleResetBaseline = () => {
    setParams({
      temperature_delta_c: 0,
      humidity_delta_pct: 0,
      wind_speed_kmh: 15,
      vegetation_coverage_pct: 25,
      cooling_centres_offline: false,
      additional_volunteers: 0
    });
    setActivePresetName('Baseline Conditions (Zero Anomaly)');
    setScenarioNameInput('Baseline Conditions');
    setIsSaved(false);
  };

  const handleSaveScenario = () => {
    const simulationToSave: HeatSimulationResult = {
      ...currentResult,
      id: `sim-save-${Date.now()}`,
      name: scenarioNameInput || 'Saved Heat Scenario',
      created_by: user?.full_name || 'Urban Resilience Coordinator'
    };

    mockDb.saveSimulation(simulationToSave);
    setSavedSimulations(mockDb.getSimulations());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLoadSavedScenario = (sim: HeatSimulationResult) => {
    setParams({ ...sim.parameters });
    setActivePresetName(sim.name);
    setScenarioNameInput(sim.name);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-blue-600" />
              <span>What-If Heat Simulation Engine</span>
            </h1>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
              ISOLATED SANDBOX
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Model hypothetical heatwave anomalies, urban tree canopy interventions, and infrastructure outage resilience without altering production telemetry.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetBaseline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleSaveScenario}
            disabled={isSaved}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved to Library' : 'Save Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Sandbox Isolation Notice */}
      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Data Isolation Guarantee:</strong> All simulation calculations execute strictly in client-side memory. Real-time temperature sensors and live citizen check-in records are protected and unmodified.
          </span>
        </div>
        <span className="font-mono text-[11px] text-blue-700 font-semibold uppercase">
          Sandbox Mode: ACTIVE
        </span>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Select Standard Policy & Climate Presets:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SIMULATION_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className={`p-2.5 rounded-xl border text-left card-interactive btn-press transition-all ${
                activePresetName === p.name
                  ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</div>
              <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Simulation Parameters</span>
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                INPUT CONTROL
              </span>
            </div>

            {/* Scenario Name Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scenario Name
              </label>
              <input
                type="text"
                value={scenarioNameInput}
                onChange={(e) => {
                  setScenarioNameInput(e.target.value);
                  setActivePresetName('Custom Scenario');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Slider 1: Temperature Delta */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>Temperature Delta</span>
                </span>
                <span className="font-mono font-bold text-red-600">
                  {params.temperature_delta_c >= 0 ? `+${params.temperature_delta_c.toFixed(1)}` : params.temperature_delta_c.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="-5"
                max="8"
                step="0.5"
                value={params.temperature_delta_c}
                onChange={(e) => {
                  setParams(prev => ({ ...prev, temperature_delta_c: parseFloat(e.target.value) }));
                  setActivePresetName('Custom Scenario');
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-5.0°C (Cooler)</span>
                <span>0°C (Normal)</span>
                <span>+8.0°C (Extreme Heat)</span>
              </div>
            </div>

            {/* Slider 2: Humidity Delta */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Relative Humidity Delta</span>
                <span className="font-mono font-bold text-blue-600">
                  {params.humidity_delta_pct >= 0 ? `+${params.humidity_delta_pct}` : params.humidity_delta_pct}%
                </span>
              </div>
              <input
                type="range"
                min="-25"
                max="35"
                step="5"
                value={params.humidity_delta_pct}
                onChange={(e) => {
                  setParams(prev => ({ ...prev, humidity_delta_pct: parseInt(e.target.value) }));
                  setActivePresetName('Custom Scenario');
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-25% (Dry Air)</span>
                <span>0% (Baseline)</span>
                <span>+35% (Humid Dome)</span>
              </div>
            </div>

            {/* Slider 3: Urban Canopy / Vegetation Coverage */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Trees className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tree Canopy Coverage</span>
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {params.vegetation_coverage_pct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={params.vegetation_coverage_pct}
                onChange={(e) => {
                  setParams(prev => ({ ...prev, vegetation_coverage_pct: parseInt(e.target.value) }));
                  setActivePresetName('Custom Scenario');
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0% (Sparse)</span>
                <span>25% (Urban Average)</span>
                <span>100% (High Canopy)</span>
              </div>
            </div>

            {/* Slider 4: Additional Volunteers */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Surge Volunteer Deployment</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  +{params.additional_volunteers} volunteers
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={params.additional_volunteers}
                onChange={(e) => {
                  setParams(prev => ({ ...prev, additional_volunteers: parseInt(e.target.value) }));
                  setActivePresetName('Custom Scenario');
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 (Normal Force)</span>
                <span>+25</span>
                <span>+50 (Max Surge)</span>
              </div>
            </div>

            {/* Toggle 5: Cooling Centres Outage */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <PowerOff className={`w-4 h-4 ${params.cooling_centres_offline ? 'text-red-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Cooling Shelter Outage
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Simulate grid failure disabling shelters
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={params.cooling_centres_offline}
                  onChange={(e) => {
                    setParams(prev => ({ ...prev, cooling_centres_offline: e.target.checked }));
                    setActivePresetName('Custom Scenario');
                  }}
                  className="w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500"
                />
              </label>
            </div>
          </div>

          {/* Saved Scenarios History Panel */}
          {savedSimulations.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 border-b border-slate-100 pb-2">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Saved Scenario Snapshots ({savedSimulations.length})</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {savedSimulations.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSavedScenario(s)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 text-xs transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 line-clamp-1">{s.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(s.created_at).toLocaleDateString()} • Delta {s.parameters.temperature_delta_c}°C
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Load
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Simulation Output & Impact Analysis (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm card-interactive">
              <span className="text-xs text-slate-500 block mb-1">Average Risk Shift</span>
              <div className={`text-2xl font-bold font-mono ${
                currentResult.summary.average_risk_delta > 0 
                  ? 'text-red-600' 
                  : currentResult.summary.average_risk_delta < 0 
                  ? 'text-emerald-600' 
                  : 'text-slate-900'
              }`}>
                {currentResult.summary.average_risk_delta >= 0 ? `+${currentResult.summary.average_risk_delta}` : currentResult.summary.average_risk_delta} pts
              </div>
              <span className="text-[10px] text-slate-400">vs live baseline</span>
            </div>

            <div className="p-4 bg-white border border-red-200 rounded-xl shadow-sm card-interactive">
              <span className="text-xs text-red-600 font-semibold block mb-1">Critical Zones</span>
              <div className="text-2xl font-bold font-mono text-red-700">
                {currentResult.summary.critical_neighbourhoods_count}
              </div>
              <span className="text-[10px] text-slate-500">Risk Score ≥ 75</span>
            </div>

            <div className="p-4 bg-white border border-orange-200 rounded-xl shadow-sm card-interactive">
              <span className="text-xs text-orange-600 font-semibold block mb-1">Additional At-Risk</span>
              <div className="text-2xl font-bold font-mono text-orange-700">
                ~{currentResult.summary.additional_at_risk_residents.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Vulnerable residents</span>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm card-interactive">
              <span className="text-xs text-slate-500 block mb-1">Zones Above 35°C</span>
              <div className="text-2xl font-bold font-mono text-red-600">
                {currentResult.locality_results.filter(l => l.is_above_35).length} / {currentResult.locality_results.length}
              </div>
              <span className="text-[10px] text-slate-400">Trigger thermal alerts</span>
            </div>
          </div>

          {/* Explainable AI Impact Analysis Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Scenario AI Impact Assessment: {currentResult.name}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {currentResult.ai_impact_analysis}
            </p>

            {/* Recommended Interventions */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Recommended Policy & Dispatch Actions:
              </span>
              <div className="space-y-1">
                {currentResult.summary.recommended_interventions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Before vs After Neighbourhood Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-900 text-sm">Neighbourhood Thermal Delta Comparison</h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Red tag applied when simulated temperature &gt; 35°C
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  <tr>
                    <th className="p-3.5">Neighbourhood</th>
                    <th className="p-3.5">Baseline Temp</th>
                    <th className="p-3.5">Simulated Temp</th>
                    <th className="p-3.5">Risk Shift</th>
                    <th className="p-3.5">Outcome Category</th>
                    <th className="p-3.5">Resource Deficit / Operational Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentResult.locality_results.map((loc) => {
                    const tempDelta = Math.round((loc.simulated_temp - loc.baseline_temp) * 10) / 10;
                    const riskDelta = loc.simulated_risk - loc.baseline_risk;

                    return (
                      <tr key={loc.location_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          {loc.location_name}
                        </td>

                        <td className="p-3.5 font-mono text-slate-600">
                          {loc.baseline_temp.toFixed(1)}°C
                        </td>

                        <td className="p-3.5">
                          <span className={`font-mono font-bold ${loc.is_above_35 ? 'text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200' : 'text-slate-800'}`}>
                            {loc.simulated_temp.toFixed(1)}°C
                            <span className="text-[10px] ml-1 text-slate-500">
                              ({tempDelta >= 0 ? `+${tempDelta}` : tempDelta}°)
                            </span>
                          </span>
                        </td>

                        <td className="p-3.5 font-mono">
                          <span className="text-slate-600">{loc.baseline_risk}</span>
                          <span className="mx-1 text-slate-400">→</span>
                          <span className={`font-bold ${riskDelta > 0 ? 'text-red-600' : riskDelta < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {loc.simulated_risk} ({riskDelta >= 0 ? `+${riskDelta}` : riskDelta})
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            loc.simulated_category === 'critical'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : loc.simulated_category === 'high'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : loc.simulated_category === 'moderate'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {loc.simulated_category}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-500 max-w-xs truncate">
                          {loc.resource_deficit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
