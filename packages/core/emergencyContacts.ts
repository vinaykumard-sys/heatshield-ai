export interface EmergencyContact {
  state: string;
  stateCode: string;
  disasterHelpline: string;
  disasterLabel: string;
  medicalHelpline: string;
  healthInfoHelpline: string;
  districtOffices: Array<{ name: string; phone: string; address?: string }>;
}

export const EMERGENCY_CONTACTS: Record<string, EmergencyContact> = {
  delhi: {
    state: 'Delhi (NCT)',
    stateCode: 'DL',
    disasterHelpline: '1077',
    disasterLabel: 'DDMA — Delhi Disaster Management Control Room (Toll Free 24x7)',
    medicalHelpline: '108',
    healthInfoHelpline: '104',
    districtOffices: [
      { name: 'Central Delhi Disaster Control Room', phone: '011-23282906', address: 'Darya Ganj, New Delhi' },
      { name: 'North Delhi Heat Action Cell', phone: '011-27202020', address: 'Alipur, Delhi' },
      { name: 'South Delhi Emergency Ops', phone: '011-29535025', address: 'Saket, New Delhi' },
      { name: 'East Delhi Disaster Management', phone: '011-22151077', address: 'Shastri Nagar, Delhi' },
      { name: 'West Delhi Control Room', phone: '011-25195529', address: 'Rajouri Garden, New Delhi' },
    ],
  },
  gujarat: {
    state: 'Gujarat (Ahmedabad / State)',
    stateCode: 'GJ',
    disasterHelpline: '1070',
    disasterLabel: 'Gujarat State Disaster Management Authority (GSDMA)',
    medicalHelpline: '108',
    healthInfoHelpline: '104',
    districtOffices: [
      { name: 'Ahmedabad Municipal Heat Control Cell', phone: '079-25391811' },
    ],
  },
  maharashtra: {
    state: 'Maharashtra (Mumbai / Nagpur)',
    stateCode: 'MH',
    disasterHelpline: '1077',
    disasterLabel: 'Maharashtra Disaster Relief Helpline',
    medicalHelpline: '108',
    healthInfoHelpline: '104',
    districtOffices: [
      { name: 'BMC Disaster Control Room Mumbai', phone: '022-22694725' },
      { name: 'Nagpur Heat Relief Operations', phone: '0712-2567014' },
    ],
  },
  karnataka: {
    state: 'Karnataka (Bengaluru / State)',
    stateCode: 'KA',
    disasterHelpline: '1070',
    disasterLabel: 'Karnataka State Disaster Management Authority (KSDMA)',
    medicalHelpline: '108',
    healthInfoHelpline: '104',
    districtOffices: [
      { name: 'BBMP Control Room Bengaluru', phone: '080-22221188' },
    ],
  },
  rajasthan: {
    state: 'Rajasthan (Jaipur / State)',
    stateCode: 'RJ',
    disasterHelpline: '1070',
    disasterLabel: 'Rajasthan Disaster Control & Relief Room',
    medicalHelpline: '108',
    healthInfoHelpline: '104',
    districtOffices: [
      { name: 'Jaipur Disaster Helpline', phone: '0141-2227290' },
    ],
  },
  telangana: {
    state: 'Telangana (Hyderabad)',
    stateCode: 'TS',
    disasterHelpline: '1070',
    disasterLabel: 'Telangana Disaster Response Room',
    medicalHelpline: '108',
    healthInfoHelpline: '104',
    districtOffices: [
      { name: 'GHMC Emergency Control Room', phone: '040-21111111' },
    ],
  },
  tamilnadu: {
    state: 'Tamil Nadu (Chennai)',
    stateCode: 'TN',
    disasterHelpline: '1070',
    disasterLabel: 'Tamil Nadu State Disaster Management Control Room',
    medicalHelpline: '108',
    healthInfoHelpline: '104',
    districtOffices: [
      { name: 'Greater Chennai Corporation Helpline', phone: '1913' },
    ],
  },
};

export const HEATSTROKE_FIRST_AID = [
  { step: '1', title: 'Move to Shade or Air-Cooling', text: 'Immediately shift the person into an air-conditioned room or cool shaded area out of direct sunlight.' },
  { step: '2', title: 'Rapid Surface Cooling', text: 'Apply cool, wet cloths on forehead, neck, armpits, and groin. Spray cool water or use a fan to accelerate evaporation.' },
  { step: '3', title: 'Loosen Tight Clothing', text: 'Remove unnecessary outerwear to assist natural thermal regulation.' },
  { step: '4', title: 'Hydrate Only If Conscious', text: 'Sip cold water, ORS solution, or salted lime water. Never force liquids if the person is confused or unconscious.' },
  { step: '5', title: 'Call Emergency 108 / 112', text: 'If body temperature exceeds 40°C (104°F) or if there is confusion, slurred speech, or fainting, call an ambulance immediately.' },
];
