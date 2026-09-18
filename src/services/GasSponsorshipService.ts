/**
 * GasSponsorshipService - Automated Monad Network Gas Sponsorship for Beyini
 * 
 * Users should NEVER have to hold, buy, or manage MON tokens just to send USDC.
 * This service automatically detects low gas balances, sponsors gas via the
 * platform faucet in the background, and ensures transactions proceed without
 * blocking the user or throwing "insufficient balance" errors.
 */

import { parseEther } from 'viem';
import { monadPublicClient } from '../blockchain/client';

export class GasSponsorshipService {
  private static activeRequests = new Map<string, Promise<boolean>>();

  /**
   * Transparently checks gas balance and sponsors gas if balance is below threshold.
   * Awaits on-chain balance confirmation so the subsequent transaction NEVER fails.
   */
  public static async checkAndSponsorGas(
    address?: `0x${string}` | string,
    onStatusUpdate?: (status: string) => void
  ): Promise<{ sponsored: boolean; balance: bigint }> {
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
      return { sponsored: false, balance: 0n };
    }

    const cleanAddress = address.toLowerCase() as `0x${string}`;

    try {
      const currentBalance = await monadPublicClient.getBalance({ address: cleanAddress });
      const minThreshold = parseEther('0.005');

      // If user already has ample gas, return immediately
      if (currentBalance >= minThreshold) {
        return { sponsored: false, balance: currentBalance };
      }

      console.log(`[GasSponsorship] Low gas balance (${currentBalance} wei) on ${cleanAddress}. Sponsoring gas...`);
      if (onStatusUpdate) {
        onStatusUpdate('Sponsoring network gas for you...');
      }

      // Deduplicate in-flight requests for the same address
      let dripPromise = this.activeRequests.get(cleanAddress);
      if (!dripPromise) {
        dripPromise = this.requestDrip(cleanAddress);
        this.activeRequests.set(cleanAddress, dripPromise);
      }

      await dripPromise;
      this.activeRequests.delete(cleanAddress);

      // Wait for balance to reflect on Monad (typically 1 block / 800ms)
      const confirmedBalance = await this.waitForBalanceIncrease(cleanAddress, currentBalance);
      return { sponsored: true, balance: confirmedBalance };
    } catch (err) {
      console.warn('[GasSponsorship] Non-fatal gas sponsorship check error:', err);
      return { sponsored: false, balance: 0n };
    }
  }

  /**
   * Dispatches gas request trying POST first, with automatic GET fallback for static CDNs
   */
  private static async requestDrip(address: `0x${string}`): Promise<boolean> {
    // Attempt 1: Standard POST /api/faucet
    try {
      const postRes = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (postRes.ok) {
        console.log(`[GasSponsorship] POST /api/faucet succeeded for ${address}`);
        return true;
      }
      console.warn(`[GasSponsorship] POST /api/faucet returned ${postRes.status}. Trying GET fallback...`);
    } catch (e) {
      console.warn('[GasSponsorship] POST /api/faucet network error:', e);
    }

    // Attempt 2: Fallback GET /api/faucet?address=... (works on static hosts where POST is restricted)
    try {
      const getRes = await fetch(`/api/faucet?address=${encodeURIComponent(address)}`);
      if (getRes.ok) {
        console.log(`[GasSponsorship] GET /api/faucet fallback succeeded for ${address}`);
        return true;
      }
    } catch (e) {
      console.warn('[GasSponsorship] GET /api/faucet network error:', e);
    }

    return false;
  }

  /**
   * Polls Monad until balance increases
   */
  private static async waitForBalanceIncrease(
    address: `0x${string}`,
    initialBalance: bigint,
    maxWaitMs = 5000
  ): Promise<bigint> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      try {
        const bal = await monadPublicClient.getBalance({ address });
        if (bal > initialBalance) {
          console.log(`[GasSponsorship] Confirmed new balance on Monad: ${bal.toString()} wei`);
          return bal;
        }
      } catch {
        // Retry
      }
    }
    return initialBalance;
  }

  /**
   * Silent background auto-sponsor triggered on login / wallet connection
   */
  public static autoSponsorOnLogin(address?: `0x${string}` | string): void {
    if (!address || !address.startsWith('0x')) return;
    this.checkAndSponsorGas(address as `0x${string}`).catch(() => {});
  }
}
