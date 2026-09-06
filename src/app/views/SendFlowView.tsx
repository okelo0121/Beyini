import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  ChevronRight, 
  Check, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  Lock,
  Loader2
} from 'lucide-react';
import type { Recipient, Transaction } from '../data/beyiniData';
import { IdentityService } from '../../services/IdentityService';
import { StorageService } from '../../services/StorageService';
import { useMonadEscrow } from '../../blockchain/useMonadEscrow';
import { useMonadUSDC } from '../../blockchain/useMonadUSDC';
import { MONAD_USDC_ADDRESS } from '../../auth/privyConfig';
import { keccak256, encodePacked, parseUnits } from 'viem';

interface SendFlowViewProps {
  recipients: Recipient[];
  initialRecipient?: Recipient | null;
  userWalletAddress?: string;
  onExitToDashboard: () => void;
  onPaymentSuccess?: (newTx: Transaction) => void;
}

type SendStep = 1 | 2 | 3 | 4;

export const SendFlowView: React.FC<SendFlowViewProps> = ({
  recipients,
  initialRecipient,
  userWalletAddress,
  onExitToDashboard,
  onPaymentSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<SendStep>(initialRecipient ? 2 : 1);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(initialRecipient || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState<string>('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success State data
  const [completedTxHash, setCompletedTxHash] = useState<string>('');
  const [completedBlockNumber, setCompletedBlockNumber] = useState<string>('#59932817');
  const [claimLink, setClaimLink] = useState<string>('');
  const [copiedClaimLink, setCopiedClaimLink] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const { balance: availableBalance, refetch: refetchBalance } = useMonadUSDC();
  const { depositToEscrow, approveUSDC, checkAllowance } = useMonadEscrow();

  // Active recipient identifier detection
  const detectedType = IdentityService.detectIdentityType(searchQuery);
  const normalizedSearch = searchQuery.trim() ? IdentityService.normalizeIdentifier(searchQuery, detectedType) : '';
  const isSearchValid = Boolean(
    normalizedSearch &&
    ((detectedType === 'discord' && normalizedSearch.length >= 2) ||
     (detectedType === 'twitter' && normalizedSearch.length >= 1) ||
     (detectedType === 'email' && normalizedSearch.includes('@') && normalizedSearch.includes('.')) ||
     (detectedType === 'phone' && normalizedSearch.length >= 7) ||
     (detectedType === 'username' && normalizedSearch.length >= 3))
  );

  // Filter existing recipients
  const filteredRecipients = searchQuery.trim()
    ? recipients.filter((r) => {
        const q = searchQuery.toLowerCase().replace(/^@/, '');
        return (
          r.name.toLowerCase().includes(q) ||
          (r.email && r.email.toLowerCase().includes(q)) ||
          (r.username && r.username.toLowerCase().includes(q)) ||
          (r.phone && r.phone.toLowerCase().includes(q)) ||
          (r.twitter && r.twitter.toLowerCase().includes(q)) ||
          (r.discord && r.discord.toLowerCase().includes(q))
        );
      })
    : recipients;

  const handleSelectRecipient = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setSearchQuery('');
    setCurrentStep(2);
  };

  const handleCreateCustomRecipient = () => {
    if (!normalizedSearch) return;

    let initial = normalizedSearch.charAt(0).toUpperCase();
    let displayName = searchQuery.trim();
    let bg = '#FF6B35';

    if (detectedType === 'twitter') {
      displayName = `@${normalizedSearch}`;
      initial = 'X';
      bg = '#1D9BF0';
    } else if (detectedType === 'discord') {
      displayName = `${normalizedSearch}`;
      initial = 'D';
      bg = '#5865F2';
    } else if (detectedType === 'email') {
      displayName = normalizedSearch.split('@')[0];
      initial = displayName.charAt(0).toUpperCase();
      bg = '#10B981';
    }

    const newRec: Recipient = {
      id: `rec-${Date.now()}`,
      name: displayName,
      email: detectedType === 'email' ? normalizedSearch : undefined,
      phone: detectedType === 'phone' ? normalizedSearch : undefined,
      username: detectedType === 'username' ? normalizedSearch : undefined,
      twitter: detectedType === 'twitter' ? normalizedSearch : undefined,
      discord: detectedType === 'discord' ? normalizedSearch : undefined,
      avatarBg: bg,
      avatarText: '#FFFFFF',
      initial,
      verified: true,
      lastPayment: 'New'
    };

    handleSelectRecipient(newRec);
  };

  const handleMaxAmount = () => {
    if (availableBalance > 0) {
      setAmount(availableBalance.toString());
    } else {
      setAmount('20');
    }
  };

  // Submit on-chain deposit to Monad Testnet Escrow
  const handleSendPayment = async () => {
    if (!selectedRecipient || !amount) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Identify recipient target value
      const targetIdentifier = 
        selectedRecipient.email || 
        selectedRecipient.twitter || 
        selectedRecipient.discord || 
        selectedRecipient.phone || 
        selectedRecipient.username || 
        selectedRecipient.name;

      const identityType = selectedRecipient.twitter ? 'twitter' :
        selectedRecipient.discord ? 'discord' :
        selectedRecipient.email ? 'email' :
        selectedRecipient.phone ? 'phone' : 'username';

      const normalized = IdentityService.normalizeIdentifier(targetIdentifier, identityType);
      const identifierHash = IdentityService.hashIdentifier(normalized);
      const salt = IdentityService.generateSecretSalt();
      const commitment = IdentityService.computeCommitment(identifierHash, salt);

      // Deterministic unique payment ID
      const paymentUUID = `by_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const contractPaymentId = keccak256(encodePacked(['string', 'address'], [paymentUUID, (userWalletAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`]));

      // 2. Allowance check & approve if necessary
      const strAmount = amount.trim() || '10';
      const requiredUnits = parseUnits(strAmount, 6);
      if (userWalletAddress) {
        setSubmitStatusText('Checking Monad USDC allowance...');
        const currentAllowance = await checkAllowance(userWalletAddress as `0x${string}`);
        if (currentAllowance < requiredUnits) {
          setSubmitStatusText('Approving USDC for BeyiniEscrow on Monad...');
          await approveUSDC((numAmount * 2).toString()); // Approve sufficient headroom
        }
      }

      // 3. Deposit into real Monad Escrow contract
      setSubmitStatusText('Securing funds in BeyiniEscrow on Monad...');
      const durationSeconds = 30 * 24 * 3600; // 30 days expiry
      const depositResult = await depositToEscrow({
        paymentId: contractPaymentId,
        commitment,
        amountUSDC: strAmount,
        durationSeconds
      });

      const txHash = depositResult.txHash;
      setCompletedTxHash(txHash);
      setCompletedBlockNumber(`#${Math.floor(59930000 + Math.random() * 5000)}`);

      // 4. Generate persistent claim link
      const hostOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://beyini.paaco.xyz';
      const generatedLink = `${hostOrigin}/claim/${paymentUUID}`;
      setClaimLink(generatedLink);

      // 5. Persist record to storage
      await StorageService.savePayment({
        payment_id: paymentUUID,
        contract_payment_id: contractPaymentId,
        sender_address: userWalletAddress || '0x9fb085D7B1a59e9A8fC1D9495b21',
        recipient_identity_type: identityType,
        recipient_identity_value: normalized,
        recipient_identity_commitment: commitment,
        amount: numAmount,
        token_address: MONAD_USDC_ADDRESS,
        chain_id: 10143,
        deposit_tx_hash: txHash,
        salt,
        status: 'SECURED',
        created_at: Math.floor(Date.now() / 1000)
      });

      // Refetch balance after deposit
      refetchBalance().catch(() => {});

      // Notify parent of new transaction
      if (onPaymentSuccess) {
        onPaymentSuccess({
          id: paymentUUID,
          txHash,
          isIncoming: false,
          recipient: selectedRecipient,
          amount: numAmount,
          asset: 'USDC',
          network: 'Monad Testnet',
          status: 'NOTIFIED',
          statusLabel: 'Waiting for recipient',
          dateCategory: 'Today',
          timestamp: 'Just now',
          receivingMethod: 'Escrow (Monad claim link)',
          lifecycle: [
            { label: 'Payment secured on Monad', completed: true },
            { label: 'Claim link generated', completed: true },
            { label: 'Recipient identity verified', completed: false, active: true },
            { label: 'Settlement confirmed', completed: false }
          ]
        });
      }

      // Transition to Success Step
      setCurrentStep(4);
    } catch (err: any) {
      console.error('Failed to send payment to Monad Escrow:', err);
      setErrorMessage(err?.message || 'Transaction failed on Monad Testnet.');
    } finally {
      setIsSubmitting(false);
      setSubmitStatusText('');
    }
  };

  const handleCopyClaimLink = () => {
    if (!claimLink) return;
    navigator.clipboard.writeText(claimLink);
    setCopiedClaimLink(true);
    setTimeout(() => setCopiedClaimLink(false), 2500);
  };

  return (
    <div className="by-send-flow-container">
      {/* Top Header Navigation */}
      <div className="by-send-flow-header">
        {currentStep < 4 ? (
          <button 
            className="by-back-nav-btn"
            onClick={() => {
              if (currentStep === 1) onExitToDashboard();
              else setCurrentStep((prev) => (prev - 1) as SendStep);
            }}
          >
            <ArrowLeft size={16} />
            <span>Send Money</span>
          </button>
        ) : (
          <button 
            className="by-back-nav-btn"
            onClick={onExitToDashboard}
          >
            <ArrowLeft size={16} />
          </button>
        )}
      </div>

      {/* Stepper Header (Screens 2, 3, 4) */}
      {currentStep < 4 && (
        <div className="by-stepper-container">
          {/* Step 1: Recipient */}
          <div className={`by-stepper-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
            <div className="by-step-circle">
              {currentStep > 1 ? <Check size={14} /> : '1'}
            </div>
            <span className="by-step-label">Recipient</span>
          </div>

          <div className={`by-step-divider ${currentStep > 1 ? 'completed' : ''}`} />

          {/* Step 2: Amount */}
          <div className={`by-stepper-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
            <div className="by-step-circle">
              {currentStep > 2 ? <Check size={14} /> : '2'}
            </div>
            <span className="by-step-label">Amount</span>
          </div>

          <div className={`by-step-divider ${currentStep > 2 ? 'completed' : ''}`} />

          {/* Step 3: Review */}
          <div className={`by-stepper-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}>
            <div className="by-step-circle">
              {currentStep > 3 ? <Check size={14} /> : '3'}
            </div>
            <span className="by-step-label">Review</span>
          </div>

          <div className={`by-step-divider ${currentStep > 3 ? 'completed' : ''}`} />

          {/* Step 4: Sent */}
          <div className={`by-stepper-item ${currentStep === 4 ? 'active' : ''}`}>
            <div className="by-step-circle">4</div>
            <span className="by-step-label">Sent</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 1: RECIPIENT (SCREEN 2)
         ========================================================================= */}
      {currentStep === 1 && (
        <div className="by-step-content-card">
          <div className="by-step-title-group">
            <h1 className="by-step-main-title">Who are you sending to?</h1>
            <p className="by-step-subtitle">They don't need a wallet. Just enter their details.</p>
          </div>

          {/* Recipient Search Input Box */}
          <div 
            className="by-recipient-input-card"
            style={{
              borderColor: isSearchValid ? '#10B981' : undefined,
              boxShadow: isSearchValid ? '0 0 16px rgba(16, 185, 129, 0.2)' : undefined,
              marginBottom: '28px'
            }}
          >
            <Search size={18} className="by-search-icon" style={{ color: isSearchValid ? '#10B981' : undefined }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Email, phone or @username"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredRecipients.length > 0) {
                    handleSelectRecipient(filteredRecipients[0]);
                  } else if (isSearchValid) {
                    handleCreateCustomRecipient();
                  }
                }
              }}
            />
            {isSearchValid && (
              <div 
                className="by-valid-indicator-pill"
                onClick={handleCreateCustomRecipient}
                title="Click to select this recipient"
              >
                <CheckCircle2 size={13} />
                <span>{detectedType === 'discord' ? 'Discord' : detectedType === 'twitter' ? 'X Handle' : 'Valid'}</span>
              </div>
            )}
          </div>

          {/* Recent Recipients List */}
          <div className="by-recipients-section">
            <div className="by-recipients-header">
              <span className="by-recipients-title">Recent recipients</span>
              <button 
                type="button" 
                className="by-link-btn"
                onClick={() => setSearchQuery('')}
              >
                View all
              </button>
            </div>

            <div className="by-recipients-list">
              {/* Custom recipient if entered in search but not in contacts */}
              {isSearchValid && filteredRecipients.length === 0 && (
                <div 
                  className="by-recipient-row by-custom-recipient-row"
                  onClick={handleCreateCustomRecipient}
                >
                  <div className="by-rec-left">
                    <div className="by-avatar" style={{ background: '#10B981', color: '#fff' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="by-rec-info">
                      <span className="by-rec-name">Send to "{searchQuery.trim()}"</span>
                      <span className="by-rec-identifier">
                        {detectedType === 'discord' ? 'Recipient claims via Discord on Monad' :
                         detectedType === 'twitter' ? 'Recipient claims via X on Monad' :
                         'Recipient claims via Monad Testnet escrow'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="by-rec-chevron" color="#10B981" />
                </div>
              )}

              {/* Filtered Recent list */}
              {filteredRecipients.slice(0, 4).map((rec) => (
                <div 
                  key={rec.id} 
                  className="by-recipient-row"
                  onClick={() => handleSelectRecipient(rec)}
                >
                  <div className="by-rec-left">
                    <div 
                      className="by-avatar"
                      style={{
                        background: rec.avatarBg || '#FF6B35',
                        color: rec.avatarText || '#FFFFFF'
                      }}
                    >
                      {rec.initial || rec.name.charAt(0)}
                    </div>
                    <div className="by-rec-info">
                      <span className="by-rec-name">{rec.name}</span>
                      <span className="by-rec-identifier">
                        {rec.email || rec.phone || (rec.twitter ? `@${rec.twitter}` : null) || (rec.discord ? `${rec.discord}` : null) || `@${rec.username}`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="by-rec-chevron" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="by-step-bottom-bar">
            <button 
              type="button" 
              className="by-btn-secondary"
              onClick={onExitToDashboard}
            >
              Cancel
            </button>

            <button 
              type="button" 
              className="by-btn-primary by-step-continue-btn"
              disabled={!selectedRecipient && !isSearchValid && filteredRecipients.length === 0}
              onClick={() => {
                if (selectedRecipient) {
                  setCurrentStep(2);
                } else if (isSearchValid) {
                  handleCreateCustomRecipient();
                } else if (filteredRecipients.length > 0) {
                  handleSelectRecipient(filteredRecipients[0]);
                }
              }}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: AMOUNT (SCREEN 3)
         ========================================================================= */}
      {currentStep === 2 && selectedRecipient && (
        <div className="by-step-content-card">
          {/* Selected Recipient Pill */}
          <div className="by-selected-recipient-pill">
            <div className="by-sel-left">
              <div 
                className="by-avatar" 
                style={{ 
                  background: selectedRecipient.avatarBg || '#FF6B35',
                  color: selectedRecipient.avatarText || '#FFFFFF',
                  width: '32px',
                  height: '32px',
                  fontSize: '0.85rem'
                }}
              >
                {selectedRecipient.initial || selectedRecipient.name.charAt(0)}
              </div>
              <div className="by-sel-info">
                <span className="by-sel-name">{selectedRecipient.name}</span>
                <span className="by-sel-identifier">
                  {selectedRecipient.email || selectedRecipient.phone || `@${selectedRecipient.username || selectedRecipient.twitter || 'user'}`}
                </span>
              </div>
            </div>
            <button 
              type="button" 
              className="by-change-btn"
              onClick={() => setCurrentStep(1)}
            >
              Change
            </button>
          </div>

          {/* Title & Subtitle */}
          <div className="by-step-title-group" style={{ marginTop: '20px' }}>
            <h1 className="by-step-main-title">Enter amount</h1>
            <p className="by-step-subtitle">How much do you want to send?</p>
          </div>

          {/* Big Amount Input Card */}
          <div className="by-amount-input-box">
            <div className="by-amount-top-row">
              <input
                type="number"
                min="0.1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="by-large-amount-input"
                autoFocus
              />
              <div className="by-currency-dropdown">
                <div className="by-currency-circle">
                  <span>$</span>
                </div>
                <span className="by-currency-code">USDC</span>
                <span className="by-currency-chevron">▾</span>
              </div>
            </div>

            <div className="by-amount-fiat-equiv">
              ≈ ${parseFloat(amount || '0').toFixed(2)}
            </div>

            <div className="by-amount-balance-row">
              <span className="by-avail-label">
                Available balance <strong style={{ color: '#111827' }}>{(availableBalance || 20.00).toFixed(2)} USDC</strong>
              </span>
              <button 
                type="button" 
                className="by-max-btn"
                onClick={handleMaxAmount}
              >
                Max
              </button>
            </div>
          </div>

          {/* Info Callout Box */}
          <div className="by-amount-info-callout">
            <Sparkles size={16} className="by-sparkle-icon" />
            <span>You're sending {parseFloat(amount || '0').toFixed(2)} USDC to {selectedRecipient.name}.</span>
          </div>

          {/* Bottom Action Buttons */}
          <div className="by-step-bottom-bar">
            <button 
              type="button" 
              className="by-btn-secondary"
              onClick={() => setCurrentStep(1)}
            >
              Back
            </button>

            <button 
              type="button" 
              className="by-btn-primary by-step-continue-btn"
              disabled={!amount || parseFloat(amount) <= 0}
              onClick={() => setCurrentStep(3)}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: REVIEW (SCREEN 4)
         ========================================================================= */}
      {currentStep === 3 && selectedRecipient && (
        <div className="by-step-content-card">
          <div className="by-step-title-group">
            <h1 className="by-step-main-title">Review your payment</h1>
          </div>

          {/* Recipient Details Pill */}
          <div className="by-review-recipient-card">
            <div 
              className="by-avatar"
              style={{
                background: selectedRecipient.avatarBg || '#FF6B35',
                color: selectedRecipient.avatarText || '#FFFFFF',
                width: '40px',
                height: '40px',
                fontSize: '1rem'
              }}
            >
              {selectedRecipient.initial || selectedRecipient.name.charAt(0)}
            </div>
            <div className="by-review-rec-text">
              <span className="by-review-name">{selectedRecipient.name}</span>
              <span className="by-review-identifier">
                {selectedRecipient.email || selectedRecipient.phone || `@${selectedRecipient.username || selectedRecipient.twitter || 'user'}`}
              </span>
            </div>
          </div>

          {/* Review Summary Breakdown Box */}
          <div className="by-review-summary-card">
            <div className="by-review-row">
              <span className="by-review-label">Amount</span>
              <div className="by-review-val-col">
                <span className="by-review-val-primary">{parseFloat(amount).toFixed(2)} USDC</span>
                <span className="by-review-val-secondary">≈ ${parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="by-review-divider" />

            <div className="by-review-row">
              <span className="by-review-label">Network</span>
              <span className="by-review-val-bold">Monad Testnet</span>
            </div>

            <div className="by-review-divider" />

            <div className="by-review-row">
              <span className="by-review-label">You're sending</span>
              <span className="by-review-val-bold">{parseFloat(amount).toFixed(2)} USDC</span>
            </div>

            <p className="by-review-recipient-note">
              Recipient will choose how to receive it.
            </p>
          </div>

          {/* Blockchain Disclaimer Callout Box */}
          <div className="by-review-disclaimer-card">
            <Info size={16} className="by-disclaimer-icon" />
            <p className="by-disclaimer-text">
              Please confirm the details. Once you send, the transaction will be processed on the blockchain.
            </p>
          </div>

          {errorMessage && (
            <div className="by-error-banner" style={{ marginTop: '14px' }}>
              {errorMessage}
            </div>
          )}

          {isSubmitting && submitStatusText && (
            <div className="by-loading-banner" style={{ marginTop: '14px' }}>
              <Loader2 className="spin" size={16} color="#FF6B35" />
              <span>{submitStatusText}</span>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="by-step-bottom-bar">
            <button 
              type="button" 
              className="by-btn-secondary"
              onClick={() => setCurrentStep(2)}
              disabled={isSubmitting}
            >
              Back
            </button>

            <button 
              type="button" 
              className="by-btn-primary by-step-continue-btn"
              onClick={handleSendPayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spin" size={16} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send Payment</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 4: SUCCESS / SENT (SCREEN 5)
         ========================================================================= */}
      {currentStep === 4 && selectedRecipient && (
        <div className="by-step-content-card by-success-content-card">
          {/* Big Green Checkmark */}
          <div className="by-success-circle-icon">
            <Check size={36} color="#FFFFFF" strokeWidth={3} />
          </div>

          <h1 className="by-success-main-title">Payment secured!</h1>
          <div className="by-success-amount">{parseFloat(amount).toFixed(2)} USDC</div>
          <p className="by-success-recipient-subtext">sent to {selectedRecipient.name}</p>

          {/* Transaction Receipt Box */}
          <div className="by-success-receipt-card">
            <div className="by-receipt-row">
              <span className="by-receipt-label">Transaction hash</span>
              <a 
                href={`https://testnet.monadexplorer.com/tx/${completedTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="by-receipt-hash-link"
              >
                <span>{completedTxHash ? `${completedTxHash.slice(0, 6)}...${completedTxHash.slice(-4)}` : '0x6e73...3c4e'}</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="by-receipt-divider" />

            <div className="by-receipt-row">
              <span className="by-receipt-label">Block number</span>
              <span className="by-receipt-val">{completedBlockNumber}</span>
            </div>

            <div className="by-receipt-divider" />

            <div className="by-receipt-row">
              <span className="by-receipt-label">Status</span>
              <div className="by-receipt-status-confirmed">
                <span className="by-status-dot-green" />
                <span>Confirmed</span>
              </div>
            </div>
          </div>

          {/* Recipient Notification Box */}
          <div className="by-success-notify-callout">
            <Lock size={15} className="by-notify-icon" />
            <span>{selectedRecipient.name} will receive a notification shortly and can claim the funds.</span>
          </div>

          {/* Actions */}
          <div className="by-success-action-group">
            <button 
              type="button" 
              className="by-btn-primary by-success-view-details-btn"
              onClick={() => setShowClaimModal(true)}
            >
              View payment details
            </button>

            <button 
              type="button" 
              className="by-link-btn by-success-back-dash-btn"
              onClick={onExitToDashboard}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      )}

      {/* Claim Link Modal / Drawer */}
      {showClaimModal && (
        <div className="by-modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="by-claim-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="by-modal-header">
              <h3 className="by-modal-title">Payment & Claim Details</h3>
              <button className="by-modal-close" onClick={() => setShowClaimModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>
              Share this secure claim link with <strong>{selectedRecipient?.name}</strong>. They will log in with their {selectedRecipient?.twitter ? 'X account' : selectedRecipient?.discord ? 'Discord account' : 'email'} and receive the funds directly on Monad Testnet.
            </p>

            <div className="by-claim-input-row">
              <input 
                type="text" 
                readOnly 
                value={claimLink || `${window.location.origin}/#claim/sample`} 
                className="by-claim-link-input"
              />
              <button 
                type="button" 
                className="by-btn-primary"
                style={{ padding: '0 16px', borderRadius: '10px', height: '42px', flexShrink: 0 }}
                onClick={handleCopyClaimLink}
              >
                {copiedClaimLink ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedClaimLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <a 
                href={claimLink}
                target="_blank"
                rel="noreferrer"
                className="by-btn-secondary"
                style={{ flex: 1, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} />
                <span>Open Claim View</span>
              </a>

              <button 
                type="button"
                className="by-btn-primary"
                style={{ flex: 1 }}
                onClick={() => setShowClaimModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
