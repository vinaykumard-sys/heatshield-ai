import { LocationZone, SimulationParameters, HeatSimulationResult, SimulationLocalityResult, RiskCategory } from '../types';

export const SIMULATION_PRESETS: { name: string; description: string; params: SimulationParameters }[] = [
  {
    name: 'Severe Heatwave Dome (+4.0°C)',
    description: 'Models acute atmospheric high-pressure heat dome with calm winds and high thermal stress.',
    params: {
      temperature_delta_c: 4.0,
      humidity_delta_pct: -5,
      wind_speed_kmh: 8,
      vegetation_coverage_pct: 15,
      cooling_centres_offline: false,
      additional_volunteers: 0
    }
  },
  {
    name: 'Monsoon Pre-Heat Humid Dome',
    description: 'High relative humidity combined with elevated temperatures, drastically spiking apparent wet-bulb stress.',
    params: {
      temperature_delta_c: 2.5,
      humidity_delta_pct: 25,
      wind_speed_kmh: 12,
      vegetation_coverage_pct: 20,
      cooling_centres_offline: false,
      additional_volunteers: 10
    }
  },
  {
    name: 'Cooling Infrastructure Outage',
    description: 'Urban grid power outage disabling municipal cooling centres and water chilling stations.',
    params: {
      temperature_delta_c: 3.5,
      humidity_delta_pct: 5,
      wind_speed_kmh: 10,
      vegetation_coverage_pct: 15,
      cooling_centres_offline: true,
      additional_volunteers: 0
    }
  },
  {
    name: 'Urban Green Canopy Intervention',
    description: 'Simulates intensive urban re-greening (45% tree canopy coverage) mitigating surface radiant heat.',
    params: {
      temperature_delta_c: 1.5,
      humidity_delta_pct: 0,
      wind_speed_kmh: 16,
      vegetation_coverage_pct: 45,
      cooling_centres_offline: false,
      additional_volunteers: 15
    }
  },
  {
    name: 'Maximum Volunteer Surge Mobilization',
    description: 'Simulates full rapid deployment of community volunteers conducting active welfare checks across all wards.',
    params: {
      temperature_delta_c: 3.0,
      humidity_delta_pct: 0,
      wind_speed_kmh: 12,
      vegetation_coverage_pct: 20,
      cooling_centres_offline: false,
      additional_volunteers: 45
    }
  }
];

export function getRiskCategory(score: number): RiskCategory {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

/**
 * Runs isolated what-if mathematical heat simulation against baseline monitored locations.
 * STRICTLY READ-ONLY against production state - does NOT alter live environmental readings.
 */
export function runHeatSimulation(
  locations: LocationZone[],
  params: SimulationParameters,
  scenarioName: string = 'Custom Scenario',
  scenarioDescription: string = ''
): HeatSimulationResult {
  const locality_results: SimulationLocalityResult[] = [];
  let totalBaselineRisk = 0;
  let totalSimulatedRisk = 0;
  let criticalCount = 0;
  let additionalAtRiskPopulation = 0;

  locations.forEach(loc => {
    const baseTemp = loc.current_reading?.temperature_c ?? 36.5;
    const baseRisk = loc.current_risk?.risk_score ?? loc.baseline_vulnerability_score ?? 55;
    const baseCategory: RiskCategory = loc.current_risk?.risk_category || getRiskCategory(baseRisk);

    // 1. Temperature Delta and Vegetation Cooling Mitigation
    // High vegetation/canopy (0-100%) can mitigate ambient radiant heat by up to 2.8°C
    const vegCooling = (params.vegetation_coverage_pct / 100) * 2.8;
    const simulatedTemp = Math.round((baseTemp + params.temperature_delta_c - vegCooling) * 10) / 10;

    // 2. Humidity impact on thermal stress
    const humidityImpact = (params.humidity_delta_pct / 10) * 1.8;

    // 3. Infrastructure outage impact (cooling centres offline adds risk)
    const infrastructurePenalty = params.cooling_centres_offline ? 14 : 0;

    // 4. Volunteer surge relief (additional volunteers reduce unmonitored risk)
    const volunteerRelief = Math.min(18, (params.additional_volunteers / 40) * 15);

    // 5. Urban Heat Island interaction
    const uhiFactor = loc.urban_heat_island_factor || 1.25;
    const thermalStressDelta = ((params.temperature_delta_c * 4.2) + humidityImpact) * (uhiFactor / 1.2);

    const calculatedRisk = Math.min(
      100,
      Math.max(0, Math.round(baseRisk + thermalStressDelta + infrastructurePenalty - volunteerRelief))
    );

    const simulatedCategory = getRiskCategory(calculatedRisk);
    const isAbove35 = simulatedTemp > 35.0;

    if (simulatedCategory === 'critical') {
      criticalCount++;
    }

    // Population estimation impact
    const pop = loc.estimated_population || 85000;
    if (calculatedRisk > baseRisk && (simulatedCategory === 'high' || simulatedCategory === 'critical')) {
      const deltaRatio = (calculatedRisk - baseRisk) / 100;
      additionalAtRiskPopulation += Math.round(pop * deltaRatio * 0.4);
    }

    totalBaselineRisk += baseRisk;
    totalSimulatedRisk += calculatedRisk;

    let resourceDeficit = 'Normal operation';
    if (params.cooling_centres_offline) {
      resourceDeficit = 'Critical Shelter Deficit: 0% active cooling available';
    } else if (calculatedRisk >= 75 && params.additional_volunteers < 15) {
      resourceDeficit = 'Volunteer Deficit: Field check-in capacity below threshold';
    } else if (simulatedTemp > 39 && params.vegetation_coverage_pct < 20) {
      resourceDeficit = 'Thermal Canopy Deficit: Intense radiant surface exposure';
    }

    locality_results.push({
      location_id: loc.id,
      location_name: loc.name,
      baseline_temp: baseTemp,
      simulated_temp: simulatedTemp,
      baseline_risk: baseRisk,
      simulated_risk: calculatedRisk,
      baseline_category: baseCategory,
      simulated_category: simulatedCategory,
      is_above_35: isAbove35,
      resource_deficit: resourceDeficit
    });
  });

  const count = locations.length || 1;
  const avgBaseline = totalBaselineRisk / count;
  const avgSimulated = totalSimulatedRisk / count;
  const average_risk_delta = Math.round((avgSimulated - avgBaseline) * 10) / 10;

  // Generate explainable AI impact analysis
  const interventions: string[] = [];
  if (params.cooling_centres_offline) {
    interventions.push('Activate emergency backup generator systems for primary municipal cooling hubs.');
  }
  if (average_risk_delta > 10) {
    interventions.push('Declare Category-2 Municipal Heat Emergency and suspend non-essential outdoor construction between 11:00 and 16:00.');
  }
  if (params.vegetation_coverage_pct < 25) {
    interventions.push('Prioritise long-term urban forestry and cool roof reflective coatings in high UHI industrial corridors.');
  }
  if (params.additional_volunteers < 20) {
    interventions.push('Mobilise university and civil defence volunteers to conduct scheduled door-to-door welfare verification.');
  }
  if (interventions.length === 0) {
    interventions.push('Maintain current baseline monitoring and automated heat health advisory dispatches.');
  }

  const canopyRelief = ((params.vegetation_coverage_pct / 100) * 2.8).toFixed(1);
  const ai_impact_analysis = `Simulation reveals that a ${params.temperature_delta_c >= 0 ? '+' : ''}${params.temperature_delta_c.toFixed(1)}°C anomaly ${
    params.cooling_centres_offline ? 'compounded by cooling facility outages ' : ''
  }shifts average neighbourhood thermal risk by ${average_risk_delta >= 0 ? '+' : ''}${average_risk_delta} points. ${
    criticalCount > 0 ? `${criticalCount} neighbourhoods enter CRITICAL status (risk score ≥ 75). ` : 'No neighbourhoods reach critical threshold. '
  }Canopy mitigation factors contribute -${canopyRelief}°C radiant cooling relief. Estimated ~${additionalAtRiskPopulation.toLocaleString()} additional community residents will require hydration and active cooling intervention.`;

  return {
    id: `sim-${Date.now()}`,
    name: scenarioName,
    description: scenarioDescription || `Modeled with temperature delta ${params.temperature_delta_c}°C, humidity delta ${params.humidity_delta_pct}%, and ${params.vegetation_coverage_pct}% canopy.`,
    parameters: params,
    created_at: new Date().toISOString(),
    summary: {
      average_risk_delta,
      critical_neighbourhoods_count: criticalCount,
      additional_at_risk_residents: additionalAtRiskPopulation,
      recommended_interventions: interventions
    },
    locality_results,
    ai_impact_analysis
  };
}
