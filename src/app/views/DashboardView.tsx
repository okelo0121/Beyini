import React from 'react';
import { ArrowRight, TrendingUp, CheckCircle } from 'lucide-react';
import type { Transaction } from '../data/beyiniData';

interface DashboardViewProps {
  userName?: string;
  transactions: Transaction[];
  onStartSend: () => void;
  onViewAllActivity: () => void;
  onSelectTransaction?: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userName = 'Alex',
  transactions,
  onStartSend,
  onViewAllActivity,
  onSelectTransaction,
}) => {
  // Compute real or display stats
  const totalSent = transactions
    .filter((t) => !t.isIncoming)
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 120.00;

  const successfulCount = transactions.filter((t) => t.status === 'SETTLED').length || 6;
  const recentList = transactions.slice(0, 3);

  return (
    <div className="by-dashboard-view">
      {/* Top Hero / Greeting Section */}
      <div className="by-dash-hero">
        <div className="by-dash-hero-text">
          <h1 className="by-dash-greeting">Good morning, {userName}</h1>
          <p className="by-dash-subtitle">Send money to anyone, anywhere in the world.</p>
        </div>

        <button 
          className="by-btn-primary by-dash-send-btn"
          onClick={onStartSend}
        >
          <span>Send Money</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* 3 Metric / Stat Cards */}
      <div className="by-dash-metrics-grid">
        {/* Metric 1: Total Sent */}
        <div className="by-metric-card">
          <div className="by-metric-header">
            <span className="by-metric-label">Total Sent</span>
            <div className="by-metric-badge by-badge-green">
              <TrendingUp size={12} />
              <span>+12% from last week</span>
            </div>
          </div>
          <div className="by-metric-value">${totalSent.toFixed(2)}</div>
        </div>

        {/* Metric 2: Successful Payments */}
        <div className="by-metric-card">
          <div className="by-metric-header">
            <span className="by-metric-label">Successful Payments</span>
            <div className="by-metric-badge by-badge-green">
              <CheckCircle size={12} />
              <span>100% success rate</span>
            </div>
          </div>
          <div className="by-metric-value">{successfulCount}</div>
        </div>

        {/* Metric 3: Active Recipients */}
        <div className="by-metric-card">
          <div className="by-metric-header">
            <span className="by-metric-label">Active Recipients</span>
            <span className="by-metric-subtext">People you've paid</span>
          </div>
          <div className="by-metric-value">4</div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="by-dash-activity-section">
        <div className="by-dash-section-header">
          <h2 className="by-dash-section-title">Recent Activity</h2>
          <button 
            className="by-link-btn"
            onClick={onViewAllActivity}
          >
            View all
          </button>
        </div>

        <div className="by-activity-card-list">
          {recentList.map((tx) => {
            const isWaiting = tx.status === 'NOTIFIED' || tx.status === 'PENDING';
            const statusLabel = isWaiting ? 'Waiting for recipient' : 'Completed';
            const statusClass = isWaiting ? 'by-status-waiting' : 'by-status-completed';

            return (
              <div 
                key={tx.id} 
                className="by-activity-item"
                onClick={() => onSelectTransaction?.(tx)}
              >
                <div className="by-activity-left">
                  <div 
                    className="by-avatar"
                    style={{
                      background: tx.recipient.avatarBg || '#FF6B35',
                      color: tx.recipient.avatarText || '#FFFFFF'
                    }}
                  >
                    {tx.recipient.initial || tx.recipient.name.charAt(0)}
                  </div>
                  <div className="by-activity-info">
                    <span className="by-activity-name">{tx.recipient.name}</span>
                    <span className="by-activity-identifier">
                      {tx.recipient.email || tx.recipient.phone || `@${tx.recipient.username || 'user'}`}
                    </span>
                  </div>
                </div>

                <div className="by-activity-right">
                  <div className="by-activity-amount-row">
                    <span className="by-activity-amount">- ${tx.amount.toFixed(2)} USDC</span>
                    <span className="by-activity-time">{tx.timestamp}</span>
                  </div>
                  <div className={`by-activity-status-pill ${statusClass}`}>
                    <span className="by-status-dot" />
                    <span>{statusLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
