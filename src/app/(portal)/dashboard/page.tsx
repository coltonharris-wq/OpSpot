'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Phone, Users, Star, CreditCard } from 'lucide-react';

interface MetricCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtext: string;
}

interface ActivityItem {
  id: string;
  type: 'call' | 'lead' | 'task';
  text: string;
  time: string;
}

interface LeadItem {
  id: string;
  name: string;
  service: string;
  status: string;
}

const DOT_COLORS: Record<string, string> = {
  call: '#85B7EB',
  lead: '#5DCAA5',
  task: '#F07020',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  hot: { bg: '#FCEBEB', color: '#A32D2D' },
  'follow-up': { bg: '#FAEEDA', color: '#854F0B' },
  new: { bg: '#E1F5EE', color: '#0F6E56' },
};

function getStatusStyle(status: string) {
  const key = status.toLowerCase();
  return STATUS_STYLES[key] || STATUS_STYLES['new'];
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function DashboardPage() {
  const [companyName, setCompanyName] = useState('Your Company');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function loadDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load profile for company name
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name, vertical_config_id')
          .eq('id', user.id)
          .single();

        if (profile?.company_name) {
          setCompanyName(profile.company_name);
        }

        // Load call count
        const { count: callCount } = await supabase
          .from('call_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Load lead count
        const { count: leadCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Load work hours
        const { data: hours } = await supabase
          .from('work_hours')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Load VM status (unused in new design but kept for future)
        const { data: _vm } = await supabase
          .from('vms')
          .select('status')
          .eq('user_id', user.id)
          .single();
        void _vm;

        setMetrics([
          {
            label: 'Calls today',
            value: String(callCount || 0),
            icon: <Phone size={16} style={{ color: '#1D9E75' }} />,
            subtext: 'Handled by King Mouse',
          },
          {
            label: 'New leads',
            value: String(leadCount || 0),
            icon: <Users size={16} style={{ color: '#1D9E75' }} />,
            subtext: 'Captured this week',
          },
          {
            label: 'Reviews',
            value: '4.8',
            icon: <Star size={16} style={{ color: '#1D9E75' }} />,
            subtext: '12 this month',
          },
          {
            label: 'Revenue',
            value: hours ? `$${(hours.total_used * 150).toFixed(0)}` : '$0',
            icon: <CreditCard size={16} style={{ color: '#1D9E75' }} />,
            subtext: 'This month',
          },
        ]);

        // Load recent activity
        const activityItems: ActivityItem[] = [];

        const { data: recentCalls } = await supabase
          .from('call_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (recentCalls) {
          for (const call of recentCalls) {
            activityItems.push({
              id: call.id,
              type: 'call',
              text: `King Mouse answered call from ${call.caller_name || call.caller_phone || 'new lead'}`,
              time: formatRelativeTime(call.created_at),
            });
          }
        }

        const { data: recentLeads } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (recentLeads) {
          for (const lead of recentLeads) {
            activityItems.push({
              id: lead.id,
              type: 'lead',
              text: `King Mouse followed up on estimate for ${lead.name}`,
              time: formatRelativeTime(lead.created_at),
            });
          }
        }

        // Sort by most recent
        activityItems.sort((a, b) => {
          const parseTime = (t: string) => {
            if (t === 'Just now') return 0;
            const num = parseInt(t);
            if (t.includes('m')) return num;
            if (t.includes('h')) return num * 60;
            if (t.includes('d')) return num * 1440;
            return 9999;
          };
          return parseTime(a.time) - parseTime(b.time);
        });
        setActivity(activityItems.slice(0, 6));

        // Load today's leads
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayLeads } = await supabase
          .from('leads')
          .select('id, name, service_needed, status, created_at')
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (todayLeads && todayLeads.length > 0) {
          setLeads(
            todayLeads.map((l) => ({
              id: l.id,
              name: l.name,
              service: l.service_needed || 'General inquiry',
              status: l.status || 'new',
            }))
          );
        } else {
          // If no leads today, show recent leads instead
          if (recentLeads && recentLeads.length > 0) {
            setLeads(
              recentLeads.slice(0, 5).map((l) => ({
                id: l.id,
                name: l.name,
                service: l.service_needed || 'General inquiry',
                status: l.status || 'new',
              }))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f6f6f4',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '15px', color: '#888' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f6f6f4',
        minHeight: '100vh',
      }}
    >
      {/* Welcome card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '0.5px solid #e8e8e4',
          padding: '20px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1a3a4a, #1D9E75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          M
        </div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 500, color: '#1a1a1a' }}>
            Welcome to {companyName}
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
            King Mouse is ready to run your business. Here&apos;s what&apos;s happening today.
          </div>
        </div>
      </div>

      {/* 4 metric cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '10px',
        }}
      >
        {metrics.map((metric, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '0.5px solid #e8e8e4',
              padding: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              {metric.icon}
              <span
                style={{
                  fontSize: '11px',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {metric.label}
              </span>
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 500,
                color: '#1a1a1a',
                marginBottom: '4px',
              }}
            >
              {metric.value}
            </div>
            <div style={{ fontSize: '11px', color: '#1D9E75' }}>{metric.subtext}</div>
          </div>
        ))}
      </div>

      {/* Two-column grid: Activity log + Today's leads */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        {/* Left: Activity log */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '0.5px solid #e8e8e4',
            padding: '20px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#1a1a1a',
              marginBottom: '12px',
            }}
          >
            Recent activity
          </div>
          {activity.length === 0 ? (
            <div
              style={{
                padding: '24px 0',
                textAlign: 'center',
                fontSize: '13px',
                color: '#888',
              }}
            >
              No activity yet. King Mouse will start working soon.
            </div>
          ) : (
            <div>
              {activity.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 0',
                    borderBottom: '0.5px solid #f0f0ec',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: DOT_COLORS[item.type] || '#5DCAA5',
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      color: '#444',
                    }}
                  >
                    {item.text}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#aaa',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Today's leads */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '0.5px solid #e8e8e4',
            padding: '20px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#1a1a1a',
              marginBottom: '12px',
            }}
          >
            Today&apos;s leads
          </div>
          {leads.length === 0 ? (
            <div
              style={{
                padding: '24px 0',
                textAlign: 'center',
                fontSize: '13px',
                color: '#888',
              }}
            >
              No leads yet today. They&apos;ll appear here as King Mouse captures them.
            </div>
          ) : (
            <div>
              {leads.map((lead) => {
                const style = getStatusStyle(lead.status);
                return (
                  <div
                    key={lead.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '0.5px solid #f0f0ec',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#1a1a1a',
                        }}
                      >
                        {lead.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>
                        {lead.service}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        backgroundColor: style.bg,
                        color: style.color,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                        flexShrink: 0,
                      }}
                    >
                      {lead.status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
