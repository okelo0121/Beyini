export type PaymentStatus = 
  | 'PENDING' 
  | 'NOTIFIED' 
  | 'CLAIMED' 
  | 'SETTLED' 
  | 'EXPIRED' 
  | 'REFUNDED';

export type ReceivingMethodType = 'Wallet' | 'Monad Wallet' | 'Escrow (Wallet claim)' | 'Mobile Money' | 'PayPal';

export interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  username?: string;
  twitter?: string;
  discord?: string;
  avatarBg: string;
  avatarText: string;
  initial: string;
  verified: boolean;
  lastPayment?: string;
  preferredMethod?: ReceivingMethodType;
}

export interface TransactionLifecycleStep {
  label: string;
  completed: boolean;
  active?: boolean;
}

export interface Transaction {
  id: string;
  txHash?: string;
  isIncoming?: boolean;
  senderAddress?: string;
  recipient: Recipient;
  amount: number;
  asset: string;
  network: string;
  status: PaymentStatus;
  statusLabel: string;
  dateCategory: 'Today' | 'Yesterday' | 'Last Week' | 'Earlier';
  timestamp: string;
  receivingMethod?: string;
  settlementDetails?: string;
  lifecycle: TransactionLifecycleStep[];
}

export interface CurrentUser {
  name: string;
  username: string;
  email: string;
  phone: string;
  walletAddress: string;
  balanceUSDC: number;
  network: string;
}

export const CURRENT_USER: CurrentUser = {
  name: 'Monad User',
  username: 'monad_user',
  email: '',
  phone: '',
  walletAddress: '',
  balanceUSDC: 0,
  network: 'Monad Testnet'
};

export const INITIAL_RECIPIENTS: Recipient[] = [
  {
    id: 'rec-1',
    name: 'Sarah M.',
    email: 'sarah@email.com',
    username: 'sarah_m',
    avatarBg: '#FF6B35',
    avatarText: '#FFFFFF',
    initial: 'S',
    verified: true,
    preferredMethod: 'Wallet'
  },
  {
    id: 'rec-2',
    name: 'John K.',
    phone: '+254700000001',
    username: 'johnk',
    avatarBg: '#E9DFD8',
    avatarText: '#7A5B49',
    initial: 'J',
    verified: true,
    preferredMethod: 'Wallet'
  },
  {
    id: 'rec-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@gmail.com',
    username: 'elena_r',
    avatarBg: '#D8E8E4',
    avatarText: '#2D6659',
    initial: 'E',
    verified: true,
    preferredMethod: 'Wallet'
  },
  {
    id: 'rec-4',
    name: 'David Kim',
    email: 'david.kim@email.com',
    username: 'davidk',
    avatarBg: '#F3E8FF',
    avatarText: '#7E22CE',
    initial: 'D',
    verified: true,
    preferredMethod: 'Wallet'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-sample-1',
    txHash: '0x6e73c882194ad93214b7e882410a8b9f10923c4e',
    isIncoming: false,
    recipient: INITIAL_RECIPIENTS[0],
    amount: 10.00,
    asset: 'USDC',
    network: 'Monad Testnet',
    status: 'NOTIFIED',
    statusLabel: 'Waiting for recipient',
    dateCategory: 'Today',
    timestamp: '2h ago',
    receivingMethod: 'Escrow (Monad claim link)',
    lifecycle: [
      { label: 'Payment secured on Monad', completed: true },
      { label: 'Claim link generated', completed: true },
      { label: 'Recipient identity verified', completed: false, active: true },
      { label: 'Settlement confirmed', completed: false }
    ]
  },
  {
    id: 'tx-sample-2',
    txHash: '0x9a3e491204d88e01924510cae78491c9201e85a1',
    isIncoming: false,
    recipient: INITIAL_RECIPIENTS[1],
    amount: 25.00,
    asset: 'USDC',
    network: 'Monad Testnet',
    status: 'SETTLED',
    statusLabel: 'Completed',
    dateCategory: 'Yesterday',
    timestamp: '1d ago',
    receivingMethod: 'Escrow (Claimed to wallet)',
    lifecycle: [
      { label: 'Payment secured on Monad', completed: true },
      { label: 'Claim link generated', completed: true },
      { label: 'Recipient identity verified', completed: true },
      { label: 'Settlement confirmed', completed: true }
    ]
  },
  {
    id: 'tx-sample-3',
    txHash: '0x4f128bc990142e01a8818c72839410ea092389cd',
    isIncoming: false,
    recipient: INITIAL_RECIPIENTS[2],
    amount: 15.00,
    asset: 'USDC',
    network: 'Monad Testnet',
    status: 'SETTLED',
    statusLabel: 'Completed',
    dateCategory: 'Earlier',
    timestamp: '2d ago',
    receivingMethod: 'Escrow (Claimed to wallet)',
    lifecycle: [
      { label: 'Payment secured on Monad', completed: true },
      { label: 'Claim link generated', completed: true },
      { label: 'Recipient identity verified', completed: true },
      { label: 'Settlement confirmed', completed: true }
    ]
  },
  {
    id: 'tx-sample-4',
    txHash: '0x1276a09bcde10928374019283401928409128374',
    isIncoming: false,
    recipient: {
      id: 'rec-4',
      name: 'David Kim',
      email: 'david.kim@email.com',
      avatarBg: '#F3E8FF',
      avatarText: '#7E22CE',
      initial: 'D',
      verified: true
    },
    amount: 5.00,
    asset: 'USDC',
    network: 'Monad Testnet',
    status: 'SETTLED',
    statusLabel: 'Completed',
    dateCategory: 'Earlier',
    timestamp: '3d ago',
    receivingMethod: 'Escrow (Claimed to wallet)',
    lifecycle: [
      { label: 'Payment secured on Monad', completed: true },
      { label: 'Claim link generated', completed: true },
      { label: 'Recipient identity verified', completed: true },
      { label: 'Settlement confirmed', completed: true }
    ]
  }
];

