import { useState, useEffect, useRef } from 'react';
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
    linkTwitter,
    linkDiscord,
    linkPasskey,
    linkWallet,
    connectWallet,
  } = usePrivy();

  const { wallets } = useWallets();
  const { createWallet: privyCreateWallet } = useCreateWallet();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const creationAttemptedRef = useRef(false);

  // Auto-provision embedded wallet in background for authenticated users
  useEffect(() => {
    if (!ready || !authenticated || !privyUser) return;

    const hasAnyWallet = Boolean(
      wallets.length > 0 ||
      privyUser.wallet ||
      privyUser.linkedAccounts?.some((a) => a.type === 'wallet')
    );

    if (!hasAnyWallet && !creationAttemptedRef.current) {
      creationAttemptedRef.current = true;
      setIsCreatingWallet(true);
      privyCreateWallet()
        .then(() => {
          console.log('[Beyini] Monad embedded wallet created automatically in background');
        })
        .catch((err) => {
          console.warn('[Beyini] Automatic wallet provisioning error or already created:', err);
          creationAttemptedRef.current = false;
        })
        .finally(() => {
          setIsCreatingWallet(false);
        });
    }
  }, [ready, authenticated, privyUser, wallets, privyCreateWallet]);

  const createWallet = async () => {
    setIsCreatingWallet(true);
    try {
      return await privyCreateWallet();
    } finally {
      setIsCreatingWallet(false);
    }
  };

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

  const twitterUsername = privyUser?.twitter?.username || undefined;
  const discordUsername = privyUser?.discord?.username || undefined;

  // Determine primary display name
  const displayName = 
    (twitterUsername ? `@${twitterUsername}` : null) ||
    discordUsername ||
    privyUser?.google?.name || 
    privyUser?.email?.address?.split('@')[0] || 
    (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Monad User');

  // Determine auth provider type
  const authProvider = 
    privyUser?.twitter ? 'privy_twitter' :
    privyUser?.discord ? 'privy_discord' :
    privyUser?.google ? 'privy_google' :
    privyUser?.email ? 'privy_email' :
    privyUser?.phone ? 'privy_phone' :
    walletAddress ? 'web3_wallet' : 'privy_passkey';

  // Map real Privy user to BeyiniUser model
  const user: BeyiniUser | null = privyUser ? {
    id: privyUser.id,
    walletAddress,
    email: privyUser.email?.address || privyUser.google?.email,
    phone: privyUser.phone?.number,
    twitterUsername,
    discordUsername,
    displayName,
    avatarUrl: privyUser.twitter?.profilePictureUrl || undefined,
    authProvider,
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
    isCreatingWallet,
    login,
    logout,
    linkEmail,
    linkPhone,
    linkTwitter,
    linkDiscord,
    linkPasskey,
    linkWallet,
    connectWallet,
  };
};

export * from './types';
export * from './privyConfig';
