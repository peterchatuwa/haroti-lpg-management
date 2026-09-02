export interface Station {
  code: string;
  name: string;
  region: 'Lilongwe' | 'Blantyre';
  district: string;
  address: string;
  phone: string;
  hours: string;
  services: string[];
  status?: 'open' | 'opening-soon';
  lat?: number;
  lng?: number;
}

const DEFAULT_PHONE = '+265991274228';

export const stations: Station[] = [
  // Lilongwe region
  {
    code: 'LLW-A47-SANA',
    name: 'Area 47 — Sana Mall',
    region: 'Lilongwe',
    district: 'Lilongwe',
    address: 'Sana Mall, Area 47, Lilongwe',
    phone: DEFAULT_PHONE,
    hours: 'Mon-Sat: 7:00 AM - 7:00 PM, Sun: 8:00 AM - 4:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    status: 'open',
    lat: -13.962,
    lng: 33.74,
  },
  {
    code: 'LLW-A47-CHIT',
    name: 'Area 47 — Chitukuko',
    region: 'Lilongwe',
    district: 'Lilongwe',
    address: 'Chitukuko, Area 47, Lilongwe',
    phone: DEFAULT_PHONE,
    hours: 'Opening soon',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    status: 'opening-soon',
    lat: -13.958,
    lng: 33.735,
  },
  {
    code: 'LLW-A10-EKH',
    name: 'Area 10 — Ekhaya Mall',
    region: 'Lilongwe',
    district: 'Lilongwe',
    address: 'Ekhaya Mall, Area 10, Lilongwe',
    phone: DEFAULT_PHONE,
    hours: 'Mon-Sat: 7:00 AM - 8:00 PM, Sun: 8:00 AM - 5:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange', 'Bulk Orders'],
    status: 'open',
    lat: -13.966,
    lng: 33.783,
  },
  {
    code: 'LLW-A25',
    name: 'Area 25 Station',
    region: 'Lilongwe',
    district: 'Lilongwe',
    address: 'Area 25, Lilongwe',
    phone: DEFAULT_PHONE,
    hours: 'Mon-Sat: 7:00 AM - 7:00 PM, Sun: 8:00 AM - 4:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange', 'Bulk Orders'],
    status: 'open',
    lat: -13.983,
    lng: 33.783,
  },
  {
    code: 'SAL-01',
    name: 'Salima',
    region: 'Lilongwe',
    district: 'Salima',
    address: 'Salima Town, Central Region',
    phone: DEFAULT_PHONE,
    hours: 'Mon-Sat: 7:00 AM - 6:00 PM, Sun: 8:00 AM - 2:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    status: 'open',
    lat: -13.783,
    lng: 34.45,
  },
  // Blantyre region
  {
    code: 'BT-LIMBE',
    name: 'Limbe',
    region: 'Blantyre',
    district: 'Blantyre',
    address: 'Limbe, Blantyre',
    phone: DEFAULT_PHONE,
    hours: 'Mon-Sat: 7:00 AM - 7:00 PM, Sun: 8:00 AM - 4:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    status: 'open',
    lat: -15.817,
    lng: 35.05,
  },
  {
    code: 'BT-MACH',
    name: 'Machinjiri',
    region: 'Blantyre',
    district: 'Blantyre',
    address: 'Machinjiri, Blantyre',
    phone: DEFAULT_PHONE,
    hours: 'Mon-Sat: 7:00 AM - 6:00 PM, Sun: 8:00 AM - 2:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    status: 'open',
    lat: -15.84,
    lng: 35.02,
  },
  {
    code: 'BT-LUNZ',
    name: 'Lunzu',
    region: 'Blantyre',
    district: 'Blantyre',
    address: 'Lunzu, Blantyre',
    phone: DEFAULT_PHONE,
    hours: 'Mon-Sat: 7:00 AM - 6:00 PM, Sun: 8:00 AM - 2:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    status: 'open',
    lat: -15.855,
    lng: 34.995,
  },
  {
    code: 'BT-CHIL',
    name: 'Chilomoni',
    region: 'Blantyre',
    district: 'Blantyre',
    address: 'Chilomoni, Blantyre',
    phone: DEFAULT_PHONE,
    hours: 'Mon-Sat: 7:00 AM - 6:00 PM, Sun: 8:00 AM - 2:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    status: 'open',
    lat: -15.828,
    lng: 35.015,
  },
];

export const STATION_COUNT = stations.length;
export const OPEN_STATION_COUNT = stations.filter((s) => s.status !== 'opening-soon').length;
