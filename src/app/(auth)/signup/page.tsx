'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';

const INDUSTRIES = [
  { name: 'Construction', niches: ['Roofing','General contractor','Electrical','Plumbing','HVAC','Concrete','Painting','Framing','Landscaping','Fencing','Drywall','Flooring','Solar installation'] },
  { name: 'Healthcare', niches: ['Dental','Chiropractic','Med spa','Veterinary','Optometry','Physical therapy','Mental health','Primary care','Dermatology','Orthodontics','Podiatry','Urgent care','Cosmetic surgery'] },
  { name: 'Home services', niches: ['Cleaning','Pest control','Lawn care','Pool service','Handyman','Locksmith','Moving','Junk removal','Pressure washing','Window cleaning','Carpet cleaning','Appliance repair','Tree service'] },
  { name: 'Food & Drink', niches: ['Restaurant','Catering','Food truck','Bakery','Bar/lounge','Coffee shop','Meal prep','Ghost kitchen','Brewery','Juice bar','Pizzeria','BBQ','Fine dining'] },
  { name: 'Legal', niches: ['Personal injury','Family law','Criminal defense','Estate planning','Immigration','Business law','Real estate law','Bankruptcy','Tax law','DUI defense','Employment law','Civil litigation'] },
  { name: 'Automotive', niches: ['Auto repair','Body shop','Detailing','Tire shop','Dealership','Towing','Oil change','Transmission','Auto glass','Diesel repair','Fleet maintenance','EV service'] },
  { name: 'Real estate', niches: ['Residential agent','Commercial agent','Property management','Mortgage broker','Home staging','Appraisal','Title company','Inspector','Vacation rental','HOA management'] },
  { name: 'Retail', niches: ['Clothing','Electronics','Jewelry','Pet store','Sporting goods','Furniture','Gift shop','Hardware','Florist','Bookstore','Toy store','Thrift/consignment'] },
];

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramIndustry = searchParams.get('industry') || '';
  const paramNiche = searchParams.get('niche') || '';

  // If both industry and niche came via URL params, skip to credentials
  const hasPreselected = Boolean(paramIndustry && paramNiche);

  const [step, setStep] = useState<0 | 1 | 2>(hasPreselected ? 2 : 0);
  const [selectedIndustry, setSelectedIndustry] = useState(paramIndustry);
  const [selectedNiche, setSelectedNiche] = useState(paramNiche);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function selectIndustry(name: string) {
    setSelectedIndustry(name);
    setSelectedNiche('');
    setStep(1);
  }

  function selectNiche(niche: string) {
    setSelectedNiche(niche);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            industry: selectedIndustry,
            niche: selectedNiche,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push('/questionnaire');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

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

  // ─── Step 0: Select Industry ───
  if (step === 0) {
    return (
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textAlign: 'center' }}>
          What industry are you in?
        </h1>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 28, textAlign: 'center' }}>
          We will customize your AI employee for your business
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.name}
              onClick={() => selectIndustry(ind.name)}
              style={{
                padding: '16px 14px',
                fontSize: 15,
                fontWeight: 500,
                color: '#1a1a1a',
                background: '#fafaf8',
                border: '1px solid #e8e8e4',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#F07020';
                e.currentTarget.style.background = 'rgba(240,112,32,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e8e8e4';
                e.currentTarget.style.background = '#fafaf8';
              }}
            >
              {ind.name}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 15, color: '#666' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#F07020', fontWeight: 600, textDecoration: 'none' }}>Log in</a>
        </p>
      </div>
    );
  }

  // ─── Step 1: Select Niche ───
  if (step === 1) {
    const industry = INDUSTRIES.find((i) => i.name === selectedIndustry);

    return (
      <div>
        <button
          onClick={() => setStep(0)}
          style={{
            background: 'none',
            border: 'none',
            color: '#F07020',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 16,
          }}
        >
          &larr; Back
        </button>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textAlign: 'center' }}>
          What type of {selectedIndustry.toLowerCase()}?
        </h1>
        <p style={{ fontSize: 15, color: '#666', marginBottom: 28, textAlign: 'center' }}>
          Pick the closest match to your business
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {industry?.niches.map((niche) => (
            <button
              key={niche}
              onClick={() => selectNiche(niche)}
              style={{
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 500,
                color: '#1a1a1a',
                background: '#fafaf8',
                border: '1px solid #e8e8e4',
                borderRadius: 999,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#F07020';
                e.currentTarget.style.background = '#F07020';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e8e8e4';
                e.currentTarget.style.background = '#fafaf8';
                e.currentTarget.style.color = '#1a1a1a';
              }}
            >
              {niche}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Step 2: Credentials ───
  return (
    <div>
      {!hasPreselected && (
        <button
          onClick={() => setStep(1)}
          style={{
            background: 'none',
            border: 'none',
            color: '#F07020',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 16,
          }}
        >
          &larr; Back
        </button>
      )}

      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 8, textAlign: 'center' }}>
        Start your free trial
      </h1>
      <p style={{ fontSize: 15, color: '#666', marginBottom: 32, textAlign: 'center' }}>
        Get your AI employee for {selectedNiche}
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

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="fullName" style={labelStyle}>Full name</label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Smith"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px 24px',
            fontSize: 17,
            fontWeight: 700,
            color: '#fff',
            background: loading ? '#f5a97a' : '#F07020',
            border: 'none',
            borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Creating account...' : 'Start free trial'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 15, color: '#666' }}>
        Already have an account?{' '}
        <a href="/login" style={{ color: '#F07020', fontWeight: 600, textDecoration: 'none' }}>Log in</a>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          Loading...
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
