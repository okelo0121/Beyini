import type { NewsItem } from '../types/ecosystem';

export const ecosystemNewsData: NewsItem[] = [
  {
    id: 'news-1',
    headline: 'Monad Metropolis Hackathon kicks off with $250k+ prize pool..',
    source: 'Monad Foundation',
    date: '1 hr ago',
    category: 'Hackathon',
    badgeType: 'alex',
    readTime: '3 min read',
    url: '#metropolis'
  },
  {
    id: 'news-2',
    headline: 'Beyini enables zero-address P2P payments with 1s finality..',
    source: 'Consumer Products & Payments',
    date: '2 hrs ago',
    category: 'Product Launch',
    badgeType: 'crypto',
    readTime: '4 min read',
    url: '#beyini-launch'
  },
  {
    id: 'news-3',
    headline: '10,000 TPS on Monad makes on-chain payments feel invisible..',
    source: 'Monad Research',
    date: '4 hrs ago',
    category: 'Infrastructure',
    badgeType: 'nyc',
    readTime: '2 min read',
    url: '#monad-speed'
  },
  {
    id: 'news-4',
    headline: 'Recipients choose payout: Monad EVM, stablecoins, or bank rails..',
    source: 'Ecosystem Watch',
    date: '6 hrs ago',
    category: 'Payments',
    badgeType: 'bitcoin',
    readTime: '5 min read',
    url: '#multi-rail'
  }
];
