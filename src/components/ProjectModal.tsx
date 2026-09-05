import React from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';
import type { ProjectShowcase } from '../types/ecosystem';
import '../styles/modal.css';

interface ProjectModalProps {
  project: ProjectShowcase | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card project-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span 
              className="project-modal-badge"
              style={{ 
                background: project.accentColor ? `${project.accentColor}22` : 'rgba(255, 85, 0, 0.2)',
                color: project.accentColor || '#FF5500'
              }}
            >
              {project.category}
            </span>
            <h3 className="modal-title">{project.name}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <p className="project-modal-desc">
          {project.description}
        </p>

        <div className="project-modal-stats">
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>Ecosystem Traction</span>
            <strong style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>{project.stats || 'Active Protocol'}</strong>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'block' }}>Security Standard</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', marginTop: '2px' }}>
              <ShieldCheck size={18} />
              <strong style={{ fontSize: '1rem' }}>Bitcoin Anchored</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          <button 
            className="btn-primary" 
            style={{ flex: 1, padding: '14px 24px', fontSize: '1.1rem' }}
            onClick={() => alert(`Redirecting to ${project.name} application...`)}
          >
            <span>{project.linkText || 'Open App'}</span>
            <ExternalLink size={18} />
          </button>
          <button 
            className="modal-close-btn" 
            style={{ width: 'auto', padding: '0 24px', borderRadius: '100px', fontSize: '1rem' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
