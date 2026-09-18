# Beyini Envio HyperIndex Indexer for Monad

This directory contains the [Envio HyperIndex](https://docs.envio.dev/) configuration and event handlers for the **Beyini** zero-address payment escrow protocol on Monad Testnet (Chain ID `10143`).

## Overview

Envio HyperIndex provides high-performance real-time indexing of the `BeyiniEscrow` contract deployed on Monad Testnet:
- **Contract Address:** `0x7b4bcf6ba16b15bd3eca2c920f52d1447970c227`
- **Network:** Monad Testnet (RPC: `https://testnet-rpc.monad.xyz`)
- **Indexed Events:**
  - `PaymentDeposited(bytes32 indexed paymentId, address indexed sender, address indexed token, uint256 amount, bytes32 commitment, uint64 expiry)`
  - `PaymentClaimed(bytes32 indexed paymentId, address indexed destination, uint256 amount, address token)`
  - `PaymentRefunded(bytes32 indexed paymentId, address indexed sender, uint256 amount, address token)`

## Webhook Architecture with Resend

In addition to querying historical payments and settlements via GraphQL:
- The event handlers in `src/EventHandlers.ts` can invoke `NOTIFICATION_WEBHOOK_URL` (pointing to `/api/notify`).
- When an on-chain deposit or claim takes place on Monad, Envio detects the event at the block level and triggers automated Resend emails even if the client's browser disconnected.

## Quickstart

### Prerequisites
- Node.js 18+
- Docker (for local indexing node)
- Envio CLI: `npm i -g envio`

### Commands
```bash
# 1. Generate TypeScript types from ABI & schema.graphql
npm run codegen

# 2. Run local indexing container
npm run dev

# 3. Explore indexed data in GraphQL Playground
# Opens at http://localhost:8080/v1/graphql
```

### Deploying to Envio Hosted Service
To deploy to the official Envio cloud for the Monad Hackathon:
```bash
envio login
envio deploy
```
