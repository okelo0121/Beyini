import type { SettlementRequest, SettlementResult, OffRampQuote } from './types';
import { RampAdapter } from './RampAdapter';
import { WalletAdapter } from './WalletAdapter';

export class SettlementAdapter {
  /**
   * Universal router directing payment settlement to the recipient's chosen rail
   */
  public static async executeSettlement(
    request: SettlementRequest,
    callbacks?: {
      onSuccess?: () => void;
      onClose?: () => void;
    }
  ): Promise<SettlementResult> {
    const { payoutMethod, amountUSDC, recipientDestination, fiatCurrency } = request;

    switch (payoutMethod) {
      case 'WALLET': {
        if (!WalletAdapter.isValidAddress(recipientDestination)) {
          return {
            success: false,
            error: 'Invalid Monad EVM wallet address provided.',
          };
        }
        return {
          success: true,
          payoutDetails: `Routed to Monad Wallet (${recipientDestination})`,
        };
      }

      case 'RAMP_MOBILE_MONEY':
      case 'RAMP_BANK_TRANSFER':
      case 'RAMP_CARD_DIRECT': {
        // Direct integration via Ramp Network
        RampAdapter.openOfframp({
          userAddress: WalletAdapter.isValidAddress(recipientDestination)
            ? recipientDestination
            : '0x0000000000000000000000000000000000000000',
          swapAmount: amountUSDC,
          fiatCurrency: fiatCurrency || (payoutMethod === 'RAMP_MOBILE_MONEY' ? 'KES' : 'USD'),
          onSuccess: callbacks?.onSuccess,
          onClose: callbacks?.onClose,
        });

        return {
          success: true,
          payoutDetails: `Routed to Ramp Network (${payoutMethod})`,
        };
      }

      default:
        return {
          success: false,
          error: `Unsupported payout method: ${payoutMethod}`,
        };
    }
  }

  /**
   * Fetches real-time off-ramp quote for any rail
   */
  public static async getQuote(
    amountUSDC: number,
    fiatCurrency: string = 'USD'
  ): Promise<OffRampQuote> {
    return RampAdapter.getLiveQuote(amountUSDC, fiatCurrency);
  }
}
