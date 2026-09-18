/**
 * EmailNotificationService - Client-side service for dispatching transactional emails
 * via the secure backend proxy (/api/notify) powered by Resend.
 */

export interface ClaimInvitationEmailParams {
  to: string;
  amount: number | string;
  senderName?: string;
  claimUrl: string;
  txHash?: string;
}

export interface ClaimConfirmationEmailParams {
  to: string;
  amount: number | string;
  claimTxHash: string;
  destinationAddress: string;
}

export interface WelcomeEmailParams {
  to: string;
  walletAddress: string;
  name?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  id?: string;
  error?: string;
  warning?: string;
}

export class EmailNotificationService {
  /**
   * Helper to POST to /api/notify
   */
  private static async postNotification(payload: any): Promise<EmailDispatchResult> {
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error || `Email dispatch failed with status ${response.status}`;
        console.warn('[EmailNotificationService] Notification dispatch notice:', errorMsg, data);
        
        // Check for common Resend sandbox restriction
        if (data?.details?.name === 'validation_error' || errorMsg.includes('testing emails')) {
          return {
            success: false,
            warning: 'Resend Sandbox Mode: Test emails are delivered to the registered Resend account owner until a custom domain is verified.',
            error: errorMsg,
          };
        }

        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: true,
        id: data.id,
      };
    } catch (err: any) {
      console.error('[EmailNotificationService] Network error dispatching notification:', err);
      return {
        success: false,
        error: err?.message || 'Network error',
      };
    }
  }

  /**
   * Dispatches a Claim Invitation email to the recipient with their unique claim link
   */
  public static async sendClaimInvitation(params: ClaimInvitationEmailParams): Promise<EmailDispatchResult> {
    if (!params.to || !params.to.includes('@')) {
      return { success: false, error: 'Valid email address required' };
    }

    return this.postNotification({
      type: 'CLAIM_INVITATION',
      to: params.to,
      amount: params.amount,
      senderName: params.senderName,
      claimUrl: params.claimUrl,
      txHash: params.txHash,
    });
  }

  /**
   * Dispatches a Claim Confirmation email once funds have been withdrawn from escrow on Monad
   */
  public static async sendClaimConfirmation(params: ClaimConfirmationEmailParams): Promise<EmailDispatchResult> {
    if (!params.to || !params.to.includes('@')) {
      return { success: false, error: 'Valid email address required' };
    }

    return this.postNotification({
      type: 'CLAIM_CONFIRMED',
      to: params.to,
      amount: params.amount,
      destinationAddress: params.destinationAddress,
      txHash: params.claimTxHash,
    });
  }

  /**
   * Dispatches a Welcome email when a user registers or logs in with their email/Privy
   */
  public static async sendWelcomeNotification(params: WelcomeEmailParams): Promise<EmailDispatchResult> {
    if (!params.to || !params.to.includes('@')) {
      return { success: false, error: 'Valid email address required' };
    }

    return this.postNotification({
      type: 'WELCOME',
      to: params.to,
      walletAddress: params.walletAddress,
      recipientName: params.name,
    });
  }
}
