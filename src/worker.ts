/**
 * Cloudflare Worker Entry Point for Beyini
 * Serves /api/* dynamically with edge functions and delegates all static asset requests to Cloudflare Assets.
 */

import { onRequest as faucetHandler } from '../functions/api/faucet';
import { onRequest as notifyHandler } from '../functions/api/notify';

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  MONAD_DEPLOYER_KEY?: string;
  VITE_RESEND_API_KEY?: string;
  VITE_RESEND_FROM?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route /api/faucet
    if (url.pathname === '/api/faucet' || url.pathname === '/api/faucet/') {
      return faucetHandler({ request, env });
    }

    // Route /api/notify
    if (url.pathname === '/api/notify' || url.pathname === '/api/notify/') {
      return notifyHandler({ request, env });
    }

    // Default: Delegate to Cloudflare Static Assets (dist/) for frontend & SPA routing
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
