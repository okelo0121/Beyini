import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.body || {};
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Valid 0x address required' });
    }

    let pkey = process.env.MONAD_DEPLOYER_KEY || '';
    if (!pkey) {
      return res.status(500).json({ error: 'Faucet deployer key not configured' });
    }
    if (!pkey.startsWith('0x')) pkey = `0x${pkey}`;

    const account = privateKeyToAccount(pkey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http('https://testnet-rpc.monad.xyz'),
    });
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http('https://testnet-rpc.monad.xyz'),
    });

    const hash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: parseEther('0.05'),
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return res.status(200).json({ success: true, txHash: hash, amount: '0.05 MON' });
  } catch (err: any) {
    console.error('Faucet execution error:', err);
    return res.status(500).json({ error: err?.message || 'Faucet failure' });
  }
}
