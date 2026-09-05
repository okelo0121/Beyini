import { RampInstantSDK, RampInstantEventTypes } from '@ramp-network/ramp-instant-sdk';
import type { OffRampQuote } from './types';

export interface RampOfframpConfig {
  userAddress: string;
  swapAmount: number; // in USDC
  fiatCurrency?: string; // e.g. 'EUR', 'USD', 'GBP', 'KES'
  fiatValue?: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

export class RampAdapter {
  private static apiKey = (import.meta.env.VITE_RAMP_API_KEY || '').trim();

  public static isConfigured(): boolean {
    return Boolean(this.apiKey.length > 0);
  }

  public static getApiKeyInstructions(): string {
    return 'To register a Ramp Network Partner API key, apply at https://rampnetwork.com (or email partner@ramp.network) and set VITE_RAMP_API_KEY in .env.local';
  }

  /**
   * Fetches real-time price quotes directly from Ramp Network's Host API v3
   */
  public static async getLiveQuote(
    amountUSDC: number,
    fiatCurrency: string = 'USD'
  ): Promise<OffRampQuote> {
    try {
      const response = await fetch('https://api.ramp.network/api/host-api/v3/assets');
      if (!response.ok) {
        throw new Error(`Ramp API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const assets: any[] = data.assets || data;
      const usdcAsset = assets.find((a) => a.symbol === 'USDC' && a.price) || assets[0];

      const rate = usdcAsset?.price?.[fiatCurrency] || usdcAsset?.price?.['USD'] || 1.0;
      const networkFee = usdcAsset?.networkFee || 0.01;
      const fiatAmount = (amountUSDC - networkFee) * rate;

      return {
        cryptoAmount: amountUSDC,
        fiatAmount: Math.max(0, parseFloat(fiatAmount.toFixed(2))),
        fiatCurrency,
        feeUSDC: networkFee,
        exchangeRate: rate,
        provider: 'Ramp Network',
        estimatedSeconds: 30,
      };
    } catch (err) {
      console.warn('Live Ramp Host API quote unavailable, falling back to standard rate:', err);
      // Transparent fallback rate
      const fallbackRate = fiatCurrency === 'EUR' ? 0.92 : fiatCurrency === 'GBP' ? 0.78 : 1.0;
      return {
        cryptoAmount: amountUSDC,
        fiatAmount: parseFloat((amountUSDC * fallbackRate).toFixed(2)),
        fiatCurrency,
        feeUSDC: 0.05,
        exchangeRate: fallbackRate,
        provider: 'Ramp Network',
        estimatedSeconds: 45,
      };
    }
  }

  /**
   * Launch the official Ramp Network Off-ramp Experience
   */
  public static openOfframp({
    userAddress,
    swapAmount,
    fiatCurrency = 'USD',
    onSuccess,
    onClose,
  }: RampOfframpConfig): void {
    // If a partner hostApiKey is configured, use the embedded RampInstantSDK widget
    if (this.isConfigured()) {
      try {
        const widget = new RampInstantSDK({
          hostAppName: 'Beyini',
          hostLogoUrl: 'https://beyini.app/assets/logo.png',
          hostApiKey: this.apiKey,
          flow: 'OFFRAMP',
          userAddress,
          swapAsset: 'USDC',
          offrampAsset: 'USDC',
          fiatCurrency,
          fiatValue: swapAmount.toString(),
          url: 'https://app.ramp.network',
        } as any);

        widget.on(RampInstantEventTypes.WIDGET_CLOSE, () => {
          if (onClose) onClose();
        });

        widget.on(RampInstantEventTypes.OFFRAMP_SALE_CREATED, (event: any) => {
          console.log('Ramp Off-Ramp Sale Created:', event);
          if (onSuccess) onSuccess();
        });

        widget.show();
        return;
      } catch (err) {
        console.warn('Ramp SDK widget initialization issue, falling back to direct hosted URL:', err);
      }
    }

    // Direct Hosted Ramp portal (works without hostApiKey)
    const hostedUrl = `https://app.ramp.network/?hostAppName=Beyini&flow=OFFRAMP&userAddress=${encodeURIComponent(
      userAddress
    )}&swapAsset=USDC&fiatCurrency=${encodeURIComponent(fiatCurrency)}&fiatValue=${swapAmount}`;
    window.open(hostedUrl, '_blank', 'noopener,noreferrer');
    if (onSuccess) onSuccess();
  }
}
