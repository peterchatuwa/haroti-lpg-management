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
    title: 'New Carbon Finance Partnership with WESM',
    excerpt:
      "Haroti Gas partners with World's Energy Solutions for Malawi to generate carbon credits from avoided deforestation.",
    content:
      'Our partnership with WESM supports verified carbon outcomes linked to clean cooking adoption, helping finance PAYC expansion while reducing pressure on Malawi\'s forests.',
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
