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
    excerpt: 'We\'re scaling our PAYC programme to reach 150,000 active households by Year 5, transforming clean cooking access across Malawi.',
    content: 'Full article content here...',
    date: '2026-08-01',
    category: 'announcement',
  },
  {
    id: '2',
    title: 'New Carbon Finance Partnership with WESM',
    excerpt: 'Haroti Gas partners with World\'s Energy Solutions for Malawi to generate carbon credits from avoided deforestation.',
    content: 'Full article content here...',
    date: '2026-07-25',
    category: 'partnership',
  },
  {
    id: '3',
    title: 'New Station Opening in Blantyre Zingwangwa',
    excerpt: 'Our newest franchise station brings clean LPG cooking to Zingwangwa community, creating local jobs and economic opportunities.',
    content: 'Full article content here...',
    date: '2026-07-15',
    category: 'expansion',
  },
  {
    id: '4',
    title: 'Celebrating 10,000 PAYC Households Milestone',
    excerpt: 'Haroti Gas reaches major milestone with 10,000+ active PAYC households across Salima, Lilongwe, and Blantyre.',
    content: 'Full article content here...',
    date: '2026-06-30',
    category: 'milestone',
  },
];
