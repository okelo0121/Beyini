import React, { useState, useEffect } from 'react';
import { Menu, X, Wallet } from 'lucide-react';
import { BeyiniWordmark } from '../assets/icons/BeyiniLogo';
import '../styles/navbar.css';

interface NavbarProps {
  onOpenWalletModal: () => void;
  onOpenLaunchApp?: () => void;
  connectedWallet: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenWalletModal, 
  onOpenLaunchApp,
  connectedWallet 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Why Monad', href: '#monad' },
    { label: 'Trust', href: '#trust' },
    { label: 'Metropolis', href: '#metropolis' }
  ];

  const handleLaunchClick = () => {
    if (onOpenLaunchApp) {
      onOpenLaunchApp();
    } else {
      onOpenWalletModal();
    }
  };

  return (
    <header className="navbar-wrapper">
      <nav className={`navbar-pill ${scrolled ? 'scrolled' : ''}`}>
        <a href="#" className="navbar-logo" style={{ textDecoration: 'none' }}>
          <BeyiniWordmark size={36} textColor="#000000" variant="black" />
        </a>

        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="navbar-link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          <button 
            className={`btn-connect-wallet ${connectedWallet ? 'connected' : ''}`}
            onClick={handleLaunchClick}
          >
            {connectedWallet ? (
              <>
                <span className="wallet-badge-dot" />
                <span>{connectedWallet}</span>
              </>
            ) : (
              <>
                <Wallet size={16} />
                <span>Launch App</span>
              </>
            )}
          </button>

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={26} />
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <BeyiniWordmark size={38} textColor="#FFFFFF" variant="white" />
          <button 
            className="modal-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <ul className="mobile-drawer-links">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a 
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
          <button 
            className="btn-primary" 
            style={{ width: '100%' }}
            onClick={() => {
              setMobileMenuOpen(false);
              handleLaunchClick();
            }}
          >
            {connectedWallet ? `Connected: ${connectedWallet}` : 'Launch App'}
          </button>
        </div>
      </div>
    </header>
  );
};
