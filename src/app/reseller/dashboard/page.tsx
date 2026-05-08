'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import {
  DollarSign,
  Users,
  Percent,
  Link2,
  Copy,
  Check,
  Activity,
  TrendingUp,
  UserPlus,
  CreditCard,
} from 'lucide-react';

interface ResellerStats {
  totalEarned: number;
  activeCustomers: number;
  commissionRate: number;
  referralCode: string;
}

interface ActivityItem {
  id: string;
  type: 'signup' | 'commission' | 'payout';
  description: string;
  amount: number | null;
  created_at: string;
}

export default function ResellerDashboardPage() {
  const [stats, setStats] = useState<ResellerStats>({
    totalEarned: 0,
    activeCustomers: 0,
    commissionRate: 40,
    referralCode: '',
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch reseller profile
      const { data: reseller } = await supabase
        .from('resellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch referred customers
      const { data: customers } = await supabase
        .from('reseller_customers')
        .select('*')
        .eq('reseller_id', user.id);

      // Fetch commissions
      const { data: commissions } = await supabase
        .from('reseller_commissions')
        .select('*')
        .eq('reseller_id', user.id);

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('reseller_activity')
        .select('*')
        .eq('reseller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const totalEarned =
        commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      const activeCount =
        customers?.filter((c) => c.status === 'active').length || 0;

      setStats({
        totalEarned,
        activeCustomers: activeCount,
        commissionRate: reseller?.commission_rate || 40,
        referralCode: reseller?.referral_code || user.id.slice(0, 8),
      });

      setActivity(activityData || []);
      setLoading(false);
    }

    loadData();
  }, []);

  const referralLink = `https://mouse.co?ref=${stats.referralCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function getActivityIcon(type: string) {
    switch (type) {
      case 'signup':
        return UserPlus;
      case 'commission':
        return TrendingUp;
      case 'payout':
        return CreditCard;
      default:
        return Activity;
    }
  }

  function getActivityColor(type: string): string {
    switch (type) {
      case 'signup':
        return '#3B82F6';
      case 'commission':
        return '#1D9E75';
      case 'payout':
        return '#F07020';
      default:
        return '#6B7280';
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
        Loading dashboard...
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
          Reseller Dashboard
        </h1>
        <p
          style={{
            fontSize: 14,
            color: '#6b7280',
            marginTop: 4,
          }}
        >
          Track your referrals, commissions, and earnings
        </p>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
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
            {formatCurrency(stats.totalEarned)}
          </div>
          <div style={{ fontSize: 12, color: '#1D9E75', marginTop: 4 }}>
            Lifetime commissions
          </div>
        </div>

        {/* Active Customers */}
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
              Active Customers
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} color="#3B82F6" />
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
            {stats.activeCustomers}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Referred and active
          </div>
        </div>

        {/* Commission Rate */}
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
              Commission Rate
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
              <Percent size={18} color="#F07020" />
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
            {stats.commissionRate}%
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            On every referred customer
          </div>
        </div>
      </div>

      {/* Referral link card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #e5e7eb',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Link2 size={16} color="#1D9E75" />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
            Your Referral Link
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: '#6b7280',
            margin: '0 0 16px 0',
          }}
        >
          Share this link with potential customers. When they sign up, you earn{' '}
          {stats.commissionRate}% commission on their subscription.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '10px 14px',
              backgroundColor: '#f6f6f4',
              borderRadius: 8,
              fontSize: 14,
              color: '#374151',
              fontFamily: 'monospace',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              backgroundColor: copied ? '#1D9E75' : '#1e2a3a',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Recent Activity */}
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
          <Activity size={16} color="#1D9E75" />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
            Recent Activity
          </span>
        </div>

        {activity.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            No activity yet. Share your referral link to start earning!
          </div>
        ) : (
          <div>
            {activity.map((item) => {
              const Icon = getActivityIcon(item.type);
              const iconColor = getActivityColor(item.type);

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 24px',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: `${iconColor}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color={iconColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}
                    >
                      {item.description}
                    </div>
                    <div
                      style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}
                    >
                      {formatDate(item.created_at)}
                    </div>
                  </div>
                  {item.amount !== null && (
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#1D9E75',
                      }}
                    >
                      +{formatCurrency(item.amount)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
