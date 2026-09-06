import React, { useState, useRef, useEffect } from 'react';
import { Search, Lock, CheckCircle2, AtSign, MessageSquare, Mail, Smartphone } from 'lucide-react';
import type { Recipient } from '../data/beyiniData';
import { IdentityService } from '../../services/IdentityService';

interface RecipientSearchProps {
  allRecipients: Recipient[];
  onSelectRecipient: (recipient: Recipient) => void;
}

export const RecipientSearch: React.FC<RecipientSearchProps> = ({
  allRecipients,
  onSelectRecipient
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'twitter' | 'discord' | 'email' | 'phone'>('all');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect current typed identifier type
  const detectedType = IdentityService.detectIdentityType(query);

  // Filter existing recipients
  const filtered = query.trim()
    ? allRecipients.filter((r) => {
      const q = query.toLowerCase().replace(/^@/, '');
      const matchesQuery =
        r.name.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.username && r.username.toLowerCase().includes(q)) ||
        (r.twitter && r.twitter.toLowerCase().includes(q)) ||
        (r.discord && r.discord.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q));

      if (!matchesQuery) return false;
      if (activeFilter === 'twitter') return Boolean(r.twitter || r.username);
      if (activeFilter === 'discord') return Boolean(r.discord);
      if (activeFilter === 'email') return Boolean(r.email);
      if (activeFilter === 'phone') return Boolean(r.phone);
      return true;
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

    let type = detectedType;
    if (activeFilter !== 'all') {
      type = activeFilter;
    }

    const normalized = IdentityService.normalizeIdentifier(query, type);

    let avatarBg = '#FF6B35';
    let displayName = query.trim();
    let initial = normalized.charAt(0).toUpperCase();

    if (type === 'twitter') {
      avatarBg = '#1D9BF0'; // Twitter blue
      displayName = `@${normalized}`;
      initial = 'X';
    } else if (type === 'discord') {
      avatarBg = '#5865F2'; // Discord blurple
      displayName = `${normalized} (Discord)`;
      initial = 'D';
    } else if (type === 'email') {
      avatarBg = '#10B981'; // Emerald
      displayName = query.trim().split('@')[0];
    }

    const newRecipient: Recipient = {
      id: `custom-${Date.now()}`,
      name: displayName,
      email: type === 'email' ? normalized : undefined,
      phone: type === 'phone' ? normalized : undefined,
      twitter: type === 'twitter' ? normalized : undefined,
      discord: type === 'discord' ? normalized : undefined,
      username: (type === 'twitter' || type === 'discord' || type === 'username') ? normalized : undefined,
      avatarBg,
      avatarText: '#FFFFFF',
      initial,
      verified: true,
      lastPayment: 'New recipient'
    };

    onSelectRecipient(newRecipient);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="by-search-container" ref={containerRef} style={{ position: 'relative' }}>
      {/* Social & Identity Quick Selector Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          style={{
            background: activeFilter === 'all' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: activeFilter === 'all' ? '1px solid #FF6B35' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeFilter === 'all' ? '#FF6B35' : '#94a3b8',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveFilter('twitter');
            if (!query.startsWith('@') && query.trim()) setQuery(`@${query.replace(/^@/, '')}`);
          }}
          style={{
            background: activeFilter === 'twitter' ? 'rgba(29, 155, 240, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: activeFilter === 'twitter' ? '1px solid #1D9BF0' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeFilter === 'twitter' ? '#1D9BF0' : '#94a3b8',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <AtSign size={13} />
          <span>X / Twitter</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('discord')}
          style={{
            background: activeFilter === 'discord' ? 'rgba(88, 101, 242, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: activeFilter === 'discord' ? '1px solid #5865F2' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeFilter === 'discord' ? '#818cf8' : '#94a3b8',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <MessageSquare size={13} />
          <span>Discord</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('email')}
          style={{
            background: activeFilter === 'email' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: activeFilter === 'email' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeFilter === 'email' ? '#10B981' : '#94a3b8',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Mail size={13} />
          <span>Email</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('phone')}
          style={{
            background: activeFilter === 'phone' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: activeFilter === 'phone' ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
            color: activeFilter === 'phone' ? '#F59E0B' : '#94a3b8',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Smartphone size={13} />
          <span>Phone</span>
        </button>
      </div>

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
          placeholder={
            activeFilter === 'twitter' ? 'Enter X handle (e.g. @username)' :
              activeFilter === 'discord' ? 'Enter Discord username (e.g. username)' :
                activeFilter === 'email' ? 'Enter email address (e.g. alex@example.com)' :
                  activeFilter === 'phone' ? 'Enter phone number (e.g. +1...)' :
                    'X handle (@username), Discord, email or phone'
          }
        />
      </form>

      {/* Lock Notice Below Input */}
      <div className="by-input-subtext">
        <Lock size={13} />
        <span>No wallet address needed — recipient logs in with X, Discord or Email to claim.</span>
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
                  <div className="by-sr-identifier">
                    {r.twitter ? `@${r.twitter} (X)` : r.discord ? `${r.discord} (Discord)` : r.email || r.phone || `@${r.username}`}
                  </div>
                </div>
              </div>
              <CheckCircle2 size={16} color="#10B981" />
            </div>
          ))}

          {/* Dynamic Social / Custom Recipient Card */}
          <div
            className="by-search-result-item"
            style={{
              background:
                detectedType === 'twitter' || activeFilter === 'twitter' ? 'rgba(29, 155, 240, 0.12)' :
                  detectedType === 'discord' || activeFilter === 'discord' ? 'rgba(88, 101, 242, 0.12)' :
                    'var(--by-orange-tint)'
            }}
            onClick={handleCustomSubmit}
          >
            <div className="by-sr-left">
              <div
                className="by-avatar"
                style={{
                  width: '36px',
                  height: '36px',
                  background:
                    detectedType === 'twitter' || activeFilter === 'twitter' ? '#1D9BF0' :
                      detectedType === 'discord' || activeFilter === 'discord' ? '#5865F2' :
                        'var(--by-orange)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem'
                }}
              >
                {detectedType === 'twitter' || activeFilter === 'twitter' ? 'X' :
                  detectedType === 'discord' || activeFilter === 'discord' ? 'D' : '+'}
              </div>
              <div>
                <div className="by-sr-name" style={{
                  color:
                    detectedType === 'twitter' || activeFilter === 'twitter' ? '#38bdf8' :
                      detectedType === 'discord' || activeFilter === 'discord' ? '#a5b4fc' :
                        'var(--by-orange)'
                }}>
                  Send to "{query.trim()}"
                </div>
                <div className="by-sr-identifier" style={{ color: '#94a3b8' }}>
                  {detectedType === 'twitter' || activeFilter === 'twitter' ? 'Recipient will authenticate with X to claim on Monad' :
                    detectedType === 'discord' || activeFilter === 'discord' ? 'Recipient will authenticate with Discord to claim on Monad' :
                      'Recipient will claim on Monad Testnet via escrow'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
