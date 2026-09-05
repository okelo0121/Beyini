import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Building2, 
  Coins, 
  Smartphone, 
  Check, 
  Wifi, 
  Battery, 
  Signal, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { BeyiniLogoIcon } from '../assets/icons/BeyiniLogo';
import '../styles/simulator.css';

type PayoutMethod = 'monad' | 'bank' | 'usdc' | 'mobile';

interface PayoutOption {
  id: PayoutMethod;
  title: string;
  subtitle: string;
  speed: string;
  icon: React.ReactNode;
}

const payoutOptions: PayoutOption[] = [
  {
    id: 'monad',
    title: 'Monad EVM Wallet',
    subtitle: 'Native Web3 · 0x71...b82a',
    speed: '< 1s · $0 fee',
    icon: <Zap size={18} />
  },
  {
    id: 'bank',
    title: 'Direct Bank Deposit',
    subtitle: 'Visa Direct · Chase ****4812',
    speed: '2-3 mins · Free',
    icon: <Building2 size={18} />
  },
  {
    id: 'usdc',
    title: 'USDC Stablecoin',
    subtitle: 'Native Monad USD Token',
    speed: 'Instant · Free',
    icon: <Coins size={18} />
  },
  {
    id: 'mobile',
    title: 'Mobile Money / Cash App',
    subtitle: 'Direct to $cashtag / Phone',
    speed: 'Instant · Free',
    icon: <Smartphone size={18} />
  }
];

export const PaymentSimulator: React.FC = () => {
  // Mode: 'video' (automated loop) or 'interactive' (manual)
  const [mode, setMode] = useState<'video' | 'interactive'>('video');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Simulation State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [recipient, setRecipient] = useState('@sarah.j');
  const [amount, setAmount] = useState('50');
  const [memo, setMemo] = useState('Dinner & drinks 🍕');
  const [isSending, setIsSending] = useState(false);
  const [senderSent, setSenderSent] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutMethod>('bank');
  const [recipientClaimed, setRecipientClaimed] = useState(false);

  const videoTimerRef = useRef<number | null>(null);

  // Automated Video Flow Loop
  useEffect(() => {
    if (mode !== 'video' || !isPlaying) return;

    let currentProgress = 0;
    const interval = 100; // update progress every 100ms
    const totalDuration = 12000; // 12-second total cycle
    const stepIncrement = (interval / totalDuration) * 100;

    const runVideoCycle = () => {
      currentProgress += stepIncrement;
      if (currentProgress > 100) {
        currentProgress = 0;
        // Reset cycle
        setStep(1);
        setSenderSent(false);
        setIsSending(false);
        setRecipientClaimed(false);
        setSelectedPayout('bank');
      }
      setProgress(currentProgress);

      // Phase 1: Sender view prepared (0% - 25%)
      if (currentProgress >= 0 && currentProgress < 25) {
        setStep(1);
      }
      // Phase 2: Sender clicks Send & Monad executes (25% - 50%)
      else if (currentProgress >= 25 && currentProgress < 50) {
        setStep(2);
        setIsSending(true);
        setSenderSent(true);
      }
      // Phase 3: Recipient receives notification & selects rail (50% - 75%)
      else if (currentProgress >= 50 && currentProgress < 75) {
        setStep(3);
        setIsSending(false);
        if (currentProgress > 60) {
          setSelectedPayout('bank');
        }
      }
      // Phase 4: Recipient claims & funds settled (75% - 100%)
      else if (currentProgress >= 75) {
        setStep(4);
        setRecipientClaimed(true);
      }
    };

    videoTimerRef.current = window.setInterval(runVideoCycle, interval);

    return () => {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    };
  }, [mode, isPlaying]);

  // Interactive Manual Handlers
  const handleManualSend = () => {
    setMode('interactive');
    setIsPlaying(false);
    setIsSending(true);
    setStep(2);

    setTimeout(() => {
      setIsSending(false);
      setSenderSent(true);
      setStep(3);
    }, 800);
  };

  const handleManualClaim = () => {
    setMode('interactive');
    setIsPlaying(false);
    setRecipientClaimed(true);
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setSenderSent(false);
    setIsSending(false);
    setRecipientClaimed(false);
    setSelectedPayout('bank');
    setProgress(0);
    if (mode === 'video') {
      setIsPlaying(true);
    }
  };

  return (
    <div className="simulator-outer-container" id="payment-simulator">
      {/* Simulator Control Header */}
      <div className="sim-controls-header">
        <div className="sim-title-group">
          <span className="sim-badge-dot" />
          <div>
            <h3 className="sim-heading">Real-Time P2P Payment Simulation</h3>
            <p className="sim-subtext">Sender specifies identifier · Recipient selects their preferred rail</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div className="sim-mode-switcher">
            <button
              className={`sim-mode-btn ${mode === 'video' ? 'active' : ''}`}
              onClick={() => { setMode('video'); setIsPlaying(true); }}
            >
              <Play size={14} />
              <span>Video Demo Flow</span>
            </button>
            <button
              className={`sim-mode-btn ${mode === 'interactive' ? 'active' : ''}`}
              onClick={() => { setMode('interactive'); setIsPlaying(false); }}
            >
              <span>Interactive Mode</span>
            </button>
          </div>

          {/* Video Controls (Only in Video Mode) */}
          {mode === 'video' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="sim-quick-btn"
                style={{ padding: '8px 14px', borderRadius: '100px' }}
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause Demo' : 'Play Demo'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                className="sim-quick-btn"
                style={{ padding: '8px 14px', borderRadius: '100px' }}
                onClick={handleReset}
                title="Restart Demo"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar for Video Loop */}
      {mode === 'video' && (
        <div className="sim-video-progress-bar">
          <div 
            className="sim-video-progress-fill" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      {/* Dual Device Stage */}
      <div className="sim-dual-stage">
        {/* =================================================== */}
        {/* DEVICE 1: SENDER PHONE (Alex sending payment)        */}
        {/* =================================================== */}
        <div className="sim-phone-frame">
          {/* Status Bar */}
          <div className="sim-phone-status-bar">
            <span>9:41</span>
            <div className="sim-dynamic-island" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Signal size={12} />
              <Wifi size={12} />
              <Battery size={14} />
            </div>
          </div>

          {/* App Canvas */}
          <div className="sim-phone-canvas">
            {/* Device Header */}
            <div className="sim-device-header-pill">
              <span className="sim-device-role">
                <BeyiniLogoIcon size={16} variant="orange" />
                <span>Sender (You)</span>
              </span>
              <span className="sim-device-user">@alex.eth</span>
            </div>

            {!senderSent ? (
              <>
                {/* Sender Balance Card */}
                <div className="sim-sender-balance-card">
                  <span className="sim-balance-label">Available Balance</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="sim-balance-amount">$2,450.00</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>USDC · Monad</span>
                  </div>
                </div>

                {/* Recipient Input Field */}
                <div className="sim-input-box">
                  <span className="sim-input-label">Pay To (Email, Phone, or Handle)</span>
                  <input
                    type="text"
                    className="sim-recipient-field"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. @sarah.j or +1..."
                  />
                </div>

                {/* Amount Display */}
                <div className="sim-amount-display">
                  <span className="sim-amount-number">${amount}</span>
                </div>

                {/* Quick Amounts */}
                <div className="sim-quick-amounts">
                  {['25', '50', '100', '250'].map((val) => (
                    <button
                      key={val}
                      className={`sim-quick-btn ${amount === val ? 'active' : ''}`}
                      onClick={() => setAmount(val)}
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                {/* Payment Memo */}
                <input
                  type="text"
                  className="sim-memo-input"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="What's this for?"
                />

                {/* Monad Rail Info Pill */}
                <div className="sim-rail-info-pill">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} color="var(--color-primary)" />
                    <strong>Monad Single-Slot</strong>
                  </div>
                  <span>&lt;0.8s · $0.0001 Gas</span>
                </div>

                {/* Send Button */}
                <button
                  className="sim-send-action-btn"
                  onClick={handleManualSend}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Clock size={18} className="animate-spin" />
                      <span>Settling on Monad...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Send ${amount} to {recipient}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              /* Sender Confirmed View */
              <div className="sim-sent-state-box">
                <div className="sim-success-circle">
                  <Check size={26} />
                </div>
                <h4 style={{ fontSize: '1.15rem', margin: 0, color: '#FFFFFF' }}>
                  ${amount}.00 Sent!
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#888888', margin: 0 }}>
                  Funds transferred instantly to <strong>{recipient}</strong>.
                </p>

                <div className="sim-tx-hash-badge">
                  Tx: 0x8f2a...910b · Monad Block #1489201
                </div>

                <div style={{ 
                  background: '#18191B', 
                  borderRadius: '14px', 
                  padding: '12px 14px', 
                  width: '100%', 
                  textAlign: 'left', 
                  fontSize: '0.78rem',
                  color: '#AAAAAA',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Settlement Speed:</span>
                    <strong style={{ color: '#10B981' }}>0.78s (Finalized)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Network Fee:</span>
                    <strong style={{ color: '#10B981' }}>$0.00008</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Recipient Status:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>Claim Link Active</strong>
                  </div>
                </div>

                {mode === 'interactive' && (
                  <button
                    className="sim-quick-btn"
                    style={{ width: '100%', padding: '10px', marginTop: '6px' }}
                    onClick={handleReset}
                  >
                    Make Another Payment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================== */}
        {/* CENTER: MONAD INSTANT SETTLEMENT BRIDGE TUNNEL      */}
        {/* =================================================== */}
        <div className="sim-bridge-tunnel">
          <div className="sim-monad-speed-tag">
            <strong>0.8s Finality</strong>
            <span>Monad Pipelined EVM</span>
          </div>

          <div className="sim-pulse-wire">
            <div className="sim-pulse-ball" />
          </div>

          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'var(--color-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <ArrowRight size={16} />
          </div>

          <div className="sim-monad-speed-tag">
            <strong>10,000 TPS</strong>
            <span>Zero-Address Abstracted</span>
          </div>
        </div>

        {/* =================================================== */}
        {/* DEVICE 2: RECIPIENT PHONE (Sarah choosing payout)   */}
        {/* =================================================== */}
        <div className="sim-phone-frame">
          {/* Status Bar */}
          <div className="sim-phone-status-bar">
            <span>9:41</span>
            <div className="sim-dynamic-island" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Signal size={12} />
              <Wifi size={12} />
              <Battery size={14} />
            </div>
          </div>

          {/* App Canvas */}
          <div className="sim-phone-canvas">
            {/* Device Header */}
            <div className="sim-device-header-pill">
              <span className="sim-device-role" style={{ color: '#10B981' }}>
                <CheckCircle2 size={16} />
                <span>Recipient</span>
              </span>
              <span className="sim-device-user">Sarah J. ({recipient})</span>
            </div>

            {step < 2 ? (
              /* Waiting for Payment State */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '10px', color: '#666666' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#18191B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} color="#888888" />
                </div>
                <h4 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.05rem' }}>Waiting for Payment...</h4>
                <p style={{ fontSize: '0.78rem', margin: 0, maxWidth: '230px', lineHeight: 1.4 }}>
                  When someone sends money to <strong>{recipient}</strong>, you will receive an instant notification here to choose how to get paid.
                </p>
              </div>
            ) : !recipientClaimed ? (
              /* Claim & Payout Selection Screen */
              <>
                {/* Push Notification Banner */}
                <div className="sim-recipient-push-alert">
                  <div className="sim-push-icon">
                    <BeyiniLogoIcon size={16} variant="white" />
                  </div>
                  <div className="sim-push-text">
                    <span className="sim-push-title">Beyini Payment Received</span>
                    <span className="sim-push-body">@alex.eth sent you ${amount}.00</span>
                  </div>
                </div>

                {/* Claim Card Header */}
                <div className="sim-claim-header">
                  <span className="sim-claim-amount-pill">${amount}.00</span>
                  <span className="sim-claim-sender-name">
                    From @alex.eth · "{memo}"
                  </span>
                </div>

                {/* Prompt */}
                <span className="sim-payout-prompt">Choose how you want to receive:</span>

                {/* 4 Real Payout Options */}
                <div className="sim-payout-options-list">
                  {payoutOptions.map((opt) => {
                    const isSelected = selectedPayout === opt.id;
                    return (
                      <div
                        key={opt.id}
                        className={`sim-payout-choice-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedPayout(opt.id)}
                      >
                        <div className="sim-choice-left">
                          <div className="sim-choice-icon-box">
                            {opt.icon}
                          </div>
                          <div>
                            <span className="sim-choice-title">{opt.title}</span>
                            <span className="sim-choice-subtitle">{opt.subtitle}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--color-primary)' : '#888888' }}>
                            {opt.speed}
                          </span>
                          <div className="sim-choice-radio">
                            {isSelected && <div className="sim-choice-radio-inner" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Claim Button */}
                <button
                  className="sim-claim-action-btn"
                  onClick={handleManualClaim}
                >
                  <span>Deposit to {payoutOptions.find(o => o.id === selectedPayout)?.title}</span>
                  <Check size={18} />
                </button>
              </>
            ) : (
              /* Recipient Claimed & Settled Receipt */
              <div className="sim-sent-state-box">
                <div className="sim-success-circle">
                  <Check size={26} />
                </div>
                <h4 style={{ fontSize: '1.15rem', margin: 0, color: '#FFFFFF' }}>
                  ${amount}.00 Deposited!
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#888888', margin: 0 }}>
                  Funds routed to <strong>{payoutOptions.find(o => o.id === selectedPayout)?.title}</strong>.
                </p>

                {/* Official Receipt */}
                <div className="sim-final-receipt-card" style={{ width: '100%', textAlign: 'left' }}>
                  <div className="sim-receipt-row">
                    <span>Receipt ID:</span>
                    <strong>#BEY-2026-9182</strong>
                  </div>
                  <div className="sim-receipt-row">
                    <span>Sender:</span>
                    <strong>@alex.eth</strong>
                  </div>
                  <div className="sim-receipt-row">
                    <span>Destination:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      {payoutOptions.find(o => o.id === selectedPayout)?.title}
                    </strong>
                  </div>
                  <div className="sim-receipt-row">
                    <span>Execution Rail:</span>
                    <strong>Monad Single-Slot (0.78s)</strong>
                  </div>
                  <div className="sim-receipt-row">
                    <span>Transfer Fee:</span>
                    <strong style={{ color: '#10B981' }}>$0.00 (Zero Fee)</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#888888' }}>
                  <span>Verified on Monad Explorer</span>
                  <ExternalLink size={12} />
                </div>

                {mode === 'interactive' && (
                  <button
                    className="sim-quick-btn"
                    style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                    onClick={handleReset}
                  >
                    Start New Simulation
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Steps Timeline Indicators */}
      <div className="sim-steps-timeline">
        <div 
          className={`sim-step-pill ${step === 1 ? 'active' : ''}`}
          onClick={() => { setMode('interactive'); setIsPlaying(false); setStep(1); }}
        >
          <span className="sim-step-number">1</span>
          <span>Sender Enters @Recipient</span>
        </div>

        <div 
          className={`sim-step-pill ${step === 2 ? 'active' : ''}`}
          onClick={() => { setMode('interactive'); setIsPlaying(false); setStep(2); }}
        >
          <span className="sim-step-number">2</span>
          <span>0.8s Monad Settlement</span>
        </div>

        <div 
          className={`sim-step-pill ${step === 3 ? 'active' : ''}`}
          onClick={() => { setMode('interactive'); setIsPlaying(false); setStep(3); }}
        >
          <span className="sim-step-number">3</span>
          <span>Recipient Chooses Rail</span>
        </div>

        <div 
          className={`sim-step-pill ${step === 4 ? 'active' : ''}`}
          onClick={() => { setMode('interactive'); setIsPlaying(false); setStep(4); }}
        >
          <span className="sim-step-number">4</span>
          <span>Funds Deposited</span>
        </div>
      </div>
    </div>
  );
};
