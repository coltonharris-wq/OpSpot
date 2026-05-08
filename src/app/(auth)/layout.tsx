'use client';

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f6f6f4',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      {/* Mouse logo */}
      <div
        style={{
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#1e2a3a',
            letterSpacing: '-0.5px',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          Mouse
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#F07020',
              marginLeft: 2,
              verticalAlign: 'super',
            }}
          />
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e8e8e4',
          padding: '40px 36px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
