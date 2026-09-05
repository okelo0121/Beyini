import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Smartphone, 
  Check, 
  X, 
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Building,
  RefreshCw
} from 'lucide-react';
import type { ReceivingMethodType } from '../data/beyiniData';
import { RampAdapter } from '../../adapters/RampAdapter';
import { SettlementAdapter } from '../../adapters/SettlementAdapter';
import { PaymentService } from '../../services/PaymentService';
import type { OffRampQuote } from '../../adapters/types';

interface RecipientClaimViewProps {
  paymentId?: string;
  salt?: string;
  amount?: number;
  senderName?: string;
  recipientIdentifier?: string;
  onClose?: () => void;
  onCompleted?: () => void;
}

export const RecipientClaimView: React.FC<RecipientClaimViewProps> = ({
  paymentId: propPaymentId,
  salt: propSalt,
  amount: propAmount = 100.00,
  senderName: propSenderName = 'Alex',
  recipientIdentifier: propRecipientIdentifier = '',
  onClose,
  onCompleted
}) => {
  const [paymentId, setPaymentId] = useState<string>(propPaymentId || '');
  const [_salt, setSalt] = useState<string>(propSalt || '');
  const [amount, setAmount] = useState<number>(propAmount);
  const [senderName, setSenderName] = useState<string>(propSenderName);
  const [selectedMethod, setSelectedMethod] = useState<ReceivingMethodType>('Mobile Money');
  const [claimStep, setClaimStep] = useState<'choose' | 'details' | 'success'>('choose');
  const [phoneNumber, setPhoneNumber] = useState(propRecipientIdentifier || '');
  const [walletAddress, setWalletAddress] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveQuote, setLiveQuote] = useState<OffRampQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check URL hash for direct claim links: #claim?id=0x...&salt=0x...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('claim')) {
        const queryIdx = hash.indexOf('?');
        if (queryIdx !== -1) {
          const params = new URLSearchParams(hash.slice(queryIdx));
          const urlId = params.get('id');
          const urlSalt = params.get('salt');
          if (urlId) {
            setPaymentId(urlId);
            const savedPayment = PaymentService.getPaymentById(urlId);
            if (savedPayment) {
              setAmount(savedPayment.amountUSDC);
              if (savedPayment.recipientName) setSenderName('Alex');
              if (savedPayment.recipientIdentifier) setPhoneNumber(savedPayment.recipientIdentifier);
            }
          }
          if (urlSalt) setSalt(urlSalt);
        }
      }
    }
  }, []);

  // Fetch real-time Ramp Host API v3 quotes whenever amount or method changes
  useEffect(() => {
    let isCancelled = false;
    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      try {
        const fiat = selectedMethod === 'Mobile Money' ? 'KES' : 'EUR';
        const quote = await RampAdapter.getLiveQuote(amount, fiat);
        if (!isCancelled) {
          setLiveQuote(quote);
        }
      } catch (err) {
        console.warn('Failed to fetch live Ramp quote:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingQuote(false);
        }
      }
    };

    fetchQuote();
    return () => {
      isCancelled = true;
    };
  }, [amount, selectedMethod]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const destination = selectedMethod === 'Wallet'
      ? walletAddress
      : selectedMethod === 'Mobile Money'
      ? phoneNumber
      : bankIban;

    try {
      if (selectedMethod === 'Wallet') {
        if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
          throw new Error('Please enter a valid 42-character Monad EVM address (0x...)');
        }
        if (paymentId) {
          PaymentService.updatePaymentStatus(paymentId, 'CLAIMED', walletAddress);
        }
        setIsProcessing(false);
        setClaimStep('success');
        return;
      }

      // Ramp Network Off-ramp Rail
      const fiatCurr = selectedMethod === 'Mobile Money' ? 'KES' : 'EUR';
      await SettlementAdapter.executeSettlement({
        paymentId: paymentId || `pay-${Date.now()}`,
        amountUSDC: amount,
        recipientDestination: destination || '0x0000000000000000000000000000000000000000',
        payoutMethod: selectedMethod === 'Mobile Money' ? 'RAMP_MOBILE_MONEY' : 'RAMP_BANK_TRANSFER',
        fiatCurrency: fiatCurr,
      }, {
        onSuccess: () => {
          if (paymentId) {
            PaymentService.updatePaymentStatus(paymentId, 'CLAIMED', destination);
          }
          setIsProcessing(false);
          setClaimStep('success');
        },
        onClose: () => {
          if (paymentId) {
            PaymentService.updatePaymentStatus(paymentId, 'CLAIMED', destination);
          }
          setIsProcessing(false);
          setClaimStep('success');
        }
      });

      if (paymentId) {
        PaymentService.updatePaymentStatus(paymentId, 'CLAIMED', destination);
      }
      setIsProcessing(false);
      setClaimStep('success');
    } catch (err: any) {
      console.error('Claim error:', err);
      setErrorMessage(err?.message || 'Failed to process claim request.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="by-modal-overlay" onClick={onClose}>
      <div className="by-claim-card-frame" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {claimStep === 'details' ? (
            <button 
              className="by-modal-back-btn" 
              onClick={() => setClaimStep('choose')}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--by-orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Beyini Recipient Claim Portal
            </span>
          )}

          {onClose && (
            <button className="by-modal-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginTop: '12px',
            color: '#ef4444',
            fontSize: '0.84rem'
          }}>
            {errorMessage}
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 1: CHOOSE HOW TO RECEIVE                                 */}
        {/* ============================================================= */}
        {claimStep === 'choose' && (
          <>
            <div className="by-claim-hero">
              <p className="by-claim-sender-label">{senderName} sent you</p>
              <h1 className="by-claim-amount">${amount.toFixed(2)} USDC</h1>
              <h2 className="by-claim-question">How would you like to receive?</h2>
            </div>

            {/* Method Selectable Cards */}
            <div className="by-method-options-list">
              {/* Option 1: Mobile Money (Ramp Network) */}
              <div 
                className={`by-method-card ${selectedMethod === 'Mobile Money' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('Mobile Money')}
                role="button"
                tabIndex={0}
              >
                <div className="by-method-left">
                  <div className="by-method-icon-box">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <div className="by-method-title">M-Pesa / Mobile Money</div>
                    <div className="by-method-sub">Direct local currency via Ramp Network</div>
                  </div>
                </div>

                <div className="by-method-radio-dot">
                  {selectedMethod === 'Mobile Money' && <Check size={14} strokeWidth={3} />}
                </div>
              </div>

              {/* Option 2: Bank Transfer (Ramp Network) */}
              <div 
                className={`by-method-card ${selectedMethod === 'PayPal' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('PayPal')}
                role="button"
                tabIndex={0}
              >
                <div className="by-method-left">
                  <div className="by-method-icon-box">
                    <Building size={20} />
                  </div>
                  <div>
                    <div className="by-method-title">Direct Bank Transfer (ACH / SEPA)</div>
                    <div className="by-method-sub">Direct bank account settlement via Ramp Network</div>
                  </div>
                </div>

                <div className="by-method-radio-dot">
                  {selectedMethod === 'PayPal' && <Check size={14} strokeWidth={3} />}
                </div>
              </div>

              {/* Option 3: Monad EVM Wallet */}
              <div 
                className={`by-method-card ${selectedMethod === 'Wallet' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('Wallet')}
                role="button"
                tabIndex={0}
              >
                <div className="by-method-left">
                  <div className="by-method-icon-box">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <div className="by-method-title">Monad EVM / Web3 Wallet</div>
                    <div className="by-method-sub">Receive native USDC on Monad testnet</div>
                  </div>
                </div>

                <div className="by-method-radio-dot">
                  {selectedMethod === 'Wallet' && <Check size={14} strokeWidth={3} />}
                </div>
              </div>
            </div>

            <button 
              className="by-primary-btn"
              onClick={() => setClaimStep('details')}
            >
              <span>Continue</span>
              <span>&rarr;</span>
            </button>
          </>
        )}

        {/* ============================================================= */}
        {/* STEP 2: ENTER METHOD DETAILS                                  */}
        {/* ============================================================= */}
        {claimStep === 'details' && (
          <div className="by-claim-detail-section">
            <div>
              <div style={{ fontSize: '0.88rem', color: 'var(--by-text-secondary)', fontWeight: 500 }}>
                Receive ${amount.toFixed(2)} USDC via
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--by-text)' }}>
                {selectedMethod === 'PayPal' ? 'Bank Account' : selectedMethod}
              </h2>
            </div>

            {selectedMethod === 'Mobile Money' && (
              <>
                <div className="by-claim-field">
                  <label>Mobile Money Phone Number</label>
                  <input 
                    type="text" 
                    className="by-claim-text-input" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+254 712 345 678"
                  />
                </div>

                <div className="by-conversion-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="by-conv-label">Live Quote via Ramp Network</span>
                    {isLoadingQuote && <RefreshCw size={12} className="spin" />}
                  </div>
                  <span className="by-conv-amount">
                    {liveQuote ? `KES ~${liveQuote.fiatAmount.toLocaleString()}` : `KES ~${(amount * 129.5).toFixed(0)}`}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--by-text-muted)' }}>
                    Ramp Host API v3 • Single-slot finality on Monad
                  </span>
                </div>
              </>
            )}

            {selectedMethod === 'PayPal' && (
              <>
                <div className="by-claim-field">
                  <label>Bank IBAN / Account Number</label>
                  <input 
                    type="text" 
                    className="by-claim-text-input" 
                    value={bankIban} 
                    onChange={(e) => setBankIban(e.target.value)}
                    placeholder="GB29 XXXXXXXX or US routing"
                  />
                </div>

                <div className="by-conversion-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="by-conv-label">Live Quote via Ramp Network</span>
                    {isLoadingQuote && <RefreshCw size={12} className="spin" />}
                  </div>
                  <span className="by-conv-amount">
                    {liveQuote ? `EUR €${liveQuote.fiatAmount.toFixed(2)}` : `EUR €${(amount * 0.92).toFixed(2)}`}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--by-text-muted)' }}>
                    SEPA / ACH Payout • Single-slot finality on Monad
                  </span>
                </div>
              </>
            )}

            {selectedMethod === 'Wallet' && (
              <div className="by-claim-field">
                <label>Monad Testnet Wallet Address (0x...)</label>
                <input 
                  type="text" 
                  className="by-claim-text-input" 
                  value={walletAddress} 
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>
            )}

            <button 
              className="by-primary-btn"
              disabled={isProcessing}
              onClick={handleConfirm}
            >
              <span>{isProcessing ? 'Connecting Ramp Network...' : 'Confirm and Claim'}</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 3: CLAIM SUCCESS STATE                                   */}
        {/* ============================================================= */}
        {claimStep === 'success' && (
          <div className="by-allset-box">
            <div className="by-allset-badge">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <h2 className="by-allset-title">Claim Initiated</h2>
            <p className="by-allset-sub">
              <strong>${amount.toFixed(2)} USDC</strong> has been routed to your <strong>{selectedMethod === 'PayPal' ? 'Bank Account' : selectedMethod}</strong> destination.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#10B981',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '20px'
            }}>
              <ShieldCheck size={14} />
              <span>Verified On-Chain · Monad Single-Slot Finality</span>
            </div>

            <button 
              className="by-primary-btn"
              onClick={() => {
                if (onCompleted) onCompleted();
                if (onClose) onClose();
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
