import React, { useState } from 'react';
import { SecurityStages } from './SecurityStages';
import { ProjectModal } from './ProjectModal';
import { showcaseProjectsData } from '../data/projects';
import type { ProjectShowcase } from '../types/ecosystem';
import {
  StacksLogoIcon,
  AlexDeFiLogo,
  XverseWingLogo,
  MetaWalletLogo
} from '../assets/icons/Icons';
import '../styles/developer.css';

interface DeveloperSectionProps {
  onStartStacking?: () => void;
}

export const DeveloperSection: React.FC<DeveloperSectionProps> = ({ onStartStacking }) => {
  const [selectedProject, setSelectedProject] = useState<ProjectShowcase | null>(null);

  const renderProjectIcon = (type: string) => {
    switch (type) {
      case 'stacks':
        return <StacksLogoIcon size={56} />;
      case 'alex':
        return <AlexDeFiLogo size={56} />;
      case 'xverse':
        return <XverseWingLogo size={56} />;
      case 'meta':
        return <MetaWalletLogo size={56} />;
      default:
        return <StacksLogoIcon size={56} />;
    }
  };

  return (
    <section className="developer-section" id="trust">
      <div className="container">
        {/* Top Trust & Architecture Introduction & Security Diagram */}
        <div className="developer-top-grid">
          <div className="developer-left">
            <span className="developer-tag">Designed for Trust</span>

            <h2 className="developer-title">
              Your money<br />
              doesn't need<br />
              our permission.
            </h2>

            <p className="developer-desc">
              A better way to send and receive money globally. Simple for the sender. Flexible for the recipient.
            </p>

            <div className="developer-actions">
              <button
                className="btn-dev-cta"
                onClick={onStartStacking}
              >
                Explore the Product
              </button>

              <a
                href="https://docs.monad.xyz"
                target="_blank"
                rel="noreferrer"
                className="btn-dev-docs"
              >
                Monad Docs & Specs
              </a>
            </div>
          </div>

          <SecurityStages />
        </div>

        {/* Lower Section: Built on Monad Rails */}
        <div className="built-showcase-container">
          <h2 className="built-showcase-title">
            Built on Monad<br />
            Payment Rails
          </h2>

          <div className="showcase-cards-grid">
            {showcaseProjectsData.map((project) => (
              <div
                key={project.id}
                className="showcase-pill-card"
                onClick={() => setSelectedProject(project)}
              >
                <div className="showcase-card-icon" style={{ color: '#FFFFFF' }}>
                  {renderProjectIcon(project.iconType)}
                </div>
                <h3 className="showcase-card-name" style={{ whiteSpace: 'pre-line' }}>
                  {project.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Project Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
};
