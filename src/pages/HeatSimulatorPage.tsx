import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Save, 
  Flame, 
  Trees, 
  Users, 
  PowerOff, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  History,
  Info,
  Droplets,
  Wind
} from 'lucide-react';
import { mockDb } from '../lib/mockDb';
import { LocationZone, SimulationParameters, HeatSimulationResult } from '../types';
import { SIMULATION_PRESETS, runHeatSimulation } from '../lib/simulationEngine';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

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
      created_by: user?.full_name || 'Community Safety Planner'
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
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Heat Simulator
            </h1>
            <Badge variant="brand" size="sm">Interactive Sandbox</Badge>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Test hypothetical heat conditions, tree canopy interventions, and emergency response capacity.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetBaseline}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveScenario}
            disabled={isSaved}
            icon={isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          >
            {isSaved ? 'Scenario Saved' : 'Save Scenario'}
          </Button>
        </div>
      </div>

      {/* Sandbox Notice Banner */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-[20px] flex items-center justify-between text-xs text-blue-950">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-[#1E60F2] shrink-0" />
          <span>
            <strong>Simulation Sandbox:</strong> Adjust parameters below to project heat outcomes. Real-time community data and weather feeds remain protected.
          </span>
        </div>
      </div>

      {/* Preset Scenario Cards */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
          Choose a Scenario Preset
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SIMULATION_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className={`p-3.5 rounded-[18px] border text-left transition-all ${
                activePresetName === p.name
                  ? 'border-[#1E60F2] bg-blue-50/60 ring-2 ring-[#1E60F2]/10'
                  : 'border-[#E5EDF5] bg-white hover:border-slate-300 hover:bg-[#F5F8FC]'
              }`}
            >
              <div className="font-bold text-xs text-[#0F172A] line-clamp-1">{p.name}</div>
              <div className="text-[11px] text-[#64748B] line-clamp-2 mt-1">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Parameters on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sliders Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card padding="lg" className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5EDF5] pb-3">
              <h3 className="font-bold text-[#0F172A] text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1E60F2]" />
                <span>Adjust Parameters</span>
              </h3>
              <Badge variant="outline" size="sm">Controls</Badge>
            </div>

            {/* Scenario Name Field */}
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Scenario Title
              </label>
              <input
                type="text"
                value={scenarioNameInput}
                onChange={(e) => {
                  setScenarioNameInput(e.target.value);
                  setActivePresetName('Custom Scenario');
                }}
                className="w-full bg-[#F5F8FC] border border-[#E5EDF5] rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#1E60F2]"
              />
            </div>

            {/* Slider 1: Temperature Delta */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>Temperature Change</span>
                </span>
                <span className="font-bold text-red-600">
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
                className="w-full h-2 bg-[#E5EDF5] rounded-lg appearance-none cursor-pointer accent-[#1E60F2]"
              />
              <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-medium">
                <span>-5.0°C</span>
                <span>0°C (Current)</span>
                <span>+8.0°C</span>
              </div>
            </div>

            {/* Slider 2: Humidity Delta */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>Humidity Shift</span>
                </span>
                <span className="font-bold text-sky-700">
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
                className="w-full h-2 bg-[#E5EDF5] rounded-lg appearance-none cursor-pointer accent-[#1E60F2]"
              />
              <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-medium">
                <span>-25% (Dry)</span>
                <span>0% (Baseline)</span>
                <span>+35% (Humid Dome)</span>
              </div>
            </div>

            {/* Slider 3: Urban Canopy / Vegetation Coverage */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Trees className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tree Canopy Coverage</span>
                </span>
                <span className="font-bold text-emerald-700">
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
                className="w-full h-2 bg-[#E5EDF5] rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-medium">
                <span>0% (Sparse)</span>
                <span>25% (Average)</span>
                <span>100% (Dense)</span>
              </div>
            </div>

            {/* Slider 4: Additional Volunteers */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#1E60F2]" />
                  <span>Volunteer Surge Aid</span>
                </span>
                <span className="font-bold text-[#0F172A]">
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
                className="w-full h-2 bg-[#E5EDF5] rounded-lg appearance-none cursor-pointer accent-[#1E60F2]"
              />
              <div className="flex justify-between text-[10px] text-[#64748B] mt-1 font-medium">
                <span>0</span>
                <span>+25</span>
                <span>+50</span>
              </div>
            </div>

            {/* Toggle: Cooling Centres Outage */}
            <div className="pt-2 border-t border-[#E5EDF5]">
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-[#E5EDF5] hover:bg-[#F5F8FC] transition-colors">
                <div className="flex items-center gap-2.5">
                  <PowerOff className={`w-4 h-4 ${params.cooling_centres_offline ? 'text-red-600' : 'text-[#64748B]'}`} />
                  <div>
                    <span className="text-xs font-semibold text-[#0F172A] block">
                      Cooling Center Outage
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Simulate grid blackout disabling shelters
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
                  className="w-4 h-4 rounded text-red-600 border-[#E5EDF5] focus:ring-red-500"
                />
              </label>
            </div>
          </Card>

          {/* Saved Scenarios History Panel */}
          {savedSimulations.length > 0 && (
            <Card padding="md" className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] border-b border-[#E5EDF5] pb-2">
                <History className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Saved Scenarios ({savedSimulations.length})</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {savedSimulations.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleLoadSavedScenario(s)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#F5F8FC] border border-transparent hover:border-[#E5EDF5] text-xs transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-[#0F172A] line-clamp-1">{s.name}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {new Date(s.created_at).toLocaleDateString()} • Delta {s.parameters.temperature_delta_c}°C
                      </div>
                    </div>
                    <Badge variant="outline" size="sm">Load</Badge>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Simulation Output & Impact Analysis (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Card padding="md">
              <span className="text-xs text-[#64748B] block mb-1">Risk Score Shift</span>
              <div className={`text-2xl font-extrabold ${
                currentResult.summary.average_risk_delta > 0 
                  ? 'text-red-600' 
                  : currentResult.summary.average_risk_delta < 0 
                  ? 'text-emerald-600' 
                  : 'text-[#0F172A]'
              }`}>
                {currentResult.summary.average_risk_delta >= 0 ? `+${currentResult.summary.average_risk_delta}` : currentResult.summary.average_risk_delta} pts
              </div>
              <span className="text-[11px] text-[#64748B]">vs current baseline</span>
            </Card>

            <Card padding="md" className="border-red-200">
              <span className="text-xs text-red-600 font-semibold block mb-1">High Risk Areas</span>
              <div className="text-2xl font-extrabold text-red-700">
                {currentResult.summary.critical_neighbourhoods_count}
              </div>
              <span className="text-[11px] text-[#64748B]">Risk Score ≥ 75</span>
            </Card>

            <Card padding="md" className="border-amber-200">
              <span className="text-xs text-amber-700 font-semibold block mb-1">At-Risk Residents</span>
              <div className="text-2xl font-extrabold text-amber-800">
                ~{currentResult.summary.additional_at_risk_residents.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#64748B]">Vulnerable population</span>
            </Card>

            <Card padding="md">
              <span className="text-xs text-[#64748B] block mb-1">Zones Above 35°C</span>
              <div className="text-2xl font-extrabold text-red-600">
                {currentResult.locality_results.filter(l => l.is_above_35).length} / {currentResult.locality_results.length}
              </div>
              <span className="text-[11px] text-[#64748B]">Exceeding warning threshold</span>
            </Card>
          </div>

          {/* AI Impact Analysis Card */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1E60F2]" />
              <h3 className="font-bold text-[#0F172A] text-base">
                Scenario Impact Assessment: {currentResult.name}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed bg-[#F5F8FC] p-4 rounded-2xl border border-[#E5EDF5]">
              {currentResult.ai_impact_analysis}
            </p>

            {/* Recommended Interventions */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
                Recommended Actions
              </span>
              <div className="space-y-1.5">
                {currentResult.summary.recommended_interventions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#0F172A]">
                    <CheckCircle2 className="w-4 h-4 text-[#1E60F2] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Before vs After Neighbourhood Comparison Table */}
          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-[#E5EDF5] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#64748B]" />
                <h3 className="font-bold text-[#0F172A] text-sm">Neighbourhood Comparison</h3>
              </div>
              <span className="text-xs text-[#64748B]">
                Projected thermal conditions by sector
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F8FC] border-b border-[#E5EDF5] text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
                  <tr>
                    <th className="p-4">Neighbourhood</th>
                    <th className="p-4">Baseline Temp</th>
                    <th className="p-4">Simulated Temp</th>
                    <th className="p-4">Risk Shift</th>
                    <th className="p-4">Projected Level</th>
                    <th className="p-4">Operational Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EDF5]">
                  {currentResult.locality_results.map((loc) => {
                    const tempDelta = Math.round((loc.simulated_temp - loc.baseline_temp) * 10) / 10;
                    const riskDelta = loc.simulated_risk - loc.baseline_risk;

                    return (
                      <tr key={loc.location_id} className="hover:bg-[#F5F8FC]/50 transition-colors">
                        <td className="p-4 font-bold text-[#0F172A]">
                          {loc.location_name}
                        </td>

                        <td className="p-4 text-[#64748B]">
                          {loc.baseline_temp.toFixed(1)}°C
                        </td>

                        <td className="p-4">
                          <span className={`font-semibold ${loc.is_above_35 ? 'text-red-700 bg-red-50 px-2 py-0.5 rounded-full' : 'text-[#0F172A]'}`}>
                            {loc.simulated_temp.toFixed(1)}°C
                            <span className="text-[11px] ml-1 text-[#64748B] font-normal">
                              ({tempDelta >= 0 ? `+${tempDelta}` : tempDelta}°)
                            </span>
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="text-[#64748B]">{loc.baseline_risk}</span>
                          <span className="mx-1.5 text-[#64748B]">→</span>
                          <span className={`font-bold ${riskDelta > 0 ? 'text-red-600' : riskDelta < 0 ? 'text-emerald-600' : 'text-[#0F172A]'}`}>
                            {loc.simulated_risk} ({riskDelta >= 0 ? `+${riskDelta}` : riskDelta})
                          </span>
                        </td>

                        <td className="p-4">
                          <Badge variant={
                            loc.simulated_category === 'critical' ? 'danger' :
                            loc.simulated_category === 'high' ? 'warning' :
                            loc.simulated_category === 'moderate' ? 'warning' : 'success'
                          } size="sm">
                            {loc.simulated_category}
                          </Badge>
                        </td>

                        <td className="p-4 text-[#64748B] max-w-xs truncate">
                          {loc.resource_deficit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
