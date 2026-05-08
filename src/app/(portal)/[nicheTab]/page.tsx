'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { VerticalConfig } from '@/lib/types';
import {
  Star, Megaphone, Globe,
  Package, Building2,
  Clock, Plus
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Niche tab placeholder components
// ---------------------------------------------------------------------------

function LeadFunnel() {
  const columns = ['New', 'Contacted', 'Quoted', 'Won', 'Lost'];
  const columnColors = ['bg-blue-50', 'bg-yellow-50', 'bg-purple-50', 'bg-green-50', 'bg-red-50'];
  const dotColors = ['bg-blue-400', 'bg-yellow-400', 'bg-purple-400', 'bg-green-400', 'bg-red-400'];

  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Lead Funnel</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col, i) => (
          <div key={col} className={`min-w-[220px] rounded-xl ${columnColors[i]} p-4 flex-shrink-0`}>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColors[i]}`} />
              <span className="font-medium text-mouse-text text-sm">{col}</span>
              <span className="text-xs text-mouse-text-secondary ml-auto">0</span>
            </div>
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3 border border-mouse-border">
                <div className="text-sm text-mouse-text-secondary">No leads yet</div>
              </div>
            </div>
            <button className="mt-3 flex items-center gap-1 text-sm text-mouse-text-secondary hover:text-mouse-text">
              <Plus size={14} /> Add lead
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EstimatesInvoices() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Estimates & Invoices</h2>
      <div className="bg-mouse-card rounded-xl border border-mouse-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-mouse-border bg-gray-50">
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Number</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Client</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Amount</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Status</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-mouse-text-secondary">
                No estimates or invoices yet. King Mouse will create them here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewsReputation() {
  const placeholderReviews = [
    { id: '1', name: 'No reviews yet', stars: 0, text: 'Reviews from Google, Yelp, and Facebook will appear here.', date: '' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-mouse-text">Reviews & Reputation</h2>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={18} className="text-gray-200" />
          ))}
          <span className="text-sm text-mouse-text-secondary ml-2">0 reviews</span>
        </div>
      </div>
      <div className="space-y-3">
        {placeholderReviews.map((review) => (
          <div key={review.id} className="bg-mouse-card rounded-xl border border-mouse-border p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-mouse-text">{review.name}</span>
              {review.date && (
                <span className="text-xs text-mouse-text-secondary">{review.date}</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={s <= review.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                />
              ))}
            </div>
            <p className="text-sm text-mouse-text-secondary">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdsManager() {
  const metrics = [
    { label: 'Ad spend', value: '$0.00', subtitle: 'This month' },
    { label: 'Impressions', value: '0', subtitle: 'Total' },
    { label: 'Clicks', value: '0', subtitle: 'Total' },
    { label: 'Conversions', value: '0', subtitle: 'Total' },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Ads Manager</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="bg-mouse-card rounded-xl border border-mouse-border p-5">
            <div className="text-sm text-mouse-text-secondary mb-1">{m.label}</div>
            <div className="text-2xl font-bold text-mouse-text">{m.value}</div>
            <div className="text-xs text-mouse-text-secondary">{m.subtitle}</div>
          </div>
        ))}
      </div>
      <div className="bg-mouse-card rounded-xl border border-mouse-border p-8 text-center">
        <Megaphone size={32} className="text-mouse-text-secondary mx-auto mb-3" />
        <p className="text-mouse-text-secondary">
          Connect Google Ads or Facebook Ads to see your ad performance here.
        </p>
      </div>
    </div>
  );
}

function WebsiteBuilder() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Website Builder</h2>
      <div className="bg-mouse-card rounded-xl border border-mouse-border p-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium mb-4">
          <Clock size={14} />
          Coming soon
        </div>
        <div className="max-w-md mx-auto">
          <Globe size={48} className="text-mouse-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-mouse-text mb-2">
            Your website, built by AI
          </h3>
          <p className="text-mouse-text-secondary">
            King Mouse will build and maintain a professional website for your business.
            This feature is coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}

function PatientScheduling() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];

  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Patient Scheduling</h2>
      <div className="bg-mouse-card rounded-xl border border-mouse-border overflow-hidden">
        <div className="grid grid-cols-6 border-b border-mouse-border">
          <div className="p-3 text-sm font-medium text-mouse-text-secondary" />
          {days.map((day) => (
            <div key={day} className="p-3 text-sm font-medium text-mouse-text text-center border-l border-mouse-border">
              {day}
            </div>
          ))}
        </div>
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-6 border-b border-mouse-border last:border-0">
            <div className="p-3 text-xs text-mouse-text-secondary">{hour}</div>
            {days.map((day) => (
              <div key={day} className="p-3 border-l border-mouse-border min-h-[48px] hover:bg-gray-50 cursor-pointer" />
            ))}
          </div>
        ))}
      </div>
      <p className="text-sm text-mouse-text-secondary mt-3 text-center">
        Patient appointments will appear here once scheduling is connected.
      </p>
    </div>
  );
}

function InsuranceBilling() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Insurance Billing</h2>
      <div className="bg-mouse-card rounded-xl border border-mouse-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-mouse-border bg-gray-50">
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Claim ID</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Patient</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Provider</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Amount</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-mouse-text-secondary">
                No insurance claims yet. They will show up here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderManagement() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Order Management</h2>
      <div className="bg-mouse-card rounded-xl border border-mouse-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-mouse-border bg-gray-50">
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Order #</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Customer</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Items</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Total</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-mouse-text-secondary">
                No orders yet. Orders will appear here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServiceTickets() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Service Tickets</h2>
      <div className="bg-mouse-card rounded-xl border border-mouse-border overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-mouse-border bg-gray-50">
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Ticket #</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Customer</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Issue</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Priority</th>
              <th className="px-5 py-3 text-sm font-medium text-mouse-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-mouse-text-secondary">
                No service tickets yet. They will appear here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListingManager() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Listing Manager</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-mouse-card rounded-xl border border-dashed border-mouse-border p-8 flex flex-col items-center justify-center text-center">
          <Building2 size={32} className="text-mouse-text-secondary mb-3" />
          <p className="text-sm text-mouse-text-secondary mb-3">No listings yet</p>
          <button className="text-sm font-medium text-mouse-primary hover:underline flex items-center gap-1">
            <Plus size={14} /> Add listing
          </button>
        </div>
      </div>
    </div>
  );
}

function InventoryManager() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-mouse-text mb-5">Inventory Manager</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-mouse-card rounded-xl border border-dashed border-mouse-border p-6 flex flex-col items-center justify-center text-center">
          <Package size={28} className="text-mouse-text-secondary mb-2" />
          <p className="text-sm text-mouse-text-secondary mb-2">No products yet</p>
          <button className="text-sm font-medium text-mouse-primary hover:underline flex items-center gap-1">
            <Plus size={14} /> Add product
          </button>
        </div>
      </div>
    </div>
  );
}

// Component registry
const COMPONENTS: Record<string, React.ComponentType> = {
  LeadFunnel,
  EstimatesInvoices,
  ReviewsReputation,
  AdsManager,
  WebsiteBuilder,
  PatientScheduling,
  InsuranceBilling,
  OrderManagement,
  ServiceTickets,
  ListingManager,
  InventoryManager,
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NicheTabPage() {
  const params = useParams();
  const nicheTab = params.nicheTab as string;

  const [tabConfig, setTabConfig] = useState<{ label: string; component: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function loadConfig() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile to find vertical config ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('vertical_config_id, niche')
          .eq('id', user.id)
          .single();

        if (!profile?.vertical_config_id) {
          setNotFound(true);
          return;
        }

        // Fetch vertical config from the API or database
        const { data: configData } = await supabase
          .from('vertical_configs')
          .select('config_json')
          .eq('id', profile.vertical_config_id)
          .single();

        if (configData?.config_json) {
          const config = configData.config_json as VerticalConfig;
          const matchedTab = config.sidebar?.tabs?.find((t) => t.id === nicheTab);

          if (matchedTab) {
            setTabConfig({ label: matchedTab.label, component: matchedTab.component });
          } else {
            setNotFound(true);
          }
        } else {
          // Fallback: try fetching from API endpoint
          try {
            const res = await fetch(`/api/vertical-config?niche=${profile.niche || profile.vertical_config_id}`);
            if (res.ok) {
              const config: VerticalConfig = await res.json();
              const matchedTab = config.sidebar?.tabs?.find((t) => t.id === nicheTab);

              if (matchedTab) {
                setTabConfig({ label: matchedTab.label, component: matchedTab.component });
              } else {
                setNotFound(true);
              }
            } else {
              setNotFound(true);
            }
          } catch {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.error('Failed to load niche tab:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [nicheTab]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-mouse-text-secondary text-lg">Loading...</div>
      </div>
    );
  }

  if (notFound || !tabConfig) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-24">
        <div className="text-5xl mb-4 text-mouse-text-secondary">?</div>
        <h1 className="text-2xl font-bold text-mouse-text mb-2">Tab not found</h1>
        <p className="text-mouse-text-secondary">
          The tab &quot;{nicheTab}&quot; does not match any configured niche tab for your account.
        </p>
      </div>
    );
  }

  const Component = COMPONENTS[tabConfig.component];

  if (!Component) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-24">
        <h1 className="text-2xl font-bold text-mouse-text mb-2">{tabConfig.label}</h1>
        <p className="text-mouse-text-secondary">
          Component &quot;{tabConfig.component}&quot; is not yet available. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Component />
    </div>
  );
}
