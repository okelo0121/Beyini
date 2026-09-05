import type { SettlementResult } from './types';
import { monadPublicClient } from '../blockchain/client';
import { MONAD_USDC_ADDRESS } from '../auth/privyConfig';

export class WalletAdapter {
  /**
   * Validates if a destination is a valid Monad EVM address
   */
  public static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Retrieves USDC balance for any recipient destination on Monad
   */
  public static async getRecipientBalance(address: `0x${string}`): Promise<bigint> {
    if (!this.isValidAddress(address)) {
      return 0n;
    }

    try {
      const balance = await monadPublicClient.readContract({
        address: MONAD_USDC_ADDRESS,
        abi: [
          {
            type: 'function',
            name: 'balanceOf',
            inputs: [{ name: 'account', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view',
          },
        ],
        functionName: 'balanceOf',
        args: [address],
      });
      return balance as bigint;
    } catch (err) {
      console.error('Error querying recipient balance on Monad:', err);
      return 0n;
    }
  }

  /**
   * Builds settlement confirmation
   */
  public static createSettlementResult(txHash: string, destination: string): SettlementResult {
    return {
      success: true,
      txHash,
      payoutDetails: `Direct Monad EVM Transfer to ${destination}`,
    };
  }
}
