import React, { useState } from 'react';
import { Shield, Lock, Cpu, Check } from 'lucide-react';
import { SecurityLockIcon } from '../assets/icons/Icons';
import devPhoneMockup from '../assets/images/developer_phone_mockup.png';
import '../styles/developer.css';

export const SecurityStages: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(1);

  return (
    <div className="security-diagram-wrap">
      {/* Background Central Security Capsule */}
      <div className="security-main-capsule">
        <div className="security-lock-glow" />
        
        {/* Floating Bitcoin Secure & Safe Badge */}
        <div className="security-capsule-badge">
          <span>Bitcoin secure<br />and safe</span>
        </div>

        {/* Big White Security Padlock */}
        <div className="security-lock-icon">
          <SecurityLockIcon width={130} height={180} />
        </div>

        {/* Progress indicator bars from Figma */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center', zIndex: 2 }}>
          <div style={{ width: '160px', height: '8px', background: activeStage === 1 ? '#10B981' : '#523FFF', borderRadius: '100px', transition: 'background 0.3s ease' }} />
          <div style={{ width: '176px', height: '8px', background: activeStage === 2 ? '#FFC200' : '#523FFF', borderRadius: '100px', transition: 'background 0.3s ease' }} />
          <div style={{ width: '126px', height: '8px', background: activeStage === 3 ? '#FF7733' : '#FF5500', borderRadius: '100px', transition: 'background 0.3s ease' }} />
        </div>
      </div>

      {/* Orbiting Satellite Chips & Stage Badges */}
      <div 
        className={`security-orbit-card orbit-top-left ${activeStage === 1 ? 'active' : ''}`}
        style={{ cursor: 'pointer', borderColor: activeStage === 1 ? '#FF5500' : undefined }}
        onClick={() => setActiveStage(1)}
      >
        <div className="orbit-icon-circle">
          <Shield size={20} color="#FF5500" />
        </div>
        <span className="orbit-label">Secured</span>
      </div>

      <div 
        className={`security-orbit-card orbit-top-right ${activeStage === 2 ? 'active' : ''}`}
        style={{ cursor: 'pointer', borderColor: activeStage === 2 ? '#FF5500' : undefined }}
        onClick={() => setActiveStage(2)}
      >
        <div className="orbit-icon-circle">
          <Lock size={20} color="#FF5500" />
        </div>
        <span className="orbit-label">Escrow</span>
      </div>

      <div 
        className={`security-orbit-card orbit-bottom-left ${activeStage === 3 ? 'active' : ''}`}
        style={{ cursor: 'pointer', borderColor: activeStage === 3 ? '#FF7733' : undefined }}
        onClick={() => setActiveStage(3)}
      >
        <div className="orbit-icon-circle">
          <Cpu size={20} color="#FF7733" />
        </div>
        <span className="orbit-label">Monad</span>
      </div>

      {/* Floating Developer Phone Mockup Preview */}
      <div 
        className="security-orbit-card orbit-bottom-right"
        style={{ padding: '8px 16px', background: 'rgba(38, 39, 41, 0.95)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={devPhoneMockup} 
            alt="Developer Screen Preview" 
            style={{ width: '38px', height: '70px', borderRadius: '8px', objectFit: 'cover' }}
          />
          <div>
            <span style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> 100% Finality
            </span>
            <strong style={{ fontSize: '0.95rem' }}>Monad EVM</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
