export interface ClaimNotificationPayload {
  paymentId: string;
  salt: string;
  amountUSDC: number;
  senderName?: string;
  recipientIdentifier: string;
}

export class NotificationService {
  /**
   * Generates a direct claim URL
   */
  public static generateClaimUrl(paymentId: string, _salt?: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://beyini.app';
    return `${origin}/#claim/${encodeURIComponent(paymentId)}`;
  }

  /**
   * Generates share message for recipient
   */
  public static generateMessageText({
    amountUSDC,
    senderName = 'Someone',
    claimUrl,
  }: {
    amountUSDC: number;
    senderName?: string;
    claimUrl: string;
  }): string {
    return `${senderName} sent you $${amountUSDC.toFixed(
      2
    )} USDC via Beyini on Monad! Choose how to receive (M-Pesa, Bank, or Crypto): ${claimUrl}`;
  }

  /**
   * Generates WhatsApp direct share link
   */
  public static getWhatsAppShareUrl(phone: string, text: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Generates SMS intent URL
   */
  public static getSmsIntentUrl(phone: string, text: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
  }

  /**
   * Generates Email intent URL
   */
  public static getEmailIntentUrl(email: string, amount: number, text: string): string {
    const subject = `You received $${amount.toFixed(2)} USDC on Beyini`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  }
}
