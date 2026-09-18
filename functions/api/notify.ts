/**
 * Cloudflare Pages Function for /api/notify
 * Proxies transactional email requests to Resend API
 */

const DEFAULT_FROM = 'onboarding@resend.dev';

export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: any = await request.json();
    const { type, to, amount, senderName, claimUrl, txHash, walletAddress, destinationAddress, recipientName } = payload;

    if (!to || !type) {
      return new Response(JSON.stringify({ error: 'Missing parameters "to" and "type"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = env?.VITE_RESEND_API_KEY || env?.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Resend API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const fromEmail = env?.VITE_RESEND_FROM || env?.RESEND_FROM || DEFAULT_FROM;

    const amountStr = typeof amount === 'number' ? amount.toFixed(2) : (amount || '0.00');
    let subject = 'Notification from Beyini on Monad';
    let html = '';

    if (type === 'CLAIM_INVITATION') {
      subject = `💰 You received $${amountStr} USDC on Monad via Beyini`;
      const sName = senderName || 'A friend';
      const cUrl = claimUrl || 'https://beyini.paaco.xyz';
      const explorerUrl = txHash ? `https://testnet.monadexplorer.com/tx/${txHash}` : null;

      html = `
<div style="background-color: #0F0E17; color: #F4F4F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #1A1926; border: 1px solid #2D2C3F; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <div style="padding: 24px; text-align: center; background: linear-gradient(135deg, rgba(131, 110, 249, 0.2) 0%, rgba(255, 107, 53, 0.1) 100%); border-bottom: 1px solid #2D2C3F;">
      <span style="background: rgba(131, 110, 249, 0.25); color: #836EF9; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; border: 1px solid rgba(131, 110, 249, 0.4);">Monad Testnet • Beyini Escrow</span>
      <h2 style="margin: 14px 0 4px; color: #FFF; font-size: 24px; font-weight: 800;">USDC Payment Ready</h2>
      <p style="margin: 0; color: #9CA3AF; font-size: 13px;">Zero-Address Payment Routing</p>
    </div>
    <div style="padding: 30px; text-align: center;">
      <div style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px;">Amount to Claim</div>
      <div style="font-size: 42px; font-weight: 800; color: #FFF; margin: 6px 0;">$${amountStr} <span style="font-size: 20px; color: #FF6B35;">USDC</span></div>
      <div style="font-size: 14px; color: #9CA3AF;">Sent to you by <strong style="color: #FFF;">${sName}</strong></div>
      <div style="margin: 26px 0;">
        <a href="${cUrl}" style="background: #FF6B35; color: #FFF; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; display: inline-block; font-size: 15px; box-shadow: 0 4px 14px rgba(255, 107, 53, 0.35);">Claim Funds on Monad &rarr;</a>
      </div>
      <p style="font-size: 12px; color: #6B7280; margin: 0;">Funds are secured in smart escrow. Verify your handle or email to release USDC.</p>
    </div>
    ${explorerUrl ? `
    <div style="padding: 14px 24px; background: rgba(0,0,0,0.25); border-top: 1px solid #2D2C3F; font-size: 12px; text-align: center;">
      <a href="${explorerUrl}" style="color: #836EF9; text-decoration: none;">View On-Chain Escrow Tx on Monad Explorer &nearr;</a>
    </div>` : ''}
  </div>
</div>`;
    } else if (type === 'CLAIM_CONFIRMED') {
      subject = `✅ Claim Confirmed: $${amountStr} USDC settled on Monad`;
      const dest = destinationAddress || 'Your Monad Wallet';
      const explorerUrl = txHash ? `https://testnet.monadexplorer.com/tx/${txHash}` : null;

      html = `
<div style="background-color: #0F0E17; color: #F4F4F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #1A1926; border: 1px solid #2D2C3F; border-radius: 16px; padding: 30px; text-align: center;">
    <div style="font-size: 40px; margin-bottom: 12px;">🎉</div>
    <h2 style="color: #FFF; margin: 0 0 8px;">Claim Confirmed!</h2>
    <p style="color: #10B981; font-weight: 700; margin: 0 0 20px;">+$${amountStr} USDC Successfully Settled</p>
    <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 10px; font-size: 13px; text-align: left; color: #9CA3AF;">
      <div style="margin-bottom: 8px;"><strong>Destination:</strong> <span style="font-family: monospace; color: #FFF;">${dest}</span></div>
      <div><strong>Network:</strong> Monad Testnet (Chain ID 10143)</div>
      ${explorerUrl ? `<div style="margin-top: 8px;"><a href="${explorerUrl}" style="color: #836EF9;">View Explorer Receipt &nearr;</a></div>` : ''}
    </div>
  </div>
</div>`;
    } else {
      // WELCOME
      subject = `💜 Welcome to Beyini on Monad!`;
      const wAddr = walletAddress || 'Provisioning...';
      const uName = recipientName || 'Monad Builder';

      html = `
<div style="background-color: #0F0E17; color: #F4F4F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #1A1926; border: 1px solid #2D2C3F; border-radius: 16px; padding: 30px; text-align: center;">
    <div style="font-size: 40px; margin-bottom: 10px;">⚡</div>
    <h2 style="color: #FFF; margin: 0 0 8px;">Welcome to Beyini, ${uName}!</h2>
    <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 20px;">Zero-Address Payment Routing on Monad</p>
    <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 10px; font-size: 13px; text-align: left; color: #9CA3AF;">
      <div style="margin-bottom: 6px;"><strong>Your Embedded Monad Address:</strong></div>
      <div style="font-family: monospace; color: #836EF9; word-break: break-all; margin-bottom: 12px;">${wAddr}</div>
      <div style="font-size: 12px; line-height: 1.5; color: #D1D5DB;">
        You can now send and receive USDC instantly using just an email, Twitter handle, or phone number.
      </div>
    </div>
  </div>
</div>`;
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Beyini <${fromEmail}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const resendData: any = await resendRes.json();

    if (!resendRes.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: resendData?.message || 'Resend error',
        details: resendData,
      }), {
        status: resendRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      id: resendData.id,
      to,
      type,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
