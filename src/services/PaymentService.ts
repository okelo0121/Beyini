import { IdentityService } from './IdentityService';
import type { IdentityCommitment } from './IdentityService';

export interface EscrowPaymentRecord {
  paymentId: `0x${string}`;
  senderAddress: `0x${string}`;
  recipientIdentifier: string; // phone or email (local client storage only, never onchain)
  recipientName?: string;
  commitment: `0x${string}`;
  salt: `0x${string}`;
  amountUSDC: number;
  txHash?: string;
  createdAt: number;
  expiry: number; // timestamp
  status: 'DEPOSITED' | 'CLAIMED' | 'REFUNDED';
  claimDestination?: string;
}

const STORAGE_KEY = 'beyini_escrow_payments_v1';

export class PaymentService {
  /**
   * Loads saved payments from secure client storage
   */
  public static getStoredPayments(): EscrowPaymentRecord[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Saves payment record to client storage
   */
  public static savePayment(record: EscrowPaymentRecord): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const existing = this.getStoredPayments();
    const updated = [record, ...existing.filter((p) => p.paymentId !== record.paymentId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Retrieves a payment by paymentId
   */
  public static getPaymentById(paymentId: string): EscrowPaymentRecord | null {
    const list = this.getStoredPayments();
    return list.find((p) => p.paymentId.toLowerCase() === paymentId.toLowerCase()) || null;
  }

  /**
   * Updates status of an existing payment
   */
  public static updatePaymentStatus(
    paymentId: string,
    status: 'DEPOSITED' | 'CLAIMED' | 'REFUNDED',
    claimDestination?: string
  ): void {
    const list = this.getStoredPayments();
    const updated = list.map((p) => {
      if (p.paymentId.toLowerCase() === paymentId.toLowerCase()) {
        return {
          ...p,
          status,
          claimDestination: claimDestination || p.claimDestination,
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Prepares a new escrow payment package
   */
  public static createPaymentSession({
    senderAddress,
    recipientIdentifier,
    recipientName,
    amountUSDC,
    durationSeconds = 86400, // 24 hours default
  }: {
    senderAddress: `0x${string}`;
    recipientIdentifier: string;
    recipientName?: string;
    amountUSDC: number;
    durationSeconds?: number;
  }): { commitmentPkg: IdentityCommitment; paymentRecord: EscrowPaymentRecord } {
    const commitmentPkg = IdentityService.createCommitmentPackage(
      senderAddress,
      recipientIdentifier
    );

    const now = Math.floor(Date.now() / 1000);
    const paymentRecord: EscrowPaymentRecord = {
      paymentId: commitmentPkg.paymentId,
      senderAddress,
      recipientIdentifier,
      recipientName,
      commitment: commitmentPkg.commitment,
      salt: commitmentPkg.salt,
      amountUSDC,
      createdAt: now,
      expiry: now + durationSeconds,
      status: 'DEPOSITED',
    };

    this.savePayment(paymentRecord);
    return { commitmentPkg, paymentRecord };
  }
}
