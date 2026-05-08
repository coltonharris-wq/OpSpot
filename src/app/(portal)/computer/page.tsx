'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { ScreenshotResponse } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
/* ------------------------------------------------------------------ */
function MonitorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function MousePointerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge component                                             */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: 'working' | 'idle' | 'offline' }) {
  const config = {
    working: { bg: '#1D9E75', text: '#fff', label: 'Working', pulse: true },
    idle: { bg: '#F59E0B', text: '#fff', label: 'Idle', pulse: false },
    offline: { bg: '#EF4444', text: '#fff', label: 'Offline', pulse: false },
  }[status];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: config.bg,
      color: config.text,
      fontSize: 12,
      fontWeight: 600,
      padding: '4px 12px',
      borderRadius: 999,
    }}>
      <span style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: '#fff',
        animation: config.pulse ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      }} />
      {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  VM display dimensions                                              */
/* ------------------------------------------------------------------ */
const VM_WIDTH = 1920;
const VM_HEIGHT = 1080;

/* ================================================================== */
/*  Main Computer Page                                                 */
/* ================================================================== */
export default function ComputerPage() {
  const [screenshot, setScreenshot] = useState<ScreenshotResponse>({
    image: null,
    status: 'offline',
    current_task: null,
    last_active: null,
  });
  const [prevImage, setPrevImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [takeControl, setTakeControl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const monitorRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Get auth token
  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token || null;
      setLoading(false);
    }
    init();
  }, []);

  // Poll screenshots
  const fetchScreenshot = useCallback(async () => {
    if (inFlightRef.current || !tokenRef.current) return;
    inFlightRef.current = true;

    try {
      const res = await fetch('/api/vm/screenshot', {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data: ScreenshotResponse = await res.json();
        setScreenshot((prev) => {
          // Save previous image for crossfade
          if (prev.image && data.image && prev.image !== data.image) {
            setPrevImage(prev.image);
            setTimeout(() => setPrevImage(null), 300);
          }
          return data;
        });
      }
    } catch {
      // Skip this cycle
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    fetchScreenshot();
    pollingRef.current = setInterval(fetchScreenshot, 1500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [loading, fetchScreenshot]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!monitorRef.current) return;
    if (!document.fullscreenElement) {
      monitorRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Take control: translate click coordinates
  const handleScreenClick = useCallback(async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!takeControl || !tokenRef.current || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = VM_WIDTH / rect.width;
    const scaleY = VM_HEIGHT / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    try {
      await fetch('/api/vm/action', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'click', x, y, double: e.detail === 2 }),
      });
      // Fetch fresh screenshot after click
      setTimeout(fetchScreenshot, 300);
    } catch {
      // Silently fail
    }
  }, [takeControl, fetchScreenshot]);

  // Take control: keyboard events
  useEffect(() => {
    if (!takeControl) return;

    const handler = async (e: KeyboardEvent) => {
      if (!tokenRef.current) return;
      // Don't capture if user is in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      e.preventDefault();

      // Single character = type, special keys = key press
      if (e.key.length === 1) {
        await fetch('/api/vm/action', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'type', text: e.key }),
        });
      } else {
        await fetch('/api/vm/action', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'key', key: e.key }),
        });
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [takeControl]);

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ color: '#888', fontSize: 16 }}>Loading computer view...</div>
      </div>
    );
  }

  const hasImage = !!screenshot.image;
  const isOffline = screenshot.status === 'offline';

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Global styles */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .monitor-frame {
          position: relative;
          background: #0a0a0f;
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid #2a2a34;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .monitor-frame img {
          transition: opacity 0.3s ease;
        }
        .take-control-active {
          border-color: #F07020 !important;
          box-shadow: 0 0 0 2px rgba(240,112,32,0.3), 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .monitor-stand {
          width: 120px;
          height: 24px;
          background: linear-gradient(180deg, #2a2a34, #1a1a22);
          margin: 0 auto;
          border-radius: 0 0 8px 8px;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#1D9E75' }}><MonitorIcon /></span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a22', margin: 0 }}>
            King Mouse&apos;s Computer
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={screenshot.status} />
          <button
            onClick={toggleFullscreen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: 8,
              color: '#555',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <MaximizeIcon /> {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Current task */}
      {screenshot.current_task && screenshot.status === 'working' && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 14,
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#1D9E75',
            animation: 'pulse-dot 1.5s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <div>
            <span style={{ color: '#666', fontWeight: 500 }}>King Mouse is working: </span>
            <span style={{ color: '#1a1a22' }}>{screenshot.current_task}</span>
          </div>
        </div>
      )}

      {/* Monitor frame */}
      <div
        ref={monitorRef}
        className={`monitor-frame ${takeControl ? 'take-control-active' : ''}`}
        style={{ cursor: takeControl ? 'crosshair' : 'default' }}
      >
        {hasImage ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0a0a0f' }}>
            {/* Previous image for crossfade */}
            {prevImage && (
              <img
                src={prevImage}
                alt=""
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Current screenshot */}
            <img
              ref={imgRef}
              src={screenshot.image!}
              alt="King Mouse's desktop"
              onClick={handleScreenClick}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              draggable={false}
            />

            {/* Take control button overlay */}
            <button
              onClick={() => setTakeControl((p) => !p)}
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: takeControl ? '#F07020' : 'rgba(0,0,0,0.7)',
                border: takeControl ? '2px solid #F07020' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
            >
              <MousePointerIcon />
              {takeControl ? 'Release Control' : 'Take Control'}
            </button>

            {/* Idle overlay */}
            {screenshot.status === 'idle' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(2px)',
              }}>
                <div style={{
                  background: 'rgba(0,0,0,0.8)',
                  borderRadius: 12,
                  padding: '20px 32px',
                  textAlign: 'center',
                  color: '#fff',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Idle</div>
                  <div style={{ fontSize: 14, color: '#aaa' }}>Waiting for your next task</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            width: '100%',
            aspectRatio: '16/9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#1a1a22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              color: '#555',
            }}>
              <MonitorIcon />
            </div>
            {isOffline ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#888', marginBottom: 6 }}>
                  Computer is offline
                </div>
                <div style={{ fontSize: 14, color: '#666', maxWidth: 400, textAlign: 'center' }}>
                  King Mouse&apos;s computer will start automatically when there is work to do,
                  or send a task in the chat to wake it up.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#888', marginBottom: 6 }}>
                  Connecting...
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>
                  Establishing connection to King Mouse&apos;s computer
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Monitor stand */}
      <div className="monitor-stand" />

      {/* Status bar below monitor */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        padding: '12px 16px',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#555' }}>
          {screenshot.status === 'working' && (
            <>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#1D9E75',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
              <span>King Mouse is using <strong>Browser</strong></span>
            </>
          )}
          {screenshot.status === 'idle' && (
            <>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              <span>Idle — waiting for a task</span>
            </>
          )}
          {screenshot.status === 'offline' && (
            <>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <span>Computer is offline</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchScreenshot}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: 8,
              color: '#555',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <RefreshIcon /> Refresh
          </button>
        </div>
      </div>

      {/* Take control tip */}
      {takeControl && (
        <div style={{
          marginTop: 12,
          padding: '10px 16px',
          background: 'rgba(240,112,32,0.08)',
          border: '1px solid rgba(240,112,32,0.2)',
          borderRadius: 8,
          fontSize: 13,
          color: '#F07020',
          textAlign: 'center',
        }}>
          Take Control mode active — Click on the screen to interact. Press &quot;Release Control&quot; to stop.
        </div>
      )}
    </div>
  );
}
