import React, { useState } from 'react';
import { 
  Bell, 
  ChevronDown, 
  Copy, 
  Check, 
  ExternalLink, 
  LogOut,
  PlusCircle
} from 'lucide-react';
import type { AppTab } from './Sidebar';
import { useBeyiniAuth } from '../../auth/useBeyiniAuth';

interface HeaderProps {
  currentTab: AppTab;
  walletAddress: string;
  onToggleWalletModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  walletAddress,
}) => {
  const { user, createWallet, logout } = useBeyiniAuth();
  const [copied, setCopied] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const getTabTitle = () => {
    switch (currentTab) {
      case 'send':
        return 'Send money';
      case 'activity':
        return 'Activity';
      case 'recipients':
        return 'Recipients';
      case 'profile':
        return 'Profile';
      default:
        return 'Send money';
    }
  };

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateWallet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreatingWallet(true);
    try {
      await createWallet();
    } catch (err) {
      console.error('Failed to create wallet:', err);
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const truncatedAddress = walletAddress && walletAddress.length > 12
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : walletAddress || 'No Wallet';

  return (
    <header className="by-header">
      <div className="by-header-left">
        <h2 className="by-header-title">{getTabTitle()}</h2>
      </div>

      <div className="by-header-right" style={{ position: 'relative' }}>

        {/* Notifications */}
        <button 
          className="by-header-icon-btn" 
          title="Notifications"
          onClick={() => alert('All recent transfers settled with sub-second finality on Monad.')}
        >
          <Bell size={17} />
          <span className="by-notification-dot" />
        </button>

        {/* Connected Wallet Pill with Direct Address Visibility */}
        {walletAddress ? (
          <div 
            className="by-wallet-pill"
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            title="Click to view Monad Account Details"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '6px 12px',
              borderRadius: '9999px',
              background: '#1A1A1E',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
            }} />
            
            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600 }}>
              {truncatedAddress}
            </span>

            {/* Quick Copy Button */}
            <button
              onClick={handleCopyAddress}
              title="Copy full Monad wallet address"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 6px',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: copied ? '#10B981' : '#94a3b8'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>

            <ChevronDown size={13} color="#94a3b8" />
          </div>
        ) : (
          <button
            onClick={handleCreateWallet}
            disabled={isCreatingWallet}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '9999px',
              background: '#FF6B35',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={14} />
            <span>{isCreatingWallet ? 'Generating Wallet...' : 'Create Monad Wallet'}</span>
          </button>
        )}

        {/* Account Details Popover Menu */}
        {isAccountMenuOpen && walletAddress && (
          <div 
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '320px',
              background: '#18181B',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              zIndex: 100,
              color: '#FFFFFF'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monad Smart Account
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 600
              }}>
                Chain 10143
              </span>
            </div>

            {/* Full Wallet Address Box */}
            <div style={{
              background: '#0D0D10',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '10px',
              marginBottom: '14px',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div>{walletAddress}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={handleCopyAddress}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: copied ? '#10B981' : '#FFFFFF',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                </button>

                <a
                  href={`https://testnet.monadexplorer.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Monad Explorer</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Quick Account Info */}
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Identity:</span>
                <strong style={{ color: '#FFFFFF' }}>{user?.displayName || 'Monad User'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Email:</span>
                <span style={{ color: '#FFFFFF' }}>{user?.email || 'None'}</span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => logout()}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
