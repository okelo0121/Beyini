import { usePrivy, useWallets, useCreateWallet } from '@privy-io/react-auth';
import type { BeyiniUser } from './types';

export const useBeyiniAuth = () => {
  const {
    ready,
    authenticated,
    user: privyUser,
    login,
    logout,
    linkEmail,
    linkPhone,
    linkPasskey,
    linkWallet,
    connectWallet,
  } = usePrivy();

  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  // Robust multi-source resolution for the active Monad wallet address
  const activeWallet = 
    wallets.find((w) => w.walletClientType === 'privy') ||
    wallets[0] ||
    privyUser?.wallet;

  const linkedWallet = privyUser?.linkedAccounts?.find(
    (a): a is any => a.type === 'wallet'
  );

  const walletAddress = 
    activeWallet?.address || 
    privyUser?.wallet?.address || 
    linkedWallet?.address || 
    '';

  // Map real Privy user to BeyiniUser model
  const user: BeyiniUser | null = privyUser ? {
    id: privyUser.id,
    walletAddress,
    email: privyUser.email?.address || privyUser.google?.email,
    phone: privyUser.phone?.number,
    displayName: privyUser.google?.name || privyUser.email?.address?.split('@')[0] || (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Monad User'),
    avatarUrl: undefined,
    authProvider: privyUser.google ? 'privy_google' : privyUser.email ? 'privy_email' : privyUser.phone ? 'privy_phone' : walletAddress ? 'web3_wallet' : 'privy_passkey',
    isEmbeddedWallet: activeWallet?.walletClientType === 'privy' || privyUser.wallet?.walletClientType === 'privy',
    network: 'monad-testnet',
    balanceUSDC: 0.00,
  } : null;

  return {
    ready,
    isAuthenticated: authenticated,
    user,
    privyUser,
    wallets,
    createWallet,
    login,
    logout,
    linkEmail,
    linkPhone,
    linkPasskey,
    linkWallet,
    connectWallet,
  };
};

export * from './types';
export * from './privyConfig';
