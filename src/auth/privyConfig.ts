import { defineChain } from 'viem';
import { sepolia } from 'viem/chains';
import type { PrivyClientConfig } from '@privy-io/react-auth';

const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;
const alchemyRpc = alchemyKey 
  ? `https://monad-testnet.g.alchemy.com/v2/${alchemyKey}` 
  : 'https://testnet-rpc.monad.xyz';

// Monad Testnet Definition for Viem & Privy
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [alchemyRpc, 'https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
});

// Official Monad Circle USDC Contract Address on Testnet
export const MONAD_USDC_ADDRESS = '0x534b2f3A21130d7a60830c2Df862319e593943A3' as const;

// Deployed BeyiniEscrow Contract Address on Monad Testnet
export const BEYINI_ESCROW_ADDRESS = (import.meta.env.VITE_BEYINI_ESCROW_ADDRESS || '0x7b4bcf6ba16b15bd3eca2c920f52d1447970c227') as `0x${string}`;

// Default Privy Configuration for Beyini
export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: 'dark',
    accentColor: '#10B981', // Emerald green
    logo: '/beyini-logo-orange.png',
    showWalletLoginFirst: false, // Prioritize email, phone, and social login
    walletList: ['metamask', 'rabby_wallet', 'rainbow'],
  },
  loginMethods: ['email', 'sms', 'google', 'twitter', 'discord', 'passkey', 'wallet'],
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    showWalletUIs: false, // Seamless non-intrusive embedded signing
  },
  defaultChain: monadTestnet,
  supportedChains: [monadTestnet, sepolia],
};
