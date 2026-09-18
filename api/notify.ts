/**
 * Serverless notification handler for Resend email dispatch
 * Used in production (Vercel, Cloudflare, Node environments)
 */

interface NotifyPayload {
  type: 'CLAIM_INVITATION' | 'CLAIM_CONFIRMED' | 'WELCOME';
  to: string;
  amount?: number | string;
  senderName?: string;
  claimUrl?: string;
  txHash?: string;
  walletAddress?: string;
  destinationAddress?: string;
  recipientName?: string;
}

function generateEmailContent(payload: NotifyPayload): { subject: string; html: string } {
  const brandPrimary = '#836EF9'; // Monad Purple
  const brandAccent = '#FF6B35'; // Beyini Orange
  const bgDark = '#0F0E17';
  const cardBg = '#1A1926';
  const textLight = '#F4F4F8';
  const textMuted = '#9CA3AF';
  const borderCol = '#2D2C3F';

  if (payload.type === 'CLAIM_INVITATION') {
    const amountStr = typeof payload.amount === 'number' ? payload.amount.toFixed(2) : (payload.amount || '0.00');
    const sender = payload.senderName || 'Someone';
    const claimUrl = payload.claimUrl || 'https://beyini.app';
    const explorerUrl = payload.txHash ? `https://testnet.monadexplorer.com/tx/${payload.txHash}` : null;

    return {
      subject: `💰 You received $${amountStr} USDC on Monad via Beyini`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgDark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textLight};">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgDark}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px 20px; background: linear-gradient(135deg, rgba(131, 110, 249, 0.15) 0%, rgba(255, 107, 53, 0.1) 100%); border-bottom: 1px solid ${borderCol}; text-align: center;">
              <span style="display: inline-block; padding: 4px 12px; background: rgba(131, 110, 249, 0.2); border: 1px solid rgba(131, 110, 249, 0.4); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; color: ${brandPrimary}; text-transform: uppercase;">
                Monad Testnet • Instant Escrow
              </span>
              <h1 style="margin: 16px 0 6px; font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                You've Received USDC!
              </h1>
              <p style="margin: 0; font-size: 14px; color: ${textMuted};">
                Zero-address payment routed securely through Beyini
              </p>
            </td>
          </tr>

          <!-- Amount Card -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center;">
              <div style="font-size: 13px; color: ${textMuted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                Amount Available to Claim
              </div>
              <div style="font-size: 44px; font-weight: 800; color: #FFFFFF; letter-spacing: -1px; line-height: 1.1;">
                $${amountStr} <span style="font-size: 22px; color: ${brandAccent}; font-weight: 700;">USDC</span>
              </div>
              <div style="margin-top: 8px; font-size: 14px; color: ${textMuted};">
                Sent by <strong style="color: ${textLight};">${sender}</strong>
              </div>

              <!-- CTA Button -->
              <div style="margin: 28px 0 20px;">
                <a href="${claimUrl}" style="display: inline-block; padding: 15px 36px; background: linear-gradient(135deg, #FF6B35 0%, #F55D26 100%); color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 16px rgba(255, 107, 53, 0.35);">
                  Claim Your Funds &rarr;
                </a>
              </div>

              <p style="margin: 0; font-size: 12px; color: ${textMuted};">
                Funds are held in trust on Monad Testnet smart contract and will expire if uncollected.
              </p>
            </td>
          </tr>

          <!-- Security & Explorer Details -->
          <tr>
            <td style="padding: 20px 32px 28px; background-color: rgba(0,0,0,0.2); border-top: 1px solid ${borderCol};">
              <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 12px; color: ${textMuted};">
                <tr>
                  <td style="padding: 4px 0;"><strong>Network:</strong></td>
                  <td align="right" style="color: ${textLight};">Monad Testnet (10143)</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><strong>Routing Rail:</strong></td>
                  <td align="right" style="color: ${textLight};">Zero-Address Preimage Escrow</td>
                </tr>
                ${explorerUrl ? `
                <tr>
                  <td style="padding: 4px 0;"><strong>On-Chain Tx:</strong></td>
                  <td align="right">
                    <a href="${explorerUrl}" style="color: ${brandPrimary}; text-decoration: none;">View on Monad Explorer &nearr;</a>
                  </td>
                </tr>` : ''}
              </table>

              <div style="margin-top: 16px; padding: 12px; background: rgba(131, 110, 249, 0.08); border-radius: 8px; border: 1px solid rgba(131, 110, 249, 0.15); font-size: 11px; line-height: 1.5; color: ${textMuted};">
                🔐 <strong>How it works:</strong> You can claim these funds instantly into an embedded Monad wallet, direct crypto address, or cash out seamlessly.
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; margin-top: 20px; text-align: center; font-size: 11px; color: #6B7280;">
          <tr>
            <td>
              Powered by Beyini on Monad • Built for Metropolis Hackathon<br>
              Direct Link: <a href="${claimUrl}" style="color: ${brandPrimary}; word-break: break-all;">${claimUrl}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  }

  if (payload.type === 'CLAIM_CONFIRMED') {
    const amountStr = typeof payload.amount === 'number' ? payload.amount.toFixed(2) : (payload.amount || '0.00');
    const dest = payload.destinationAddress || 'Your Monad Wallet';
    const explorerUrl = payload.txHash ? `https://testnet.monadexplorer.com/tx/${payload.txHash}` : null;

    return {
      subject: `✅ Funds Claimed: $${amountStr} USDC settled on Monad`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Claimed</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgDark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textLight};">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgDark}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 28px 32px; text-align: center; border-bottom: 1px solid ${borderCol};">
              <div style="font-size: 40px; margin-bottom: 12px;">🎉</div>
              <h1 style="margin: 0 0 6px; font-size: 24px; font-weight: 800; color: #FFFFFF;">
                Payment Successfully Claimed!
              </h1>
              <p style="margin: 0; font-size: 14px; color: #10B981; font-weight: 600;">
                +$${amountStr} USDC Settled to Destination
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 13px; color: ${textMuted};">
                <tr>
                  <td>Destination:</td>
                  <td align="right" style="color: ${textLight}; font-family: monospace;">${dest.length > 20 ? `${dest.slice(0, 10)}...${dest.slice(-8)}` : dest}</td>
                </tr>
                <tr>
                  <td>Network:</td>
                  <td align="right" style="color: ${textLight};">Monad Testnet</td>
                </tr>
                ${explorerUrl ? `
                <tr>
                  <td>Claim Receipt:</td>
                  <td align="right">
                    <a href="${explorerUrl}" style="color: ${brandPrimary}; text-decoration: none;">View On-Chain Receipt &nearr;</a>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };
  }

  // WELCOME Email
  const wallet = payload.walletAddress || 'Provisioning...';
  const name = payload.recipientName || 'Monad Builder';

  return {
    subject: `💜 Welcome to Beyini on Monad!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Beyini</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgDark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${textLight};">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgDark}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540px" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 32px; text-align: center; border-bottom: 1px solid ${borderCol};">
              <span style="font-size: 36px; display: block; margin-bottom: 12px;">⚡</span>
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #FFFFFF;">
                Welcome to Beyini, ${name}!
              </h1>
              <p style="margin: 0; font-size: 14px; color: ${textMuted};">
                Zero-address payment routing powered by Monad's 10,000 TPS architecture.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px;">
              <div style="font-size: 13px; color: ${textMuted}; margin-bottom: 6px;">Your Monad Smart Account Address:</div>
              <div style="padding: 10px 14px; background: rgba(0,0,0,0.3); border-radius: 8px; font-family: monospace; font-size: 12px; color: ${brandPrimary}; word-break: break-all;">
                ${wallet}
              </div>

              <div style="margin-top: 20px; font-size: 13px; line-height: 1.6; color: ${textLight};">
                With Beyini you can:
                <ul style="padding-left: 20px; margin-top: 8px; color: ${textMuted};">
                  <li>Send USDC to any email, phone number, or social handle without needing their wallet address first.</li>
                  <li>Enjoy sub-second finality and near-zero gas on Monad Testnet.</li>
                  <li>Claim incoming funds to self-custody or global fiat rails.</li>
                </ul>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
  const fromEmail = process.env.VITE_RESEND_FROM || process.env.RESEND_FROM || 'onboarding@resend.dev';

  if (!apiKey) {
    return res.status(500).json({ error: 'Resend API key is not configured' });
  }

  try {
    const payload: NotifyPayload = req.body || {};
    if (!payload.to || !payload.type) {
      return res.status(400).json({ error: 'Missing required fields: "to" and "type"' });
    }

    const { subject, html } = generateEmailContent(payload);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Beyini <${fromEmail}>`,
        to: [payload.to],
        subject,
        html,
      }),
    });

    const resData: any = await resendResponse.json();

    if (!resendResponse.ok) {
      console.warn('[Resend Warning]', resData);
      return res.status(resendResponse.status).json({
        success: false,
        error: resData?.message || 'Resend email dispatch failed',
        details: resData,
      });
    }

    return res.status(200).json({
      success: true,
      id: resData.id,
      recipient: payload.to,
      type: payload.type,
    });
  } catch (err: any) {
    console.error('Notification dispatch error:', err);
    return res.status(500).json({ error: err?.message || 'Internal notification error' });
  }
}
