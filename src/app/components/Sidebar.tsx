import React, { useState } from 'react';
import { 
  Send, 
  Activity, 
  Users, 
  User, 
  ChevronRight,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { BeyiniWordmark } from '../../assets/icons/BeyiniLogo';

export type AppTab = 'send' | 'activity' | 'recipients' | 'profile';

interface SidebarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  balanceUSDC: number;
  network: string;
  walletAddress?: string;
  onExitToLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  balanceUSDC,
  network,
  walletAddress,
  onExitToLanding
}) => {
  const [copied, setCopied] = useState(false);

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'send', label: 'Send', icon: <Send size={15} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={16} /> },
    { id: 'recipients', label: 'Recipients', icon: <Users size={16} /> },
    { id: 'profile', label: 'Profile', icon: <User size={16} /> }
  ];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="by-sidebar">
      <div className="by-sidebar-top">
        {/* Brand */}
        <div className="by-sidebar-brand" onClick={() => onSelectTab('send')}>
          <BeyiniWordmark size={24} textColor="#FFFFFF" variant="white" />
        </div>

        {/* Navigation Items */}
        <nav className="by-sidebar-nav">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`by-sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
              >
                <span className="by-nav-icon-wrap">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom: Wallet Balance & Address */}
      <div className="by-sidebar-bottom">
        <div className="by-sidebar-wallet-card">
          <span className="by-sidebar-wb-label">Wallet balance</span>
          <div className="by-sidebar-wb-amount-row">
            <span className="by-sidebar-wb-amount">
              {balanceUSDC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
            </span>
            <div className="by-usdc-badge-circle" title="Circle Native USDC on Monad">
              $
            </div>
          </div>

          <div 
            className="by-sidebar-network-row"
            onClick={() => alert(`Connected to ${network} Metropolis (Single-slot finality)`)}
          >
            <div className="by-sidebar-net-left">
              <span className="by-monad-dot" />
              <span>{network}</span>
            </div>
            <ChevronRight size={13} color="#8E8E93" />
          </div>

          {/* Prominent Wallet Address Display */}
          {walletAddress && (
            <div style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#94a3b8'
            }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {walletAddress.length > 12 ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : walletAddress}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '4px',
                  color: copied ? '#10B981' : '#cbd5e1',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem'
                }}
                title="Copy Address"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {onExitToLanding && (
          <button 
            className="by-sidebar-exit-btn"
            onClick={onExitToLanding}
            title="Return to marketing site"
          >
            <ArrowLeft size={13} />
            <span>Return to Website</span>
          </button>
        )}
      </div>
    </aside>
  );
};
