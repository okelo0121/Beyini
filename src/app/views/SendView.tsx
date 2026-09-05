import React from 'react';
import type { Recipient } from '../data/beyiniData';
import { RecipientSearch } from '../components/RecipientSearch';
import { SendDiagram } from '../components/SendDiagram';
import { RecentRecipients } from '../components/RecentRecipients';

interface SendViewProps {
  recipients: Recipient[];
  onSelectRecipient: (recipient: Recipient) => void;
  onViewAllRecipients: () => void;
}

export const SendView: React.FC<SendViewProps> = ({
  recipients,
  onSelectRecipient,
  onViewAllRecipients
}) => {
  return (
    <div className="by-send-view">
      {/* Top Hero Section: Headline & Search on Left, Routing Diagram on Right */}
      <div className="by-send-hero-section">
        <div className="by-send-headline-col">
          <h1 className="by-send-title">
            Who are you<br />
            <span className="by-send-title-orange">sending to?</span>
          </h1>

          <p className="by-send-subtitle">
            Send to anyone using their X handle (@username), Discord, email, or phone. They authenticate and claim directly to their Monad smart account.
          </p>

          {/* Primary Recipient Input */}
          <RecipientSearch 
            allRecipients={recipients} 
            onSelectRecipient={onSelectRecipient} 
          />
        </div>

        {/* Minimalist Routing Diagram */}
        <div className="by-send-diagram-col">
          <SendDiagram />
        </div>
      </div>

      {/* Recent Recipients Grid */}
      <RecentRecipients 
        recipients={recipients}
        onSelectRecipient={onSelectRecipient}
        onViewAll={onViewAllRecipients}
      />
    </div>
  );
};
