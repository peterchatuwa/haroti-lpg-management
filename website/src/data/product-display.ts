export interface CylinderDisplayMeta {
  sku: string;
  usage: string;
  duration: string;
  popular?: boolean;
}

export interface AccessoryDisplayMeta {
  sku: string;
  title: string;
  description: string;
  gradient: string;
}

/** Website display order and marketing copy keyed by ERP SKU */
export const CYLINDER_DISPLAY: CylinderDisplayMeta[] = [
  { sku: 'CYL-6KG', usage: 'Perfect for 1-2 people', duration: '2-3 weeks' },
  { sku: 'CYL-9KG', usage: 'Ideal for small families', duration: '3-4 weeks' },
  {
    sku: 'CYL-12KG',
    usage: 'Most popular choice',
    duration: '4-6 weeks',
    popular: true,
  },
  { sku: 'CYL-19KG', usage: 'Large families', duration: '6-8 weeks' },
  { sku: 'CYL-45KG', usage: 'Commercial & bulk users', duration: '12+ weeks' },
];

export const ACCESSORY_DISPLAY: AccessoryDisplayMeta[] = [
  {
    sku: 'REG-STD',
    title: 'Regulators',
    description: 'Certified safety regulators',
    gradient: 'from-haroti-forest to-haroti-leaf-bright',
  },
  {
    sku: 'BURNER-STD',
    title: 'Gas Stoves',
    description: 'Single & double burner',
    gradient: 'from-haroti-orange to-haroti-flame-hot',
  },
  {
    sku: 'HOSE-1.5M',
    title: 'Hoses',
    description: 'High-quality gas hoses',
    gradient: 'from-haroti-green to-green-600',
  },
  {
    sku: 'KIT-HOME-STD',
    title: 'Starter Kits',
    description: 'Complete cooking solution',
    gradient: 'from-purple-500 to-purple-600',
  },
];

export function formatMwk(amount: number) {
  return `MWK ${amount.toLocaleString('en-MW', { maximumFractionDigits: 0 })}`;
}
