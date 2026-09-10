export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: 'announcement' | 'milestone' | 'partnership' | 'expansion';
  imageUrl?: string;
}

export const newsArticles: NewsArticle[] = [
  {
    id: '5',
    title: 'Haroti Gas Supplies 16,000 LPG Cylinders for Malawi Electoral Commission Project',
    excerpt:
      'In 2025, Haroti Gas delivered LPG supply and cylinder logistics across all three regions of Malawi for the Malawi Electoral Commission (MEC).',
    content:
      'Haroti Gas was proud to support Malawi\'s democratic process through a major LPG supply contract for the Malawi Electoral Commission (MEC).\n\n' +
      '**National scope** — The project required reliable LPG supply across Malawi\'s three regions — Northern, Central, and Southern — ensuring electoral operations had clean cooking fuel where it was needed.\n\n' +
      '**16,000 cylinders** — Haroti mobilised, staged, and supplied 16,000 LPG cylinders as part of this commission-led programme, drawing on our bulk import, storage, and nationwide distribution capability.\n\n' +
      '**Delivered in 2025** — Completed in 2025, the project demonstrated Haroti\'s ability to execute large-scale, multi-region LPG logistics for institutional clients while maintaining safety and quality standards.\n\n' +
      'This milestone reflects our growing role as a trusted national LPG partner — from household PAYC programmes to high-volume public-sector supply.',
    date: '2026-09-10',
    category: 'milestone',
    imageUrl: '/news/mec-2025-lpg-cylinders.jpeg',
  },
  {
    id: '1',
    title: 'Haroti Gas Announces Ambitious Expansion to 150,000 Households',
    excerpt:
      "We're scaling our PAYC programme to reach 150,000 active households by Year 5, transforming clean cooking access across Malawi.",
    content:
      'Haroti Gas is accelerating its Pay-As-You-Cook (PAYC) rollout with a target of 150,000 active households within five years. The expansion builds on our growing station network, smart-meter technology, and partnerships that make clean LPG cooking affordable for more Malawian families.',
    date: '2026-08-01',
    category: 'announcement',
  },
  {
    id: '2',
    title: 'New Partnership with WESM',
    excerpt:
      'Haroti Gas partners with the Wildlife and Environmental Society of Malawi (WESM) to support clean cooking and forest protection.',
    content:
      'Haroti Gas and WESM (Wildlife and Environmental Society of Malawi) are working together to promote LPG adoption, protect Malawi\'s forests, and expand access to clean cooking through the PAYC programme.',
    date: '2026-07-25',
    category: 'partnership',
  },
  {
    id: '3',
    title: 'New Openings: Area 47 Retail Shop & Nalikule Bulk Wholesale Station',
    excerpt:
      'Haroti Gas is opening a new retail shop in Lilongwe Area 47 and a bulk wholesale LPG station in Nalikule to serve households and commercial customers.',
    content:
      'Haroti Gas continues to expand its footprint across Malawi with two major developments.\n\n' +
      '**Area 47 retail shop (Lilongwe)** — A new Haroti Gas shop in Area 47 will bring cylinder refills, PAYC enrollment, and accessories closer to residents in one of Lilongwe\'s fastest-growing neighbourhoods. Customers will be able to switch to clean LPG cooking with the same trusted Haroti service.\n\n' +
      '**Nalikule bulk wholesale station** — Our new bulk wholesale facility in Nalikule is designed for high-volume LPG supply to franchise partners, institutions, and commercial users. The site strengthens distribution capacity for Lilongwe and surrounding areas, supporting faster refills and reliable stock for the wider network.\n\n' +
      'Both locations reflect Haroti\'s strategy to combine neighbourhood retail with wholesale infrastructure — making clean cooking accessible at the doorstep while keeping the supply chain robust. Follow our station locator for opening dates and hours.',
    date: '2026-08-15',
    category: 'expansion',
  },
  {
    id: '4',
    title: 'Celebrating 10,000 PAYC Households Milestone',
    excerpt:
      'Haroti Gas reaches a major milestone with 10,000+ active PAYC households across Lilongwe, Salima, and Blantyre.',
    content:
      'More than 10,000 households are now cooking with Haroti PAYC smart meters, paying for gas as they use it and reducing reliance on charcoal and firewood.',
    date: '2026-06-30',
    category: 'milestone',
  },
];
