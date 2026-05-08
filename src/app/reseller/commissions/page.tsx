'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import {
  DollarSign,
  Clock,
  CreditCard,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface PayoutEntry {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'processing' | 'failed';
  payout_date: string;
  stripe_transfer_id: string | null;
}

interface CommissionSummary {
  totalEarned: number;
  pendingPayout: number;
  stripeConnected: boolean;
}

export default function CommissionsPage() {
  const [summary, setSummary] = useState<CommissionSummary>({
    totalEarned: 0,
    pendingPayout: 0,
    stripeConnected: false,
  });
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    async function loadCommissions() {
      const supabase = createBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch reseller profile for Stripe status
      const { data: reseller } = await supabase
        .from('resellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch all commissions for total
      const { data: commissions } = await supabase
        .from('reseller_commissions')
        .select('*')
        .eq('reseller_id', user.id);

      // Fetch payout history
      const { data: payoutData } = await supabase
        .from('reseller_payouts')
        .select('*')
        .eq('reseller_id', user.id)
        .order('payout_date', { ascending: false });

      const totalEarned =
        commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const paidOut =
        payoutData
          ?.filter((p) => p.status === 'paid')
          .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setSummary({
        totalEarned,
        pendingPayout: totalEarned - paidOut,
        stripeConnected: reseller?.stripe_connect_id ? true : false,
      });

      setPayouts(payoutData || []);
      setLoading(false);
    }

    loadCommissions();
  }, []);

  async function handleConnectStripe() {
    setConnectingStripe(true);

    try {
      const supabase = createBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Call the Stripe Connect onboarding endpoint
      const response = await fetch('/api/reseller/stripe-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reseller_id: user.id }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setConnectingStripe(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getStatusBadge(status: string) {
    const config: Record<
      string,
      { bg: string; color: string; icon: typeof CheckCircle }
    > = {
      paid: { bg: '#ecfdf5', color: '#059669', icon: CheckCircle },
      pending: { bg: '#fef3c7', color: '#d97706', icon: Clock },
      processing: { bg: '#eff6ff', color: '#3b82f6', icon: Loader2 },
      failed: { bg: '#fef2f2', color: '#dc2626', icon: AlertCircle },
    };
    const s = config[status] || config.pending;
    const Icon = s.icon;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          backgroundColor: s.bg,
          color: s.color,
          textTransform: 'capitalize',
        }}
      >
        <Icon size={12} />
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
        Loading commissions...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#111827',
            margin: 0,
          }}
        >
          Commissions
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Track your earnings and manage payouts
        </p>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Total Earned */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
              Total Earned
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={18} color="#1D9E75" />
            </div>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.02em',
            }}
          >
            {formatCurrency(summary.totalEarned)}
          </div>
          <div style={{ fontSize: 12, color: '#1D9E75', marginTop: 4 }}>
            Lifetime commissions
          </div>
        </div>

        {/* Pending Payout */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
              Pending Payout
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#fff7ed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} color="#F07020" />
            </div>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.02em',
            }}
          >
            {formatCurrency(summary.pendingPayout)}
          </div>
          <div style={{ fontSize: 12, color: '#F07020', marginTop: 4 }}>
            Available for withdrawal
          </div>
        </div>
      </div>

      {/* Stripe Connect card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 24,
          border: summary.stripeConnected
            ? '1px solid #e5e7eb'
            : '2px solid #F07020',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <CreditCard
                size={16}
                color={summary.stripeConnected ? '#1D9E75' : '#F07020'}
              />
              <span
                style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}
              >
                {summary.stripeConnected
                  ? 'Stripe Connected'
                  : 'Connect Stripe to Get Paid'}
              </span>
              {summary.stripeConnected && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                  }}
                >
                  <CheckCircle size={10} />
                  Connected
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: 13,
                color: '#6b7280',
                margin: 0,
                maxWidth: 480,
              }}
            >
              {summary.stripeConnected
                ? 'Your payouts will be sent directly to your connected Stripe account.'
                : 'Connect your Stripe account to receive commission payouts directly to your bank.'}
            </p>
          </div>
          <button
            onClick={handleConnectStripe}
            disabled={connectingStripe}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              backgroundColor: summary.stripeConnected ? '#f6f6f4' : '#F07020',
              color: summary.stripeConnected ? '#374151' : '#ffffff',
              border: summary.stripeConnected
                ? '1px solid #e5e7eb'
                : 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: connectingStripe ? 'not-allowed' : 'pointer',
              opacity: connectingStripe ? 0.6 : 1,
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {connectingStripe ? (
              <>
                <Loader2
                  size={14}
                  style={{
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink size={14} />
                {summary.stripeConnected
                  ? 'Manage Stripe'
                  : 'Connect Stripe'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payout History Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <DollarSign size={16} color="#1D9E75" />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
            Payout History
          </span>
        </div>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 24px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Date
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 24px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Amount
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 24px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Status
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '12px 24px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Reference
              </th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: 48,
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: 14,
                  }}
                >
                  <DollarSign
                    size={24}
                    color="#d1d5db"
                    style={{ marginBottom: 8 }}
                  />
                  <div>No payouts yet. Commissions will appear here once processed.</div>
                </td>
              </tr>
            ) : (
              payouts.map((payout) => (
                <tr
                  key={payout.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#fafafa')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  <td style={{ padding: '14px 24px', color: '#374151' }}>
                    {formatDate(payout.payout_date)}
                  </td>
                  <td
                    style={{
                      padding: '14px 24px',
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    {formatCurrency(payout.amount)}
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    {getStatusBadge(payout.status)}
                  </td>
                  <td
                    style={{
                      padding: '14px 24px',
                      textAlign: 'right',
                      color: '#9ca3af',
                      fontSize: 12,
                      fontFamily: 'monospace',
                    }}
                  >
                    {payout.stripe_transfer_id
                      ? payout.stripe_transfer_id.slice(0, 20) + '...'
                      : '--'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
