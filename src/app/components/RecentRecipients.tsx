import React from 'react';
import { Users, ChevronRight } from 'lucide-react';
import type { Recipient } from '../data/beyiniData';

interface RecentRecipientsProps {
  recipients: Recipient[];
  onSelectRecipient: (recipient: Recipient) => void;
  onViewAll: () => void;
}

export const RecentRecipients: React.FC<RecentRecipientsProps> = ({
  recipients,
  onSelectRecipient,
  onViewAll
}) => {
  const displayRecipients = recipients.slice(0, 3);

  return (
    <section className="by-recent-section">
      <h3 className="by-section-header">Recent recipients</h3>

      <div className="by-recent-grid">
        {displayRecipients.map((r) => (
          <div
            key={r.id}
            className="by-recent-card"
            onClick={() => onSelectRecipient(r)}
            role="button"
            tabIndex={0}
          >
            <div 
              className="by-avatar"
              style={{ background: r.avatarBg, color: r.avatarText }}
            >
              {r.initial}
            </div>

            <div className="by-recent-info">
              <span className="by-recent-name">{r.name}</span>
              <span className="by-recent-identifier">
                {r.email || r.phone || `@${r.username}`}
              </span>
            </div>
          </div>
        ))}

        {/* 4th Item: View All */}
        <div
          className="by-recent-card-viewall"
          onClick={onViewAll}
          role="button"
          tabIndex={0}
        >
          <div className="by-viewall-left">
            <div className="by-viewall-icon">
              <Users size={18} />
            </div>
            <span>View all</span>
          </div>
          <ChevronRight size={16} color="#6B6B6B" />
        </div>
      </div>
    </section>
  );
};
