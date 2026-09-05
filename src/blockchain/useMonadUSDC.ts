import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { formatUnits, parseUnits, encodeFunctionData } from 'viem';
import { monadPublicClient, USDC_ABI } from './client';
import { MONAD_USDC_ADDRESS } from '../auth/privyConfig';
import { useBeyiniAuth } from '../auth/useBeyiniAuth';

export interface UseMonadUSDCResult {
  balance: number;
  balanceFormatted: string;
  rawBalance: bigint;
  decimals: number;
  symbol: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  sendUSDC: (toAddress: string, amount: string) => Promise<{ txHash: string }>;
}

export function useMonadUSDC(): UseMonadUSDCResult {
  const { user: beyiniUser } = useBeyiniAuth();
  const { user, sendTransaction } = usePrivy();
  const [balance, setBalance] = useState<number>(0);
  const [balanceFormatted, setBalanceFormatted] = useState<string>('0.00');
  const [rawBalance, setRawBalance] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = (beyiniUser?.walletAddress || user?.wallet?.address) as `0x${string}` | undefined;

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(0);
      setBalanceFormatted('0.00');
      setRawBalance(0n);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const bal = await monadPublicClient.readContract({
        address: MONAD_USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      });

      const formatted = formatUnits(bal, 6);
      setRawBalance(bal);
      setBalance(parseFloat(formatted));
      setBalanceFormatted(parseFloat(formatted).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }));
    } catch (err: any) {
      console.error('Failed to fetch Monad USDC balance:', err);
      setError(err?.message || 'Error fetching balance');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalance();
    // Poll balance periodically on Monad single-slot finality
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  const sendUSDC = async (toAddress: string, amount: string): Promise<{ txHash: string }> => {
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    const amountInUnits = parseUnits(amount, 6);
    if (amountInUnits > rawBalance) {
      throw new Error(`Insufficient USDC balance. You have ${balanceFormatted} USDC.`);
    }

    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [toAddress as `0x${string}`, amountInUnits],
    });

    // Execute real transaction via Privy
    const tx = await sendTransaction({
      to: MONAD_USDC_ADDRESS,
      data,
      chainId: 10143,
    });

    // Refresh balance after transaction
    setTimeout(() => {
      fetchBalance();
    }, 2000);

    return { txHash: tx.hash };
  };

  return {
    balance,
    balanceFormatted,
    rawBalance,
    decimals: 6,
    symbol: 'USDC',
    isLoading,
    error,
    refetch: fetchBalance,
    sendUSDC,
  };
}
