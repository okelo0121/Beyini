import { PaymentService } from './PaymentService';
import { StorageService } from './StorageService';

export interface IndexedActivityItem {
  id: string;
  paymentId: string;
  txHash?: string;
  sender: string;
  recipientName: string;
  recipientIdentifier: string;
  amount: number;
  asset: string;
  network: string;
  status: 'DEPOSITED' | 'CLAIMED' | 'REFUNDED' | 'SECURED' | 'COMPLETED';
  statusLabel: string;
  timestamp: string;
  destinationRail?: string;
  explorerUrl?: string;
}

export class IndexerService {
  /**
   * Fetches unified activity history combining Monad on-chain records, StorageService, and local sessions
   */
  public static async getActivities(userAddress?: string): Promise<IndexedActivityItem[]> {
    const localPayments = PaymentService.getStoredPayments();
    const persistedPayments = StorageService.getLocalPayments();

    // Map persistedPayments to common format
    const mappedPersisted = persistedPayments.map((p) => ({
      paymentId: p.payment_id,
      txHash: p.claim_tx_hash || p.deposit_tx_hash,
      senderAddress: p.sender_address,
      recipientName: p.recipient_identity_value,
      recipientIdentifier: p.recipient_identity_value,
      amountUSDC: p.amount,
      status: (p.status === 'COMPLETED' ? 'CLAIMED' : p.status === 'SECURED' ? 'DEPOSITED' : p.status) as 'DEPOSITED' | 'CLAIMED' | 'REFUNDED',
      createdAt: p.created_at,
      claimDestination: p.claim_destination,
    }));

    // Deduplicate by paymentId
    const seen = new Set<string>();
    const combined = [...mappedPersisted, ...localPayments].filter((item) => {
      if (seen.has(item.paymentId.toLowerCase())) return false;
      seen.add(item.paymentId.toLowerCase());
      return true;
    });

    // Filter by user address if specified
    const filtered = userAddress
      ? combined.filter(
          (p) => p.senderAddress.toLowerCase() === userAddress.toLowerCase()
        )
      : combined;

    return filtered.map((p) => {
      const isClaimed = p.status === 'CLAIMED';
      const isRefunded = p.status === 'REFUNDED';

      const dateObj = new Date(p.createdAt * 1000);
      const timeStr = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        id: p.paymentId,
        paymentId: p.paymentId,
        txHash: p.txHash,
        sender: p.senderAddress,
        recipientName: p.recipientName || 'Recipient',
        recipientIdentifier: p.recipientIdentifier,
        amount: p.amountUSDC,
        asset: 'USDC',
        network: 'Monad Testnet',
        status: p.status,
        statusLabel: isClaimed
          ? 'Settled'
          : isRefunded
          ? 'Refunded'
          : 'Waiting for recipient',
        timestamp: timeStr,
        destinationRail: p.claimDestination || 'Pending Choice',
        explorerUrl: p.txHash && !p.txHash.startsWith('0xmonad_')
          ? `https://testnet.monadexplorer.com/tx/${p.txHash}`
          : undefined,
      };
    });
  }
}
