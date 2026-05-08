'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import type { Profile } from '@/lib/types';

const PAGE_TITLES: Record<string, string> = {
  'king-mouse': 'King Mouse',
  dashboard: 'Dashboard',
  computer: "King Mouse's Computer",
  receptionist: 'Receptionist',
  tasks: 'Tasks',
  connections: 'Connections',
  billing: 'Billing & Hours',
  settings: 'Settings',
};

function getPageTitle(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean)[0] || '';
  return PAGE_TITLES[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Home';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface TopBarProps {
  profile: Profile;
}

export function TopBar({ profile }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [showMenu, setShowMenu] = useState(false);

  async function handleLogout() {
    const { createBrowserClient } = await import('@/lib/supabase-browser');
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 260,
        right: 0,
        height: 40,
        backgroundColor: '#ffffff',
        borderBottom: '0.5px solid #e8e8e4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 30,
        fontSize: 13,
      }}
    >
      {/* Left: page title */}
      <h1 style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>
        {title}
      </h1>

      {/* Right: stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {/* Stat items separated by borders */}
        <div style={{ padding: '0 16px', borderLeft: '0.5px solid #e8e8e4', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#888', fontSize: 12 }}>Hours remaining:</span>
          <span style={{ color: '#1D9E75', fontSize: 12, fontWeight: 600 }}>2.0</span>
        </div>
        <div style={{ padding: '0 16px', borderLeft: '0.5px solid #e8e8e4', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#1D9E75' }} />
          <span style={{ color: '#888', fontSize: 12 }}>Online</span>
        </div>

        <div style={{ padding: '0 0 0 16px', borderLeft: '0.5px solid #e8e8e4', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              color: '#888888',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Notifications"
          >
            <Bell size={16} strokeWidth={1.8} />
          </button>

          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowMenu((p) => !p)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#1D9E75',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title={profile.full_name || profile.email}
            >
              {getInitials(profile.full_name || profile.email)}
            </div>

            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 36,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #e8e8e4',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  minWidth: 160,
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0ec' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{profile.full_name || profile.email}</div>
                  {profile.company_name && (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{profile.company_name}</div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    color: '#b91c1c',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <LogOut size={14} strokeWidth={2} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
