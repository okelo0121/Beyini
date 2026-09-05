import React, { useState } from 'react';
import type { CurrentUser } from '../data/beyiniData';
import { useBeyiniAuth } from '../../auth/useBeyiniAuth';
import { 
  User, 
  Wallet, 
  Smartphone, 
  ShieldCheck, 
  Bell, 
  CheckCircle2, 
  ExternalLink,
  LogOut,
  Sparkles
} from 'lucide-react';

interface ProfileViewProps {
  user: CurrentUser;
  onExitToLanding?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onExitToLanding }) => {
  const { logout } = useBeyiniAuth();
  const [defaultMethod, setDefaultMethod] = useState<'Wallet' | 'Mobile Money' | 'PayPal'>('Wallet');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = async () => {
    await logout();
    if (onExitToLanding) {
      onExitToLanding();
    }
  };

  return (
    <div className="by-profile-page">
      <div className="by-page-title-row">
        <h1 className="by-page-title">Profile & Settings</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="by-sidebar-exit-btn"
            style={{ 
              color: '#EF4444', 
              borderColor: 'rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={handleSignOut}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
          {onExitToLanding && (
            <button 
              className="by-sidebar-exit-btn"
              style={{ color: 'var(--by-text)', borderColor: 'var(--by-border)' }}
              onClick={onExitToLanding}
            >
              Return to Landing
            </button>
          )}
        </div>
      </div>

      <div className="by-profile-sections-grid">
        {/* Card 1: Account & Wallet */}
        <div className="by-profile-card">
          <h3 className="by-profile-card-title">
            <Wallet size={18} color="var(--by-orange)" />
            <span>Account & Smart Account</span>
          </h3>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Monad Smart Account</span>
            <span className="by-pfr-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                {user.walletAddress.length > 18 
                  ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}`
                  : user.walletAddress || 'Generating...'}
              </span>

              {user.walletAddress && (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.walletAddress);
                      alert('Wallet address copied to clipboard!');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      color: '#FFFFFF',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Copy full address"
                  >
                    Copy
                  </button>

                  <a 
                    href={`https://testnet.monadexplorer.com/address/${user.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', color: 'inherit' }}
                    title="View on Monad Explorer"
                  >
                    <ExternalLink size={14} color="#10B981" />
                  </a>
                </>
              )}
            </span>
          </div>

          {user.walletAddress && (
            <div style={{
              background: '#0D0D10',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: '#94a3b8',
              wordBreak: 'break-all',
              userSelect: 'all'
            }}>
              {user.walletAddress}
            </div>
          )}

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Account Architecture</span>
            <span className="by-pfr-val" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 600 }}>
              <Sparkles size={13} />
              <span>Privy Embedded · 100% Gas Sponsored</span>
            </span>
          </div>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Primary Network</span>
            <span className="by-pfr-val">Monad Testnet (10,000 TPS)</span>
          </div>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Available Balance</span>
            <span className="by-pfr-val" style={{ color: 'var(--by-orange)', fontWeight: 700 }}>
              {user.balanceUSDC.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDC
            </span>
          </div>
        </div>

        {/* Card 2: Identity Model */}
        <div className="by-profile-card">
          <h3 className="by-profile-card-title">
            <User size={18} color="var(--by-orange)" />
            <span>Identity Handles</span>
          </h3>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Full Name</span>
            <span className="by-pfr-val">{user.name}</span>
          </div>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Username</span>
            <span className="by-pfr-val">@{user.username}</span>
          </div>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Email Address</span>
            <span className="by-pfr-val">{user.email}</span>
          </div>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Phone Number</span>
            <span className="by-pfr-val">{user.phone}</span>
          </div>
        </div>

        {/* Card 3: Default Receiving Methods */}
        <div className="by-profile-card">
          <h3 className="by-profile-card-title">
            <Smartphone size={18} color="var(--by-orange)" />
            <span>Default Payout Preference</span>
          </h3>

          <p style={{ fontSize: '0.82rem', color: 'var(--by-text-secondary)', margin: 0 }}>
            When someone sends money to your email or phone, Beyini will route directly to your default preference.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['Wallet', 'Mobile Money', 'PayPal'] as const).map((method) => {
              const isSelected = defaultMethod === method;
              return (
                <div
                  key={method}
                  className={`by-method-card ${isSelected ? 'selected' : ''}`}
                  style={{ padding: '12px 14px' }}
                  onClick={() => setDefaultMethod(method)}
                  role="button"
                  tabIndex={0}
                >
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--by-text)' }}>
                    {method}
                  </span>
                  <div className="by-method-radio-dot" style={{ width: '18px', height: '18px' }}>
                    {isSelected && <CheckCircle2 size={14} color="var(--by-orange)" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: Settings & Security */}
        <div className="by-profile-card">
          <h3 className="by-profile-card-title">
            <ShieldCheck size={18} color="var(--by-orange)" />
            <span>Security & Notifications</span>
          </h3>

          <div className="by-profile-field-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={15} color="var(--by-text-muted)" />
              <span className="by-pfr-label">Payment Notifications</span>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              style={{
                background: notificationsEnabled ? 'var(--by-orange)' : '#E7E7E5',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {notificationsEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Zero-Address Stealth Registry</span>
            <span className="by-pfr-val" style={{ color: '#10B981', fontSize: '0.82rem' }}>
              Active (Monad EVM)
            </span>
          </div>

          <div className="by-profile-field-row">
            <span className="by-pfr-label">Single-Slot Finality</span>
            <span className="by-pfr-val">&lt; 800ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
