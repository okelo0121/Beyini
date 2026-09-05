import React, { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar } from './Navbar';
import { ecosystemNewsData } from '../data/news';
import {
  PuzzleNodeIcon,
  BlueNetworkIcon,
  WhiteCryptoIcon,
  GoldBtcBadge
} from '../assets/icons/Icons';
import '../styles/hero.css';

interface HeroProps {
  onOpenWalletModal: () => void;
  onOpenLaunchApp?: () => void;
  connectedWallet: string | null;
  onSelectNewsItem?: (headline: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenWalletModal,
  onOpenLaunchApp,
  connectedWallet,
  onSelectNewsItem
}) => {
  const newsScrollRef = useRef<HTMLDivElement>(null);

  const scrollNews = (direction: 'left' | 'right') => {
    if (newsScrollRef.current) {
      const scrollAmount = 436; // Card width + gap
      newsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case 'alex':
        return <PuzzleNodeIcon size={70} />;
      case 'nyc':
        return <BlueNetworkIcon size={58} />;
      case 'crypto':
        return <WhiteCryptoIcon size={64} />;
      case 'bitcoin':
        return <GoldBtcBadge size={72} />;
      default:
        return <PuzzleNodeIcon size={70} />;
    }
  };

  return (
    <section className="hero-section" id="learn">
      <div className="hero-glow-bg" />

      <div className="container">
        {/* Floating Navbar */}
        <Navbar 
          onOpenWalletModal={onOpenWalletModal} 
          onOpenLaunchApp={onOpenLaunchApp}
          connectedWallet={connectedWallet} 
        />

        {/* Hero Main Content */}
        <div className="hero-content">
          <h1 className="hero-title">
            Send to a Person<br />
            <span className="hero-title-accent">They Choose how to receive</span>
          </h1>

          <p className="hero-subtitle">
            Send money using a phone number, email or username. Your RECIPIENT CHOOSES where the money goes.
          </p>

          <a href="#how-it-works" className="hero-cta-btn">
            <span>See How it Works</span>
            <ArrowRight size={22} className="hero-cta-arrow" />
          </a>
        </div>

        {/* Latest Ecosystem News */}
        <div className="ecosystem-news-container">
          <div className="ecosystem-news-header">
            <h2 className="ecosystem-news-title">Monad Metropolis Updates</h2>
            <div className="ecosystem-news-controls">
              <button
                className="news-ctrl-btn"
                onClick={() => scrollNews('left')}
                aria-label="Previous news"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                className="news-ctrl-btn"
                onClick={() => scrollNews('right')}
                aria-label="Next news"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          <div className="news-cards-row" ref={newsScrollRef}>
            {ecosystemNewsData.map((item) => (
              <div
                key={item.id}
                className="news-card-pill"
                onClick={() => onSelectNewsItem && onSelectNewsItem(item.headline)}
              >
                <div className="news-card-icon">
                  {renderBadge(item.badgeType)}
                </div>
                <div className="news-card-text-wrap">
                  <span className="news-card-source">{item.source}</span>
                  <p className="news-card-headline">{item.headline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
