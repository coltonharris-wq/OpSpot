'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Crown,
  LayoutDashboard,
  Monitor,
  Phone,
  CheckSquare,
  Plug,
  CreditCard,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { VerticalConfig, Profile } from '@/lib/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Crown, LayoutDashboard, Monitor, Phone, CheckSquare, Plug, CreditCard, Settings,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? CheckSquare;
}

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 20px',
        color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        borderLeft: active ? '3px solid #5DCAA5' : '3px solid transparent',
        backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        transition: 'background-color 0.15s, color 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
        }
      }}
    >
      <Icon size={18} strokeWidth={1.5} />
      <span>{label}</span>
    </Link>
  );
}

function SectionSeparator() {
  return <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '6px 20px' }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '12px 20px 6px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.06em',
        color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

interface SidebarProps {
  config: VerticalConfig | null;
  profile: Profile;
}

export function Sidebar({ config, profile }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (pathname === href) return true;
    if (href !== '/' && pathname.startsWith(href + '/')) return true;
    return false;
  }

  const nicheLabel = config?.sidebar?.nicheLabel || profile.niche || 'Your Business';
  const nicheTabs = config?.sidebar?.tabs || [];
  const companyName = profile.company_name || 'My Business';

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 260,
        backgroundColor: '#1e2a3a',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        zIndex: 40,
      }}
    >
      {/* Brand area */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{companyName}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Powered by Mouse</div>
      </div>

      {/* King Mouse (main nav item) */}
      <NavItem href="/king-mouse" icon={Crown} label="King Mouse" active={isActive('/king-mouse')} />

      <SectionSeparator />

      {/* Operations section */}
      <SectionLabel>Operations</SectionLabel>
      <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive('/dashboard')} />
      <NavItem href="/computer" icon={Monitor} label={"King Mouse\u2019s computer"} active={isActive('/computer')} />
      <NavItem href="/receptionist" icon={Phone} label="Receptionist" active={isActive('/receptionist')} />
      <NavItem href="/tasks" icon={CheckSquare} label="Tasks" active={isActive('/tasks')} />

      {/* Dynamic niche section */}
      {nicheTabs.length > 0 && (
        <>
          <SectionSeparator />
          <SectionLabel>{nicheLabel}</SectionLabel>
          {nicheTabs.map((tab) => {
            const TabIcon = getIcon(tab.icon);
            return (
              <NavItem
                key={tab.id}
                href={`/${tab.id}`}
                icon={TabIcon}
                label={tab.label}
                active={isActive(`/${tab.id}`)}
              />
            );
          })}
        </>
      )}

      <SectionSeparator />

      {/* System section */}
      <NavItem href="/connections" icon={Plug} label="Connections" active={isActive('/connections')} />
      <NavItem href="/billing" icon={CreditCard} label="Billing & hours" active={isActive('/billing')} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Settings at bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <NavItem href="/settings" icon={Settings} label="Settings" active={isActive('/settings')} />
      </div>

      {/* User info */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#1D9E75',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {getInitials(profile.full_name || profile.email)}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile.full_name || profile.email}
          </div>
          {profile.company_name && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.company_name}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
