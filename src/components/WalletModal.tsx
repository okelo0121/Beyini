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
    id: 'metamask',
    name: 'MetaMask',
    description: 'The standard EVM wallet with Monad Testnet support',
    iconBg: '#F6851B',
    recommended: true
  },
  {
    id: 'rabby',
    name: 'Rabby Wallet',
    description: 'Security-first browser wallet for Monad power users',
    iconBg: '#8697FF',
    recommended: true
  },
  {
    id: 'rainbow',
    name: 'Rainbow Wallet',
    description: 'Intuitive mobile & browser wallet with instant bridging',
    iconBg: '#001E59'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Smart wallet & EVM browser extension on Monad',
    iconBg: '#0052FF'
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
              Monad Address: 0x... &bull; Network: Monad Testnet (10,000 TPS)
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
              By connecting your wallet, you agree to Beyini's Terms of Service and Privacy Policy.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
