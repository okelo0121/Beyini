import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { parseUnits, encodeFunctionData } from 'viem';
import { monadPublicClient, USDC_ABI } from './client';
import { MONAD_USDC_ADDRESS, BEYINI_ESCROW_ADDRESS } from '../auth/privyConfig';
import { useBeyiniAuth } from '../auth/useBeyiniAuth';
import { GasSponsorshipService } from '../services/GasSponsorshipService';
import BeyiniEscrowArtifact from './artifacts/BeyiniEscrow.json';

export const BEYINI_ESCROW_ABI = BeyiniEscrowArtifact.abi;

export interface EscrowPaymentOnChain {
  sender: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  commitment: `0x${string}`;
  createdAt: bigint;
  expiry: bigint;
  status: number; // 0 = NONE, 1 = DEPOSITED, 2 = CLAIMED, 3 = REFUNDED
}

export function useMonadEscrow() {
  const { user: beyiniUser } = useBeyiniAuth();
  const { user, sendTransaction } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = (beyiniUser?.walletAddress || user?.wallet?.address) as `0x${string}` | undefined;

  /**
   * Checks how much USDC the escrow contract is approved to spend on behalf of the user
   */
  const checkAllowance = useCallback(async (ownerAddress?: `0x${string}`): Promise<bigint> => {
    const owner = ownerAddress || walletAddress;
    if (!owner) return 0n;

    try {
      const allowance = await monadPublicClient.readContract({
        address: MONAD_USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [owner, BEYINI_ESCROW_ADDRESS],
      });
      return allowance as bigint;
    } catch (err: any) {
      console.error('Error checking USDC allowance:', err);
      return 0n;
    }
  }, [walletAddress]);

  /**
   * Approves BeyiniEscrow to spend USDC, automatically sponsoring gas if needed
   */
  const approveUSDC = useCallback(async (
    amountUSDC: string,
    onStatusUpdate?: (status: string) => void
  ): Promise<{ txHash: string }> => {
    if (!walletAddress) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);

    try {
      await GasSponsorshipService.checkAndSponsorGas(walletAddress, onStatusUpdate);

      const amountUnits = parseUnits(amountUSDC, 6);
      const data = encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'approve',
        args: [BEYINI_ESCROW_ADDRESS, amountUnits],
      });

      let tx: { hash: string };
      try {
        tx = await sendTransaction({
          to: MONAD_USDC_ADDRESS,
          data,
          chainId: 10143,
        });
      } catch (txErr: any) {
        const errDetails = txErr?.message || txErr?.details || '';
        if (errDetails.includes('insufficient balance')) {
          console.log('[useMonadEscrow] Insufficient gas detected on approval. Sponsoring and retrying...');
          if (onStatusUpdate) onStatusUpdate('Sponsoring Monad network gas for you...');
          await GasSponsorshipService.checkAndSponsorGas(walletAddress, onStatusUpdate);
          tx = await sendTransaction({
            to: MONAD_USDC_ADDRESS,
            data,
            chainId: 10143,
          });
        } else {
          throw txErr;
        }
      }

      // Wait for receipt on Monad single-slot finality
      await monadPublicClient.waitForTransactionReceipt({ hash: tx.hash as `0x${string}` });

      return { txHash: tx.hash };
    } catch (err: any) {
      console.error('USDC approval error:', err);
      const msg = err?.message || 'USDC approval failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, sendTransaction]);

  /**
   * Deposits USDC into BeyiniEscrow with a Zero-PII commitment, automatically sponsoring gas if needed
   */
  const depositToEscrow = useCallback(async ({
    paymentId,
    commitment,
    amountUSDC,
    durationSeconds = 86400, // 24 hours
    onStatusUpdate,
  }: {
    paymentId: `0x${string}`;
    commitment: `0x${string}`;
    amountUSDC: string;
    durationSeconds?: number;
    onStatusUpdate?: (status: string) => void;
  }): Promise<{ txHash: string; blockNumber: bigint }> => {
    if (!walletAddress) throw new Error('Wallet not connected');
    setIsLoading(true);
    setError(null);

    try {
      await GasSponsorshipService.checkAndSponsorGas(walletAddress, onStatusUpdate);

      const amountUnits = parseUnits(amountUSDC, 6);

      // Verify allowance first
      const allowance = await checkAllowance(walletAddress);
      if (allowance < amountUnits) {
        if (onStatusUpdate) onStatusUpdate('Authorizing USDC for BeyiniEscrow on Monad...');
        await approveUSDC(amountUSDC, onStatusUpdate);
      }

      if (onStatusUpdate) onStatusUpdate('Securing funds in BeyiniEscrow on Monad...');

      const data = encodeFunctionData({
        abi: BEYINI_ESCROW_ABI,
        functionName: 'deposit',
        args: [
          paymentId,
          commitment,
          MONAD_USDC_ADDRESS,
          amountUnits,
          BigInt(durationSeconds),
        ],
      });

      let tx: { hash: string };
      try {
        tx = await sendTransaction({
          to: BEYINI_ESCROW_ADDRESS,
          data,
          chainId: 10143,
        });
      } catch (txErr: any) {
        const errDetails = txErr?.message || txErr?.details || '';
        if (errDetails.includes('insufficient balance')) {
          console.log('[useMonadEscrow] Insufficient gas detected on deposit. Sponsoring and retrying...');
          if (onStatusUpdate) onStatusUpdate('Sponsoring Monad network gas for you...');
          await GasSponsorshipService.checkAndSponsorGas(walletAddress, onStatusUpdate);
          tx = await sendTransaction({
            to: BEYINI_ESCROW_ADDRESS,
            data,
            chainId: 10143,
          });
        } else {
          throw txErr;
        }
      }

      const receipt = await monadPublicClient.waitForTransactionReceipt({
        hash: tx.hash as `0x${string}`,
      });

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (err: any) {
      console.error('Escrow deposit error:', err);
      const msg = err?.message || 'Escrow deposit failed on Monad Testnet';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, sendTransaction, checkAllowance, approveUSDC]);

  /**
   * Claims escrow funds by revealing the preimage (identifierHash + salt)
   */
  const claimWithPreimage = useCallback(async ({
    paymentId,
    destination,
    identifierHash,
    salt,
  }: {
    paymentId: `0x${string}`;
    destination: `0x${string}`;
    identifierHash: `0x${string}`;
    salt: `0x${string}`;
  }): Promise<{ txHash: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const activeAddr = walletAddress || destination;
      await GasSponsorshipService.checkAndSponsorGas(activeAddr);

      const data = encodeFunctionData({
        abi: BEYINI_ESCROW_ABI,
        functionName: 'claimWithPreimage',
        args: [paymentId, destination, identifierHash, salt],
      });

      const tx = await sendTransaction({
        to: BEYINI_ESCROW_ADDRESS,
        data,
        chainId: 10143,
      });

      await monadPublicClient.waitForTransactionReceipt({
        hash: tx.hash as `0x${string}`,
      });

      return { txHash: tx.hash };
    } catch (err: any) {
      console.error('Escrow claim error:', err);
      setError(err?.message || 'Escrow claim failed on Monad Testnet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sendTransaction, walletAddress]);

  /**
   * Queries payment record directly from Monad Testnet on-chain source of truth
   */
  const getOnchainPayment = useCallback(async (
    paymentId: `0x${string}`
  ): Promise<EscrowPaymentOnChain | null> => {
    try {
      const payment: any = await monadPublicClient.readContract({
        address: BEYINI_ESCROW_ADDRESS,
        abi: BEYINI_ESCROW_ABI,
        functionName: 'getPayment',
        args: [paymentId],
      });

      // Status 0 = NONE
      if (payment.status === 0 || payment.sender === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      return {
        sender: payment.sender,
        token: payment.token,
        amount: payment.amount,
        commitment: payment.commitment,
        createdAt: payment.createdAt,
        expiry: payment.expiry,
        status: payment.status,
      };
    } catch (err: any) {
      console.error('Failed to query onchain escrow payment:', err);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    ensureGasBalance: GasSponsorshipService.checkAndSponsorGas,
    checkAllowance,
    approveUSDC,
    depositToEscrow,
    claimWithPreimage,
    getOnchainPayment,
  };
}
