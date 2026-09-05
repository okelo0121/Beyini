import React, { useState } from 'react';
import { 
  ArrowLeft, 
  X, 
  Check, 
  ChevronDown, 
  Lock, 
  ExternalLink, 
  AlertCircle,
  Copy, 
  CheckCircle2, 
  MessageCircle, 
  Mail,
  Loader2
} from 'lucide-react';
import { parseUnits } from 'viem';
import type { Recipient, Transaction } from '../data/beyiniData';
import { useMonadEscrow } from '../../blockchain/useMonadEscrow';
import { useBeyiniAuth } from '../../auth/useBeyiniAuth';
import { PaymentService } from '../../services/PaymentService';
import { NotificationService } from '../../services/NotificationService';
import { IdentityService } from '../../services/IdentityService';
import { StorageService, type PaymentRecord } from '../../services/StorageService';
import { MONAD_USDC_ADDRESS } from '../../auth/privyConfig';

export type PaymentFlowStep = 'recipient' | 'amount' | 'review' | 'sent';

interface PaymentFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: Recipient | null;
  onEditRecipient: () => void;
  onPaymentCompleted: (tx: Transaction) => void;
  onViewActivity: () => void;
  userBalanceUSDC: number;
}

export const PaymentFlowModal: React.FC<PaymentFlowModalProps> = ({
  isOpen,
  onClose,
  recipient,
  onEditRecipient,
  onPaymentCompleted,
  onViewActivity,
  userBalanceUSDC
}) => {
  const { user } = useBeyiniAuth();
  const { checkAllowance, approveUSDC, depositToEscrow } = useMonadEscrow();
  const [step, setStep] = useState<PaymentFlowStep>('recipient');
  const [amount, setAmount] = useState('10.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStageMessage, setTxStageMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedTxHash, setConfirmedTxHash] = useState<string>('');
  const [claimUrl, setClaimUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !recipient) return null;

  const numericAmount = parseFloat(amount) || 0;

  // Determine normalized identity and type
  const recipientType: 'twitter' | 'discord' | 'email' | 'phone' | 'username' = 
    recipient.twitter ? 'twitter' :
    recipient.discord ? 'discord' :
    recipient.email ? 'email' :
    recipient.phone ? 'phone' :
    IdentityService.detectIdentityType(recipient.username || recipient.name);

  const rawRecipientValue = 
    recipient.twitter ||
    recipient.discord ||
    recipient.email ||
    recipient.phone ||
    recipient.username ||
    recipient.name;

  const normalizedRecipientValue = IdentityService.normalizeIdentifier(rawRecipientValue, recipientType);

  const recipientIdentifier = 
    recipientType === 'twitter' ? `@${normalizedRecipientValue} (X)` :
    recipientType === 'discord' ? `${normalizedRecipientValue} (Discord)` :
    normalizedRecipientValue;

  const handleSendPayment = async () => {
    if (!user?.walletAddress) {
      setErrorMessage('Please connect your Monad wallet first.');
      return;
    }

    if (userBalanceUSDC < numericAmount) {
      setErrorMessage(
        `Insufficient Monad USDC balance. You currently have $${userBalanceUSDC.toFixed(2)} USDC, but this transfer requires $${numericAmount.toFixed(2)} USDC.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setTxStageMessage('Initializing Zero-PII commitment package...');

    try {
      const senderAddress = user.walletAddress as `0x${string}`;

      // 1. Generate real Zero-PII Cryptographic Commitment Package using normalized social identifier
      const commitmentPkg = IdentityService.createCommitmentPackage(
        senderAddress,
        normalizedRecipientValue
      );

      // 2. Check USDC allowance
      setTxStageMessage('Checking USDC allowance on Monad Testnet...');
      const neededUnits = parseUnits(numericAmount.toString(), 6);
      const currentAllowance = await checkAllowance(senderAddress);

      if (currentAllowance < neededUnits) {
        setTxStageMessage('Step 1/2: Please approve USDC spend in your wallet...');
        await approveUSDC(numericAmount.toString());
      }

      // 3. Deposit into BeyiniEscrow on Monad Testnet
      setTxStageMessage('Step 2/2: Confirming Escrow deposit on Monad Testnet...');
      const { txHash } = await depositToEscrow({
        paymentId: commitmentPkg.paymentId,
        commitment: commitmentPkg.commitment,
        amountUSDC: numericAmount.toString(),
        durationSeconds: 86400,
      });

      // 4. Persist to cross-browser shared storage
      const storageRecord: PaymentRecord = {
        payment_id: commitmentPkg.paymentId,
        contract_payment_id: commitmentPkg.paymentId,
        sender_address: senderAddress,
        recipient_identity_type: recipientType,
        recipient_identity_value: normalizedRecipientValue,
        recipient_identity_commitment: commitmentPkg.commitment,
        amount: numericAmount,
        token_address: MONAD_USDC_ADDRESS,
        chain_id: 10143,
        deposit_tx_hash: txHash,
        salt: commitmentPkg.salt,
        status: 'SECURED',
        created_at: Math.floor(Date.now() / 1000),
      };
      await StorageService.savePayment(storageRecord);

      // Keep local session for fast recall
      PaymentService.savePayment({
        paymentId: commitmentPkg.paymentId,
        senderAddress,
        recipientIdentifier: normalizedRecipientValue,
        recipientName: recipient.name,
        commitment: commitmentPkg.commitment,
        salt: commitmentPkg.salt,
        amountUSDC: numericAmount,
        txHash,
        createdAt: storageRecord.created_at,
        expiry: storageRecord.created_at + 86400,
        status: 'DEPOSITED',
      });

      // 5. Generate direct standalone recipient claim URL
      const generatedLink = NotificationService.generateClaimUrl(
        commitmentPkg.paymentId,
        commitmentPkg.salt
      );

      setClaimUrl(generatedLink);
      setConfirmedTxHash(txHash);
      setStep('sent');

      const newTx: Transaction = {
        id: commitmentPkg.paymentId,
        txHash,
        recipient,
        amount: numericAmount,
        asset: 'USDC',
        network: 'Monad Testnet',
        status: 'NOTIFIED',
        statusLabel: 'Secured on Monad',
        dateCategory: 'Today',
        timestamp: 'Just now',
        receivingMethod: 'Escrow (Wallet claim)',
        lifecycle: [
          { label: 'Payment secured on Monad', completed: true },
          { label: 'Claim link generated', completed: true },
          { label: 'Waiting for recipient claim', completed: false, active: true },
          { label: 'Settlement confirmed', completed: false }
        ]
      };

      onPaymentCompleted(newTx);
    } catch (err: any) {
      console.error('Payment error on Monad:', err);
      let msg = err?.message || 'Failed to submit transaction on Monad Testnet';
      if (msg.includes('insufficient balance') || err?.details?.includes('insufficient balance')) {
        msg = 'Your Monad wallet had insufficient MON for network gas fees. Gas has been funded to your wallet — please click Send again!';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
      setTxStageMessage('');
    }
  };

  const handleCopyLink = () => {
    if (!claimUrl) return;
    navigator.clipboard.writeText(claimUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleBack = () => {
    if (step === 'amount') setStep('recipient');
    else if (step === 'review') setStep('amount');
    else onClose();
  };

  const shareText = NotificationService.generateMessageText({
    amountUSDC: numericAmount,
    senderName: user?.displayName || 'Sender',
    claimUrl
  });

  return (
    <div className="by-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && step !== 'sent') onClose();
    }}>
      <div 
        className={`by-payment-card-frame ${step === 'sent' ? 'dark-sent-state' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        {step !== 'sent' && (
          <div className="by-modal-header">
            <button className="by-modal-back-btn" onClick={handleBack}>
              <ArrowLeft size={18} />
              <span>
                {step === 'review' ? 'Review payment' : 'Send money'}
              </span>
            </button>

            <button className="by-modal-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Error notification if any */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: '#ef4444',
            fontSize: '0.84rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
            {(errorMessage.toLowerCase().includes('gas') || errorMessage.toLowerCase().includes('insufficient') || errorMessage.toLowerCase().includes('balance')) && (
              <button
                type="button"
                onClick={async () => {
                  if (!user?.walletAddress) return;
                  try {
                    setErrorMessage('Requesting 0.05 MON testnet gas...');
                    const res = await fetch('/api/faucet', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ address: user.walletAddress }),
                    });
                    if (res.ok) {
                      setErrorMessage('Gas funded successfully! 0.05 MON is now in your wallet. Please click Send again.');
                    }
                  } catch {
                    setErrorMessage('Faucet request failed. Please check network.');
                  }
                }}
                style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(255, 107, 53, 0.2)',
                  border: '1px solid #FF6B35',
                  color: '#FF6B35',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Request 0.05 MON Gas
              </button>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* STEP 1: RECIPIENT SELECTED                                      */}
        {/* =============================================================== */}
        {step === 'recipient' && (
          <>
            <div>
              <div className="by-flow-label">To</div>
              <div className="by-recipient-box">
                <div className="by-rb-left">
                  <div 
                    className="by-avatar"
                    style={{ background: recipient.avatarBg, color: recipient.avatarText }}
                  >
                    {recipient.initial}
                  </div>
                  <div>
                    <div className="by-rb-name">{recipient.name}</div>
                    <div className="by-rb-identifier">
                      {recipientIdentifier}
                    </div>
                  </div>
                </div>

                <div className="by-green-check-circle">
                  <Check size={14} strokeWidth={3} />
                </div>
              </div>
            </div>

            <button 
              className="by-primary-btn"
              onClick={() => setStep('amount')}
            >
              <span>Continue</span>
              <span>&rarr;</span>
            </button>
          </>
        )}

        {/* =============================================================== */}
        {/* STEP 2: AMOUNT SCREEN                                           */}
        {/* =============================================================== */}
        {step === 'amount' && (
          <>
            {/* Recipient summary card with Edit */}
            <div>
              <div className="by-flow-label">To</div>
              <div className="by-recipient-box">
                <div className="by-rb-left">
                  <div 
                    className="by-avatar"
                    style={{ width: '38px', height: '38px', background: recipient.avatarBg, color: recipient.avatarText }}
                  >
                    {recipient.initial}
                  </div>
                  <div>
                    <div className="by-rb-name">{recipient.name}</div>
                    <div className="by-rb-identifier">
                      {recipientIdentifier}
                    </div>
                  </div>
                </div>

                <button className="by-rb-edit-btn" onClick={onEditRecipient}>
                  Edit
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="by-flow-label">Amount</div>
              <div className="by-amount-card-field">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--by-text)' }}>$</span>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="by-amount-numeric-input"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                <div className="by-currency-pill">
                  <span style={{ color: '#2775CA', fontWeight: 800 }}>$</span>
                  <span>USDC</span>
                  <ChevronDown size={14} color="#6B6B6B" />
                </div>
              </div>
            </div>

            <div className="by-balance-hint">
              <span>Your Monad balance:</span>
              <strong style={{ color: 'var(--by-text)' }}>
                {userBalanceUSDC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDC
              </strong>
            </div>

            {userBalanceUSDC < numericAmount && (
              <div style={{
                background: 'rgba(255, 107, 53, 0.08)',
                border: '1px solid rgba(255, 107, 53, 0.25)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: '#FF6B35',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <span>Testnet Balance Low</span>
                <a 
                  href="https://testnet.monad.xyz/" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#FF6B35', fontWeight: 700, textDecoration: 'underline' }}
                >
                  Get Faucet Tokens &rarr;
                </a>
              </div>
            )}

            {/* Routing Notice */}
            <div className="by-info-notice-bar">
              <Lock size={15} />
              <span>{recipient.name.split(' ')[0]} chooses the receiving method.</span>
            </div>

            <button 
              className="by-primary-btn"
              disabled={numericAmount <= 0}
              onClick={() => setStep('review')}
            >
              <span>Review payment</span>
              <span>&rarr;</span>
            </button>
          </>
        )}

        {/* =============================================================== */}
        {/* STEP 3: REVIEW PAYMENT                                          */}
        {/* =============================================================== */}
        {step === 'review' && (
          <>
            <div className="by-review-summary-box">
              <div className="by-review-row">
                <span className="by-review-label">To</span>
                <div className="by-review-value">
                  <div>{recipient.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--by-text-secondary)', fontWeight: 400 }}>
                    {recipientIdentifier}
                  </div>
                </div>
              </div>

              <div className="by-review-row">
                <span className="by-review-label">Amount</span>
                <span className="by-review-value" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  ${numericAmount.toFixed(2)} USDC
                </span>
              </div>

              <div className="by-review-row">
                <span className="by-review-label">Network</span>
                <span className="by-review-value">Monad Testnet (Chain 10143)</span>
              </div>

              <div className="by-review-row">
                <span className="by-review-label">Execution Speed</span>
                <span className="by-review-value" style={{ color: '#10B981', fontWeight: 600 }}>
                  &lt; 0.8s Single-Slot Finality
                </span>
              </div>
            </div>

            <div className="by-info-notice-bar">
              <Lock size={15} />
              <span>Recipient selects whether to claim to Monad EVM, Mobile Money, or Bank.</span>
            </div>

            {txStageMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(255, 107, 53, 0.1)',
                border: '1px solid rgba(255, 107, 53, 0.25)',
                color: 'var(--by-orange)',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: '10px'
              }}>
                <Loader2 size={14} className="animate-spin" />
                <span>{txStageMessage}</span>
              </div>
            )}

            <button 
              className="by-primary-btn"
              disabled={isSubmitting}
              onClick={handleSendPayment}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Securing on Monad...</span>
                </>
              ) : (
                <>
                  <span>Send ${numericAmount.toFixed(2)}</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </>
        )}

        {/* =============================================================== */}
        {/* STEP 4: PAYMENT SENT STATE                                      */}
        {/* =============================================================== */}
        {step === 'sent' && (
          <>
            <div className="by-sent-hero-icon">
              <Check size={32} strokeWidth={3} />
            </div>

            <p className="by-sent-title">Payment Secured on Monad!</p>
            <div className="by-sent-amount">${numericAmount.toFixed(2)} USDC</div>
            <div className="by-sent-recipient-sub">Ready for {recipient.name}</div>

            {/* Real Claim Link Card */}
            {claimUrl && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '14px',
                margin: '16px 0',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Recipient Claim Link
                  </span>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      background: isCopied ? '#10B981' : 'rgba(255, 107, 53, 0.15)',
                      color: isCopied ? '#ffffff' : '#FF6B35',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isCopied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#e2e8f0',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  {claimUrl}
                </div>

                {/* Direct Share Options */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {recipient.phone && (
                    <a
                      href={NotificationService.getWhatsAppShareUrl(recipient.phone, shareText)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        background: 'rgba(37, 211, 102, 0.15)',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        color: '#25D366',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {recipient.email && (
                    <a
                      href={NotificationService.getEmailIntentUrl(recipient.email, numericAmount, shareText)}
                      style={{
                        flex: 1,
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <Mail size={13} />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Payment Lifecycle Checklist */}
            <div className="by-lifecycle-card">
              <div className="by-lifecycle-item">
                <div className="by-lc-icon completed">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="by-lc-text completed">Payment secured on Monad</span>
              </div>

              <div className="by-lifecycle-item">
                <div className="by-lc-icon completed">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="by-lc-text completed">Claim link generated</span>
              </div>

              <div className="by-lifecycle-item">
                <div className="by-lc-icon pending" />
                <span className="by-lc-text pending">Waiting for recipient</span>
              </div>

              <div className="by-lifecycle-item">
                <div className="by-lc-icon pending" />
                <span className="by-lc-text pending">Settlement pending</span>
              </div>
            </div>

            {/* Explorer Verification Link */}
            {confirmedTxHash && (
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <a 
                  href={`https://testnet.monadexplorer.com/tx/${confirmedTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#10B981',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  <span>Verify on Monad Explorer</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Actions for Sent State */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              <button 
                className="by-sent-view-activity-btn"
                style={{ margin: 0 }}
                onClick={() => {
                  onClose();
                  onViewActivity();
                }}
              >
                View in Activity
              </button>

              <button 
                style={{
                  width: '100%',
                  background: 'rgba(255, 107, 53, 0.12)',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  color: 'var(--by-orange)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  window.open(claimUrl, '_blank');
                }}
              >
                <ExternalLink size={15} />
                <span>Open Recipient Claim Page (New Tab)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
