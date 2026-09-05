import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import {
  PoXExchangeIcon,
  LightningIcon,
  BitcoinSymbolIcon
} from '../assets/icons/Icons';
import '../styles/features.css';

interface FeaturesGridProps {
  onLearnMore?: (featureTitle: string) => void;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onLearnMore }) => {
  const features = [
    {
      id: 'pox',
      title: 'Identify',
      description: 'Enter the person you want to pay. EMAIL, PHONE, OR USERNAME',
      icon: <PoXExchangeIcon size={38} />,
      learnText: 'Learn more about PoX'
    },
    {
      id: 'nfts',
      title: 'Send',
      description: 'Send the payment without asking for wallet address',
      icon: <LightningIcon size={40} />,
      learnText: 'Explore Bitcoin NFTs'
    },
    {
      id: 'receive',
      title: 'Receive',
      description: 'The recipient chooses where the money goes. WALLET, MOBILE NUMBER, OR OTHER RAILS',
      icon: <BitcoinSymbolIcon size={40} />,
      learnText: 'Discover Recipient Choices'
    }
  ];

  return (
    <section className="features-section" id="how-it-works">
      <div className="container">
        <div className="features-header">
          <h2 className="features-title">
            One payment.<br />
            Their choice
          </h2>
        </div>

        <div className="features-grid">
          {features.map((item) => (
            <div key={item.id} className="feature-card">
              <div className="feature-icon-badge">
                {item.icon}
              </div>

              <div className="feature-content">
                <h3 className="feature-heading" style={{ whiteSpace: 'pre-line' }}>
                  {item.title}
                </h3>

                <p className="feature-description">
                  {item.description}
                </p>

                <button
                  className="feature-link"
                  onClick={() => onLearnMore && onLearnMore(item.title.replace('\n', ' '))}
                >
                  <span>Learn more</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="features-footer-action">
          <a
            href="#explore"
            className="see-all-features-link"
            onClick={(e) => {
              e.preventDefault();
              alert('Displaying all 14+ Stacks network features, consensus specifications & developer APIs.');
            }}
          >
            <span>See all features</span>
            <ChevronRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
};
