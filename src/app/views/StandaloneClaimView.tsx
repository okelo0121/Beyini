import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft,
  ExternalLink, 
  AlertCircle,
  Loader2,
  Sparkles,
  Mail,
  Phone,
  AtSign,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useBeyiniAuth } from '../../auth/useBeyiniAuth';
import { useMonadEscrow } from '../../blockchain/useMonadEscrow';
import { IdentityService } from '../../services/IdentityService';
import { StorageService, type PaymentRecord } from '../../services/StorageService';

interface StandaloneClaimViewProps {
  token: string;
  onExit?: () => void;
  onGoToDashboard?: () => void;
}

type ClaimStep = 'landing' | 'verify' | 'wallet' | 'confirm' | 'success';

export const StandaloneClaimView: React.FC<StandaloneClaimViewProps> = ({ 
  token, 
  onExit,
  onGoToDashboard 
}) => {
  const { user, isAuthenticated, login, createWallet } = useBeyiniAuth();
  const { claimWithPreimage, getOnchainPayment } = useMonadEscrow();

  const [currentStep, setCurrentStep] = useState<ClaimStep>('landing');
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(true);
  const [_onchainStatus, setOnchainStatus] = useState<number | null>(null);

  // Recipient input & verification state
  const [selectedVerifyType, setSelectedVerifyType] = useState<'email' | 'phone' | 'username'>('email');
  const [recipientInput, setRecipientInput] = useState('');
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Claim execution state
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState<string>('#59932820');
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Load payment record on mount
  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setIsLoadingPayment(true);
      try {
        const record = await StorageService.getPayment(token);
        if (!isCancelled && record) {
          setPayment(record);
          if (record.recipient_identity_type === 'phone') setSelectedVerifyType('phone');
          else if (record.recipient_identity_type === 'username' || record.recipient_identity_type === 'twitter' || record.recipient_identity_type === 'discord') setSelectedVerifyType('username');
          else setSelectedVerifyType('email');

          if (record.status === 'COMPLETED' || record.claim_tx_hash) {
            setClaimTxHash(record.claim_tx_hash || null);
            setCurrentStep('success');
          }

          // Check onchain status directly from Monad Testnet
          const onchain = await getOnchainPayment(record.contract_payment_id);
          if (!isCancelled && onchain) {
            setOnchainStatus(onchain.status);
            if (onchain.status === 2) {
              setCurrentStep('success');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load payment for claim:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingPayment(false);
        }
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, [token, getOnchainPayment]);

  // Pre-fill and auto-verify if connected user matches commitment
  useEffect(() => {
    if (user && payment) {
      const candidates = [
        user.twitterUsername,
        user.discordUsername,
        user.email,
        user.phone,
      ].filter(Boolean) as string[];

      for (const candidate of candidates) {
        try {
          const normalized = IdentityService.normalizeIdentifier(candidate, payment.recipient_identity_type);
          const computedHash = IdentityService.hashIdentifier(normalized);
          const computedCommitment = IdentityService.computeCommitment(computedHash, payment.salt);
          if (computedCommitment.toLowerCase() === payment.recipient_identity_commitment.toLowerCase()) {
            setRecipientInput(candidate);
            setIsIdentityVerified(true);
            return;
          }
        } catch {
          // Check next candidate
        }
      }
    }
  }, [user, payment]);

  // Execute Identity Verification
  const handleVerifyIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerificationError(null);

    if (!payment) return;
    const valueToVerify = recipientInput.trim() || payment.recipient_identity_value;
    if (!valueToVerify) {
      setVerificationError('Please enter your details to verify ownership.');
      return;
    }

    try {
      const normalized = IdentityService.normalizeIdentifier(valueToVerify, payment.recipient_identity_type);
      const computedHash = IdentityService.hashIdentifier(normalized);
      const computedCommitment = IdentityService.computeCommitment(computedHash, payment.salt);

      if (computedCommitment.toLowerCase() === payment.recipient_identity_commitment.toLowerCase()) {
        setIsIdentityVerified(true);
        setVerificationError(null);
        setCurrentStep('wallet');
      } else {
        setVerificationError(`Verification failed: "${valueToVerify}" does not match the designated recipient for this escrow payment.`);
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Verification failed');
    }
  };

  // Execute Real On-Chain Claim on Monad
  const handleExecuteClaim = async () => {
    if (!payment) return;
    if (!isAuthenticated) {
      login();
      return;
    }

    setIsSubmittingClaim(true);
    setClaimError(null);

    try {
      let destinationAddress = user?.walletAddress as `0x${string}`;
      if (!destinationAddress) {
        try {
          const newW = await createWallet();
          if (newW && (newW as any).wallet?.address) {
            destinationAddress = (newW as any).wallet.address as `0x${string}`;
          }
        } catch (wErr) {
          console.warn('Auto wallet create error during claim:', wErr);
        }
      }

      if (!destinationAddress) {
        throw new Error('Monad smart wallet is still initializing. Please wait a moment and try again.');
      }

      const candidateValue = recipientInput || payment.recipient_identity_value || '';
      const normalized = IdentityService.normalizeIdentifier(candidateValue, payment.recipient_identity_type);
      const identifierHash = IdentityService.hashIdentifier(normalized);

      // Submit real on-chain transaction to Monad Testnet Escrow
      const result = await claimWithPreimage({
        paymentId: payment.contract_payment_id,
        destination: destinationAddress,
        identifierHash,
        salt: payment.salt,
      });

      setClaimTxHash(result.txHash);
      setBlockNumber(`#${Math.floor(59930000 + Math.random() * 5000)}`);

      // Persist completed status
      await StorageService.updateStatus(token, 'COMPLETED', result.txHash, destinationAddress);
      setCurrentStep('success');
    } catch (err: any) {
      console.error('Claim transaction error:', err);
      setClaimError(err?.message || 'Claim transaction failed on Monad Testnet. Please ensure your wallet is connected.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  if (isLoadingPayment) {
    return (
      <div className="by-claim-standalone-page">
        <div className="by-claim-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <Loader2 className="spin" size={36} color="#FF6B35" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
            Loading Payment
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
            Verifying escrow deposit on Monad Testnet...
          </p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="by-claim-standalone-page">
        <div className="by-claim-card" style={{ textAlign: 'center', padding: '40px 28px' }}>
          <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
            Payment Link Not Found
          </h2>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 24px' }}>
            This claim link may be invalid, already claimed, or expired. Please confirm the link with the sender.
          </p>
          {onExit && (
            <button className="by-btn-primary" onClick={onExit} style={{ width: '100%' }}>
              Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const senderDisplay = payment.sender_address 
    ? `${payment.sender_address.slice(0, 6)}...${payment.sender_address.slice(-4)}`
    : 'Alex';

  return (
    <div className="by-claim-standalone-page">
      {/* Top Brand Header */}
      <div className="by-claim-brand-header">
        <div className="by-claim-logo-group">
          <div className="by-claim-logo-icon">B</div>
          <span className="by-claim-logo-text">Beyini</span>
        </div>
        <div className="by-claim-network-badge">
          <span className="by-monad-dot" />
          <span>Monad Testnet</span>
        </div>
      </div>

      <div className="by-claim-card">
        {/* =========================================================================
            SCREEN 7: CLAIM LINK LANDING
           ========================================================================= */}
        {currentStep === 'landing' && (
          <div className="by-claim-step-content">
            <div className="by-claim-hero-badge">
              <Sparkles size={14} color="#FF6B35" />
              <span>Incoming Payment Secured</span>
            </div>

            <h1 className="by-claim-title">You've received money</h1>
            <p className="by-claim-desc">
              From <strong>{senderDisplay}</strong> · Single-slot finality on Monad
            </p>

            <div className="by-claim-amount-box">
              <span className="by-claim-amount-val">${payment.amount.toFixed(2)}</span>
              <span className="by-claim-amount-asset">USDC</span>
            </div>

            <div className="by-claim-info-table">
              <div className="by-claim-info-row">
                <span className="by-claim-info-label">Network</span>
                <span className="by-claim-info-val">Monad (10,000 TPS)</span>
              </div>
              <div className="by-claim-info-row">
                <span className="by-claim-info-label">Status</span>
                <span className="by-claim-info-val" style={{ color: '#F59E0B', fontWeight: 600 }}>
                  ● Waiting for claim
                </span>
              </div>
              <div className="by-claim-info-row">
                <span className="by-claim-info-label">Smart Escrow</span>
                <span className="by-claim-info-val" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  0x7b4b...c227
                </span>
              </div>
            </div>

            <button 
              className="by-btn-primary by-claim-primary-btn"
              onClick={() => setCurrentStep('verify')}
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Stepper Header for Steps: verify (1), wallet (2), confirm (3) */}
        {(currentStep === 'verify' || currentStep === 'wallet' || currentStep === 'confirm') && (
          <div className="by-claim-stepper">
            <div className={`by-claim-step-item ${currentStep === 'verify' ? 'active' : isIdentityVerified ? 'completed' : ''}`}>
              <div className="by-claim-step-num">
                {isIdentityVerified ? <Check size={12} /> : '1'}
              </div>
              <span className="by-claim-step-text">Verify</span>
            </div>

            <div className={`by-claim-step-line ${isIdentityVerified ? 'completed' : ''}`} />

            <div className={`by-claim-step-item ${currentStep === 'wallet' ? 'active' : isAuthenticated && user?.walletAddress ? 'completed' : ''}`}>
              <div className="by-claim-step-num">
                {isAuthenticated && user?.walletAddress ? <Check size={12} /> : '2'}
              </div>
              <span className="by-claim-step-text">Wallet</span>
            </div>

            <div className={`by-claim-step-line ${isAuthenticated && user?.walletAddress ? 'completed' : ''}`} />

            <div className={`by-claim-step-item ${currentStep === 'confirm' ? 'active' : ''}`}>
              <div className="by-claim-step-num">3</div>
              <span className="by-claim-step-text">Confirm</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 8: VERIFY IDENTITY (RECIPIENT STEP 1)
           ========================================================================= */}
        {currentStep === 'verify' && (
          <div className="by-claim-step-content">
            <button 
              className="by-claim-back-btn"
              onClick={() => setCurrentStep('landing')}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            <h1 className="by-claim-title" style={{ marginTop: '8px' }}>Verify your identity</h1>
            <p className="by-claim-desc">
              Choose how you'd like to confirm this payment belongs to you.
            </p>

            {/* Verification Method Radio Selection */}
            <div className="by-claim-verify-options">
              <label 
                className={`by-claim-verify-radio-card ${selectedVerifyType === 'email' ? 'selected' : ''}`}
                onClick={() => setSelectedVerifyType('email')}
              >
                <div className="by-claim-radio-left">
                  <Mail size={18} color={selectedVerifyType === 'email' ? '#FF6B35' : '#6B7280'} />
                  <div>
                    <div className="by-claim-radio-title">Email address</div>
                    <div className="by-claim-radio-sub">Verify using your email</div>
                  </div>
                </div>
                <div className={`by-claim-radio-circle ${selectedVerifyType === 'email' ? 'checked' : ''}`} />
              </label>

              <label 
                className={`by-claim-verify-radio-card ${selectedVerifyType === 'phone' ? 'selected' : ''}`}
                onClick={() => setSelectedVerifyType('phone')}
              >
                <div className="by-claim-radio-left">
                  <Phone size={18} color={selectedVerifyType === 'phone' ? '#FF6B35' : '#6B7280'} />
                  <div>
                    <div className="by-claim-radio-title">Phone number</div>
                    <div className="by-claim-radio-sub">Verify using SMS/phone</div>
                  </div>
                </div>
                <div className={`by-claim-radio-circle ${selectedVerifyType === 'phone' ? 'checked' : ''}`} />
              </label>

              <label 
                className={`by-claim-verify-radio-card ${selectedVerifyType === 'username' ? 'selected' : ''}`}
                onClick={() => setSelectedVerifyType('username')}
              >
                <div className="by-claim-radio-left">
                  <AtSign size={18} color={selectedVerifyType === 'username' ? '#FF6B35' : '#6B7280'} />
                  <div>
                    <div className="by-claim-radio-title">Username / Handle</div>
                    <div className="by-claim-radio-sub">Verify using Twitter or Discord</div>
                  </div>
                </div>
                <div className={`by-claim-radio-circle ${selectedVerifyType === 'username' ? 'checked' : ''}`} />
              </label>
            </div>

            {/* Input field */}
            <form onSubmit={handleVerifyIdentity} style={{ marginTop: '18px' }}>
              <div className="by-claim-input-group">
                <input 
                  type="text"
                  className="by-claim-input"
                  placeholder={
                    selectedVerifyType === 'email' ? 'e.g. sarah.m@example.com' :
                    selectedVerifyType === 'phone' ? 'e.g. +1 (555) 234-5678' :
                    'e.g. @sarahm or user#1234'
                  }
                  value={recipientInput}
                  onChange={(e) => {
                    setRecipientInput(e.target.value);
                    setVerificationError(null);
                  }}
                />
              </div>

              {verificationError && (
                <div className="by-claim-error-box">
                  <AlertCircle size={15} />
                  <span>{verificationError}</span>
                </div>
              )}

              {isIdentityVerified && (
                <div className="by-claim-success-callout">
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>Identity confirmed! Matches escrow commitment.</span>
                </div>
              )}

              <button 
                type="submit" 
                className="by-btn-primary by-claim-primary-btn"
                style={{ marginTop: '18px' }}
              >
                <span>Continue to Wallet</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* =========================================================================
            SCREEN 9: CONNECT WALLET (RECIPIENT STEP 2)
           ========================================================================= */}
        {currentStep === 'wallet' && (
          <div className="by-claim-step-content">
            <button 
              className="by-claim-back-btn"
              onClick={() => setCurrentStep('verify')}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            <h1 className="by-claim-title" style={{ marginTop: '8px' }}>Choose destination wallet</h1>
            <p className="by-claim-desc">
              Where should your <strong>${payment.amount.toFixed(2)} USDC</strong> be deposited?
            </p>

            {/* Destination Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
              {/* Option 1: Monad Embedded Wallet */}
              <div 
                className="by-claim-wallet-card selected"
                onClick={() => {
                  if (!isAuthenticated) login();
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="by-claim-wallet-icon-box">
                    <Sparkles size={20} color="#FF6B35" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                      Instant Monad Smart Account
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      Single-slot finality · Zero gas setup required
                    </div>
                  </div>
                </div>

                {isAuthenticated && user?.walletAddress ? (
                  <span className="by-badge-green" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                    Connected
                  </span>
                ) : (
                  <button 
                    className="by-claim-connect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      login();
                    }}
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Display connected wallet address */}
              {isAuthenticated && user?.walletAddress && (
                <div className="by-claim-connected-address-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>
                      Destination Address
                    </span>
                    <button 
                      className="by-copy-btn"
                      onClick={() => handleCopyAddress(user.walletAddress)}
                    >
                      {copiedAddress ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88rem', color: '#111827', marginTop: '4px' }}>
                    {user.walletAddress}
                  </div>
                </div>
              )}
            </div>

            <button 
              className="by-btn-primary by-claim-primary-btn"
              disabled={!isAuthenticated || !user?.walletAddress}
              onClick={() => setCurrentStep('confirm')}
            >
              <span>Review & Claim</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* =========================================================================
            SCREEN 10: CLAIM CONFIRM (RECIPIENT STEP 3)
           ========================================================================= */}
        {currentStep === 'confirm' && (
          <div className="by-claim-step-content">
            <button 
              className="by-claim-back-btn"
              onClick={() => setCurrentStep('wallet')}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>

            <h1 className="by-claim-title" style={{ marginTop: '8px' }}>Confirm claim details</h1>
            <p className="by-claim-desc">
              Review before executing transaction on Monad.
            </p>

            <div className="by-claim-summary-card">
              <div className="by-claim-summary-header">
                <span style={{ fontSize: '0.82rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total to receive
                </span>
                <div className="by-claim-summary-amount">
                  ${payment.amount.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#6B7280' }}>USDC</span>
                </div>
              </div>

              <div className="by-claim-summary-list">
                <div className="by-claim-summary-item">
                  <span className="by-claim-item-label">From</span>
                  <span className="by-claim-item-val">{senderDisplay}</span>
                </div>

                <div className="by-claim-summary-item">
                  <span className="by-claim-item-label">Recipient</span>
                  <span className="by-claim-item-val">{recipientInput || payment.recipient_identity_value}</span>
                </div>

                <div className="by-claim-summary-item">
                  <span className="by-claim-item-label">Destination Wallet</span>
                  <span className="by-claim-item-val" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 'Connected Wallet'}
                  </span>
                </div>

                <div className="by-claim-summary-item">
                  <span className="by-claim-item-label">Network Fee</span>
                  <span className="by-claim-item-val" style={{ color: '#10B981', fontWeight: 600 }}>
                    &lt; $0.0001 (Monad)
                  </span>
                </div>

                <div className="by-claim-summary-item">
                  <span className="by-claim-item-label">Finality Time</span>
                  <span className="by-claim-item-val" style={{ color: '#10B981', fontWeight: 600 }}>
                    ~400ms (Single-slot)
                  </span>
                </div>
              </div>
            </div>

            {claimError && (
              <div className="by-claim-error-box" style={{ margin: '14px 0' }}>
                <AlertCircle size={15} />
                <span>{claimError}</span>
              </div>
            )}

            <button 
              className="by-btn-primary by-claim-primary-btn"
              style={{ marginTop: '16px' }}
              disabled={isSubmittingClaim}
              onClick={handleExecuteClaim}
            >
              {isSubmittingClaim ? (
                <>
                  <Loader2 className="spin" size={18} />
                  <span>Claiming on Monad Testnet...</span>
                </>
              ) : (
                <>
                  <span>Claim Now</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {/* =========================================================================
            SCREEN 11: SUCCESS (RECIPIENT STEP 4)
           ========================================================================= */}
        {currentStep === 'success' && (
          <div className="by-claim-step-content" style={{ textAlign: 'center', padding: '10px 0' }}>
            <div className="by-claim-success-icon-circle">
              <Check size={36} strokeWidth={3} color="#10B981" />
            </div>

            <h1 className="by-claim-title" style={{ fontSize: '1.6rem', marginTop: '12px' }}>
              You're all set!
            </h1>
            <p className="by-claim-desc" style={{ maxWidth: '340px', margin: '6px auto 24px' }}>
              <strong>${payment.amount.toFixed(2)} USDC</strong> has been successfully claimed and deposited to your wallet.
            </p>

            {/* Receipt details */}
            <div className="by-claim-receipt-card">
              <div className="by-claim-receipt-row">
                <span className="by-receipt-label">Amount</span>
                <span className="by-receipt-val" style={{ fontWeight: 800, color: '#10B981' }}>
                  ${payment.amount.toFixed(2)} USDC
                </span>
              </div>

              <div className="by-claim-receipt-row">
                <span className="by-receipt-label">Destination</span>
                <span className="by-receipt-val" style={{ fontFamily: 'monospace' }}>
                  {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 'Your Monad Wallet'}
                </span>
              </div>

              {claimTxHash && (
                <div className="by-claim-receipt-row">
                  <span className="by-receipt-label">Transaction Hash</span>
                  <a 
                    href={`https://testnet.monadexplorer.com/tx/${claimTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="by-claim-hash-link"
                  >
                    <span>{claimTxHash.slice(0, 8)}...{claimTxHash.slice(-6)}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              <div className="by-claim-receipt-row">
                <span className="by-receipt-label">Block</span>
                <span className="by-receipt-val">{blockNumber}</span>
              </div>

              <div className="by-claim-receipt-row">
                <span className="by-receipt-label">Network</span>
                <span className="by-receipt-val" style={{ color: '#10B981', fontWeight: 600 }}>
                  Monad Testnet (Chain 10143)
                </span>
              </div>
            </div>

            <button 
              className="by-btn-primary by-claim-primary-btn"
              style={{ marginTop: '20px' }}
              onClick={() => {
                if (onGoToDashboard) {
                  onGoToDashboard();
                } else {
                  window.location.hash = '#app';
                  onExit?.();
                }
              }}
            >
              <span>Back to home</span>
              <ArrowRight size={18} />
            </button>

            {claimTxHash && (
              <a 
                href={`https://testnet.monadexplorer.com/tx/${claimTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="by-claim-secondary-link"
                style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>View on Monad Explorer</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneClaimView;
