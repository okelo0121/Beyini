export type AuthProviderType = 
  | 'privy_email' 
  | 'privy_google' 
  | 'privy_phone' 
  | 'privy_passkey' 
  | 'web3_wallet';

export interface BeyiniUser {
  id: string;
  walletAddress: string;
  email?: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  authProvider: AuthProviderType;
  isEmbeddedWallet: boolean;
  network: 'monad-testnet';
  balanceUSDC: number;
}

export interface AuthState {
  user: BeyiniUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginOptions {
  method?: 'email' | 'google' | 'sms' | 'passkey' | 'wallet';
  email?: string;
  phone?: string;
}
