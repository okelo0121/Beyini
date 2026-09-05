# Rule: Zero-Mock Policy & Real Integrations Only

## Core Directive
NEVER use mocks, simulated delays (`setTimeout`), fake transaction hashes (`Math.random()`), or hardcoded dummy profiles/ledgers anywhere in the codebase unless the user explicitly orders a mock. Every integration MUST be authentic, live, and functional.

## 1. Direct Real Integrations Only
- **Authentication**: Integrate official SDKs directly (`@privy-io/react-auth`, embedded wallets on Monad Testnet). Wire real authentication modals (`login()`), live user addresses, and session states.
- **Blockchain Transactions**: Execute real transactions on Monad Testnet via `viem` / Privy `sendTransaction()` or custom smart contracts. Never synthesize fake transaction hashes or fake receipt states.
- **Balance & State Queries**: Read real token balances directly from the Monad RPC (`https://testnet-rpc.monad.xyz`) and token contract (USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`) via `eth_call`.
- **Payment & Off-Ramp Rails**: Trigger live `@ramp-network/ramp-instant-sdk` widget instances and official API endpoints.
- **Data & History**: Index and query real blockchain events (via RPC logs or Envio indexer), never static mock arrays.

## 2. Environment Variable Protocol & Interactive Guidance
Whenever a feature, SDK, or service requires an API key, project ID, contract address, or secret:
1. **Never Silently Fall Back**: Do not invent fake placeholders or silent mock modes.
2. **Proactively Guide the User**:
   - Provide the exact environment variable name (e.g., `VITE_RAMP_API_KEY`, `VITE_ESCROW_CONTRACT_ADDRESS`).
   - Specify the target configuration file (`.env.local`).
   - Give step-by-step instructions on where to register or retrieve the key from the developer portal.
   - Explain what the variable unlocks.
3. **Verify Configuration**: Check that the variable is properly loaded before invoking the service.
