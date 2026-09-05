export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  date?: string;
  category?: string;
  badgeType: 'alex' | 'nyc' | 'crypto' | 'bitcoin';
  readTime?: string;
  url?: string;
}

export interface ProjectShowcase {
  id: string;
  name: string;
  category: string;
  description: string;
  iconType: 'stacks' | 'alex' | 'xverse' | 'meta';
  accentColor?: string;
  stats?: string;
  linkText?: string;
}

export interface DirectoryCategory {
  id: string;
  label: string;
  href?: string;
  count?: number;
}
