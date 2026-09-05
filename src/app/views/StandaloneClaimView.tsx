import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Check, 
  ShieldCheck, 
  ExternalLink, 
  AlertCircle,
  Loader2,
  LogIn,
  Lock,
  ArrowRight,
  Sparkles,
  AtSign,
  MessageSquare
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
  const { user, isAuthenticated, login, createWallet } = useBeyiniAuth();
  const { claimWithPreimage, getOnchainPayment } = useMonadEscrow();

  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(true);
  const [_onchainStatus, setOnchainStatus] = useState<number | null>(null);

  // Recipient input for identity verification
  const [recipientInput, setRecipientInput] = useState('');
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showManualVerify, setShowManualVerify] = useState(false);

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

  // Pre-fill recipient input and auto-verify if the connected user's identity matches the payment commitment
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
          // Continue checking next candidate
        }
      }
    }
  }, [user, payment]);

  const getMaskedRecipientHint = (val?: string): string => {
    if (!val) return '';
    if (val.includes('@') && val.includes('.')) {
      const [local, domain] = val.split('@');
      const start = local.slice(0, 3);
      return `${start}***@${domain}`;
    }
    if (val.length > 4) {
      return `${val.slice(0, 2)}****${val.slice(-2)}`;
    }
    return val;
  };

  // Handle Identity Verification
  const handleVerifyIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerificationError(null);

    if (!payment) return;
    const valueToVerify = recipientInput.trim() || payment.recipient_identity_value;
    if (!valueToVerify) {
      setVerificationError('Please enter your identity to verify.');
      return;
    }

    try {
      const normalized = IdentityService.normalizeIdentifier(valueToVerify, payment.recipient_identity_type);
      const computedHash = IdentityService.hashIdentifier(normalized);
      const computedCommitment = IdentityService.computeCommitment(computedHash, payment.salt);

      if (computedCommitment.toLowerCase() === payment.recipient_identity_commitment.toLowerCase()) {
        setIsIdentityVerified(true);
        setVerificationError(null);
      } else {
        setVerificationError(`Verification failed: '${valueToVerify}' does not match the designated recipient for this escrow payment.`);
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Verification failed');
    }
  };

  // Handle Real On-Chain Claim
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

      const candidateValue = recipientInput || (
        payment.recipient_identity_type === 'twitter' ? user?.twitterUsername :
        payment.recipient_identity_type === 'discord' ? user?.discordUsername :
        payment.recipient_identity_value
      ) || '';

      const normalized = IdentityService.normalizeIdentifier(candidateValue, payment.recipient_identity_type);
      const identifierHash = IdentityService.hashIdentifier(normalized);

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
        color: '#fff',
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '420px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>Payment Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px' }}>
            This claim link may be invalid or has expired. Please verify the link with the sender.
          </p>
          {onExit && (
            <button
              onClick={onExit}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '9999px',
                background: '#FF6B35',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const isTwitter = payment.recipient_identity_type === 'twitter';
  const isDiscord = payment.recipient_identity_type === 'discord';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 10%, rgba(255, 107, 53, 0.12), #0a0a0c 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: 'rgba(18, 18, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '32px 28px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 107, 53, 0.15)'
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#FF6B35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              color: '#fff'
            }}>
              B
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>Beyini</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            color: '#10B981',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontWeight: 600
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
            <span>Monad Testnet</span>
          </div>
        </div>

        {/* CLAIM COMPLETED SUCCESS STATE */}
        {isClaimCompleted ? (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
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
              color: '#10B981'
            }}>
              <Check size={32} strokeWidth={3} />
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 8px' }}>Payment Claimed!</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 20px' }}>
              <strong>${payment.amount.toFixed(2)} USDC</strong> has been deposited to your Monad Smart Account.
            </p>

            {claimTxHash && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '24px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#94a3b8' }}>Transaction:</span>
                <a 
                  href={`https://testnet.monadexplorer.com/tx/${claimTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#FF6B35', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
                >
                  <span>{claimTxHash.slice(0, 10)}...{claimTxHash.slice(-8)}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Primary CTA: Go to Dashboard */}
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
                {/* Social-specific banner */}
                {isTwitter ? (
                  <div style={{
                    background: 'rgba(29, 155, 240, 0.08)',
                    border: '1px solid rgba(29, 155, 240, 0.25)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '18px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(29, 155, 240, 0.18)',
                      color: '#1D9BF0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}>
                      <AtSign size={20} />
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      Locked for X User @{payment.recipient_identity_value}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 16px' }}>
                      Sign in with X to automatically verify ownership and claim to your Monad Smart Account.
                    </p>

                    <button
                      onClick={() => login()}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '9999px',
                        background: '#1D9BF0',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.94rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 20px rgba(29, 155, 240, 0.35)'
                      }}
                    >
                      <AtSign size={16} />
                      <span>Sign in with X to Claim</span>
                    </button>
                  </div>
                ) : isDiscord ? (
                  <div style={{
                    background: 'rgba(88, 101, 242, 0.08)',
                    border: '1px solid rgba(88, 101, 242, 0.25)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '18px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(88, 101, 242, 0.18)',
                      color: '#5865F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}>
                      <MessageSquare size={20} />
                    </div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                      Locked for Discord User {payment.recipient_identity_value}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4, margin: '0 0 16px' }}>
                      Sign in with Discord to automatically verify ownership and claim to your Monad Smart Account.
                    </p>

                    <button
                      onClick={() => login()}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '9999px',
                        background: '#5865F2',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.94rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 20px rgba(88, 101, 242, 0.35)'
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>Sign in with Discord to Claim</span>
                    </button>
                  </div>
                ) : null}

                {/* Alternative / Manual Verification Form */}
                {(!isTwitter && !isDiscord) || showManualVerify ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Lock size={16} color="#FF6B35" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Verify Recipient Identity</h3>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                      To unlock the escrowed funds, verify ownership of the recipient {payment.recipient_identity_type} associated with this payment.
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
                          placeholder={
                            isTwitter ? '@username' :
                            isDiscord ? 'username' :
                            payment.recipient_identity_type === 'phone' ? '+254 7XX XXX XXX' : 'name@example.com'
                          }
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
                  <button
                    type="button"
                    onClick={() => setShowManualVerify(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      display: 'block',
                      margin: '10px auto 0'
                    }}
                  >
                    Or enter {payment.recipient_identity_type} manually
                  </button>
                )}
              </div>
            ) : (
              /* STEP 2: MONAD SMART ACCOUNT CLAIM */
              <div style={{ padding: '20px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Settlement Rail</span>
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

                {/* Active Pure Web3 Rail: Monad EVM Wallet */}
                <div style={{
                  background: 'rgba(255, 107, 53, 0.08)',
                  border: '1.5px solid #FF6B35',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
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
                        Monad EVM Smart Account
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Receive native USDC directly on Monad testnet
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
                      Sign In to Claim Your Funds
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 18px' }}>
                      No seed phrases or wallet setup needed. Sign in with X, Discord or Email to claim your <strong>${payment.amount.toFixed(2)} USDC</strong> directly on Monad.
                    </p>

                    <button
                      onClick={() => login()}
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
                      <span>Sign In & Claim ${payment.amount.toFixed(2)} USDC</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Authenticated Wallet Account Card */}
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
                          {user.twitterUsername ? `@${user.twitterUsername} (X)` :
                           user.discordUsername ? `${user.discordUsername} (Discord)` :
                           user.email || user.displayName || 'Connected'}
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
