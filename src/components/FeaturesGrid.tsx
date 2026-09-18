import { ArrowRight, ChevronRight, Fingerprint, Zap, Wallet } from 'lucide-react';
import '../styles/features.css';

interface FeaturesGridProps {
  onLearnMore?: (featureTitle: string) => void;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ onLearnMore }) => {
  const features = [
    {
      id: 'identify',
      title: 'Identify',
      description: 'Enter the person you want to pay: Email, Phone, X handle, or Discord.',
      icon: <Fingerprint size={38} color="#FF6B35" />,
      learnText: 'Learn about Zero-Address Routing'
    },
    {
      id: 'send',
      title: 'Send',
      description: 'Funds are secured in a non-custodial smart escrow with 1s Monad finality.',
      icon: <Zap size={38} color="#10B981" />,
      learnText: 'Explore Monad Parallel Escrow'
    },
    {
      id: 'receive',
      title: 'Receive',
      description: 'Recipient verifies their identity and chooses how to receive: EVM Wallet, Bank, or Mobile Money.',
      icon: <Wallet size={38} color="#3B82F6" />,
      learnText: 'Discover Recipient Settlement Choices'
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
            href="#features"
            className="see-all-features-link"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('features');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span>Explore Monad Features</span>
            <ChevronRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
};
