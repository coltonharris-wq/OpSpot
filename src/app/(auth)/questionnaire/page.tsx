'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';

const TOOL_OPTIONS = [
  'QuickBooks',
  'Google Calendar',
  'Gmail',
  'ServiceTitan',
  'Jobber',
  'Housecall Pro',
  'Slack',
  'Other',
];

const TEAM_SIZES = ['Just me', '2-5', '6-10', '10+'];

export default function QuestionnairePage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleTool = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in. Please sign up first.');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          company_name: companyName,
          phone,
          location,
          team_size: teamSize,
          biggest_pain: painPoint,
          business_description: description,
          tools_used: tools,
          website_url: websiteUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      router.push('/provisioning');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    borderRadius: 10,
    border: '1px solid #e8e8e4',
    outline: 'none',
    background: '#fafaf8',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 15,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 8,
  };

  return (
    <div>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: '#1a1a1a',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        Tell us about your business
      </h1>
      <p
        style={{
          fontSize: 15,
          color: '#666',
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        We&apos;ll use this to set up your AI employee
      </p>

      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 14,
              color: '#b91c1c',
            }}
          >
            {error}
          </div>
        )}

        {/* Company name */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="companyName" style={labelStyle}>
            Company name
          </label>
          <input
            id="companyName"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Smith Plumbing LLC"
            style={inputStyle}
          />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="phone" style={labelStyle}>
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="location" style={labelStyle}>
            Location (city, state)
          </label>
          <input
            id="location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Dallas, TX"
            style={inputStyle}
          />
        </div>

        {/* Team size */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="teamSize" style={labelStyle}>
            Team size
          </label>
          <select
            id="teamSize"
            required
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            style={{
              ...inputStyle,
              appearance: 'auto',
              cursor: 'pointer',
            }}
          >
            <option value="" disabled>
              Select team size
            </option>
            {TEAM_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Biggest pain point */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="painPoint" style={labelStyle}>
            Biggest pain point
          </label>
          <input
            id="painPoint"
            type="text"
            required
            value={painPoint}
            onChange={(e) => setPainPoint(e.target.value)}
            placeholder="e.g. Answering calls while on a job"
            style={inputStyle}
          />
        </div>

        {/* Business description */}
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="description" style={labelStyle}>
            Tell us about your business
          </label>
          <textarea
            id="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you do? Who are your customers?"
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
            }}
          />
        </div>

        {/* Website URL */}
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="websiteUrl" style={labelStyle}>
            Your website (optional)
          </label>
          <input
            id="websiteUrl"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourcompany.com"
            style={inputStyle}
          />
        </div>

        {/* Tools */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Tools you already use</label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {TOOL_OPTIONS.map((tool) => {
              const isSelected = tools.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => toggleTool(tool)}
                  style={{
                    padding: '10px 16px',
                    fontSize: 14,
                    fontWeight: 500,
                    borderRadius: 10,
                    border: isSelected
                      ? '2px solid #F07020'
                      : '1px solid #e8e8e4',
                    background: isSelected ? '#FFF3EB' : '#fafaf8',
                    color: isSelected ? '#F07020' : '#444',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {isSelected ? '\u2713 ' : ''}
                  {tool}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '18px 24px',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            background: loading ? '#f5a97a' : '#F07020',
            border: 'none',
            borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Setting things up...' : 'Launch my AI employee'}
        </button>
      </form>
    </div>
  );
}
