import { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { StackingSection } from './components/StackingSection';
import { FeaturesGrid } from './components/FeaturesGrid';
import { DeveloperSection } from './components/DeveloperSection';
import { MissionSection } from './components/MissionSection';
import { ExploreFooter } from './components/ExploreFooter';
import { BeyiniApp } from './app/BeyiniApp';
import { StandaloneClaimView } from './app/views/StandaloneClaimView';
import { useBeyiniAuth } from './auth/useBeyiniAuth';
import './styles/global.css';

export function App() {
  const { user, isAuthenticated, login } = useBeyiniAuth();

  const getClaimTokenFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (path.startsWith('/claim/')) {
      const parts = path.split('/claim/');
      if (parts[1]) return parts[1].split('/')[0].split('?')[0];
    }
    const hash = window.location.hash;
    if (hash.startsWith('#claim/')) {
      return hash.replace('#claim/', '').split('?')[0];
    }
    if (hash.startsWith('#claim?')) {
      const params = new URLSearchParams(hash.replace('#claim?', ''));
      return params.get('id') || params.get('token');
    }
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('claim') || searchParams.get('token');
  };

  const [claimToken, setClaimToken] = useState<string | null>(() => getClaimTokenFromUrl());

  const [launchAppOpen, setLaunchAppOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash === '#app' || window.location.search.includes('app=true');
    }
    return false;
  });

  // Check URL routing changes
  useEffect(() => {
    const handleUrlChange = () => {
      const token = getClaimTokenFromUrl();
      setClaimToken(token);
      if (window.location.hash === '#app') {
        setLaunchAppOpen(true);
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Automatically redirect to the Beyini app dashboard when sender authenticates (if not on claim page)
  useEffect(() => {
    if (isAuthenticated && !claimToken) {
      window.location.hash = '#app';
      setLaunchAppOpen(true);
    }
  }, [isAuthenticated, claimToken]);

  // Sync hash with app state
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#app') {
        setLaunchAppOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenApp = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    window.location.hash = '#app';
    setLaunchAppOpen(true);
  };

  const handleExitApp = () => {
    if (window.location.hash === '#app') {
      window.history.pushState(null, '', window.location.pathname);
    }
    setLaunchAppOpen(false);
  };

  const handleLearnMore = (title: string) => {
    alert(`Showing in-depth technical documentation for: ${title}`);
  };

  const handleSelectNews = (headline: string) => {
    alert(`Opening article: "${headline}"`);
  };

  const handleSelectTag = (tag: string) => {
    console.log(`Filtering directory by tag: ${tag}`);
  };

  const handleExitClaim = () => {
    setClaimToken(null);
    window.history.pushState(null, '', '/');
  };

  const handleGoToDashboard = () => {
    setClaimToken(null);
    window.location.hash = '#app';
    setLaunchAppOpen(true);
  };

  // 1. Recipient Standalone Claim Route (Independent from Sender Dashboard)
  if (claimToken) {
    return (
      <StandaloneClaimView 
        token={claimToken}
        onExit={handleExitClaim}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

  // 2. If user entered the app, render the full Beyini Payment Application directly
  if (launchAppOpen) {
    return (
      <BeyiniApp 
        onExitToLanding={handleExitApp}
        onOpenWalletModal={login}
      />
    );
  }

  return (
    <div className="coinfusion-app-root">
      {/* 1. Hero Section with Floating Navbar & Latest Ecosystem News */}
      <Hero 
        onOpenWalletModal={login}
        onOpenLaunchApp={handleOpenApp}
        connectedWallet={user ? user.displayName : null}
        onSelectNewsItem={handleSelectNews}
      />

      {/* 2. Stacking & Network Rewards Bento Section */}
      <StackingSection 
        onOpenWalletModal={handleOpenApp}
      />

      {/* 3. Stacks Unleashed Bitcoin Feature Cards Grid */}
      <FeaturesGrid 
        onLearnMore={handleLearnMore}
      />

      {/* 4. Developer Section with Security Stages & Ecosystem Showcase */}
      <DeveloperSection 
        onStartStacking={handleOpenApp}
      />

      {/* 5. Mission & Decentralization Statement */}
      <MissionSection 
        onLearnMore={() => handleLearnMore('Stacks Mission and Genesis Series')}
      />

      {/* 6. Explore Stacks Directory & Footer Bar */}
      <ExploreFooter 
        onSelectTag={handleSelectTag}
      />
    </div>
  );
}

export default App;
