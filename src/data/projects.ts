import type { ProjectShowcase } from '../types/ecosystem';

export const showcaseProjectsData: ProjectShowcase[] = [
  {
    id: 'proj-1',
    name: 'Beyini P2P\nWeb App',
    category: 'Consumer Payments',
    description: 'Send global payments using an email, phone number, or handle. Zero address friction, instant settlement, and recipient flexibility.',
    iconType: 'stacks',
    accentColor: '#FF5500',
    stats: '10,000 TPS Ready',
    linkText: 'Launch Beyini'
  },
  {
    id: 'proj-2',
    name: 'Monad Instant\nSettlement',
    category: 'Execution Engine',
    description: 'Powered by Monad’s pipelined EVM and MonadBFT consensus. 1-second single-slot finality ensures payments settle as fast as a message.',
    iconType: 'alex',
    accentColor: '#FF7733',
    stats: '< 1s Finality',
    linkText: 'View Monad Specs'
  },
  {
    id: 'proj-3',
    name: 'Self-Custodial\nSmart Escrow',
    category: 'Security & Trust',
    description: 'Payments are locked in transparent, audited Monad smart contracts. Only the intended recipient can unlock funds using verifiable authentication.',
    iconType: 'xverse',
    accentColor: '#10B981',
    stats: '100% Non-Custodial',
    linkText: 'Audit Reports'
  },
  {
    id: 'proj-4',
    name: 'Multi-Rail\nPayout Hub',
    category: 'Off-Ramps & Wallets',
    description: 'Recipients choose how they want to receive: native Monad tokens, stablecoins (USDC/USDT), or direct off-ramp into local currency accounts.',
    iconType: 'meta',
    accentColor: '#00B4FF',
    stats: 'Global Coverage',
    linkText: 'Explore Rails'
  }
];
