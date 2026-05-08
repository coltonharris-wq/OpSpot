'use client';

import { useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: 'active' | 'inactive' | 'churned';
  joined_at: string;
  commission_earned: number;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'churned';
type SortField = 'name' | 'joined_at' | 'commission_earned';
type SortDir = 'asc' | 'desc';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('joined_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    async function loadCustomers() {
      const supabase = createBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('reseller_customers')
        .select('*')
        .eq('reseller_id', user.id)
        .order('joined_at', { ascending: false });

      setCustomers(data || []);
      setLoading(false);
    }

    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.plan.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'joined_at') {
        cmp =
          new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      } else if (sortField === 'commission_earned') {
        cmp = a.commission_earned - b.commission_earned;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [customers, search, statusFilter, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
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
    const styles: Record<string, { bg: string; color: string }> = {
      active: { bg: '#ecfdf5', color: '#059669' },
      inactive: { bg: '#fef3c7', color: '#d97706' },
      churned: { bg: '#fef2f2', color: '#dc2626' },
    };
    const s = styles[status] || styles.inactive;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          backgroundColor: s.bg,
          color: s.color,
          textTransform: 'capitalize',
        }}
      >
        {status}
      </span>
    );
  }

  const totalCommission = customers.reduce(
    (sum, c) => sum + c.commission_earned,
    0
  );
  const activeCount = customers.filter((c) => c.status === 'active').length;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
        Loading customers...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#111827',
              margin: 0,
            }}
          >
            Customers
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            {activeCount} active of {customers.length} total referred customers
          </p>
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1D9E75',
          }}
        >
          Total earned: {formatCurrency(totalCommission)}
        </div>
      </div>

      {/* Search and filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: 1,
            position: 'relative',
          }}
        >
          <Search
            size={16}
            color="#9ca3af"
            style={{ position: 'absolute', left: 12, top: 11 }}
          />
          <input
            type="text"
            placeholder="Search by name, email, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 36px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 13,
              color: '#374151',
              backgroundColor: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              fontSize: 13,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            <Filter size={14} color="#9ca3af" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: '#374151',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                appearance: 'none',
                paddingRight: 16,
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
            </select>
            <ChevronDown size={14} color="#9ca3af" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
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
                onClick={() => handleSort('name')}
                style={{
                  textAlign: 'left',
                  padding: '12px 20px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Customer
                  <ArrowUpDown size={12} />
                </span>
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 20px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Plan
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 20px',
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
                onClick={() => handleSort('joined_at')}
                style={{
                  textAlign: 'left',
                  padding: '12px 20px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Joined
                  <ArrowUpDown size={12} />
                </span>
              </th>
              <th
                onClick={() => handleSort('commission_earned')}
                style={{
                  textAlign: 'right',
                  padding: '12px 20px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Commission
                  <ArrowUpDown size={12} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: 48,
                    textAlign: 'center',
                    color: '#9ca3af',
                    fontSize: 14,
                  }}
                >
                  <Users
                    size={24}
                    color="#d1d5db"
                    style={{ marginBottom: 8 }}
                  />
                  <div>
                    {customers.length === 0
                      ? 'No customers yet. Share your referral link to get started!'
                      : 'No customers match your search.'}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr
                  key={customer.id}
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
                  <td style={{ padding: '14px 20px' }}>
                    <div
                      style={{
                        fontWeight: 500,
                        color: '#111827',
                      }}
                    >
                      {customer.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        marginTop: 2,
                      }}
                    >
                      {customer.email}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#374151' }}>
                    {customer.plan}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {getStatusBadge(customer.status)}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#6b7280' }}>
                    {formatDate(customer.joined_at)}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: '#1D9E75',
                    }}
                  >
                    {formatCurrency(customer.commission_earned)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
