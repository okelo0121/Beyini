import React, { useState } from 'react';
import { exploreDirectoryRow1, exploreDirectoryRow2 } from '../data/tags';
import { BeyiniWordmark } from '../assets/icons/BeyiniLogo';
import '../styles/footer.css';

interface ExploreFooterProps {
  onSelectTag?: (tagLabel: string) => void;
}

export const ExploreFooter: React.FC<ExploreFooterProps> = ({ onSelectTag }) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const handleTagClick = (tagLabel: string) => {
    setSelectedTag(tagLabel === selectedTag ? null : tagLabel);
    if (onSelectTag) onSelectTag(tagLabel);
  };

  return (
    <footer className="explore-footer-section" id="metropolis">
      <div className="container">
        <div className="explore-header">
          <h2 className="explore-title">Explore Beyini</h2>
        </div>

        {/* Directory Tags in 2 Pill Rows */}
        <div className="explore-tag-cloud">
          {/* Row 1 */}
          <div className="tag-row">
            {exploreDirectoryRow1.map((tag) => (
              <button
                key={tag.id}
                className={`directory-pill ${selectedTag === tag.label ? 'active' : ''}`}
                onClick={() => handleTagClick(tag.label)}
              >
                <span>{tag.label}</span>
                {tag.count && <span className="tag-count-badge">{tag.count}</span>}
              </button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="tag-row">
            {exploreDirectoryRow2.map((tag) => (
              <button
                key={tag.id}
                className={`directory-pill ${selectedTag === tag.label ? 'active' : ''}`}
                onClick={() => handleTagClick(tag.label)}
              >
                <span>{tag.label}</span>
                {tag.count && <span className="tag-count-badge">{tag.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <a href="#" className="footer-logo" style={{ textDecoration: 'none' }}>
            <BeyiniWordmark size={44} textColor="var(--color-primary)" variant="orange" />
          </a>

          <div className="footer-legal-links">
            <a 
              href="#terms" 
              className="footer-legal-link"
              onClick={(e) => { e.preventDefault(); alert('Beyini Terms of Service — Monad Metropolis Hackathon project.'); }}
            >
              Terms & conditions
            </a>
            <span className="footer-separator">|</span>
            <a 
              href="#sitemap" 
              className="footer-legal-link"
              onClick={(e) => { e.preventDefault(); alert('Beyini Sitemap — Consumer Products & Payments.'); }}
            >
              Sitemap
            </a>
            <span className="footer-separator">|</span>
            <a 
              href="#privacy" 
              className="footer-legal-link"
              onClick={(e) => { e.preventDefault(); alert('Beyini Privacy Policy — 100% Non-Custodial.'); }}
            >
              Privacy Policy
            </a>
            <span className="footer-separator">|</span>
            <a 
              href="#cookies" 
              className="footer-legal-link"
              onClick={(e) => { e.preventDefault(); alert('Beyini Cookies Policy.'); }}
            >
              Cookies Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
