'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { WorkHours, UsageEvent } from '@/lib/types';

const HOUR_PACKAGES = [
  { hours: 10, price: 49.80, slug: '10hr', popular: false },
  { hours: 25, price: 124.50, slug: '25hr', popular: true },
  { hours: 50, price: 249.00, slug: '50hr', popular: false },
];

export default function BillingPage() {
  const [workHours, setWorkHours] = useState<WorkHours | null>(null);
  const [usage, setUsage] = useState<UsageEvent[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function loadBilling() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: hoursData } = await supabase
          .from('work_hours')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (hoursData) {
          setWorkHours(hoursData as WorkHours);
        }

        const { data: usageData } = await supabase
          .from('usage_events')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (usageData) {
          setUsage(usageData as UsageEvent[]);
        }
      } catch (err) {
        console.error('Failed to load billing:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBilling();
  }, []);

  const remaining = workHours?.remaining ?? 0;
  const totalPurchased = workHours?.total_purchased ?? 0;
  const totalUsed = workHours?.total_used ?? 0;
  const progressPercent = totalPurchased > 0
    ? Math.min(100, (totalUsed / totalPurchased) * 100)
    : 0;

  async function handleBuyHours(slug: string) {
    if (buying) return;
    setBuying(slug);
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to purchase hours.');
        return;
      }

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ topup: slug }),
      });

      const json = await res.json();
      if (json.success && json.data?.checkout_url) {
        window.location.href = json.data.checkout_url;
      } else {
        alert(json.error || 'Failed to start checkout');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setBuying(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ color: '#888', fontSize: 18 }}>Loading billing...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>

      {/* ── Savings banner ── */}
      <div style={{
        backgroundColor: '#1e2a3a',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ color: '#fff' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#F07020' }}>$4.98/hr</span>
          <span style={{ fontSize: 15, marginLeft: 8, color: '#fff' }}>vs $35/hr typical employee</span>
        </div>
        <div style={{
          backgroundColor: '#E1F5EE',
          color: '#0F6E56',
          fontSize: 14,
          fontWeight: 600,
          padding: '6px 16px',
          borderRadius: 20,
        }}>
          Save 86%
        </div>
      </div>

      {/* ── Hours metrics row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {/* Hours balance */}
        <div style={{
          backgroundColor: '#fff',
          border: '0.5px solid #e8e8e4',
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Hours balance</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#1D9E75' }}>{remaining.toFixed(1)}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>hours remaining</div>
        </div>

        {/* Hours used */}
        <div style={{
          backgroundColor: '#fff',
          border: '0.5px solid #e8e8e4',
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Hours used</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#1a1a1a' }}>{totalUsed < 0.1 ? totalUsed.toFixed(3) : totalUsed.toFixed(1)}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>total used</div>
        </div>

        {/* Hours purchased */}
        <div style={{
          backgroundColor: '#fff',
          border: '0.5px solid #e8e8e4',
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>Hours purchased</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#1a1a1a' }}>{totalPurchased.toFixed(1)}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>total purchased</div>
        </div>
      </div>

      {/* ── Usage progress bar ── */}
      <div style={{
        backgroundColor: '#fff',
        border: '0.5px solid #e8e8e4',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
      }}>
        <div style={{
          width: '100%',
          height: 6,
          backgroundColor: '#f0f0ec',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: '#1D9E75',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
        }}>
          <span style={{ fontSize: 12, color: '#888' }}>Used: {totalUsed < 0.1 ? totalUsed.toFixed(3) : totalUsed.toFixed(1)} hrs</span>
          <span style={{ fontSize: 12, color: '#888' }}>Remaining: {remaining.toFixed(1)} hrs</span>
        </div>
      </div>

      {/* ── Buy more hours ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: '#1a1a1a' }}>Purchase more hours</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {HOUR_PACKAGES.map((pkg) => (
            <div
              key={pkg.hours}
              style={{
                backgroundColor: '#fff',
                border: pkg.popular ? '2px solid #F07020' : '0.5px solid #e8e8e4',
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {pkg.popular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#F07020',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 12px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}>
                  Most popular
                </div>
              )}
              <div style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>
                {pkg.hours} hrs
              </div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>
                ${pkg.price.toFixed(2)}
              </div>
              <button
                onClick={() => handleBuyHours(pkg.slug)}
                disabled={buying === pkg.slug}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  backgroundColor: buying === pkg.slug ? '#c0c0c0' : '#F07020',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: buying === pkg.slug ? 'not-allowed' : 'pointer',
                  opacity: buying === pkg.slug ? 0.7 : 1,
                }}
              >
                {buying === pkg.slug ? 'Redirecting...' : 'Buy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Usage history table ── */}
      <div style={{
        backgroundColor: '#fff',
        border: '0.5px solid #e8e8e4',
        borderRadius: 12,
        padding: 20,
      }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: '#1a1a1a' }}>Usage history</div>

        {usage.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 14 }}>
            No usage yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e8e4' }}>
                  <th style={{
                    textAlign: 'left',
                    paddingBottom: 10,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Date</th>
                  <th style={{
                    textAlign: 'left',
                    paddingBottom: 10,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Service</th>
                  <th style={{
                    textAlign: 'left',
                    paddingBottom: 10,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Description</th>
                  <th style={{
                    textAlign: 'right',
                    paddingBottom: 10,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}>Hours</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((event, idx) => (
                  <tr
                    key={event.id}
                    style={{
                      borderBottom: idx < usage.length - 1 ? '1px solid #e8e8e4' : 'none',
                      backgroundColor: idx % 2 === 1 ? '#fafaf8' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 8px 12px 0', fontSize: 13, color: '#1a1a1a' }}>
                      {new Date(event.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 13, color: '#1a1a1a' }}>
                      {event.service}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 13, color: '#888', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.description || '--'}
                    </td>
                    <td style={{ padding: '12px 0 12px 8px', fontSize: 13, color: '#1a1a1a', textAlign: 'right', fontWeight: 500 }}>
                      {event.hours_used < 0.01 ? '< 0.01h' : `${event.hours_used.toFixed(2)}h`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
