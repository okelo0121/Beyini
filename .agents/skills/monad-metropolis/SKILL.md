---
name: monad-metropolis
description: >-
  Comprehensive Monad developer essentials, protocol SDKs (Alchemy, Envio, Zerion, Privy, 0x, Curvance, Blend),
  starter templates, agent skills/MCP servers, and architecture blueprints for the Monad Metropolis Hackathon.
  Use when building smart contracts, indexers, frontend payment routing (x402), embedded wallets, or DeFi/Consumer apps on Monad.
---

# Monad Metropolis Developer & Hackathon Skill

Source: https://hackathon.monad.xyz/resources

This skill provides developer essentials, templates, protocol SDKs, agent tooling, and architecture blueprints for building production-grade applications on Monad.

---

## 1. Monad Core Architecture & Developer Essentials

- **Performance Envelope**: 10,000 TPS, 400ms block times, 800ms single-slot finality, asynchronous execution, and full EVM bytecode compatibility.
- **Differences from Ethereum**:
  - Execution is decoupled from consensus (parallel execution with deterministic conflict resolution).
  - [Gas & Opcode Pricing](https://docs.monad.xyz/developer-essentials/gas-pricing): Custom pricing table reflecting Monad parallel execution costs.
  - [Reserve Balance](https://docs.monad.xyz/developer-essentials/reserve-balance): Balance reservation under parallel execution to prevent double-spends before block finality.
  - [EIP-7702](https://docs.monad.xyz/developer-essentials/eip-7702): Upgrade existing EOAs to smart contract accounts during execution.
  - [x402](https://docs.monad.xyz/guides/x402#what-is-x402): HTTP-native payment protocol for AI agents, APIs, and micro-transactions.
  - [ERC-8004](https://docs.monad.xyz/guides/erc-8004): Trustless agent identity and reputation standard.
  - [MERA](https://docs.monad.xyz/guides/mera): Monad execution and runtime architecture guide.

---

## 2. Sponsor Perks & Infrastructure

- **QuickNode Build Plan**: 3 months free credit for RPC, streams, and webhooks (<https://www.quicknode.com/>).
- **Tenderly Pro Tier**: Simulation, debugging, and monitoring infrastructure (<https://tenderly.co/>).
- **Zerion API Builder Tier**: Wallet and portfolio APIs with AI agent readiness (<https://zerion.io/api/>).

---

## 3. Starter Templates

- **Next.js · PWA**:
  - `Privy embedded wallet`: One-click social/email login with gas sponsorship.
  - `0x + Privy embedded wallet`: In-app swaps across 150+ liquidity venues.
  - `thirdweb`: Complete Web3 frontend boilerplate with smart wallets.
- **React Native**:
  - `Privy embedded wallet`: Native mobile auth and biometric signing.
  - `Privy + Pimlico`: ERC-4337 sponsored transactions on mobile.
- **Farcaster Miniapp**:
  - Embedded frame apps with custom OG images, haptics, and push notifications.

---

## 4. Protocol SDKs

- **Alchemy Smart Wallets & CLI**:
  - Smart accounts, gas sponsorship (Paymaster), and ERC-20 gas payments on Monad mainnet.
  - `alchemy-cli`: Agent-ready CLI (`--json`) for RPC, wallets, and webhooks.
- **Envio HyperIndex & HyperSync**:
  - Up to 2,000x faster than standard RPC polling on Monad (Chain ID 143).
  - Factory pattern support for auto-indexing child contracts (launchpads, DEX pools).
- **Zerion CLI & API**:
  - Portfolio tracking, token balances, transaction history, and swap execution.
- **Curvance & Blend SDKs**:
  - Lending layer with native USDC support, deposits, withdrawals, and yield vaults.
- **0x Swap API**:
  - Live order book and AMM aggregation with sub-second execution.
- **Aave v3 React Kit**:
  - Hooks and components for building lending/borrowing interfaces.
  - Morpho SDKs & Euler SDK: Vault and market creation, programmatic access to EVK vaults and swaps.
- **Perpl SDK**:
  - Programmatic trading on Monad's onchain perpetuals CLOB engine.

---

## 5. MCP Servers & Agent Skills

Teach coding assistants and autonomous agents to operate on Monad:
- **Alchemy MCP Server**: Live chain data tool calls with no API key required.
- **Envio Indexer Skills**: 14 HyperIndex skills for prompt-to-production indexers.
- **Uniswap AI Skills**: Liquidity and swap orchestration.
- **Morpho & Zerion Skills**: Automated onchain strategies, wallet signing, and trading.

---

## 6. Track Architecture Blueprints

### Consumer Products & Payments (PayFi)
- **Zero-Address Routing (Beyini)**: Send to email, phone, or handle; recipient chooses settlement rail (USDC, local bank via ACH/Mobile Money, or wallet).
- **Embedded Payments in Social Gestures**: 0xSplits contracts + Circle gas sponsorship for payments that feel like chat messages.
- **Programmable Conditional Escrow**: Time-locked and oracle-verified releases using Circle USDC contracts and Sablier streams.
- **Salary & Cashflow Streaming**: Continuous per-second streaming via Superfluid and Sablier Flow.

### Onchain Finance & Trading
- **Live Order Books & CLOB DEXs**: Kuru and Clober infrastructure optimized for Monad's 800ms finality.
- **Prediction Markets for Unpriced Outcomes**: UMA Optimistic Oracle resolution + AI micro-market pricing.
- **Tokenized RWAs & Yield Stripping**: Pendle-style PT/YT tokenization for interest-bearing assets.
- **Continuous Liquidity for Illiquid Assets**: Resting limit orders at near-zero cost on Kuru CLOB.

### Social, Attention & Culture
- **Algorithm Marketplace**: Feed ranking strategies on ATProto / Farcaster with onchain monetization.
- **Card Rental & Lending Markets**: ERC-4907 expiring permissions for gaming assets.
- **Style as an Ownable Asset**: Story Protocol Programmable IP Licenses + 0xSplits attribution.

### Trust, Identity & AI Infrastructure
- **Content Passports**: C2PA cryptographically bound manifests anchored on Monad.
- **Mobile-Native Proof of Personhood**: WebAuthn/P256 verification (RIP-7212 / Daimo verifier).
- **Onchain Skill Credentials**: Ethereum Attestation Service (EAS) schemas and resolvers.
