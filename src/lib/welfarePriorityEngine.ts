import { Resident, WelfareCheckin, LocationZone, WelfarePriorityCalculation } from '../types';

export interface WelfarePriorityItem {
  resident: Resident;
  calculation: WelfarePriorityCalculation;
  checkin?: WelfareCheckin;
  locality?: LocationZone;
  recommended_action: string;
}

/**
 * Calculates priority score (0-100) and explainable reasons for a community resident
 * based on environmental thermal stress, time elapsed, vulnerability, and check-in history.
 */
export function calculateResidentPriority(
  resident: Resident,
  residentCheckins: WelfareCheckin[],
  localityRiskScore: number = 55,
  localityTemp: number = 36.5
): WelfarePriorityCalculation {
  const reasons: string[] = [];
  let riskFactorWeight = 0;
  let vulnerabilityWeight = 0;
  let daysOverdueWeight = 0;
  let unsuccessfulAttemptsWeight = 0;

  // 1. Environmental Heat Factor (0 - 35 points)
  if (localityTemp >= 40 || localityRiskScore >= 75) {
    riskFactorWeight = 35;
    reasons.push(`Critical environmental heat stress: ${localityTemp.toFixed(1)}°C (Risk Score: ${localityRiskScore})`);
  } else if (localityTemp >= 37 || localityRiskScore >= 60) {
    riskFactorWeight = 26;
    reasons.push(`Elevated thermal warning: ${localityTemp.toFixed(1)}°C in resident neighbourhood`);
  } else if (localityTemp >= 35 || localityRiskScore >= 45) {
    riskFactorWeight = 16;
    reasons.push(`Moderate heat stress: ${localityTemp.toFixed(1)}°C`);
  } else {
    riskFactorWeight = 8;
  }

  // 2. Vulnerability Factors (0 - 35 points)
  let vulnPoints = 0;

  // Age factor
  if (resident.age_range === '75_plus') {
    vulnPoints += 16;
    reasons.push('High age vulnerability: Senior citizen (75+ years old)');
  } else if (resident.age_range === '60_to_74') {
    vulnPoints += 10;
    reasons.push('Elderly resident (60-74 years old)');
  } else if (resident.age_range === 'under_5') {
    vulnPoints += 12;
    reasons.push('High vulnerability infant / young child (under 5)');
  }

  // Health and dwelling conditions
  const indicators = resident.vulnerability_indicators || [];
  indicators.forEach((ind) => {
    const lower = ind.toLowerCase();
    if (lower.includes('cardio') || lower.includes('heart') || lower.includes('hypertension')) {
      vulnPoints += 8;
      reasons.push('Cardiovascular vulnerability: heightened risk of heat stroke');
    } else if (lower.includes('respiratory') || lower.includes('asthma') || lower.includes('copd')) {
      vulnPoints += 7;
      reasons.push('Respiratory risk factor');
    } else if (lower.includes('alone') || lower.includes('single')) {
      vulnPoints += 6;
      reasons.push('Lives alone: without immediate household support in emergency');
    } else if (lower.includes('tin') || lower.includes('asbestos') || lower.includes('roof')) {
      vulnPoints += 7;
      reasons.push('High radiant heat dwelling: tin/asbestos roofing');
    } else if (lower.includes('outdoor') || lower.includes('worker') || lower.includes('labour')) {
      vulnPoints += 6;
      reasons.push('Occupational exposure: outdoor labourer');
    } else {
      vulnPoints += 4;
    }
  });

  vulnerabilityWeight = Math.min(35, vulnPoints);

  // 3. Time Elapsed Since Last Check-in (0 - 30 points)
  let daysSinceLast = 99; // default to never checked
  if (resident.last_welfare_checkin) {
    const lastDate = new Date(resident.last_welfare_checkin);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    daysSinceLast = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  if (daysSinceLast >= 4 || !resident.last_welfare_checkin) {
    daysOverdueWeight = 25;
    reasons.push(
      resident.last_welfare_checkin
        ? `Overdue: ${daysSinceLast} days since last confirmed welfare check-in`
        : 'Initial intake: No prior welfare check-in on record'
    );
  } else if (daysSinceLast >= 2) {
    daysOverdueWeight = 16;
    reasons.push(`Elapsed time: ${daysSinceLast} days since previous check-in`);
  } else if (daysSinceLast === 1) {
    daysOverdueWeight = 8;
  } else {
    daysOverdueWeight = 0;
  }

  // 4. Previous Unsuccessful Attempts or Escalations (0 - 15 points)
  const lastCheckin = residentCheckins[0];
  if (lastCheckin) {
    if (lastCheckin.status === 'unable_to_contact') {
      unsuccessfulAttemptsWeight = 14;
      reasons.push('Prior attempt: Volunteer was unable to contact or reach resident');
    } else if (lastCheckin.status === 'escalated') {
      unsuccessfulAttemptsWeight = 15;
      reasons.push('Prior escalation: Resident previously required elevated support');
    }
  }

  // Aggregate total score (capped 0-100)
  const rawScore = riskFactorWeight + vulnerabilityWeight + daysOverdueWeight + unsuccessfulAttemptsWeight;
  const priority_score = Math.min(100, Math.max(0, rawScore));

  // Determine Tier
  let priority_tier: 'immediate' | 'urgent' | 'elevated' | 'routine';
  if (priority_score >= 75) {
    priority_tier = 'immediate';
  } else if (priority_score >= 50) {
    priority_tier = 'urgent';
  } else if (priority_score >= 30) {
    priority_tier = 'elevated';
  } else {
    priority_tier = 'routine';
  }

  if (reasons.length === 0) {
    reasons.push('Routine preventive monitoring during normal conditions');
  }

  return {
    resident_id: resident.id,
    priority_score,
    priority_tier,
    reasons,
    days_overdue: daysSinceLast === 99 ? -1 : daysSinceLast,
    risk_factor_weight: riskFactorWeight,
    vulnerability_factor_weight: vulnerabilityWeight,
    unsuccessful_attempts_weight: unsuccessfulAttemptsWeight,
    calculated_at: new Date().toISOString()
  };
}

/**
 * Returns recommended field action string based on tier and indicators
 */
export function getRecommendedAction(tier: 'immediate' | 'urgent' | 'elevated' | 'routine', score: number): string {
  switch (tier) {
    case 'immediate':
      return 'Immediate in-person physical dispatch required within 2 hours. Verify consciousness, vital signs, hydration, and offer transfer to nearest air-conditioned cooling centre.';
    case 'urgent':
      return 'Same-day check-in required. Verify drinking water availability, functioning cooling devices, and signs of thermal exhaustion.';
    case 'elevated':
      return 'Conduct phone or volunteer welfare check within 24 hours. Ensure hydration reminders and provide neighbourhood cooling shelter locations.';
    case 'routine':
    default:
      return 'Standard community monitoring. Send automated WhatsApp/SMS heat health advisory.';
  }
}

/**
 * Computes ranked list of welfare check-in items across all residents.
 */
export function computeRankedWelfareCheckins(
  residents: Resident[],
  checkins: WelfareCheckin[],
  locations: LocationZone[]
): WelfarePriorityItem[] {
  const locMap = new Map<string, LocationZone>();
  locations.forEach(loc => {
    locMap.set(loc.id, loc);
    locMap.set(loc.name.toLowerCase(), loc);
  });

  return residents.map(resident => {
    // Find matching locality
    const locality = locMap.get(resident.locality_id) || 
      locations.find(l => l.name.toLowerCase() === (resident.locality_name || '').toLowerCase());
    
    const riskScore = locality ? (locality.current_risk?.risk_score ?? 55) : 55;
    const temp = locality ? (locality.current_reading?.temperature_c ?? 36.5) : 36.5;

    // Filter checkins for this resident, sorted newest first
    const rCheckins = checkins
      .filter(c => c.resident_id === resident.id)
      .sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime());

    const calculation = calculateResidentPriority(resident, rCheckins, riskScore, temp);
    const recommended_action = getRecommendedAction(calculation.priority_tier, calculation.priority_score);

    return {
      resident,
      calculation,
      checkin: rCheckins[0],
      locality,
      recommended_action
    };
  }).sort((a, b) => b.calculation.priority_score - a.calculation.priority_score);
}
