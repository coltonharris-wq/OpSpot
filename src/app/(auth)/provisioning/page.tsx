'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Step definitions — driven by backend VM status                     */
/* ------------------------------------------------------------------ */
const STEPS = [
  { key: 'account',    label: 'Creating your account...',                    matchStatus: null },
  { key: 'provision',  label: 'Setting up your AI employee...',              matchStatus: 'provisioning' },
  { key: 'install',    label: 'Installing King Mouse...',                    matchStatus: 'installing' },
  { key: 'training',   label: 'Teaching King Mouse about your business...',  matchStatus: 'installing' },
  { key: 'health',     label: 'Running final checks...',                     matchStatus: 'installing' },
  { key: 'ready',      label: 'Ready! Redirecting to your dashboard...',     matchStatus: 'ready' },
];

function getStepIndex(vmStatus: string | null, elapsed: number): number {
  if (!vmStatus) return 0;
  if (vmStatus === 'ready') return 5;
  if (vmStatus === 'installing') {
    // Simulate sub-steps within installing based on elapsed time
    if (elapsed > 45) return 4; // final checks
    if (elapsed > 25) return 3; // teaching about business
    return 2; // installing
  }
  if (vmStatus === 'provisioning') return 1;
  return 0;
}

function getProgressPct(stepIndex: number, elapsed: number): number {
  // Smooth progress that maps steps to percentage ranges
  const ranges = [
    [0, 8],     // step 0: account (0-8%)
    [8, 25],    // step 1: provisioning (8-25%)
    [25, 50],   // step 2: installing (25-50%)
    [50, 72],   // step 3: training (50-72%)
    [72, 90],   // step 4: health check (72-90%)
    [90, 100],  // step 5: ready (90-100%)
  ];
  const [min, max] = ranges[stepIndex];
  // Within each step, smoothly fill based on time spent in that step
  const stepDuration = stepIndex === 5 ? 1 : 15; // seconds per step
  const timeFraction = Math.min(1, (elapsed % stepDuration) / stepDuration);
  const lerp = min + (max - min) * timeFraction;
  // Never go backwards, and cap at 95% until actually ready
  return stepIndex === 5 ? 100 : Math.min(95, Math.round(lerp));
}

export default function ProvisioningPage() {
  const [vmStatus, setVmStatus] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const hasStartedProvision = useRef(false);
  const accessTokenRef = useRef<string | null>(null);
  const vmIdRef = useRef<string | null>(null);
  const startTimeRef = useRef(Date.now());

  // ---- Kick off provisioning on mount ----
  useEffect(() => {
    if (hasStartedProvision.current) return;
    hasStartedProvision.current = true;

    async function startProvisioning() {
      try {
        const { createBrowserClient } = await import('@/lib/supabase-browser');
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (!accessToken) {
          setError('Not authenticated. Please log in and try again.');
          return;
        }

        accessTokenRef.current = accessToken;

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('website_url')
            .eq('id', user.id)
            .single();

          // Fire-and-forget: deep research crawl
          if (profile?.website_url) {
            fetch('/api/research/crawl', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ url: profile.website_url }),
            }).catch(() => {});
          }
        }

        // Start VM provisioning
        setVmStatus('provisioning');

        const provisionRes = await fetch('/api/vm/provision', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!provisionRes.ok) {
          const text = await provisionRes.text();
          let errorMsg = `Provisioning failed (${provisionRes.status})`;
          try { errorMsg = JSON.parse(text).error || errorMsg; } catch {}
          setError(errorMsg + '. Please try again or call (910) 515-8927.');
          return;
        }

        const provisionData = await provisionRes.json();

        if (provisionData.success && provisionData.data?.vm_id) {
          vmIdRef.current = provisionData.data.vm_id;
          setVmStatus(provisionData.data.status || 'provisioning');

          if (provisionData.data.status === 'ready') {
            setVmStatus('ready');
            setTimeout(() => { window.location.href = '/king-mouse'; }, 1500);
          }
        } else if (provisionData.error === 'no_capacity') {
          setError('Our servers are at capacity right now. Your AI employee will be provisioned shortly — we will email you when it is ready.');
        } else {
          console.error('Provision failed:', provisionData);
          setError('Something went wrong. We are on it.');
        }
      } catch (err) {
        console.error('Provisioning error:', err);
        setError('Something went wrong. We are on it.');
      }
    }

    startProvisioning();
  }, []);

  // ---- Poll VM status every 3 seconds ----
  const checkStatus = useCallback(async () => {
    const token = accessTokenRef.current;
    const vmId = vmIdRef.current;
    if (!token || !vmId || vmStatus === 'ready') return;

    try {
      const res = await fetch(`/api/vm/status?vm_id=${vmId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data.success && data.data?.status) {
        const newStatus = data.data.status;

        if (newStatus === 'retrying') {
          // Silent retry — keep progress bar moving, user doesn't know
          setVmStatus('installing');
        } else if (newStatus === 'ready') {
          setVmStatus('ready');
          setTimeout(() => { window.location.href = '/king-mouse'; }, 2000);
        } else if (newStatus === 'error' || newStatus === 'failed') {
          setVmStatus('failed');
          if (data.data?.error === 'max_retries') {
            setError("We're experiencing high demand. We'll email you the moment your AI employee is ready. Usually within the hour.");
          } else {
            setError('Something went wrong. We are on it.');
          }
        } else {
          setVmStatus(newStatus);
        }
      }
    } catch {
      // Keep polling
    }
  }, [vmStatus]);

  useEffect(() => {
    if (vmStatus === 'ready' || error) return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [checkStatus, vmStatus, error]);

  // ---- Elapsed time counter ----
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---- Derived values ----
  const stepIndex = getStepIndex(vmStatus, elapsed);
  const progressPct = vmStatus === 'ready' ? 100 : getProgressPct(stepIndex, elapsed);
  const isOvertime = elapsed > 180; // 3 minutes
  const isReady = vmStatus === 'ready';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF8F4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        textAlign: 'center',
      }}>
        {/* Pulsing M logo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 36,
        }}>
          <div style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: isReady
              ? 'linear-gradient(135deg, #1D9E75, #16825f)'
              : 'linear-gradient(135deg, #F07020, #d85a10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isReady ? 'none' : 'provisionPulse 2s ease-in-out infinite',
            transition: 'background 0.5s',
          }}>
            {isReady ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1 }}>M</span>
            )}
          </div>
        </div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#1a1a1a',
          margin: '0 0 8px',
        }}>
          {isReady ? 'King Mouse is ready!' : 'Building your AI employee'}
        </h1>

        {error ? (
          /* ---- Error state ---- */
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 15, color: '#b91c1c', marginBottom: 20, lineHeight: 1.5 }}>
              {error}
              <br />
              Call us at{' '}
              <a href="tel:9105158927" style={{ fontWeight: 600, color: '#b91c1c' }}>
                (910) 515-8927
              </a>
              {' '}and we will get you set up manually.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 28px',
                fontSize: 15,
                fontWeight: 600,
                backgroundColor: '#F07020',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* ---- Steps list ---- */}
            <div style={{
              textAlign: 'left',
              maxWidth: 340,
              margin: '28px auto 0',
            }}>
              {STEPS.map((step, i) => {
                const isActive = i === stepIndex;
                const isDone = i < stepIndex;
                const isFuture = i > stepIndex;

                return (
                  <div
                    key={step.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 0',
                      transition: 'opacity 0.3s',
                      opacity: isFuture ? 0.35 : 1,
                    }}
                  >
                    {/* Step indicator */}
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isDone ? '#1D9E75' : isActive ? '#F07020' : '#e0ddd8',
                      transition: 'background 0.4s',
                    }}>
                      {isDone ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : isActive ? (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#fff',
                          animation: 'dotPulse 1.2s ease-in-out infinite',
                        }} />
                      ) : (
                        <div style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#bbb',
                        }} />
                      )}
                    </div>

                    {/* Step label */}
                    <span style={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      color: isDone ? '#1D9E75' : isActive ? '#1a1a1a' : '#999',
                      transition: 'color 0.3s, font-weight 0.3s',
                    }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ---- Progress bar ---- */}
            <div style={{
              maxWidth: 340,
              margin: '28px auto 0',
            }}>
              <div style={{
                width: '100%',
                height: 6,
                background: '#e8e5e0',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: isReady
                    ? '#1D9E75'
                    : 'linear-gradient(90deg, #F07020, #f59e0b)',
                  borderRadius: 3,
                  transition: 'width 1.5s ease-out, background 0.5s',
                }} />
              </div>
              <p style={{
                fontSize: 12,
                color: '#999',
                marginTop: 8,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {progressPct}%
              </p>
            </div>

            {/* ---- Bottom message ---- */}
            <div style={{ marginTop: 28 }}>
              {isReady ? (
                <p style={{ fontSize: 14, color: '#1D9E75', fontWeight: 500 }}>
                  Taking you to King Mouse now...
                </p>
              ) : isOvertime ? (
                <div style={{
                  padding: '16px 20px',
                  background: 'rgba(240,112,32,0.06)',
                  borderRadius: 10,
                  border: '1px solid rgba(240,112,32,0.15)',
                }}>
                  <p style={{ fontSize: 14, color: '#1a1a1a', margin: '0 0 8px', lineHeight: 1.5 }}>
                    Taking longer than usual. Do not worry — we will email you when it is ready.
                  </p>
                  <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                    Or call{' '}
                    <a href="tel:9105158927" style={{ fontWeight: 600, color: '#F07020', textDecoration: 'none' }}>
                      (910) 515-8927
                    </a>
                    {' '}for immediate support.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>
                  This usually takes about 60 seconds. Please do not close this page.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes provisionPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(240, 112, 32, 0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(240, 112, 32, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(240, 112, 32, 0); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
