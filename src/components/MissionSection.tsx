import React from 'react';
import { DirectionArrow } from '../assets/icons/Icons';
import { BeyiniLogoIcon } from '../assets/icons/BeyiniLogo';
import { Zap } from 'lucide-react';
import '../styles/mission.css';

interface MissionSectionProps {
  onLearnMore?: () => void;
}

export const MissionSection: React.FC<MissionSectionProps> = ({ onLearnMore }) => {
  return (
    <section className="mission-section" id="monad">
      <div className="container">
        <div className="mission-grid">
          {/* Left Column: Mission Statement & Links */}
          <div className="mission-left">
            <p className="mission-statement">
              Beyini's mission is to create a seamless, user-owned<br />
              global payment network. To do it we're unleashing<br />
              Monad, the 10,000 TPS, 1-second finality<br />
              blockchain that makes payments feel invisible.
            </p>

            <div className="mission-actions">
              <button 
                className="btn-learn-series"
                onClick={onLearnMore}
              >
                Metropolis Hackathon
              </button>

              <a 
                href="#how-it-works" 
                className="link-why-stacks"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Beyini utilizes Monad because 1-second block times and pipelined EVM execution allow payments to settle as fast as traditional credit cards, but with true decentralization.');
                }}
              >
                Why Monad for Payments
              </a>
            </div>
          </div>

          {/* Right Column: 3D Badge, Rings & 4 Corner Arrows */}
          <div className="mission-graphic-wrap">
            <div className="mission-composition-box">
              {/* Corner Arrows */}
              <div className="corner-arrow arrow-tl">
                <DirectionArrow direction="top-left" size={20} />
              </div>
              <div className="corner-arrow arrow-tr">
                <DirectionArrow direction="top-right" size={20} />
              </div>
              <div className="corner-arrow arrow-bl">
                <DirectionArrow direction="bottom-left" size={20} />
              </div>
              <div className="corner-arrow arrow-br">
                <DirectionArrow direction="bottom-right" size={20} />
              </div>

              {/* Central Black Pill Capsule */}
              <div className="mission-base-capsule">
                {/* Outer Frame Ring */}
                <div className="mission-gold-frame" style={{ borderColor: 'var(--color-primary)', boxShadow: '0 0 25px rgba(255, 85, 0, 0.4)' }} />

                {/* Top: Monad Speed Emblem */}
                <div className="mission-gold-circle animate-float" style={{ background: 'var(--color-primary)' }}>
                  <Zap size={36} color="#FFFFFF" />
                </div>

                {/* Bottom: Beyini Emblem */}
                <div className="mission-purple-circle" style={{ background: '#1F2123', border: '2px solid rgba(255, 85, 0, 0.5)' }}>
                  <BeyiniLogoIcon size={52} variant="orange" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
