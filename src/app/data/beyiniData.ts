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
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

