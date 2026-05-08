'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard } from 'lucide-react';

const RESELLER_NAV = [
  { href: '/reseller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reseller/customers', label: 'Customers', icon: Users },
  { href: '/reseller/commissions', label: 'Commissions', icon: CreditCard },
];

export default function ResellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 260,
          backgroundColor: '#1e2a3a',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 20px', marginBottom: 32 }}>
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
            Mouse <span style={{ color: '#1D9E75' }}>Reseller</span>
          </span>
        </div>

        <nav style={{ flex: 1 }}>
          {RESELLER_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  fontSize: 15,
                  borderLeft: active ? '3px solid #1D9E75' : '3px solid transparent',
                  backgroundColor: active ? 'rgba(29,158,117,0.1)' : 'transparent',
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '0 20px' }}>
          <Link href="/king-mouse" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>
            Back to dashboard
          </Link>
        </div>
      </aside>

      <div style={{ marginLeft: 260, flex: 1, backgroundColor: '#f6f6f4', minHeight: '100vh' }}>
        <main style={{ padding: 32 }}>{children}</main>
      </div>
    </div>
  );
}
