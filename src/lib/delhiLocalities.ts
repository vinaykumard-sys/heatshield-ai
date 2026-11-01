import { LocationZone } from '../types';

export const DELHI_LOCALITIES: LocationZone[] = [
  {
    id: 'delhi-chandni-chowk',
    name: 'Chandni Chowk & Old Delhi',
    city: 'Delhi',
    state: 'Delhi (Central)',
    pincode: '110006',
    latitude: 28.6506,
    longitude: 77.2304,
    baseline_vulnerability_score: 86.0,
    urban_heat_island_factor: 1.48,
    cooling_centers_count: 3,
    estimated_population: 62000,
  },
  {
    id: 'delhi-connaught-place',
    name: 'Connaught Place & Barakhamba',
    city: 'Delhi',
    state: 'Delhi (New Delhi)',
    pincode: '110001',
    latitude: 28.6315,
    longitude: 77.2167,
    baseline_vulnerability_score: 55.0,
    urban_heat_island_factor: 1.30,
    cooling_centers_count: 5,
    estimated_population: 35000,
  },
  {
    id: 'delhi-rohini-sec16',
    name: 'Rohini Sector 16 & Labour Colony',
    city: 'Delhi',
    state: 'Delhi (North West)',
    pincode: '110089',
    latitude: 28.7350,
    longitude: 77.1120,
    baseline_vulnerability_score: 82.5,
    urban_heat_island_factor: 1.38,
    cooling_centers_count: 2,
    estimated_population: 48000,
  },
  {
    id: 'delhi-anand-vihar',
    name: 'Anand Vihar & ISBT Hub',
    city: 'Delhi',
    state: 'Delhi (East)',
    pincode: '110092',
    latitude: 28.6469,
    longitude: 77.3160,
    baseline_vulnerability_score: 88.0,
    urban_heat_island_factor: 1.52,
    cooling_centers_count: 2,
    estimated_population: 58000,
  },
  {
    id: 'delhi-karol-bagh',
    name: 'Karol Bagh & Prasad Nagar',
    city: 'Delhi',
    state: 'Delhi (Central)',
    pincode: '110005',
    latitude: 28.6520,
    longitude: 77.1906,
    baseline_vulnerability_score: 79.0,
    urban_heat_island_factor: 1.42,
    cooling_centers_count: 3,
    estimated_population: 44000,
  },
  {
    id: 'delhi-lajpat-nagar',
    name: 'Lajpat Nagar & Amar Colony',
    city: 'Delhi',
    state: 'Delhi (South)',
    pincode: '110024',
    latitude: 28.5700,
    longitude: 77.2400,
    baseline_vulnerability_score: 64.0,
    urban_heat_island_factor: 1.25,
    cooling_centers_count: 4,
    estimated_population: 52000,
  },
  {
    id: 'delhi-dwarka-sec10',
    name: 'Dwarka Sub-City & Sector 10',
    city: 'Delhi',
    state: 'Delhi (South West)',
    pincode: '110075',
    latitude: 28.5823,
    longitude: 77.0500,
    baseline_vulnerability_score: 60.0,
    urban_heat_island_factor: 1.22,
    cooling_centers_count: 4,
    estimated_population: 70000,
  },
  {
    id: 'delhi-okhla',
    name: 'Okhla Industrial Phase I & Slum Tenements',
    city: 'Delhi',
    state: 'Delhi (South East)',
    pincode: '110020',
    latitude: 28.5300,
    longitude: 77.2700,
    baseline_vulnerability_score: 89.5,
    urban_heat_island_factor: 1.55,
    cooling_centers_count: 2,
    estimated_population: 68000,
  },
  {
    id: 'delhi-shahdara',
    name: 'Shahdara & Seelampur Ward',
    city: 'Delhi',
    state: 'Delhi (North East)',
    pincode: '110032',
    latitude: 28.6738,
    longitude: 77.2917,
    baseline_vulnerability_score: 91.0,
    urban_heat_island_factor: 1.58,
    cooling_centers_count: 2,
    estimated_population: 82000,
  },
  {
    id: 'delhi-najafgarh',
    name: 'Najafgarh Rural-Urban Fringe',
    city: 'Delhi',
    state: 'Delhi (West)',
    pincode: '110043',
    latitude: 28.6092,
    longitude: 76.9855,
    baseline_vulnerability_score: 75.0,
    urban_heat_island_factor: 1.28,
    cooling_centers_count: 2,
    estimated_population: 39000,
  },
];

export function findNearestDelhiLocality(latitude: number, longitude: number): LocationZone {
  let closest = DELHI_LOCALITIES[0];
  let minDistance = Number.MAX_VALUE;

  for (const loc of DELHI_LOCALITIES) {
    const dLat = loc.latitude - latitude;
    const dLon = loc.longitude - longitude;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  return closest;
}
