import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

function paymentsApiPlugin(): Plugin {
  return {
    name: 'beyini-payments-api',
    configureServer(server) {
      const dataDir = path.resolve(import.meta.dirname, 'scratch');
      const dataFile = path.join(dataDir, 'payments.json');

      const ensureFile = () => {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        if (!fs.existsSync(dataFile)) {
          fs.writeFileSync(dataFile, '[]', 'utf8');
        }
      };

      const readPayments = (): any[] => {
        ensureFile();
        try {
          return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        } catch {
          return [];
        }
      };

      const writePayments = (payments: any[]) => {
        ensureFile();
        fs.writeFileSync(dataFile, JSON.stringify(payments, null, 2), 'utf8');
      };

      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // POST /api/faucet - Drips 0.05 MON for testnet gas
        if (url.startsWith('/api/faucet') && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { address } = JSON.parse(body);
              if (!address || !address.startsWith('0x')) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Valid 0x address required' }));
              }

              const envContent = fs.readFileSync(path.resolve(import.meta.dirname, '.env.local'), 'utf8');
              const keyMatch = envContent.match(/MONAD_DEPLOYER_KEY=([a-fA-F0-9x]+)/);
              if (!keyMatch) {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: 'Deployer key not found' }));
              }

              let pkey = keyMatch[1].trim();
              if (!pkey.startsWith('0x')) pkey = `0x${pkey}`;

              const { createWalletClient, createPublicClient, http, parseEther } = await import('viem');
              const { privateKeyToAccount } = await import('viem/accounts');

              const monadTestnet = {
                id: 10143,
                name: 'Monad Testnet',
                nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
              };

              const account = privateKeyToAccount(pkey as `0x${string}`);
              const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http('https://testnet-rpc.monad.xyz') });
              const publicClient = createPublicClient({ chain: monadTestnet, transport: http('https://testnet-rpc.monad.xyz') });

              const hash = await walletClient.sendTransaction({
                to: address as `0x${string}`,
                value: parseEther('0.05'),
              });

              await publicClient.waitForTransactionReceipt({ hash });

              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, txHash: hash, amount: '0.05 MON' }));
            } catch (err: any) {
              console.error('Faucet error:', err);
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST /api/notify - Dispatches transactional emails via Resend
        if (url.startsWith('/api/notify') && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const { type, to, amount, senderName, claimUrl, txHash, walletAddress, destinationAddress, recipientName } = payload;

              if (!to || !type) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: 'Missing required parameters "to" and "type"' }));
              }

              const envPath = path.resolve(import.meta.dirname, '.env.local');
              const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
              const keyMatch = envContent.match(/VITE_RESEND_API_KEY=([^\r\n]+)/);
              const fromMatch = envContent.match(/VITE_RESEND_FROM=([^\r\n]+)/);

              const apiKey = process.env.VITE_RESEND_API_KEY || (keyMatch ? keyMatch[1].trim() : '');
              const fromEmail = process.env.VITE_RESEND_FROM || (fromMatch ? fromMatch[1].trim() : 'onboarding@resend.dev');

              if (!apiKey) {
                res.statusCode = 500;
                return res.end(JSON.stringify({ error: 'Resend API key not found in .env.local' }));
              }

              let subject = 'Notification from Beyini on Monad';
              let html = '';

              const amountStr = typeof amount === 'number' ? amount.toFixed(2) : (amount || '0.00');

              if (type === 'CLAIM_INVITATION') {
                subject = `💰 You received $${amountStr} USDC on Monad via Beyini`;
                const sName = senderName || 'A friend';
                const cUrl = claimUrl || 'https://beyini.app';
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
                console.warn('[Resend API Error/Notice]:', resendData);
                res.statusCode = resendRes.status;
                return res.end(JSON.stringify({ success: false, error: resendData.message || 'Resend error', details: resendData }));
              }

              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, id: resendData.id, to, type }));
            } catch (err: any) {
              console.error('Notify API error:', err);
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (!url.startsWith('/api/payments')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');

        // GET /api/payments or /api/payments/:id
        if (req.method === 'GET') {
          const payments = readPayments();
          const cleanUrl = url.split('?')[0];
          const parts = cleanUrl.split('/').filter(Boolean);

          if (parts.length === 3) {
            const id = parts[2].toLowerCase();
            const found = payments.find(
              (p: any) => (p.payment_id || '').toLowerCase() === id
            );
            if (found) {
              res.statusCode = 200;
              return res.end(JSON.stringify(found));
            } else {
              res.statusCode = 404;
              return res.end(JSON.stringify({ error: 'Payment not found' }));
            }
          }

          // Filter by sender if query param provided
          const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
          const sender = queryParams.get('sender');
          if (sender) {
            const filtered = payments.filter(
              (p: any) => (p.sender_address || '').toLowerCase() === sender.toLowerCase()
            );
            res.statusCode = 200;
            return res.end(JSON.stringify(filtered));
          }

          res.statusCode = 200;
          return res.end(JSON.stringify(payments));
        }

        // POST /api/payments (Create / Upsert)
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const payment = JSON.parse(body);
              const payments = readPayments();
              const existingIdx = payments.findIndex(
                (p: any) => p.payment_id === payment.payment_id
              );
              if (existingIdx !== -1) {
                payments[existingIdx] = { ...payments[existingIdx], ...payment };
              } else {
                payments.unshift(payment);
              }
              writePayments(payments);
              res.statusCode = 201;
              res.end(JSON.stringify({ success: true, payment }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // PATCH /api/payments/:id (Update status)
        if (req.method === 'PATCH') {
          const cleanUrl = url.split('?')[0];
          const parts = cleanUrl.split('/').filter(Boolean);
          const id = parts.length === 3 ? parts[2].toLowerCase() : null;

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const updates = JSON.parse(body);
              const payments = readPayments();
              const payment = payments.find(
                (p: any) => (p.payment_id || '').toLowerCase() === id
              );
              if (payment) {
                Object.assign(payment, updates);
                writePayments(payments);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, payment }));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Payment not found' }));
              }
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), paymentsApiPlugin(), cloudflare()],
});