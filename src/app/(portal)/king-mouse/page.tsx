'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Conversation, ScreenshotResponse } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Default fallback quick actions (used when no vertical config)      */
/* ------------------------------------------------------------------ */
const DEFAULT_QUICK_ACTIONS = [
  { label: 'Follow up on leads', prompt: 'Help me follow up on my recent leads' },
  { label: 'Check my schedule', prompt: 'Show me my schedule for today' },
  { label: 'Run ads report', prompt: 'Give me a summary of my current ad performance' },
  { label: 'Send invoices', prompt: 'Help me send out pending invoices' },
  { label: 'Post to social media', prompt: 'Help me create and post social media content' },
];

const DEFAULT_GREETING = 'Your AI employee is ready. Ask anything about your business.';

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
/* ------------------------------------------------------------------ */
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5.29" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SidebarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="3" width="10" height="10" rx="2" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function ComputerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function MousePointerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Typing indicator                                                   */
/* ------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0' }}>
      <div
        style={{
          background: '#2a2a34',
          borderRadius: '16px 16px 16px 4px',
          padding: '14px 20px',
          display: 'flex',
          gap: 5,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#888',
              display: 'inline-block',
              animation: 'typingDot 1.4s infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Date grouping helpers                                              */
/* ------------------------------------------------------------------ */
function groupConversationsByDate(conversations: Conversation[]) {
  const groups: { label: string; items: Conversation[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const todayItems: Conversation[] = [];
  const yesterdayItems: Conversation[] = [];
  const last7Items: Conversation[] = [];
  const last30Items: Conversation[] = [];
  const olderItems: Conversation[] = [];

  for (const c of conversations) {
    const d = new Date(c.updated_at || c.created_at);
    if (d >= today) todayItems.push(c);
    else if (d >= yesterday) yesterdayItems.push(c);
    else if (d >= sevenDaysAgo) last7Items.push(c);
    else if (d >= thirtyDaysAgo) last30Items.push(c);
    else olderItems.push(c);
  }

  if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (last7Items.length) groups.push({ label: 'Previous 7 days', items: last7Items });
  if (last30Items.length) groups.push({ label: 'Previous 30 days', items: last30Items });
  if (olderItems.length) groups.push({ label: 'Older', items: olderItems });

  return groups;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatTimestamp(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export default function KingMousePage() {
  /* ---- State ---- */
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickActions, setQuickActions] = useState(DEFAULT_QUICK_ACTIONS);
  const [greeting, setGreeting] = useState(DEFAULT_GREETING);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const tokenRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queuedMessageRef = useRef<string | null>(null);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

  // ── Manus-style computer panel state ──
  const [computerPanelOpen, setComputerPanelOpen] = useState(false);
  const [computerScreenshot, setComputerScreenshot] = useState<ScreenshotResponse>({
    image: null, status: 'offline', current_task: null, last_active: null,
  });
  const [computerActive, setComputerActive] = useState(false);
  const [taskSteps, setTaskSteps] = useState<Array<{ name: string; status: string }>>([]);
  const [taskElapsed, setTaskElapsed] = useState(0);
  const [takeControlMode, setTakeControlMode] = useState(false);
  const screenshotPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenshotInFlightRef = useRef(false);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const computerImgRef = useRef<HTMLImageElement>(null);

  /* ---- Scroll to bottom on new messages ---- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* ---- Auto-resize textarea ---- */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputText]);

  /* ---- Init: get auth token, load config + conversations ---- */
  useEffect(() => {
    async function init() {
      const { createBrowserClient } = await import('@/lib/supabase-browser');
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token || null;

      const headers: Record<string, string> = {};
      if (tokenRef.current) headers['Authorization'] = `Bearer ${tokenRef.current}`;

      // Load config
      try {
        const res = await fetch('/api/vm/chat?config=true', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.kingMouse) {
            if (data.kingMouse.greeting) setGreeting(data.kingMouse.greeting);
            if (data.kingMouse.quickActions?.length) setQuickActions(data.kingMouse.quickActions);
          }
        }
      } catch {
        // Fall back to defaults silently
      }
      setConfigLoaded(true);

      // Load conversations
      try {
        const res = await fetch('/api/vm/chat?conversations=true', { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.conversations)) {
            setConversations(data.conversations);
          }
        }
      } catch {
        // silently fail
      }
    }
    init();
  }, []);

  /* ---- Load messages for a conversation ---- */
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (tokenRef.current) headers['Authorization'] = `Bearer ${tokenRef.current}`;
      const res = await fetch(`/api/vm/chat?conversation_id=${conversationId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch {
      // silently fail
    }
  }, []);

  /* ---- Select conversation ---- */
  const selectConversation = useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      loadMessages(conversationId);
    },
    [loadMessages]
  );

  /* ---- New chat ---- */
  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
  }, []);

  /* ---- Send message ---- */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Optimistically add user message
      const userMsg: Message = {
        id: 'temp-' + Date.now(),
        user_id: '',
        conversation_id: activeConversationId || '',
        role: 'user',
        content: trimmed,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const res = await fetch('/api/vm/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
          },
          body: JSON.stringify({
            message: trimmed,
            conversation_id: activeConversationId,
          }),
          signal: abortController.signal,
        });

        const data = await res.json();

        if (res.ok) {
          // Update conversation id if new
          if (data.conversation_id && !activeConversationId) {
            setActiveConversationId(data.conversation_id);
            // Refresh sidebar
            const convHeaders: Record<string, string> = {};
            if (tokenRef.current) convHeaders['Authorization'] = `Bearer ${tokenRef.current}`;
            const convRes = await fetch('/api/vm/chat?conversations=true', { headers: convHeaders });
            if (convRes.ok) {
              const convData = await convRes.json();
              if (Array.isArray(convData.conversations)) {
                setConversations(convData.conversations);
              }
            }
          }

          // Track computer activity and task steps from response
          if (data.computer_active) {
            setComputerActive(true);
            if (!computerPanelOpen) {
              // Auto-hint to open computer panel
            }
          } else {
            setComputerActive(false);
          }
          if (data.steps) {
            setTaskSteps(data.steps);
          } else {
            setTaskSteps([]);
          }

          // Add assistant response
          if (data.reply) {
            const assistantMsg: Message = {
              id: data.message_id || 'reply-' + Date.now(),
              user_id: '',
              conversation_id: data.conversation_id || activeConversationId || '',
              role: 'assistant',
              content: data.reply,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        } else if (data.support_message) {
          // King Mouse is down or VM not ready — show support contact
          const supportMsg: Message = {
            id: 'support-' + Date.now(),
            user_id: '',
            conversation_id: data.conversation_id || activeConversationId || '',
            role: 'assistant',
            content: data.support_message || 'King Mouse is temporarily unavailable. Please call (910) 515-8927 for immediate human support.',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, supportMsg]);
        } else {
          // Other error
          const errorMsg: Message = {
            id: 'error-' + Date.now(),
            user_id: '',
            conversation_id: activeConversationId || '',
            role: 'assistant',
            content: data.error === 'Insufficient work hours. Please purchase more hours.'
              ? 'You have used all your work hours. Please purchase more hours to continue.'
              : 'Something went wrong. Please try again or call (910) 515-8927 for support.',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          const errorMsg: Message = {
            id: 'error-' + Date.now(),
            user_id: '',
            conversation_id: activeConversationId || '',
            role: 'assistant',
            content: 'Unable to reach King Mouse. Please check your connection and try again.',
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      }

      abortControllerRef.current = null;
      setIsLoading(false);
    },
    [isLoading, activeConversationId]
  );

  /* ---- Stop current task ---- */
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    queuedMessageRef.current = null;
    setQueuedMessage(null);
    setIsLoading(false);
    setMessages((prev) => [
      ...prev,
      {
        id: 'cancel-' + Date.now(),
        user_id: '',
        conversation_id: activeConversationId || '',
        role: 'assistant',
        content: 'Task stopped.',
        created_at: new Date().toISOString(),
      },
    ]);
  }, [activeConversationId]);

  /* ---- Queue next task ---- */
  const handleQueue = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    queuedMessageRef.current = text;
    setQueuedMessage(text);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [inputText]);

  const cancelQueue = useCallback(() => {
    queuedMessageRef.current = null;
    setQueuedMessage(null);
  }, []);

  /* ---- Process queued message when loading finishes ---- */
  useEffect(() => {
    if (!isLoading && queuedMessageRef.current) {
      const queued = queuedMessageRef.current;
      queuedMessageRef.current = null;
      setQueuedMessage(null);
      const timer = setTimeout(() => sendMessage(queued), 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, sendMessage]);

  /* ---- Voice chat: mic toggle ---- */
  const toggleVoiceRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setVoiceState('thinking');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Send to Whisper on VM for STT
        try {
          setVoiceState('thinking');
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const sttRes = await fetch('/api/vm/voice-to-text', {
            method: 'POST',
            body: formData,
          });

          if (sttRes.ok) {
            const { text } = await sttRes.json();
            if (text?.trim()) {
              setInputText(text.trim());
              // Auto-send the transcribed text
              sendMessage(text.trim());
            }
          }
        } catch (err) {
          console.error('Voice transcription failed:', err);
        }
        setVoiceState('idle');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceState('listening');
    } catch (err) {
      console.error('Mic access denied:', err);
      setVoiceState('idle');
    }
  }, [isRecording, sendMessage]);

  /* ---- Screenshot polling for computer panel ---- */
  const fetchPanelScreenshot = useCallback(async () => {
    if (screenshotInFlightRef.current || !tokenRef.current) return;
    screenshotInFlightRef.current = true;
    try {
      const res = await fetch('/api/vm/screenshot', {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data: ScreenshotResponse = await res.json();
        setComputerScreenshot(data);
      }
    } catch {
      // Skip cycle
    } finally {
      screenshotInFlightRef.current = false;
    }
  }, []);

  // Start/stop polling when panel opens/closes
  useEffect(() => {
    if (computerPanelOpen) {
      fetchPanelScreenshot();
      screenshotPollingRef.current = setInterval(fetchPanelScreenshot, 1500);
    } else {
      if (screenshotPollingRef.current) clearInterval(screenshotPollingRef.current);
    }
    return () => {
      if (screenshotPollingRef.current) clearInterval(screenshotPollingRef.current);
    };
  }, [computerPanelOpen, fetchPanelScreenshot]);

  // Elapsed timer while loading
  useEffect(() => {
    if (isLoading) {
      setTaskElapsed(0);
      elapsedTimerRef.current = setInterval(() => setTaskElapsed((p) => p + 1), 1000);
    } else {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isLoading]);

  /* ---- Take control: click handler for panel ---- */
  const handlePanelScreenClick = useCallback(async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!takeControlMode || !tokenRef.current || !computerImgRef.current) return;
    const rect = computerImgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (1920 / rect.width));
    const y = Math.round((e.clientY - rect.top) * (1080 / rect.height));
    try {
      await fetch('/api/vm/action', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenRef.current}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click', x, y, double: e.detail === 2 }),
      });
      setTimeout(fetchPanelScreenshot, 300);
    } catch {}
  }, [takeControlMode, fetchPanelScreenshot]);

  /* ---- Keyboard handler ---- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  /* ---- Derived ---- */
  const hasMessages = messages.length > 0;
  const conversationGroups = groupConversationsByDate(conversations);
  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 40px)',
        background: '#1a1a22',
        overflow: 'hidden',
      }}
    >
      {/* ============================================================ */}
      {/*  LEFT SIDEBAR - Conversation History                         */}
      {/* ============================================================ */}
      <div
        style={{
          width: sidebarOpen ? 240 : 0,
          minWidth: sidebarOpen ? 240 : 0,
          background: '#14141b',
          borderRight: sidebarOpen ? '1px solid #2a2a34' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.2s ease, min-width 0.2s ease',
        }}
      >
        {/* New chat button */}
        <div style={{ padding: '16px 14px 8px' }}>
          <button
            onClick={startNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#F07020';
              e.currentTarget.style.background = 'rgba(240,112,32,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <PlusIcon />
            New chat
          </button>
        </div>

        {/* Conversations list */}
        <div
          className="sidebar-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 8px 16px',
          }}
        >
          {conversationGroups.map((group) => (
            <div key={group.label} style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#777',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '4px 8px 6px',
                }}
              >
                {group.label}
              </div>
              {group.items.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: isActive ? 'rgba(29,158,117,0.12)' : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      color: isActive ? '#fff' : '#aaa',
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s, color 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = '#ddd';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#aaa';
                      }
                    }}
                  >
                    <span style={{ flexShrink: 0, opacity: 0.5 }}>
                      <ChatIcon />
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conv.title || 'Untitled'}
                    </span>
                    <span style={{ fontSize: 11, color: '#666', flexShrink: 0 }}>
                      {formatTime(conv.updated_at || conv.created_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {conversations.length === 0 && (
            <div
              style={{
                padding: '32px 12px',
                textAlign: 'center',
                color: '#555',
                fontSize: 13,
              }}
            >
              No conversations yet.
              <br />
              Start a new chat to begin.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/*  MAIN CHAT AREA                                              */}
      {/* ============================================================ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minWidth: 0,
        }}
      >
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 10,
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#888';
            e.currentTarget.style.background = 'transparent';
          }}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <SidebarIcon />
        </button>

        {/* ----- Chat header (shown when conversation is active) ----- */}
        {hasMessages && (
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '0.5px solid #2a2a34',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingLeft: 52,
            }}
          >
            {/* King Mouse avatar */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1a3a4a, #1D9E75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>M</span>
            </div>
            {/* Name + subtitle */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>
                King Mouse
              </div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.3 }}>
                Your AI workforce orchestrator
              </div>
            </div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <span
                style={{
                  background: '#E1F5EE',
                  color: '#0F6E56',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 999,
                  lineHeight: 1.3,
                }}
              >
                Online
              </span>
              <span
                style={{
                  background: '#2a2a34',
                  color: '#666',
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 999,
                  lineHeight: 1.3,
                }}
              >
                2.0 hrs
              </span>
            </div>
          </div>
        )}

        {/* ----- Empty state (no messages) ----- */}
        {!hasMessages && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
            }}
          >
            {/* King Mouse avatar */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a3a4a, #1D9E75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>M</span>
            </div>

            {/* Main greeting */}
            <h1
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: '#ffffff',
                margin: '0 0 10px',
                letterSpacing: '-0.3px',
              }}
            >
              What can I do for you?
            </h1>

            {/* Subtitle from config */}
            <p
              style={{
                fontSize: 15,
                color: '#999',
                margin: '0 0 36px',
                maxWidth: 480,
                textAlign: 'center',
                lineHeight: 1.5,
                opacity: configLoaded ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            >
              {greeting}
            </p>

            {/* Quick action pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'center',
                maxWidth: 600,
              }}
            >
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.prompt)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '0.5px solid #2a2a34',
                    borderRadius: 999,
                    color: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#F07020';
                    e.currentTarget.style.background = 'rgba(240,112,32,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a34';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ----- Messages area ----- */}
        {hasMessages && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 24px 8px',
            }}
          >
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ maxWidth: '80%' }}>
                      <div
                        style={{
                          background: isUser ? '#1D9E75' : '#2a2a34',
                          color: '#fff',
                          padding: '12px 18px',
                          borderRadius: isUser
                            ? '16px 16px 4px 16px'
                            : '16px 16px 16px 4px',
                          fontSize: 15,
                          lineHeight: 1.55,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#666',
                          marginTop: 4,
                          textAlign: isUser ? 'right' : 'left',
                          paddingLeft: isUser ? 0 : 4,
                          paddingRight: isUser ? 4 : 0,
                        }}
                      >
                        {formatTimestamp(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && <TypingIndicator />}

              {/* "View King Mouse's Computer" inline link — shows when computer is active */}
              {(computerActive || isLoading) && !computerPanelOpen && (
                <div style={{ padding: '8px 0' }}>
                  <button
                    onClick={() => setComputerPanelOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      background: '#1e2533',
                      border: '1px solid #2a2a34',
                      borderRadius: 10,
                      cursor: 'pointer',
                      width: '100%',
                      maxWidth: 320,
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#F07020';
                      e.currentTarget.style.background = '#222233';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#2a2a34';
                      e.currentTarget.style.background = '#1e2533';
                    }}
                  >
                    {/* Mini screenshot thumbnail */}
                    <div style={{
                      width: 48,
                      height: 28,
                      borderRadius: 4,
                      background: '#0a0a0f',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid #333',
                    }}>
                      {computerScreenshot.image && (
                        <img src={computerScreenshot.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>
                        View King Mouse&apos;s Computer
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {computerScreenshot.status === 'working' ? 'Working...' : 'Live desktop'}
                      </div>
                    </div>
                    <span style={{ color: '#F07020', fontSize: 12 }}>
                      <ComputerIcon />
                    </span>
                  </button>
                </div>
              )}

              {/* Task steps inline display */}
              {taskSteps.length > 0 && (
                <div style={{ padding: '8px 0 16px' }}>
                  {taskSteps.map((step, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 0',
                    }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${step.status === 'completed' ? '#1D9E75' : step.status === 'in_progress' ? '#F07020' : '#444'}`,
                        background: step.status === 'completed' ? '#1D9E75' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 10,
                        color: step.status === 'completed' ? '#fff' : '#888',
                      }}>
                        {step.status === 'completed' ? '✓' : step.status === 'in_progress' ? (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F07020', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                        ) : (i + 1)}
                      </div>
                      <span style={{
                        fontSize: 13,
                        color: step.status === 'completed' ? '#888' : step.status === 'in_progress' ? '#fff' : '#666',
                        textDecoration: step.status === 'completed' ? 'line-through' : 'none',
                      }}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* ----- Input area ----- */}
        <div
          style={{
            padding: hasMessages ? '8px 24px 20px' : '0 24px 40px',
            width: '100%',
            maxWidth: hasMessages ? 768 : 640,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              background: '#2a2a34',
              borderRadius: 14,
              padding: '10px 12px 10px 18px',
              border: '1px solid #333',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#555';
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#333';
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask King Mouse anything..."
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 15,
                lineHeight: 1.5,
                resize: 'none',
                maxHeight: 200,
                fontFamily: 'inherit',
              }}
            />
            {/* Mic button for voice chat */}
            <button
              onClick={toggleVoiceRecording}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: 'none',
                background: isRecording ? '#ef4444' : '#3a3a44',
                color: isRecording ? '#fff' : '#999',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
                animation: isRecording ? 'pulse-ring 1.5s ease-in-out infinite' : 'none',
              }}
              title={isRecording ? 'Stop recording' : 'Voice chat — speak to King Mouse'}
            >
              {isRecording ? <MicOffIcon /> : <MicIcon />}
            </button>
            {/* Voice state indicator */}
            {voiceState !== 'idle' && (
              <div style={{
                position: 'absolute',
                top: -32,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#2a2a34',
                borderRadius: 8,
                padding: '4px 12px',
                fontSize: 12,
                color: voiceState === 'listening' ? '#ef4444' : voiceState === 'thinking' ? '#F07020' : '#1D9E75',
                whiteSpace: 'nowrap',
              }}>
                {voiceState === 'listening' ? 'Listening...' : voiceState === 'thinking' ? 'Thinking...' : 'Speaking...'}
              </div>
            )}
            <button
              onClick={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                border: 'none',
                background: inputText.trim() && !isLoading ? '#F07020' : '#3a3a44',
                color: inputText.trim() && !isLoading ? '#fff' : '#666',
                cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (inputText.trim() && !isLoading) {
                  e.currentTarget.style.background = '#d85a10';
                }
              }}
              onMouseLeave={(e) => {
                if (inputText.trim() && !isLoading) {
                  e.currentTarget.style.background = '#F07020';
                }
              }}
            >
              <SendIcon />
            </button>
          </div>

          {/* Queued message indicator */}
          {queuedMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
                padding: '6px 12px',
                background: 'rgba(240,112,32,0.1)',
                border: '1px solid rgba(240,112,32,0.25)',
                borderRadius: 8,
                fontSize: 13,
                color: '#F07020',
              }}
            >
              <span style={{ fontWeight: 500 }}>Queued:</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ccc' }}>
                {queuedMessage}
              </span>
              <button
                onClick={cancelQueue}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: 16,
                  lineHeight: 1,
                }}
                title="Cancel queued task"
              >
                ×
              </button>
            </div>
          )}

          {/* Stop + Queue buttons (visible only while King Mouse is working) */}
          {isLoading && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
              <button
                onClick={handleStop}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  color: '#ef4444',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                }}
              >
                <StopIcon /> Stop
              </button>
              <button
                onClick={handleQueue}
                disabled={!inputText.trim() || !!queuedMessage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  background: inputText.trim() && !queuedMessage ? 'rgba(240,112,32,0.12)' : 'rgba(60,60,70,0.3)',
                  border: `1px solid ${inputText.trim() && !queuedMessage ? 'rgba(240,112,32,0.3)' : 'rgba(60,60,70,0.3)'}`,
                  borderRadius: 8,
                  color: inputText.trim() && !queuedMessage ? '#F07020' : '#555',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: inputText.trim() && !queuedMessage ? 'pointer' : 'default',
                  transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (inputText.trim() && !queuedMessage) {
                    e.currentTarget.style.background = 'rgba(240,112,32,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(240,112,32,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (inputText.trim() && !queuedMessage) {
                    e.currentTarget.style.background = 'rgba(240,112,32,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(240,112,32,0.3)';
                  }
                }}
                title={queuedMessage ? 'A task is already queued' : 'Queue this task to run next'}
              >
                <QueueIcon /> Queue next
              </button>
            </div>
          )}

          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: '#555',
              marginTop: 8,
            }}
          >
            King Mouse may occasionally make mistakes. Verify important information.
          </div>
        </div>

        {/* ── Bottom progress bar (fixed at bottom of chat) ── */}
        {(isLoading || computerActive) && (
          <div
            style={{
              borderTop: '1px solid #2a2a34',
              background: '#14141b',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
            }}
            onClick={() => setComputerPanelOpen(true)}
          >
            {/* Mini screenshot thumbnail */}
            <div style={{
              width: 40,
              height: 24,
              borderRadius: 4,
              background: '#0a0a0f',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid #333',
            }}>
              {computerScreenshot.image && (
                <img src={computerScreenshot.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            {/* Current step */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12,
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {taskSteps.length > 0
                  ? `Step ${taskSteps.findIndex((s) => s.status === 'in_progress') + 1}: ${taskSteps.find((s) => s.status === 'in_progress')?.name || 'Working...'}`
                  : isLoading ? 'King Mouse is thinking...' : 'Working...'}
              </div>
            </div>
            {/* Step counter */}
            {taskSteps.length > 0 && (
              <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>
                {taskSteps.filter((s) => s.status === 'completed').length + 1}/{taskSteps.length}
              </span>
            )}
            {/* Timer */}
            <span style={{ fontSize: 11, color: '#666', fontFamily: 'monospace', flexShrink: 0 }}>
              {formatElapsed(taskElapsed)}
            </span>
            {/* Status indicator */}
            <span style={{
              fontSize: 11,
              color: '#F07020',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#F07020',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
              {isLoading ? 'Thinking' : 'Working'}
            </span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  RIGHT PANEL — King Mouse's Computer (Manus-style slide-in)  */}
      {/* ============================================================ */}
      <div
        style={{
          width: computerPanelOpen ? 420 : 0,
          minWidth: computerPanelOpen ? 420 : 0,
          background: '#14141b',
          borderLeft: computerPanelOpen ? '1px solid #2a2a34' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.25s ease, min-width 0.25s ease',
        }}
      >
        {/* Panel header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2a2a34',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#1D9E75' }}><ComputerIcon /></span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>King Mouse&apos;s Computer</span>
          </div>
          <button
            onClick={() => { setComputerPanelOpen(false); setTakeControlMode(false); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Status bar */}
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid #2a2a34',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#aaa' }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: computerScreenshot.status === 'working' ? '#1D9E75' : computerScreenshot.status === 'idle' ? '#F59E0B' : '#EF4444',
            }} />
            {computerScreenshot.status === 'working' && 'KM is using Browser'}
            {computerScreenshot.status === 'idle' && 'Idle'}
            {computerScreenshot.status === 'offline' && 'Offline'}
          </div>
          {computerScreenshot.current_task && (
            <span style={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
              {computerScreenshot.current_task}
            </span>
          )}
        </div>

        {/* Live desktop stream */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            flex: 1,
            background: '#0a0a0f',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: takeControlMode ? 'crosshair' : 'default',
            border: takeControlMode ? '2px solid #F07020' : '2px solid transparent',
            margin: 8,
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            {computerScreenshot.image ? (
              <img
                ref={computerImgRef}
                src={computerScreenshot.image}
                alt="King Mouse's desktop"
                onClick={handlePanelScreenClick}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                draggable={false}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: 24 }}>
                <div style={{ marginBottom: 8 }}><ComputerIcon /></div>
                <div style={{ fontSize: 13 }}>
                  {computerScreenshot.status === 'offline' ? 'Computer offline' : 'Connecting...'}
                </div>
              </div>
            )}

            {/* Take control button in panel */}
            {computerScreenshot.image && (
              <button
                onClick={() => setTakeControlMode((p) => !p)}
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  background: takeControlMode ? '#F07020' : 'rgba(0,0,0,0.7)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <MousePointerIcon />
                {takeControlMode ? 'Release' : 'Take Control'}
              </button>
            )}

            {/* Idle overlay in panel */}
            {computerScreenshot.status === 'idle' && computerScreenshot.image && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(1px)',
              }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Idle</div>
              </div>
            )}
          </div>

          {/* Timeline scrubber placeholder */}
          <div style={{
            padding: '8px 16px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              flex: 1,
              height: 3,
              background: '#2a2a34',
              borderRadius: 2,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                right: 0,
                top: -3,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: computerScreenshot.status === 'working' ? '#1D9E75' : '#666',
              }} />
            </div>
            <span style={{
              fontSize: 11,
              color: computerScreenshot.status === 'working' ? '#1D9E75' : '#666',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {computerScreenshot.status === 'working' && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#1D9E75' }} />
              )}
              live
            </span>
          </div>
        </div>
      </div>

      {/* Global animation styles */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
