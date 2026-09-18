/**
 * Envio HyperIndex Event Handlers for Beyini Escrow on Monad Testnet (Chain ID 10143)
 * 
 * HyperIndex indexes on-chain contract events with sub-second latency and can
 * trigger off-chain webhooks (such as Resend email notifications) autonomously
 * whenever payments are deposited or claimed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// @ts-ignore - Envio generates these types on `envio codegen`
import { BeyiniEscrow } from "generated";

/**
 * Handle PaymentDeposited:
 * Emitted by BeyiniEscrow contract when a sender locks USDC with a preimage commitment.
 */
BeyiniEscrow.PaymentDeposited.handler(async ({ event, context }: any) => {
  const paymentId = event.params.paymentId;
  const sender = event.params.sender;
  const token = event.params.token;
  const amount = event.params.amount;
  const commitment = event.params.commitment;
  const expiry = event.params.expiry;

  const entity = {
    id: paymentId,
    paymentId: paymentId,
    sender: sender,
    token: token,
    amount: amount,
    commitment: commitment,
    expiry: expiry,
    status: "DEPOSITED",
    destination: null,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };

  // Upsert in Envio GraphQL entity store
  context.PaymentEntity.set(entity);
  context.log.info(`[PaymentDeposited] Indexed escrow payment ${paymentId} on Monad from ${sender}`);

  // Trigger Autonomous Resend Notification Webhook if configured
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CLAIM_INVITATION",
          txHash: event.transaction.hash,
          amount: amount.toString(),
          paymentId: paymentId,
          sender: sender,
          commitment: commitment,
          network: "monad-testnet",
        }),
      });
      context.log.info(`[Webhook] Sent deposit notification for ${paymentId}`);
    } catch (webhookErr) {
      context.log.warn(`[Webhook Error] Failed to post deposit notice: ${webhookErr}`);
    }
  }
});

/**
 * Handle PaymentClaimed:
 * Emitted when recipient verifies preimage hash and claims funds to their Monad address.
 */
BeyiniEscrow.PaymentClaimed.handler(async ({ event, context }: any) => {
  const paymentId = event.params.paymentId;
  const destination = event.params.destination;
  const amount = event.params.amount;
  const token = event.params.token;

  // Update existing PaymentEntity status to CLAIMED
  const payment = await context.PaymentEntity.get(paymentId);
  if (payment) {
    context.PaymentEntity.set({
      ...payment,
      status: "CLAIMED",
      destination: destination,
    });
  }

  // Create immutable ClaimEntity audit record
  const claimEntity = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    paymentId: paymentId,
    destination: destination,
    amount: amount,
    token: token,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };

  context.ClaimEntity.set(claimEntity);
  context.log.info(`[PaymentClaimed] Payment ${paymentId} settled to ${destination} on Monad`);

  // Trigger Autonomous Claim Confirmation Webhook
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CLAIM_CONFIRMED",
          txHash: event.transaction.hash,
          amount: amount.toString(),
          destinationAddress: destination,
          paymentId: paymentId,
          network: "monad-testnet",
        }),
      });
      context.log.info(`[Webhook] Sent claim confirmation notice for ${paymentId}`);
    } catch (webhookErr) {
      context.log.warn(`[Webhook Error] Failed to post claim notice: ${webhookErr}`);
    }
  }
});

/**
 * Handle PaymentRefunded:
 * Emitted when expiry has elapsed and sender claws back uncollected funds.
 */
BeyiniEscrow.PaymentRefunded.handler(async ({ event, context }: any) => {
  const paymentId = event.params.paymentId;
  const sender = event.params.sender;
  const amount = event.params.amount;
  const token = event.params.token;

  const payment = await context.PaymentEntity.get(paymentId);
  if (payment) {
    context.PaymentEntity.set({
      ...payment,
      status: "REFUNDED",
    });
  }

  const refundEntity = {
    id: `${event.transaction.hash}-${event.logIndex}`,
    paymentId: paymentId,
    sender: sender,
    amount: amount,
    token: token,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  };

  context.RefundEntity.set(refundEntity);
  context.log.info(`[PaymentRefunded] Refunded payment ${paymentId} to sender ${sender}`);
});
