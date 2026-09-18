/**
 * Cloudflare Pages Function for /api/faucet
 * Auto-sponsors 0.05 MON for zero-fee user onboarding
 */

import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
};

export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let address: string | null = null;

  if (request.method === 'POST') {
    try {
      const body: any = await request.json();
      address = body?.address;
    } catch {
      // ignore
    }
  } else if (request.method === 'GET') {
    const url = new URL(request.url);
    address = url.searchParams.get('address');
  } else {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Use GET or POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!address || !address.startsWith('0x') || address.length !== 42) {
    return new Response(JSON.stringify({ error: 'Valid 0x EVM address required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    let pkey = env?.MONAD_DEPLOYER_KEY;
    if (!pkey) {
      return new Response(JSON.stringify({ error: 'MONAD_DEPLOYER_KEY not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    const currentBal = await publicClient.getBalance({ address: address as `0x${string}` });
    if (currentBal > parseEther('0.5')) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Wallet already has sufficient gas balance',
        amount: '0 MON',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: parseEther('0.05'),
    });

    await publicClient.waitForTransactionReceipt({ hash });

    return new Response(JSON.stringify({
      success: true,
      txHash: hash,
      amount: '0.05 MON',
      recipient: address,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Faucet error in Cloudflare function:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Faucet failure' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
