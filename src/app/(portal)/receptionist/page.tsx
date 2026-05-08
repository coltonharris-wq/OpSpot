'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import type { ReceptionistConfig, CallLogEntry } from '@/lib/types';

const VOICES = [
  { id: 'professional', name: 'Professional', description: 'Calm, clear, friendly' },
  { id: 'energetic', name: 'Energetic', description: 'Upbeat, confident' },
  { id: 'southern', name: 'Southern', description: 'Warm, personable' },
  { id: 'female', name: 'Female', description: 'Polished, welcoming' },
  { id: 'casual', name: 'Casual', description: 'Relaxed, natural' },
  { id: 'deep', name: 'Deep', description: 'Authoritative, bold' },
];

const ELEVENLABS_VOICE_IDS: Record<string, string> = {
  professional: 'EXAVITQu4vr4xnSDxMaL',  // Rachel
  energetic: '21m00Tcm4TlvDq8ikWAM',      // Rachel variant
  southern: 'AZnzlk1XvdvUeBnXmlld',       // Domi
  female: 'MF3mGyEYCl7XYWbV9V6O',         // Elli
  casual: 'TxGEqnHWrfWFTfGW9XjX',         // Josh
  deep: 'VR6AewLTigWG4xSOukaG',           // Arnold
};

type PhoneOption = 'new' | 'port';

export default function ReceptionistPage() {
  const [config, setConfig] = useState<ReceptionistConfig | null>(null);
  const [calls, setCalls] = useState<CallLogEntry[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phoneOption, setPhoneOption] = useState<PhoneOption>('new');
  const [areaCode, setAreaCode] = useState('');
  const [provisioningNumber, setProvisioningNumber] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);
  const [editingGreeting, setEditingGreeting] = useState(false);
  const [greetingDraft, setGreetingDraft] = useState('');
  const [savingGreeting, setSavingGreeting] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: configData } = await supabase
          .from('receptionist_config')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (configData) {
          setConfig(configData as ReceptionistConfig);
          setSelectedVoice(configData.voice_id);
        }

        const { data: callData } = await supabase
          .from('call_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (callData) {
          setCalls(callData as CallLogEntry[]);
        }
      } catch (err) {
        console.error('Failed to load receptionist data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function selectVoice(voiceId: string) {
    setSelectedVoice(voiceId);
    setSaving(true);

    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const voice = VOICES.find(v => v.id === voiceId);

      await supabase
        .from('receptionist_config')
        .upsert({
          user_id: user.id,
          voice_id: voiceId,
          voice_name: voice?.name || voiceId,
          enabled: true,
        });
    } catch (err) {
      console.error('Failed to save voice:', err);
    } finally {
      setSaving(false);
    }
  }

  async function togglePlayVoice(voiceId: string) {
    // If currently playing this voice, stop it
    if (playingVoice === voiceId) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        setCurrentAudio(null);
      }
      setPlayingVoice(null);
      return;
    }

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }

    setPlayingVoice(voiceId);

    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPlayingVoice(null);
        return;
      }

      const elevenlabsVoiceId = ELEVENLABS_VOICE_IDS[voiceId] || ELEVENLABS_VOICE_IDS.professional;
      const sampleText = config?.greeting || 'Hello, thank you for calling. How can I help you today?';

      const response = await fetch('/api/receptionist/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: sampleText,
          voice_id: elevenlabsVoiceId,
        }),
      });

      if (!response.ok) {
        console.error('Voice test failed:', response.statusText);
        setPlayingVoice(null);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setCurrentAudio(audio);

      audio.onended = () => {
        setPlayingVoice(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setPlayingVoice(null);
        setCurrentAudio(null);
        URL.revokeObjectURL(url);
      };

      audio.play();
    } catch (err) {
      console.error('Voice test error:', err);
      setPlayingVoice(null);
      setCurrentAudio(null);
    }
  }

  async function provisionNumber() {
    setProvisioningNumber(true);
    setProvisionError(null);
    setProvisionSuccess(null);

    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setProvisionError('Not authenticated. Please sign in again.');
        setProvisioningNumber(false);
        return;
      }

      const response = await fetch('/api/receptionist/provision-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ area_code: areaCode || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProvisionError(data.error || 'Failed to provision phone number');
        setProvisioningNumber(false);
        return;
      }

      // Update config state with new phone number
      setConfig((prev) =>
        prev
          ? { ...prev, phone_number: data.data.phone_number, enabled: true }
          : { phone_number: data.data.phone_number, enabled: true } as ReceptionistConfig
      );
      setProvisionSuccess(`Number provisioned: ${data.data.phone_number}`);
    } catch (err) {
      console.error('Provision error:', err);
      setProvisionError('An unexpected error occurred. Please try again.');
    } finally {
      setProvisioningNumber(false);
    }
  }

  async function saveGreeting() {
    setSavingGreeting(true);

    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('receptionist_config')
        .upsert({
          user_id: user.id,
          greeting: greetingDraft,
        });

      setConfig((prev) => (prev ? { ...prev, greeting: greetingDraft } : prev));
      setEditingGreeting(false);
    } catch (err) {
      console.error('Failed to save greeting:', err);
    } finally {
      setSavingGreeting(false);
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  }

  function getResultBadge(result: string | null) {
    if (!result) return { bg: '#f0f0ec', color: '#666', label: 'Unknown' };
    const r = result.toLowerCase();
    if (r === 'booked' || r === 'scheduled' || r === 'answered') {
      return { bg: '#E1F5EE', color: '#0F6E56', label: r === 'answered' ? 'Booked' : result.charAt(0).toUpperCase() + result.slice(1) };
    }
    if (r === 'blocked' || r === 'missed') {
      return { bg: '#FCEBEB', color: '#A32D2D', label: r === 'missed' ? 'Blocked' : 'Blocked' };
    }
    if (r === 'voicemail') {
      return { bg: '#FAEEDA', color: '#854F0B', label: 'Voicemail' };
    }
    return { bg: '#f0f0ec', color: '#666', label: result };
  }

  const isActive = config?.enabled ?? false;
  const todayCalls = calls.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <span style={{ color: '#888', fontSize: 16 }}>Loading receptionist...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 880, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>AI Receptionist</h1>
        <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0 0' }}>
          King Mouse answers your business phone 24/7. Set up in under 60 seconds.
        </p>
      </div>

      {/* Status bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 24,
          background: isActive ? '#E1F5EE' : '#f6f6f4',
          border: isActive ? '0.5px solid #9FE1CB' : '0.5px solid #e8e8e4',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: isActive ? '#1D9E75' : '#ccc',
            boxShadow: isActive ? '0 0 8px rgba(29,158,117,0.4)' : 'none',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? '#1D9E75' : '#888' }}>
          {isActive ? 'Receptionist is live' : 'Receptionist is off'}
        </span>
        {isActive && (
          <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>
            {todayCalls} call{todayCalls !== 1 ? 's' : ''} handled today
          </span>
        )}
      </div>

      {/* Card 1: Choose a voice */}
      <div
        style={{
          background: '#fff',
          border: '0.5px solid #e8e8e4',
          borderRadius: 10,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#F07020',
              textTransform: 'uppercase' as const,
              letterSpacing: 0.3,
            }}
          >
            Step 1
          </span>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', margin: '4px 0 0 0' }}>Choose a voice</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            return (
              <div
                key={voice.id}
                onClick={() => selectVoice(voice.id)}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: isSelected ? '0.5px solid #1D9E75' : '0.5px solid #e8e8e4',
                  background: isSelected ? '#E1F5EE' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isSelected ? '#1D9E75' : '#f0f0ec',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSelected ? '#fff' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{voice.name}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{voice.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Test voice bar */}
        {selectedVoice && (
          <div
            onClick={() => togglePlayVoice(selectedVoice)}
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#f6f6f4',
              cursor: 'pointer',
              border: '0.5px solid #e8e8e4',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#1D9E75',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {playingVoice === selectedVoice ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="none">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="none">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 450 }}>
              {playingVoice === selectedVoice ? 'Playing...' : 'Test this voice'}
            </span>
          </div>
        )}

        {saving && (
          <p style={{ fontSize: 12, color: '#1D9E75', marginTop: 10, marginBottom: 0 }}>Saving voice selection...</p>
        )}
      </div>

      {/* Card 2: Connect your phone */}
      <div
        style={{
          background: '#fff',
          border: '0.5px solid #e8e8e4',
          borderRadius: 10,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#F07020',
              textTransform: 'uppercase' as const,
              letterSpacing: 0.3,
            }}
          >
            Step 2
          </span>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', margin: '4px 0 0 0' }}>Connect your phone</h2>
        </div>

        {config?.phone_number ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#E1F5EE',
                borderRadius: 8,
                padding: '10px 16px',
                border: '0.5px solid #9FE1CB',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{config.phone_number}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }} />
              <span style={{ fontSize: 12, color: '#1D9E75', fontWeight: 500 }}>Active</span>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {/* Option: New number */}
              <div
                onClick={() => setPhoneOption('new')}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: phoneOption === 'new' ? '0.5px solid #1D9E75' : '0.5px solid #e8e8e4',
                  background: phoneOption === 'new' ? '#E1F5EE' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: phoneOption === 'new' ? '5px solid #1D9E75' : '1.5px solid #ccc',
                      background: '#fff',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>Get a new number</span>
                </div>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 26, display: 'block' }}>$5/month</span>
              </div>

              {/* Option: Port number */}
              <div
                onClick={() => setPhoneOption('port')}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: phoneOption === 'port' ? '0.5px solid #1D9E75' : '0.5px solid #e8e8e4',
                  background: phoneOption === 'port' ? '#E1F5EE' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: phoneOption === 'port' ? '5px solid #1D9E75' : '1.5px solid #ccc',
                      background: '#fff',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>Port my existing number</span>
                </div>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 26, display: 'block' }}>Transfer your current number</span>
              </div>
            </div>

            {phoneOption === 'new' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Area code (e.g. 512)"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    maxLength={3}
                    disabled={provisioningNumber}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '0.5px solid #e8e8e4',
                      fontSize: 13,
                      outline: 'none',
                      width: 160,
                      color: '#1a1a1a',
                      background: provisioningNumber ? '#f6f6f4' : '#fff',
                    }}
                  />
                  <button
                    onClick={provisionNumber}
                    disabled={provisioningNumber}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 8,
                      background: provisioningNumber ? '#ccc' : '#F07020',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 500,
                      border: 'none',
                      cursor: provisioningNumber ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {provisioningNumber && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    )}
                    {provisioningNumber ? 'Getting number...' : 'Get number'}
                  </button>
                </div>
                {provisionError && (
                  <p style={{ fontSize: 12, color: '#A32D2D', marginTop: 8, marginBottom: 0 }}>
                    {provisionError}
                  </p>
                )}
                {provisionSuccess && (
                  <p style={{ fontSize: 12, color: '#1D9E75', marginTop: 8, marginBottom: 0 }}>
                    {provisionSuccess}
                  </p>
                )}
              </div>
            )}

            {phoneOption === 'port' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Your phone number"
                  style={{
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '0.5px solid #e8e8e4',
                    fontSize: 13,
                    outline: 'none',
                    width: 200,
                    color: '#1a1a1a',
                    background: '#fff',
                  }}
                />
                <button
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: '#F07020',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Start port
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Card 3: Your greeting */}
      <div
        style={{
          background: '#fff',
          border: '0.5px solid #e8e8e4',
          borderRadius: 10,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#F07020',
              textTransform: 'uppercase' as const,
              letterSpacing: 0.3,
            }}
          >
            Step 3
          </span>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', margin: '4px 0 0 0' }}>Your greeting</h2>
        </div>

        {editingGreeting ? (
          <>
            <textarea
              value={greetingDraft}
              onChange={(e) => setGreetingDraft(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 8,
                border: '0.5px solid #1D9E75',
                fontSize: 13,
                color: '#444',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                marginBottom: 14,
                background: '#fff',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={saveGreeting}
                disabled={savingGreeting}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: savingGreeting ? '#9FE1CB' : '#1D9E75',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  border: 'none',
                  cursor: savingGreeting ? 'not-allowed' : 'pointer',
                }}
              >
                {savingGreeting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingGreeting(false)}
                disabled={savingGreeting}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#fff',
                  color: '#1a1a1a',
                  fontSize: 13,
                  fontWeight: 500,
                  border: '0.5px solid #e8e8e4',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                background: '#f6f6f4',
                borderRadius: 8,
                padding: '14px 16px',
                marginBottom: 14,
                border: '0.5px solid #e8e8e4',
              }}
            >
              <p style={{ fontSize: 13, color: '#444', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                {config?.greeting ||
                  '"Hi, thanks for calling! This is King Mouse, your AI assistant. I can help you schedule an appointment, answer questions about our services, or take a message. How can I help you today?"'}
              </p>
            </div>

            <button
              onClick={() => {
                setGreetingDraft(
                  config?.greeting ||
                    'Hi, thanks for calling! This is King Mouse, your AI assistant. I can help you schedule an appointment, answer questions about our services, or take a message. How can I help you today?'
                );
                setEditingGreeting(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: '#fff',
                color: '#1a1a1a',
                fontSize: 13,
                fontWeight: 500,
                border: '0.5px solid #e8e8e4',
                cursor: 'pointer',
              }}
            >
              Edit greeting
            </button>
          </>
        )}
      </div>

      {/* Card 4: Call log */}
      <div
        style={{
          background: '#fff',
          border: '0.5px solid #e8e8e4',
          borderRadius: 10,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', margin: '0 0 16px 0' }}>Call log</h2>

        {calls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10 }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <p style={{ fontSize: 13, color: '#888', margin: 0 }}>No calls yet. They will show up here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e8e8e4' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      paddingBottom: 10,
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#888',
                      textTransform: 'uppercase' as const,
                      letterSpacing: 0.3,
                    }}
                  >
                    Caller
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      paddingBottom: 10,
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#888',
                      textTransform: 'uppercase' as const,
                      letterSpacing: 0.3,
                    }}
                  >
                    Reason
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      paddingBottom: 10,
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#888',
                      textTransform: 'uppercase' as const,
                      letterSpacing: 0.3,
                    }}
                  >
                    Duration
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      paddingBottom: 10,
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#888',
                      textTransform: 'uppercase' as const,
                      letterSpacing: 0.3,
                    }}
                  >
                    Result
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      paddingBottom: 10,
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#888',
                      textTransform: 'uppercase' as const,
                      letterSpacing: 0.3,
                    }}
                  >
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => {
                  const badge = getResultBadge(call.result);
                  return (
                    <tr key={call.id} style={{ borderBottom: '0.5px solid #f0f0ec' }}>
                      <td style={{ padding: '12px 12px 12px 0' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                          {call.caller_name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
                          {call.caller_phone || '--'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 12px 12px 0', fontSize: 13, color: '#444' }}>
                        {call.reason || '--'}
                      </td>
                      <td style={{ padding: '12px 12px 12px 0', fontSize: 13, color: '#1a1a1a' }}>
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td style={{ padding: '12px 12px 12px 0' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0 12px 0', fontSize: 12, color: '#888' }}>
                        {formatTime(call.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
