export type PaymentStatus = 
  | 'PENDING' 
  | 'SECURED' 
  | 'CLAIMED' 
  | 'COMPLETED' 
  | 'EXPIRED' 
  | 'REFUNDED';

export interface PaymentRecord {
  payment_id: string;
  contract_payment_id: `0x${string}`;
  sender_address: string;
  recipient_identity_type: 'email' | 'phone' | 'username' | 'twitter' | 'discord';
  recipient_identity_value: string;
  recipient_identity_commitment: `0x${string}`;
  amount: number;
  token_address: string;
  chain_id: number;
  deposit_tx_hash: string;
  salt: `0x${string}`;
  status: PaymentStatus;
  created_at: number;
  claimed_at?: number;
  claim_tx_hash?: string;
  claim_destination?: string;
}

const LOCAL_STORAGE_KEY = 'beyini_persisted_payments_v2';

export class StorageService {
  /**
   * Fetches payment by payment_id from backend API with localStorage fallback
   */
  public static async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.payment_id) {
          return data;
        }
      }
    } catch {
      // Fall through to localStorage
    }

    // LocalStorage fallback
    const local = this.getLocalPayments();
    return local.find((p) => p.payment_id.toLowerCase() === paymentId.toLowerCase()) || null;
  }

  /**
   * Saves or updates payment record
   */
  public static async savePayment(record: PaymentRecord): Promise<void> {
    // 1. Persist to local storage immediately
    const existing = this.getLocalPayments();
    const updated = [record, ...existing.filter((p) => p.payment_id !== record.payment_id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    // 2. Persist to shared backend API so other devices/browsers can access it
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    } catch (err) {
      console.warn('Could not sync payment to /api/payments, saved locally:', err);
    }
  }

  /**
   * Updates payment status and claim hash
   */
  public static async updateStatus(
    paymentId: string,
    status: PaymentStatus,
    claimTxHash?: string,
    claimDestination?: string
  ): Promise<void> {
    const existing = this.getLocalPayments();
    const updated = existing.map((p) => {
      if (p.payment_id.toLowerCase() === paymentId.toLowerCase()) {
        return {
          ...p,
          status,
          claim_tx_hash: claimTxHash || p.claim_tx_hash,
          claim_destination: claimDestination || p.claim_destination,
          claimed_at: status === 'COMPLETED' ? Math.floor(Date.now() / 1000) : p.claimed_at,
        };
      }
      return p;
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    try {
      await fetch(`/api/payments/${encodeURIComponent(paymentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          claim_tx_hash: claimTxHash,
          claim_destination: claimDestination,
          claimed_at: status === 'COMPLETED' ? Math.floor(Date.now() / 1000) : undefined,
        }),
      });
    } catch (err) {
      console.warn('Could not sync status update to /api/payments:', err);
    }
  }

  /**
   * Returns all payments for a given sender
   */
  public static async getPaymentsBySender(senderAddress?: string): Promise<PaymentRecord[]> {
    try {
      const url = senderAddress 
        ? `/api/payments?sender=${encodeURIComponent(senderAddress)}`
        : '/api/payments';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // Fallback
    }

    const local = this.getLocalPayments();
    if (!senderAddress) return local;
    return local.filter((p) => p.sender_address.toLowerCase() === senderAddress.toLowerCase());
  }

  public static getLocalPayments(): PaymentRecord[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
    return [];
  }
}
