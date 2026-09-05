import React from 'react';
import { BeyiniLogoIcon } from '../assets/icons/BeyiniLogo';
import { PaymentSimulator } from './PaymentSimulator';
import { Zap, Shield } from 'lucide-react';
import '../styles/stacking.css';

interface StackingSectionProps {
  onOpenWalletModal: () => void;
}

export const StackingSection: React.FC<StackingSectionProps> = ({ onOpenWalletModal }) => {
  return (
    <section className="stacking-section" id="features">
      <div className="container">
        <div className="stacking-grid-container">
          {/* Left Column: Editorial & CTA */}
          <div className="stacking-left">
            <h2 className="stacking-heading">
              You shouldn't need someone's<br />
              address to<br />
              pay them
            </h2>

            <p className="stacking-desc">
              You already know who you are paying. Why would you also need to know which wallet, network, or payment rail they use?
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                className="btn-start-stacking"
                onClick={onOpenWalletModal}
              >
                Start Your Payment
              </button>

              <a
                href="#payment-simulator"
                className="btn-dev-docs"
                style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                onClick={(e) => {
                  e.preventDefault();
                  const sim = document.getElementById('payment-simulator');
                  if (sim) sim.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Try Payment Simulator
              </a>
            </div>
          </div>

          {/* Right Column: Bento Grid of Monad Performance & Beyini Badges */}
          <div className="stacking-bento-box">
            {/* Top Row: 10,000 TPS Card & Beyini Logo Avatar */}
            <div className="stacking-bento-row-top">
              <div className="card-apy-pill">
                <span className="apy-value" style={{ fontSize: '3.2rem', color: 'var(--color-primary)' }}>10k TPS</span>
                <span className="apy-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="var(--color-primary)" />
                  <span>1s Single-Slot Finality</span>
                </span>
              </div>

              <div 
                className="card-stx-coin" 
                style={{ 
                  background: '#1F2123', 
                  border: '2px solid rgba(255, 85, 0, 0.4)',
                  boxShadow: '0 8px 25px rgba(255, 85, 0, 0.25)' 
                }}
              >
                <BeyiniLogoIcon size={84} variant="orange" />
              </div>
            </div>

            {/* Middle Row: Invisible Zero-Address Banner */}
            <div className="card-tvl-pill">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="tvl-amount" style={{ fontSize: '3rem' }}>$0.0001 Gas</span>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                  Pipelined Monad EVM execution
                </span>
              </div>
              <span className="tvl-label">Instant on Monad</span>
            </div>

            {/* Bottom Row: Metropolis Hackathon Badge */}
            <div className="stacking-bento-row-bottom">
              <div className="card-courtesy-pill" style={{ minWidth: '100%', padding: '24px 36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '50%', 
                    background: 'rgba(255, 85, 0, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}>
                    <Shield size={28} />
                  </div>
                  <span className="courtesy-text" style={{ fontSize: '1.45rem' }}>
                    Metropolis by Monad<br />
                    <span style={{ fontSize: '1.05rem', fontWeight: 400, color: '#666' }}>
                      Consumer Products & Payments Track
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Realistic Dual-Device Payment Simulator with Automated Video Demo */}
        <PaymentSimulator />
      </div>
    </section>
  );
};
