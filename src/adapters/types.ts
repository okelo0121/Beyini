/**
 * Global Settlement & Off-ramp Types for Beyini Protocol
 */

export type PayoutMethod = 
  | 'WALLET'              // Direct Monad EVM / Web3 Wallet (USDC)
  | 'RAMP_MOBILE_MONEY'   // Mobile Money (e.g. M-Pesa via Ramp Network)
  | 'RAMP_BANK_TRANSFER'  // Bank Transfer (SEPA / ACH / Faster Payments via Ramp Network)
  | 'RAMP_CARD_DIRECT';   // Visa Direct / Mastercard Send via Ramp Network

export interface SettlementRequest {
  paymentId: string;
  amountUSDC: number;
  recipientDestination: string; // Address, phone, or IBAN
  payoutMethod: PayoutMethod;
  fiatCurrency?: string;       // e.g. 'KES', 'EUR', 'USD', 'GBP'
}

export interface SettlementResult {
  success: boolean;
  txHash?: string;
  saleId?: string;
  payoutDetails?: string;
  error?: string;
}

export interface OffRampQuote {
  cryptoAmount: number;
  fiatAmount: number;
  fiatCurrency: string;
  feeUSDC: number;
  exchangeRate: number;
  provider: 'Ramp Network' | 'Native Monad Escrow';
  estimatedSeconds: number;
}
