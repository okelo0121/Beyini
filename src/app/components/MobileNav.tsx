import React from 'react';
import { Send, Activity, Users, User } from 'lucide-react';
import type { AppTab } from './Sidebar';

interface MobileNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab }) => {
  const items: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'send', label: 'Send', icon: <Send size={18} /> },
    { id: 'activity', label: 'Activity', icon: <Activity size={18} /> },
    { id: 'recipients', label: 'Recipients', icon: <Users size={18} /> },
    { id: 'profile', label: 'Profile', icon: <User size={18} /> }
  ];

  return (
    <nav className="by-mobile-bottom-nav">
      {items.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            className={`by-mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
