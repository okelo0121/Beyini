import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { WalletProvider } from '../types/wallet';
import '../styles/modal.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedWallet: string | null;
  onConnect: (walletName: string) => void;
  onDisconnect: () => void;
}

const WALLET_PROVIDERS: WalletProvider[] = [
  {
    id: 'leather',
    name: 'Leather (Hiro)',
    description: 'The native wallet for Stacks & Bitcoin apps',
    iconBg: '#FF5500',
    recommended: true
  },
  {
    id: 'xverse',
    name: 'Xverse Wallet',
    description: 'Chrome & Mobile wallet with Ordinals support',
    iconBg: '#FF5722',
    recommended: true
  },
  {
    id: 'asigna',
    name: 'Asigna Multisig',
    description: 'Multi-signature Bitcoin, Ordinals, & Stacks treasury',
    iconBg: '#10B981'
  },
  {
    id: 'unisat',
    name: 'UniSat Wallet',
    description: 'Open source browser extension wallet',
    iconBg: '#FFC200'
  }
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  connectedWallet,
  onConnect,
  onDisconnect
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {connectedWallet ? 'Connected Wallet' : 'Connect Wallet'}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {connectedWallet ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(16, 185, 129, 0.2)', 
              color: '#10B981', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle size={36} />
            </div>
            <h4 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>{connectedWallet}</h4>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              STX Address: SP2Z...4K9Q &bull; Balance: 14,250 STX
            </p>
            <button 
              className="btn-primary" 
              style={{ background: '#EF4444', width: '100%' }}
              onClick={onDisconnect}
            >
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="wallet-providers-list">
              {WALLET_PROVIDERS.map((provider) => (
                <div 
                  key={provider.id} 
                  className="wallet-provider-item"
                  onClick={() => onConnect(provider.name)}
                >
                  <div className="wallet-provider-left">
                    <div 
                      className="wallet-icon-box"
                      style={{ background: provider.iconBg, color: '#fff' }}
                    >
                      {provider.name.charAt(0)}
                    </div>
                    <div className="wallet-info">
                      <h4>{provider.name}</h4>
                      <p>{provider.description}</p>
                    </div>
                  </div>
                  {provider.recommended && (
                    <span className="wallet-badge-rec">Popular</span>
                  )}
                </div>
              ))}
            </div>
            <p className="modal-footer-note">
              By connecting your wallet, you agree to CoinFusion's Terms of Service and Privacy Policy.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
