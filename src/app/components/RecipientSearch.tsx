import React, { useState, useRef, useEffect } from 'react';
import { Search, Lock, CheckCircle2 } from 'lucide-react';
import type { Recipient } from '../data/beyiniData';

interface RecipientSearchProps {
  allRecipients: Recipient[];
  onSelectRecipient: (recipient: Recipient) => void;
}

export const RecipientSearch: React.FC<RecipientSearchProps> = ({
  allRecipients,
  onSelectRecipient
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter existing recipients
  const filtered = query.trim()
    ? allRecipients.filter((r) => {
        const q = query.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          (r.email && r.email.toLowerCase().includes(q)) ||
          (r.username && r.username.toLowerCase().includes(q)) ||
          (r.phone && r.phone.toLowerCase().includes(q))
        );
      })
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (r: Recipient) => {
    onSelectRecipient(r);
    setQuery('');
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if query is email, phone, or username
    const isEmail = query.includes('@') && query.includes('.');
    const isPhone = /^[+]?[\d\s-]{7,}$/.test(query.trim());
    
    const newRecipient: Recipient = {
      id: `custom-${Date.now()}`,
      name: query.trim().split('@')[0],
      email: isEmail ? query.trim() : undefined,
      phone: isPhone ? query.trim() : undefined,
      username: !isEmail && !isPhone ? query.replace('@', '') : undefined,
      avatarBg: '#FF6B35',
      avatarText: '#FFFFFF',
      initial: query.trim().charAt(0).toUpperCase(),
      verified: true,
      lastPayment: 'New recipient'
    };

    onSelectRecipient(newRecipient);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="by-search-container" ref={containerRef} style={{ position: 'relative' }}>
      <form onSubmit={handleCustomSubmit} className="by-recipient-input-card">
        <Search size={19} className="by-search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Email, phone number or @username"
        />
      </form>

      {/* Lock Notice Below Input */}
      <div className="by-input-subtext">
        <Lock size={13} />
        <span>You don't need their wallet address.</span>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && query.trim() && (
        <div className="by-search-dropdown">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="by-search-result-item"
              onClick={() => handleSelect(r)}
            >
              <div className="by-sr-left">
                <div 
                  className="by-avatar"
                  style={{ width: '36px', height: '36px', background: r.avatarBg, color: r.avatarText, fontSize: '0.88rem' }}
                >
                  {r.initial}
                </div>
                <div>
                  <div className="by-sr-name">{r.name}</div>
                  <div className="by-sr-identifier">{r.email || r.phone || `@${r.username}`}</div>
                </div>
              </div>
              <CheckCircle2 size={16} color="#10B981" />
            </div>
          ))}

          {/* Fallback to send directly to typed identifier */}
          <div
            className="by-search-result-item"
            style={{ background: 'var(--by-orange-tint)' }}
            onClick={handleCustomSubmit}
          >
            <div className="by-sr-left">
              <div 
                className="by-avatar"
                style={{ width: '36px', height: '36px', background: 'var(--by-orange)', color: '#FFFFFF', fontSize: '0.88rem' }}
              >
                +
              </div>
              <div>
                <div className="by-sr-name" style={{ color: 'var(--by-orange)' }}>
                  Send to "{query.trim()}"
                </div>
                <div className="by-sr-identifier">Recipient will choose their preferred payout</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
