import React, { useState } from 'react';
import type { Recipient } from '../data/beyiniData';
import { Search, UserPlus, Send, X, Check } from 'lucide-react';

interface RecipientsViewProps {
  recipients: Recipient[];
  onSelectRecipient: (recipient: Recipient) => void;
  onAddRecipient: (newRec: Recipient) => void;
}

export const RecipientsView: React.FC<RecipientsViewProps> = ({
  recipients,
  onSelectRecipient,
  onAddRecipient
}) => {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');

  const filtered = recipients.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.username && r.username.toLowerCase().includes(q)) ||
      (r.phone && r.phone.toLowerCase().includes(q))
    );
  });

  const handleCreateRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !identifier.trim()) return;

    const isEmail = identifier.includes('@');
    const isPhone = /^[+]?[\d\s-]{7,}$/.test(identifier);

    const newR: Recipient = {
      id: `rec-${Date.now()}`,
      name: name.trim(),
      email: isEmail ? identifier.trim() : undefined,
      phone: isPhone ? identifier.trim() : undefined,
      username: !isEmail && !isPhone ? identifier.replace('@', '') : undefined,
      avatarBg: '#FF6B35',
      avatarText: '#FFFFFF',
      initial: name.trim().charAt(0).toUpperCase(),
      verified: true,
      lastPayment: 'Just added'
    };

    onAddRecipient(newR);
    setName('');
    setIdentifier('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="by-recipients-page">
      <div className="by-page-title-row">
        <h1 className="by-page-title">Recipients</h1>
        <button 
          className="by-primary-btn"
          style={{ width: 'auto', padding: '10px 18px', fontSize: '0.88rem' }}
          onClick={() => setIsAddModalOpen(true)}
        >
          <UserPlus size={16} />
          <span>Add recipient</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="by-recipient-input-card" style={{ maxWidth: '440px' }}>
        <Search size={18} className="by-search-icon" />
        <input 
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or @handle"
        />
      </div>

      {/* Recipients List */}
      <div className="by-recipients-list">
        {filtered.map((r) => (
          <div key={r.id} className="by-recipient-list-row">
            <div className="by-rl-left">
              <div 
                className="by-avatar"
                style={{ width: '46px', height: '46px', background: r.avatarBg, color: r.avatarText, fontSize: '1.05rem' }}
              >
                {r.initial}
              </div>

              <div className="by-rl-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--by-text)' }}>
                    {r.name}
                  </span>
                  {r.preferredMethod && (
                    <span style={{ fontSize: '0.72rem', background: '#F4F4F2', padding: '2px 8px', borderRadius: '6px', color: 'var(--by-text-secondary)', fontWeight: 500 }}>
                      Prefers {r.preferredMethod}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--by-text-secondary)' }}>
                  {r.email || r.phone || `@${r.username}`} · {r.lastPayment}
                </span>
              </div>
            </div>

            <button 
              className="by-rl-action-btn"
              onClick={() => onSelectRecipient(r)}
            >
              <Send size={13} />
              <span>Send</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add Recipient Modal */}
      {isAddModalOpen && (
        <div className="by-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="by-payment-card-frame" onClick={(e) => e.stopPropagation()}>
            <div className="by-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Add Recipient</h3>
              <button className="by-modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecipient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="by-claim-field">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="by-claim-text-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Lin" 
                  required 
                  autoFocus
                />
              </div>

              <div className="by-claim-field">
                <label>Identifier (Email, Phone or @username)</label>
                <input 
                  type="text" 
                  className="by-claim-text-input" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="maya@gmail.com, +1 555..., or @maya" 
                  required 
                />
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--by-text-secondary)', margin: 0 }}>
                You do not need their wallet address. Beyini will notify them so they choose how to receive funds.
              </p>

              <button type="submit" className="by-primary-btn">
                <Check size={16} />
                <span>Save recipient</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
