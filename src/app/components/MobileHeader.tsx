import React from 'react';
import { Bell, ArrowLeft } from 'lucide-react';
import { BeyiniWordmark } from '../../assets/icons/BeyiniLogo';

interface MobileHeaderProps {
  walletAddress: string;
  onExitToLanding?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  walletAddress,
  onExitToLanding
}) => {
  return (
    <header className="by-mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onExitToLanding && (
          <button 
            onClick={onExitToLanding}
            style={{ background: 'none', border: 'none', color: '#111', cursor: 'pointer', padding: '4px' }}
            title="Return to website"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <BeyiniWordmark size={20} textColor="#111111" variant="black" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        <button 
          className="by-header-icon-btn"
          style={{ width: '34px', height: '34px' }}
          onClick={() => alert(`Connected Wallet: ${walletAddress}`)}
        >
          <Bell size={15} />
          <span className="by-notification-dot" style={{ top: '8px', right: '8px' }} />
        </button>
      </div>
    </header>
  );
};
