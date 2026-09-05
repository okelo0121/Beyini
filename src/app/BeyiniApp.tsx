import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { AppTab } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileHeader } from './components/MobileHeader';
import { MobileNav } from './components/MobileNav';
import { SendView } from './views/SendView';
import { ActivityView } from './views/ActivityView';
import { RecipientsView } from './views/RecipientsView';
import { ProfileView } from './views/ProfileView';
import { PaymentFlowModal } from './components/PaymentFlowModal';
import type { Recipient, Transaction, CurrentUser } from './data/beyiniData';
import { INITIAL_RECIPIENTS, INITIAL_TRANSACTIONS } from './data/beyiniData';
import { useBeyiniAuth } from '../auth/useBeyiniAuth';
import { useMonadUSDC } from '../blockchain/useMonadUSDC';
import { StorageService } from '../services/StorageService';
import { LogIn, ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import './BeyiniApp.css';

interface BeyiniAppProps {
  initialTab?: AppTab;
  onExitToLanding?: () => void;
  onOpenWalletModal?: () => void;
}

export const BeyiniApp: React.FC<BeyiniAppProps> = ({
  initialTab,
  onExitToLanding,
  onOpenWalletModal
}) => {
  const { user, isAuthenticated, login } = useBeyiniAuth();
  const { balance: liveBalance, refetch } = useMonadUSDC();
  const [currentTab, setCurrentTab] = useState<AppTab>(initialTab || 'send');
  
  // Real user recipients and transactions stored per user session
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    if (typeof window !== 'undefined' && user?.walletAddress) {
      const saved = localStorage.getItem(`beyini_recipients_${user.walletAddress}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return INITIAL_RECIPIENTS;
  });

  const mapPaymentToTransaction = (p: any, currentUser: typeof user): Transaction => {
    const isIncoming = Boolean(
      currentUser && (
        (p.destination_address && p.destination_address.toLowerCase() === currentUser.walletAddress?.toLowerCase()) ||
        (currentUser.email && p.recipient_identity_value?.toLowerCase() === currentUser.email.toLowerCase())
      )
    );

    return {
      id: p.payment_id,
      txHash: p.claim_tx_hash || p.deposit_tx_hash,
      isIncoming,
      senderAddress: p.sender_address,
      recipient: {
        id: p.recipient_identity_value,
        name: isIncoming
          ? (p.sender_address ? `${p.sender_address.slice(0, 6)}...${p.sender_address.slice(-4)}` : 'Monad Sender')
          : p.recipient_identity_value,
        email: p.recipient_identity_type === 'email' ? p.recipient_identity_value : undefined,
        phone: p.recipient_identity_type === 'phone' ? p.recipient_identity_value : undefined,
        username: p.recipient_identity_type === 'username' ? p.recipient_identity_value : undefined,
        avatarBg: isIncoming ? '#10B981' : '#FF6B35',
        avatarText: '#FFFFFF',
        initial: isIncoming ? 'S' : (p.recipient_identity_value.charAt(0).toUpperCase() || 'R'),
        verified: true,
        preferredMethod: 'Wallet'
      },
      amount: p.amount,
      asset: 'USDC',
      network: 'Monad Testnet',
      status: p.status === 'COMPLETED' ? 'SETTLED' : 'NOTIFIED',
      statusLabel: p.status === 'COMPLETED' 
        ? (isIncoming ? 'Received & Settled' : 'Claimed by Recipient') 
        : (isIncoming ? 'Incoming Escrow' : 'Secured on Monad'),
      dateCategory: 'Today',
      timestamp: new Date(p.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      receivingMethod: 'Escrow (Monad EVM claim)',
      lifecycle: [
        { label: 'Payment secured on Monad', completed: true },
        { label: 'Claim link generated', completed: true },
        { label: 'Recipient identity verified', completed: p.status === 'COMPLETED', active: p.status !== 'COMPLETED' },
        { label: 'Settlement confirmed', completed: p.status === 'COMPLETED' }
      ]
    };
  };

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const persisted = StorageService.getLocalPayments();
      if (persisted.length > 0) {
        return persisted.map((p) => mapPaymentToTransaction(p, user));
      }
      if (user?.walletAddress) {
        const saved = localStorage.getItem(`beyini_tx_${user.walletAddress}`);
        if (saved) {
          try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  // Re-sync transactions when user authentication state changes
  useEffect(() => {
    const syncPayments = async () => {
      try {
        const remotePayments = await StorageService.getPaymentsBySender();
        if (remotePayments.length > 0) {
          setTransactions(remotePayments.map((p: any) => mapPaymentToTransaction(p, user)));
          return;
        }
      } catch {
        // Fallback to local
      }
      const local = StorageService.getLocalPayments();
      if (local.length > 0) {
        setTransactions(local.map((p: any) => mapPaymentToTransaction(p, user)));
      }
    };
    syncPayments();
  }, [user?.walletAddress, user?.email]);

  // Send Payment Modal Flow State
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // If user is not authenticated, show authentic Privy connect gateway (ZERO MOCK USER)
  if (!isAuthenticated || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0c',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          background: '#141416',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          textAlign: 'center'
        }}>
          <img 
            src="/beyini-logo-orange.png" 
            alt="Beyini" 
            style={{ width: '56px', height: '56px', marginBottom: '20px', borderRadius: '14px' }} 
          />
          
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Welcome to Beyini
          </h2>
          
          <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '28px' }}>
            Send to a person. They choose how to receive. Connect with your email, phone, or wallet to access your Monad Smart Account.
          </p>

          <button
            onClick={() => login()}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '9999px',
              background: '#FF6B35',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.35)',
              marginBottom: '16px'
            }}
          >
            <LogIn size={18} />
            <span>Sign In with Privy</span>
          </button>

          {onExitToLanding && (
            <button
              onClick={onExitToLanding}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                padding: '10px 18px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>
          )}

          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: '#64748b'
          }}>
            <Sparkles size={12} color="#10B981" />
            <span>Protected by Privy · Monad Testnet (Chain 10143)</span>
          </div>
        </div>
      </div>
    );
  }

  // Active Real User from Privy
  const activeUser: CurrentUser = {
    name: user.displayName,
    username: user.email ? user.email.split('@')[0] : user.walletAddress.slice(2, 8),
    walletAddress: user.walletAddress,
    email: user.email || '',
    phone: user.phone || '',
    balanceUSDC: liveBalance,
    network: 'Monad Testnet'
  };

  const handleSelectRecipient = (recipient: Recipient) => {
    setSelectedRecipient(recipient);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentCompleted = (newTx: Transaction) => {
    setTransactions((prev) => {
      const updated = [newTx, ...prev];
      if (typeof window !== 'undefined' && user?.walletAddress) {
        localStorage.setItem(`beyini_tx_${user.walletAddress}`, JSON.stringify(updated));
      }
      return updated;
    });
    refetch();
  };

  const handleAddRecipient = (newRec: Recipient) => {
    setRecipients((prev) => {
      const updated = [newRec, ...prev];
      if (typeof window !== 'undefined' && user?.walletAddress) {
        localStorage.setItem(`beyini_recipients_${user.walletAddress}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <div className="beyini-app-root">
      {/* 1. Desktop Left Dark Sidebar (#111113) */}
      <Sidebar 
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        balanceUSDC={liveBalance}
        network={activeUser.network}
        walletAddress={activeUser.walletAddress}
        onExitToLanding={onExitToLanding}
      />

      {/* 2. Main Content Container */}
      <div className="by-main-container">
        {/* Mobile Top Header */}
        <MobileHeader 
          walletAddress={activeUser.walletAddress}
          onExitToLanding={onExitToLanding}
        />

        {/* Desktop Top Header */}
        <Header 
          currentTab={currentTab}
          walletAddress={activeUser.walletAddress}
          onToggleWalletModal={onOpenWalletModal}
        />

        {/* Monad Smart Account Banner with Address & Balance */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: 'var(--by-text)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              background: '#10B981', 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%',
              display: 'inline-block' 
            }} />
            <span style={{ color: '#94a3b8' }}>Monad Smart Account:</span>
            <strong style={{ fontFamily: 'monospace', color: '#FFFFFF' }}>
              {activeUser.walletAddress || 'Generating wallet...'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeUser.walletAddress && (
              <a 
                href={`https://testnet.monadexplorer.com/address/${activeUser.walletAddress}`}
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#10B981',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.8rem'
                }}
              >
                <span>Monad Explorer</span>
                <ExternalLink size={12} />
              </a>
            )}

            <a 
              href="https://testnet.monad.xyz/" 
              target="_blank" 
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#FF6B35',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.8rem'
              }}
            >
              <span>Get Faucet Tokens</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="by-content-body">
          {currentTab === 'send' && (
            <SendView 
              recipients={recipients}
              onSelectRecipient={handleSelectRecipient}
              onViewAllRecipients={() => setCurrentTab('recipients')}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityView 
              transactions={transactions}
              onOpenSend={() => setCurrentTab('send')}
            />
          )}

          {currentTab === 'recipients' && (
            <RecipientsView 
              recipients={recipients}
              onSelectRecipient={handleSelectRecipient}
              onAddRecipient={handleAddRecipient}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView 
              user={activeUser}
              onExitToLanding={onExitToLanding}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Dock */}
        <MobileNav 
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      </div>

      {/* 3. Interactive Payment Flow Modal (Steps 1, 2, 3, 4) */}
      <PaymentFlowModal 
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedRecipient(null);
        }}
        recipient={selectedRecipient}
        onEditRecipient={() => {
          setIsPaymentModalOpen(false);
          setSelectedRecipient(null);
        }}
        onPaymentCompleted={handlePaymentCompleted}
        onViewActivity={() => {
          setIsPaymentModalOpen(false);
          setCurrentTab('activity');
        }}
        userBalanceUSDC={liveBalance}
      />
    </div>
  );
};

export default BeyiniApp;
