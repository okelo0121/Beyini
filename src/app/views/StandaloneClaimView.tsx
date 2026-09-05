import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Smartphone, 
  Building, 
  Check, 
  ShieldCheck, 
  ExternalLink, 
  AlertCircle,
  Loader2,
  LogIn,
  Lock,
  ArrowRight,
  Sparkles
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

export const StandaloneClaimView: React.FC<StandaloneClaimViewProps> = ({ 
  token, 
  onExit,
  onGoToDashboard 
}) => {
  const { user, isAuthenticated, login, logout } = useBeyiniAuth();
  const { claimWithPreimage, getOnchainPayment } = useMonadEscrow();

  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(true);
  const [onchainStatus, setOnchainStatus] = useState<number | null>(null);

  // Recipient input for identity verification
  const [recipientInput, setRecipientInput] = useState('');
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Claim execution state
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaimCompleted, setIsClaimCompleted] = useState(false);

  // Load payment record on mount
  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setIsLoadingPayment(true);
      try {
        const record = await StorageService.getPayment(token);
        if (!isCancelled && record) {
          setPayment(record);
          if (record.status === 'COMPLETED' || record.claim_tx_hash) {
            setIsClaimCompleted(true);
            setClaimTxHash(record.claim_tx_hash || null);
          }

          // Check onchain status directly from Monad Testnet
          const onchain = await getOnchainPayment(record.contract_payment_id);
          if (!isCancelled && onchain) {
            setOnchainStatus(onchain.status);
            if (onchain.status === 2) {
              // Status 2 = CLAIMED
              setIsClaimCompleted(true);
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

  // Pre-fill recipient input ONLY if the connected user's identity matches the payment commitment
  useEffect(() => {
    if (user && !recipientInput && payment) {
      const candidate = user.email || user.phone;
      if (candidate) {
        try {
          const normalized = IdentityService.normalizeIdentifier(candidate);
          const computedHash = IdentityService.hashIdentifier(normalized);
          const computedCommitment = IdentityService.computeCommitment(computedHash, payment.salt);
          if (computedCommitment.toLowerCase() === payment.recipient_identity_commitment.toLowerCase()) {
            setRecipientInput(candidate);
            setIsIdentityVerified(true);
          }
        } catch {
          // Do not auto-prefill mismatched identity
        }
      }
    }
  }, [user, payment, recipientInput]);

  const getMaskedRecipientHint = (val?: string): string => {
    if (!val) return '';
    if (val.includes('@')) {
      const [local, domain] = val.split('@');
      const start = local.slice(0, 3);
      return `${start}***@${domain}`;
    }
    if (val.length > 6) {
      return `${val.slice(0, 4)}****${val.slice(-3)}`;
    }
    return val;
  };

  // Handle Identity Verification
  const handleVerifyIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerificationError(null);

    if (!payment) return;
    if (!recipientInput.trim()) {
      setVerificationError('Please enter your phone number, email, or username to verify identity.');
      return;
    }

    try {
      const normalized = IdentityService.normalizeIdentifier(recipientInput);
      const computedHash = IdentityService.hashIdentifier(normalized);
      const computedCommitment = IdentityService.computeCommitment(computedHash, payment.salt);

      if (computedCommitment.toLowerCase() === payment.recipient_identity_commitment.toLowerCase()) {
        setIsIdentityVerified(true);
      } else {
        setVerificationError(`Verification failed: '${recipientInput}' does not match the recipient identity for this payment.`);
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Verification failed');
    }
  };

  // Handle Real On-Chain Claim
  const handleExecuteClaim = async () => {
    if (!payment) return;
    if (!user?.walletAddress) {
      login();
      return;
    }

    setIsSubmittingClaim(true);
    setClaimError(null);

    try {
      const normalized = IdentityService.normalizeIdentifier(recipientInput);
      const identifierHash = IdentityService.hashIdentifier(normalized);
      const destinationAddress = user.walletAddress as `0x${string}`;

      // Submit real on-chain transaction to Monad Testnet
      const result = await claimWithPreimage({
        paymentId: payment.contract_payment_id,
        destination: destinationAddress,
        identifierHash,
        salt: payment.salt,
      });

      setClaimTxHash(result.txHash);
      setIsClaimCompleted(true);

      // Persist completed status
      await StorageService.updateStatus(token, 'COMPLETED', result.txHash, destinationAddress);
    } catch (err: any) {
      console.error('Claim transaction error:', err);
      setClaimError(err?.message || 'Transaction failed on Monad Testnet');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  if (isLoadingPayment) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="spin" size={32} color="#FF6B35" />
          <p style={{ marginTop: '14px', color: '#94a3b8', fontSize: '0.9rem' }}>
            Loading escrow payment from Monad Testnet...
          </p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          background: '#141416',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Payment Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '24px' }}>
            This claim link is invalid or may have expired. Please verify the URL with the sender.
          </p>
          {onExit && (
            <button
              onClick={onExit}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, #1e1512 0%, #0a0a0c 70%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: '#141416',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Top Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/beyini-logo-orange.png" alt="Beyini" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.05em', color: '#FF6B35', textTransform: 'uppercase' }}>
              Beyini Recipient Claim
            </span>
          </div>

          <span style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            {onchainStatus === 2 ? 'Claimed on Monad' : onchainStatus === 1 ? 'Escrow Secured' : 'Monad Testnet'}
          </span>
        </div>

        {/* ============================================================= */}
        {/* STATE 1: CLAIM COMPLETED                                      */}
        {/* ============================================================= */}
        {isClaimCompleted ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#10B981',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
            }}>
              <Check size={32} strokeWidth={3} />
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>Payment Claimed!</h2>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10B981', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              +${payment.amount.toFixed(2)} <span style={{ fontSize: '1.3rem' }}>USDC</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.5 }}>
              The funds have been settled directly into your Monad EVM wallet with single-slot finality.
            </p>

            {claimTxHash && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '4px' }}>Claim Transaction Hash</div>
                <a
                  href={`https://testnet.monadexplorer.com/tx/${claimTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#FF6B35',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}
                >
                  <span>{claimTxHash.slice(0, 12)}...{claimTxHash.slice(-8)}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Primary CTA: Go to Your Dashboard */}
            <button
              onClick={() => {
                if (onGoToDashboard) {
                  onGoToDashboard();
                } else {
                  window.location.hash = '#app';
                  onExit?.();
                }
              }}
              style={{
                width: '100%',
                padding: '15px 20px',
                borderRadius: '9999px',
                background: '#10B981',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '1.02rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                marginBottom: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Go to Your Dashboard</span>
              <ArrowRight size={18} />
            </button>

            {onExit && (
              <button
                onClick={onExit}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '9999px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Close / Return to Home
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Amount Hero */}
            <div style={{ textAlign: 'center', padding: '10px 0 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '4px' }}>You received an escrow payment of</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                ${payment.amount.toFixed(2)} <span style={{ fontSize: '1.4rem', color: '#FF6B35' }}>USDC</span>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '10px',
                fontSize: '0.78rem',
                color: '#10B981',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '4px 12px',
                borderRadius: '9999px'
              }}>
                <ShieldCheck size={14} />
                <span>Locked in BeyiniEscrow on Monad</span>
              </div>
            </div>

            {/* Error banner if any */}
            {(verificationError || claimError) && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                margin: '18px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ef4444',
                fontSize: '0.84rem'
              }}>
                <AlertCircle size={16} />
                <span>{verificationError || claimError}</span>
              </div>
            )}

            {/* STEP 1: IDENTITY VERIFICATION */}
            {!isIdentityVerified ? (
              <div style={{ padding: '20px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Lock size={16} color="#FF6B35" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Verify Recipient Identity</h3>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                  To unlock the escrowed funds, prove ownership of the recipient {payment.recipient_identity_type} associated with this payment.
                  {payment.recipient_identity_value && (
                    <span style={{ display: 'block', color: 'var(--by-orange)', marginTop: '4px', fontWeight: 600 }}>
                      Designated recipient: {getMaskedRecipientHint(payment.recipient_identity_value)}
                    </span>
                  )}
                </p>

                <form onSubmit={handleVerifyIdentity}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                      Enter your {payment.recipient_identity_type}
                    </label>
                    <input
                      type="text"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder={payment.recipient_identity_type === 'phone' ? '+254 7XX XXX XXX' : 'name@example.com'}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '0.92rem',
                        boxSizing: 'border-box'
                      }}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '9999px',
                      background: '#FF6B35',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)'
                    }}
                  >
                    <span>Verify Identity</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            ) : (
              /* STEP 2: CHOOSE SETTLEMENT METHOD & CLAIM */
              <div style={{ padding: '20px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Choose Settlement Rail</span>
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}>
                    <Check size={12} strokeWidth={3} /> Identity Verified
                  </span>
                </div>

                {/* Rail Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {/* Active Rail: Monad EVM Wallet */}
                  <div style={{
                    background: 'rgba(255, 107, 53, 0.08)',
                    border: '1.5px solid #FF6B35',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(255, 107, 53, 0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FF6B35'
                      }}>
                        <Wallet size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
                          Monad EVM / Web3 Wallet
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Receive native USDC on Monad testnet
                        </div>
                      </div>
                    </div>

                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#FF6B35',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff'
                    }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>

                  {/* Disabled Rail: Mobile Money (Coming in Phase 2) */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.45,
                    cursor: 'not-allowed'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8'
                      }}>
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#cbd5e1' }}>
                          Mobile Money (M-Pesa)
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Coming in Phase 2
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Disabled</span>
                  </div>

                  {/* Disabled Rail: Bank Transfer (Coming in Phase 2) */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: 0.45,
                    cursor: 'not-allowed'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8'
                      }}>
                        <Building size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#cbd5e1' }}>
                          Direct Bank Transfer (SEPA / ACH)
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Coming in Phase 2
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Disabled</span>
                  </div>
                </div>

                {/* Recipient Wallet Indicator or Connect / Onboarding Prompt */}
                {!isAuthenticated || !user?.walletAddress ? (
                  <div style={{
                    background: 'rgba(255, 107, 53, 0.06)',
                    border: '1px solid rgba(255, 107, 53, 0.22)',
                    borderRadius: '16px',
                    padding: '20px 18px',
                    textAlign: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(255, 107, 53, 0.15)',
                      color: '#FF6B35',
                      margin: '0 auto 12px'
                    }}>
                      <Sparkles size={20} />
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                      Join Beyini & Claim Your Funds
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 18px' }}>
                      No crypto wallet or seed phrases needed. Create your Beyini Smart Account with <strong>{recipientInput}</strong> to receive your <strong>${payment.amount.toFixed(2)} USDC</strong> directly on Monad.
                    </p>

                    <button
                      onClick={() => login({
                        prefill: {
                          type: payment.recipient_identity_type === 'phone' ? 'phone' : 'email',
                          value: recipientInput.trim()
                        }
                      })}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '9999px',
                        background: '#FF6B35',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.96rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)'
                      }}
                    >
                      <LogIn size={18} />
                      <span>Create Account & Claim ${payment.amount.toFixed(2)} USDC</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Check if authenticated email matches verified recipient email */}
                    {(!user.email || user.email.toLowerCase() === recipientInput.trim().toLowerCase() || user.phone === recipientInput.trim()) ? (
                      <>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '14px',
                          padding: '12px 16px',
                          marginBottom: '16px',
                          fontSize: '0.82rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#94a3b8' }}>Payout Account:</span>
                            <strong style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={12} strokeWidth={3} />
                              {user.email || user.phone || 'Connected'}
                            </strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8' }}>Monad Wallet:</span>
                            <strong style={{ fontFamily: 'monospace', color: '#fff' }}>
                              {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                            </strong>
                          </div>
                        </div>

                        <button
                          onClick={handleExecuteClaim}
                          disabled={isSubmittingClaim}
                          style={{
                            width: '100%',
                            padding: '15px',
                            borderRadius: '9999px',
                            background: '#FF6B35',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: isSubmittingClaim ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)'
                          }}
                        >
                          {isSubmittingClaim ? (
                            <>
                              <Loader2 size={18} className="spin" />
                              <span>Claiming on Monad Testnet...</span>
                            </>
                          ) : (
                            <>
                              <span>Claim ${payment.amount.toFixed(2)} USDC to Monad Wallet</span>
                              <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      /* Authenticated with a different account than the verified recipient */
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginBottom: '16px'
                      }}>
                        <div style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, marginBottom: '6px' }}>
                          Signed in as {user.email || 'another account'}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 14px' }}>
                          This payment is designated for <strong>{recipientInput}</strong>. You can switch accounts to create or claim directly with that email, or proceed to claim to this connected wallet.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            onClick={async () => {
                              await logout();
                              login({
                                prefill: {
                                  type: payment.recipient_identity_type === 'phone' ? 'phone' : 'email',
                                  value: recipientInput.trim()
                                }
                              });
                            }}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '9999px',
                              background: '#FF6B35',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <LogIn size={14} />
                            <span>Switch & Sign In as {recipientInput}</span>
                          </button>

                          <button
                            onClick={handleExecuteClaim}
                            disabled={isSubmittingClaim}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '9999px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              color: '#cbd5e1',
                              fontWeight: 600,
                              fontSize: '0.84rem',
                              cursor: isSubmittingClaim ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            {isSubmittingClaim ? (
                              <>
                                <Loader2 size={14} className="spin" />
                                <span>Claiming on Monad...</span>
                              </>
                            ) : (
                              <span>Claim to Connected Wallet ({user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)})</span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
