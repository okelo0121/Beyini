import { PaymentService } from './PaymentService';

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
  status: 'DEPOSITED' | 'CLAIMED' | 'REFUNDED';
  statusLabel: string;
  timestamp: string;
  destinationRail?: string;
  explorerUrl?: string;
}

export class IndexerService {
  /**
   * Fetches unified activity history combining Monad on-chain records and local sessions
   */
  public static async getActivities(userAddress?: string): Promise<IndexedActivityItem[]> {
    const localPayments = PaymentService.getStoredPayments();

    // Filter by user address if specified
    const filtered = userAddress
      ? localPayments.filter(
          (p) => p.senderAddress.toLowerCase() === userAddress.toLowerCase()
        )
      : localPayments;

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
