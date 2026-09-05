import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from './privyConfig';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!privyAppId) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0c',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          background: '#141416',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            Privy Integration Required
          </div>
          
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Connect Your Privy App ID
          </h2>
          
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
            Beyini strictly uses <strong>real, production Privy embedded wallets</strong> on Monad Testnet with zero simulated mocks.
          </p>

          <div style={{
            background: '#1c1c20',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px', fontWeight: 600 }}>
              Add this to your <code>.env.local</code> file in the project root:
            </p>
            <pre style={{
              background: '#0d0d10',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#10B981',
              fontFamily: 'monospace',
              margin: 0,
              overflowX: 'auto'
            }}>
              VITE_PRIVY_APP_ID=your_privy_app_id_here
            </pre>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            You can find your App ID in the <a href="https://dashboard.privy.io/" target="_blank" rel="noreferrer" style={{ color: '#10B981' }}>Privy Developer Dashboard</a> under <strong>Settings → Basics → App ID</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider appId={privyAppId} config={privyConfig}>
      {children}
    </PrivyProvider>
  );
};
