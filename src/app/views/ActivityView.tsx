import React, { useState } from 'react';
import type { Transaction } from '../data/beyiniData';
import { X, Check, Clock, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { NotificationService } from '../../services/NotificationService';

interface ActivityViewProps {
  transactions: Transaction[];
  onOpenSend: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ transactions, onOpenSend }) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Group transactions by dateCategory
  const categories: ('Today' | 'Yesterday' | 'Last Week' | 'Earlier')[] = [
    'Today',
    'Yesterday',
    'Last Week',
    'Earlier'
  ];

  const getStatusPillClass = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return 'completed';
      case 'NOTIFIED':
      case 'CLAIMED':
      case 'PENDING':
        return 'pending';
      case 'EXPIRED':
      case 'REFUNDED':
        return 'expired';
      default:
        return 'pending';
    }
  };

  return (
    <div className="by-activity-page">
      <div className="by-page-title-row">
        <h1 className="by-page-title">Activity</h1>
        <button 
          className="by-primary-btn" 
          style={{ width: 'auto', padding: '10px 20px', fontSize: '0.88rem' }}
          onClick={onOpenSend}
        >
          <span>Send money</span>
          <span>&rarr;</span>
        </button>
      </div>

      {categories.map((cat) => {
        const txsInCat = transactions.filter((t) => t.dateCategory === cat);
        if (txsInCat.length === 0) return null;

        return (
          <div key={cat} className="by-date-group">
            <div className="by-date-group-heading">{cat}</div>
            {txsInCat.map((tx) => (
              <div
                key={tx.id}
                className="by-tx-row-card"
                onClick={() => setSelectedTx(tx)}
                role="button"
                tabIndex={0}
              >
                <div className="by-tx-left">
                  <div
                    className="by-avatar"
                    style={{ background: tx.recipient.avatarBg, color: tx.recipient.avatarText }}
                  >
                    {tx.recipient.initial}
                  </div>
                  <div className="by-tx-details">
                    <span className="by-tx-name">{tx.recipient.name}</span>
                    <span className="by-tx-sub">
                      {tx.receivingMethod || 'Recipient choosing'} · {tx.timestamp}
                    </span>
                  </div>
                </div>

                <div className="by-tx-right">
                  <span 
                    className="by-tx-amount"
                    style={tx.isIncoming ? { color: '#10B981', fontWeight: 700 } : undefined}
                  >
                    {tx.isIncoming ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                  </span>
                  <span className={`by-status-pill ${getStatusPillClass(tx.status)}`}>
                    {tx.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Detailed Transaction Slide-over Drawer */}
      {selectedTx && (
        <div className="by-drawer-backdrop" onClick={() => setSelectedTx(null)}>
          <div className="by-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--by-text-secondary)', textTransform: 'uppercase' }}>
                Payment Details
              </span>
              <button className="by-modal-close-btn" onClick={() => setSelectedTx(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Main Details */}
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--by-border-subtle)' }}>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: 800, 
                color: selectedTx.isIncoming ? '#10B981' : 'var(--by-text)', 
                letterSpacing: '-0.03em' 
              }}>
                {selectedTx.isIncoming ? `+$${selectedTx.amount.toFixed(2)}` : `-$${selectedTx.amount.toFixed(2)}`}
              </div>
              <div style={{ fontSize: '0.92rem', color: 'var(--by-text-secondary)', marginTop: '4px' }}>
                {selectedTx.isIncoming ? 'Received from ' : 'Sent to '}
                <strong>{selectedTx.recipient.name}</strong>
              </div>
            </div>

            {/* Key Meta Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--by-text-secondary)' }}>Status</span>
                <span className={`by-status-pill ${getStatusPillClass(selectedTx.status)}`}>
                  {selectedTx.statusLabel}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--by-text-secondary)' }}>Receiving method</span>
                <strong style={{ color: 'var(--by-text)' }}>{selectedTx.receivingMethod}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--by-text-secondary)' }}>Network</span>
                <strong style={{ color: 'var(--by-text)' }}>{selectedTx.network} (Single-slot finality)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--by-text-secondary)' }}>Asset</span>
                <strong style={{ color: 'var(--by-text)' }}>{selectedTx.asset}</strong>
              </div>

              {selectedTx.settlementDetails && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--by-text-secondary)' }}>Destination</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--by-text)', fontWeight: 500 }}>
                    {selectedTx.settlementDetails}
                  </span>
                </div>
              )}

              {selectedTx.txHash && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--by-text-secondary)' }}>Monad Tx</span>
                  <a 
                    href={`https://testnet.monadexplorer.com/tx/${selectedTx.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      color: 'var(--by-orange)', 
                      fontSize: '0.82rem', 
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    <span>{selectedTx.txHash.length > 16 ? `${selectedTx.txHash.slice(0, 10)}...${selectedTx.txHash.slice(-6)}` : selectedTx.txHash}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Lifecycle Tracker */}
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '16px 0 10px', color: 'var(--by-text)' }}>
                Payment Lifecycle
              </h4>
              <div className="by-lifecycle-card" style={{ background: '#F9F9F8', border: '1px solid var(--by-border)' }}>
                {selectedTx.lifecycle.map((step, idx) => (
                  <div key={idx} className="by-lifecycle-item">
                    <div className={`by-lc-icon ${step.completed ? 'completed' : 'pending'}`}>
                      {step.completed ? (
                        <Check size={14} strokeWidth={3} color="#10B981" />
                      ) : (
                        <Clock size={14} color="#8E8E93" />
                      )}
                    </div>
                    <span 
                      className="by-lc-text"
                      style={{ color: step.completed ? 'var(--by-text)' : 'var(--by-text-muted)', fontWeight: step.completed ? 600 : 400 }}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient Claim Link Helper for active payments */}
            {selectedTx.status !== 'SETTLED' && !selectedTx.isIncoming && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 107, 53, 0.08)',
                border: '1px solid rgba(255, 107, 53, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--by-orange)' }}>
                    Recipient Claim Link
                  </span>
                  <button
                    onClick={() => {
                      const link = NotificationService.generateClaimUrl(selectedTx.id);
                      navigator.clipboard.writeText(link);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    style={{
                      background: isCopied ? '#10B981' : 'var(--by-orange)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    const link = NotificationService.generateClaimUrl(selectedTx.id);
                    window.open(link, '_blank');
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: '1px solid rgba(255, 107, 53, 0.3)',
                    borderRadius: '8px',
                    color: 'var(--by-orange)',
                    padding: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ExternalLink size={13} />
                  <span>Open Recipient Claim Page (New Tab)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
