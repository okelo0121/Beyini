import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

function paymentsApiPlugin(): Plugin {
  return {
    name: 'beyini-payments-api',
    configureServer(server) {
      const dataDir = path.resolve(__dirname, 'scratch');
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

              const envContent = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8');
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