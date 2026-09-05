import { createPublicClient, http, fallback } from 'viem';
import { monadTestnet } from '../auth/privyConfig';

const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY;
const alchemyRpc = alchemyKey 
  ? `https://monad-testnet.g.alchemy.com/v2/${alchemyKey}` 
  : 'https://testnet-rpc.monad.xyz';

const officialRpc = 'https://testnet-rpc.monad.xyz';

// Monad Testnet Public Client with high-performance RPC and fallback
export const monadPublicClient = createPublicClient({
  chain: monadTestnet,
  transport: fallback([
    http(alchemyRpc),
    http(officialRpc)
  ]),
});

export const USDC_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;
