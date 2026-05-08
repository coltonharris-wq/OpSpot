'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Phone, Mail } from 'lucide-react';
import type { Profile } from '@/lib/types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Toggle states (visual only for now)
  const [toggles, setToggles] = useState({
    autoRespondEmails: true,
    autoFollowUpEstimates: true,
    autoRespondReviews: true,
    dailyBriefing: true,
    requireApproval: false,
    emailNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    const supabase = createBrowserClient();

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data as Profile);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          email: profile.email,
          company_name: profile.company_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleToggle(key: keyof typeof toggles) {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div style={{ padding: 20, maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <span style={{ fontSize: 14, color: '#888' }}>Loading settings...</span>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    border: '0.5px solid #e8e8e4',
    padding: 24,
    marginBottom: 20,
  };

  const headerStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 500,
    color: '#1a1a1a',
    marginBottom: 20,
    marginTop: 0,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#888',
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: 14,
    padding: 12,
    background: '#f6f6f4',
    border: '0.5px solid #e8e8e4',
    borderRadius: 10,
    outline: 'none',
    color: '#1a1a1a',
    boxSizing: 'border-box',
  };

  const readOnlyInputStyle: React.CSSProperties = {
    ...inputStyle,
    color: '#888',
    cursor: 'default',
  };

  const fieldGap = 16;

  function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          background: on ? '#1D9E75' : '#e8e8e4',
          position: 'relative',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            display: 'block',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: on ? 22 : 2,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </button>
    );
  }

  function ToggleRow({ label, description, on, onToggle }: { label: string; description: string; on: boolean; onToggle: () => void }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '0.5px solid #f0f0ec' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>{description}</div>
        </div>
        <ToggleSwitch on={on} onToggle={onToggle} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 20 }}>
      {/* Card 1 - Business profile form */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>Business profile</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: fieldGap }}>
          <div>
            <label style={labelStyle}>Business name</label>
            <input
              type="text"
              value={profile.company_name || ''}
              onChange={(e) => updateField('company_name', e.target.value)}
              style={inputStyle}
              placeholder="Your business name"
            />
          </div>

          <div>
            <label style={labelStyle}>Your name</label>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={(e) => updateField('full_name', e.target.value)}
              style={inputStyle}
              placeholder="Your name"
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={profile.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={labelStyle}>Phone number</label>
            <input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              style={inputStyle}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label style={labelStyle}>Industry</label>
            <input
              type="text"
              value={profile.industry || ''}
              readOnly
              style={readOnlyInputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Niche</label>
            <input
              type="text"
              value={profile.niche || ''}
              readOnly
              style={readOnlyInputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: '#F07020',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 500 }}>Saved!</span>
          )}
        </div>
      </div>

      {/* Card 2 - King Mouse behavior toggles */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>King Mouse behavior</h2>

        <div>
          <ToggleRow
            label="Auto-respond to emails"
            description="King Mouse replies to business emails automatically"
            on={toggles.autoRespondEmails}
            onToggle={() => handleToggle('autoRespondEmails')}
          />
          <ToggleRow
            label="Auto-follow-up on estimates"
            description="Automatically follow up on unsent estimates after 48 hours"
            on={toggles.autoFollowUpEstimates}
            onToggle={() => handleToggle('autoFollowUpEstimates')}
          />
          <ToggleRow
            label="Auto-respond to reviews"
            description="Thank customers for positive reviews, address negative ones"
            on={toggles.autoRespondReviews}
            onToggle={() => handleToggle('autoRespondReviews')}
          />
          <ToggleRow
            label="Daily briefing"
            description="Get a morning summary of yesterday's activity"
            on={toggles.dailyBriefing}
            onToggle={() => handleToggle('dailyBriefing')}
          />
          <ToggleRow
            label="Require approval before acting"
            description="King Mouse asks before taking major actions"
            on={toggles.requireApproval}
            onToggle={() => handleToggle('requireApproval')}
          />
        </div>
      </div>

      {/* Card 3 - Notifications */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>Notifications</h2>

        <div>
          <ToggleRow
            label="Email notifications"
            description="Get notified about calls, leads, and tasks"
            on={toggles.emailNotifications}
            onToggle={() => handleToggle('emailNotifications')}
          />
          <ToggleRow
            label="SMS notifications"
            description="Text alerts for urgent items"
            on={toggles.smsNotifications}
            onToggle={() => handleToggle('smsNotifications')}
          />
        </div>
      </div>

      {/* Card 4 - Talk to a human */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>Talk to a human</h2>
        <p style={{ fontSize: 13, color: '#888', marginTop: 0, marginBottom: 16, lineHeight: 1.4 }}>
          Having trouble? Reach out and we&apos;ll help personally.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Phone size={16} color="#888" />
            <span style={{ fontSize: 14, color: '#1a1a1a' }}>(910) 515-8927</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={16} color="#888" />
            <span style={{ fontSize: 14, color: '#1a1a1a' }}>colton.harris@automioapp.com</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="tel:9105158927"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#F07020',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <Phone size={15} />
            Call now
          </a>
          <a
            href="mailto:colton.harris@automioapp.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              color: '#1a1a1a',
              border: '1px solid #e8e8e4',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <Mail size={15} />
            Send email
          </a>
        </div>
      </div>
    </div>
  );
}
