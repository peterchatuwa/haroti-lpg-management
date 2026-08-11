export interface Station {
  code: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  hours: string;
  services: string[];
  lat?: number;
  lng?: number;
}

export const stations: Station[] = [
  {
    code: 'SAL-01',
    name: 'Salima Central',
    district: 'Salima',
    address: 'Central Business District, Salima',
    phone: '+265 XXX XXX XXX',
    hours: 'Mon-Sat: 7:00 AM - 6:00 PM, Sun: 8:00 AM - 2:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    lat: -13.7833,
    lng: 34.4500,
  },
  {
    code: 'LLW-01',
    name: 'Lilongwe Area 25',
    district: 'Lilongwe',
    address: 'Area 25, Near Police Station, Lilongwe',
    phone: '+265 XXX XXX XXX',
    hours: 'Mon-Sat: 7:00 AM - 7:00 PM, Sun: 8:00 AM - 4:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange', 'Bulk Orders'],
    lat: -13.9833,
    lng: 33.7833,
  },
  {
    code: 'LLW-02',
    name: 'Lilongwe Kawale',
    district: 'Lilongwe',
    address: 'Kawale Market Area, Lilongwe',
    phone: '+265 XXX XXX XXX',
    hours: 'Mon-Sat: 7:00 AM - 7:00 PM, Sun: 8:00 AM - 4:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    lat: -13.9500,
    lng: 33.7500,
  },
  {
    code: 'LLW-03',
    name: 'Lilongwe Area 3',
    district: 'Lilongwe',
    address: 'Area 3 Shopping Center, Lilongwe',
    phone: '+265 XXX XXX XXX',
    hours: 'Mon-Sat: 7:00 AM - 8:00 PM, Sun: 8:00 AM - 5:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange', 'Bulk Orders'],
    lat: -13.9667,
    lng: 33.7833,
  },
  {
    code: 'BT-01',
    name: 'Blantyre Chichiri',
    district: 'Blantyre',
    address: 'Chichiri Shopping Mall, Blantyre',
    phone: '+265 XXX XXX XXX',
    hours: 'Mon-Sat: 7:00 AM - 8:00 PM, Sun: 8:00 AM - 5:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange', 'Bulk Orders'],
    lat: -15.8000,
    lng: 35.0333,
  },
  {
    code: 'BT-02',
    name: 'Blantyre Limbe',
    district: 'Blantyre',
    address: 'Limbe Town Center, Blantyre',
    phone: '+265 XXX XXX XXX',
    hours: 'Mon-Sat: 7:00 AM - 7:00 PM, Sun: 8:00 AM - 4:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    lat: -15.8167,
    lng: 35.0500,
  },
  {
    code: 'BT-03',
    name: 'Blantyre Ndirande',
    district: 'Blantyre',
    address: 'Ndirande Market Area, Blantyre',
    phone: '+265 XXX XXX XXX',
    hours: 'Mon-Sat: 7:00 AM - 6:00 PM, Sun: 8:00 AM - 2:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    lat: -15.8333,
    lng: 35.0167,
  },
  {
    code: 'BT-04',
    name: 'Blantyre Zingwangwa',
    district: 'Blantyre',
    address: 'Zingwangwa Trading Center, Blantyre',
    phone: '+265 XXX XXX XXX',
    hours: 'Mon-Sat: 7:00 AM - 6:00 PM, Sun: 8:00 AM - 2:00 PM',
    services: ['Cylinder Refills', 'PAYC Enrollment', 'Accessories', 'Cylinder Exchange'],
    lat: -15.8500,
    lng: 35.0000,
  },
];
