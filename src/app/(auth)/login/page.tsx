'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
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
        Welcome back
      </h1>
      <p
        style={{
          fontSize: 15,
          color: '#666',
          marginBottom: 32,
          textAlign: 'center',
        }}
      >
        Log in to your Mouse account
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
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: 15,
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: 8,
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: 16,
              borderRadius: 10,
              border: '1px solid #e8e8e4',
              outline: 'none',
              background: '#fafaf8',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label
            htmlFor="password"
            style={{
              display: 'block',
              fontSize: 15,
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: 8,
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: 16,
              borderRadius: 10,
              border: '1px solid #e8e8e4',
              outline: 'none',
              background: '#fafaf8',
              boxSizing: 'border-box',
            }}
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
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p
        style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 15,
          color: '#666',
        }}
      >
        Don&apos;t have an account?{' '}
        <a
          href="/signup"
          style={{
            color: '#F07020',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Sign up
        </a>
      </p>
    </div>
  );
}
