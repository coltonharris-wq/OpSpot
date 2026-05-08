'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';

type FilterTab = 'all' | 'active' | 'completed' | 'scheduled';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  type: string;
  hours_used: number;
  created_at: string;
  run_at?: string;
  source: 'completed' | 'scheduled';
}

const TYPE_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  auto: { bg: '#E1F5EE', text: '#0F6E56' },
  manual: { bg: '#FAEEDA', text: '#854F0B' },
  urgent: { bg: '#FCEBEB', text: '#A32D2D' },
  scheduled: { bg: '#E8F0FE', text: '#2563EB' },
  king_mouse_task: { bg: '#E1F5EE', text: '#0F6E56' },
  king_mouse_chat: { bg: '#FAEEDA', text: '#854F0B' },
};

const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: '#E8F0FE', text: '#2563EB' },
  running: { bg: '#E8F0FE', text: '#2563EB' },
  completed: { bg: '#E1F5EE', text: '#0F6E56' },
  scheduled: { bg: '#FAEEDA', text: '#854F0B' },
  pending: { bg: '#FAEEDA', text: '#854F0B' },
  processing: { bg: '#E8F0FE', text: '#2563EB' },
  failed: { bg: '#FCEBEB', text: '#A32D2D' },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [scheduleToggle, setScheduleToggle] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchTasks = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) return;

      const json = await res.json();
      if (json.success && json.data?.tasks) {
        setTasks(json.data.tasks);

        const alreadyCompleted = new Set<string>(
          json.data.tasks
            .filter((t: Task) => t.status === 'completed')
            .map((t: Task) => t.id)
        );
        setCompletedIds(alreadyCompleted);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSubmitError('Not authenticated');
        return;
      }

      const payload: { title: string; description: string; schedule_at?: string } = {
        title: newTitle.trim(),
        description: newDescription.trim(),
      };

      if (scheduleToggle && scheduleDate) {
        payload.schedule_at = new Date(scheduleDate).toISOString();
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setSubmitError(json.error || json.message || 'Failed to create task');
        return;
      }

      // Reset form and close modal
      setNewTitle('');
      setNewDescription('');
      setScheduleToggle(false);
      setScheduleDate('');
      setShowNewTask(false);

      // Refresh task list
      setLoading(true);
      await fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getEffectiveStatus = (task: Task): string => {
    if (completedIds.has(task.id)) return 'completed';
    if (task.source === 'scheduled' && (task.status === 'pending' || task.status === 'scheduled')) return 'scheduled';
    if (task.status === 'processing') return 'active';
    if (task.status === 'completed' && !completedIds.has(task.id)) return task.status;
    return task.status;
  };

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => {
        const effective = getEffectiveStatus(t);
        return effective === filter;
      });

  const totalCount = tasks.length;
  const activeCount = tasks.filter((t) => getEffectiveStatus(t) === 'active').length;
  const completedCount = tasks.filter((t) => getEffectiveStatus(t) === 'completed').length;
  const scheduledCount = tasks.filter((t) => getEffectiveStatus(t) === 'scheduled').length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'scheduled', label: 'Scheduled' },
  ];

  const statBoxStyle: React.CSSProperties = {
    background: '#fff',
    border: '0.5px solid #e8e8e4',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 0,
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#888',
    margin: 0,
    lineHeight: 1.4,
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 500,
    color: '#1a1a1a',
    margin: 0,
    lineHeight: 1.3,
  };

  if (loading) {
    return (
      <div style={{
        padding: 20,
        background: '#f6f6f4',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ fontSize: 16, color: '#888' }}>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, background: '#f6f6f4', minHeight: '100vh' }}>
      {/* Header with New Task button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Tasks</h1>
        <button
          onClick={() => setShowNewTask(true)}
          style={{
            padding: '10px 20px',
            background: '#F07020',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          + New Task
        </button>
      </div>

      {/* New Task Modal Overlay */}
      {showNewTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewTask(false);
          }}
        >
          <div style={{
            background: '#fff',
            border: '0.5px solid #e8e8e4',
            borderRadius: 12,
            padding: 28,
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a', margin: '0 0 20px 0' }}>
              New Task
            </h2>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }}>
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '0.5px solid #e8e8e4',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#1a1a1a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#F07020'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e8e8e4'; }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Provide details about the task..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '0.5px solid #e8e8e4',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#1a1a1a',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#F07020'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e8e8e4'; }}
              />
            </div>

            {/* Schedule toggle */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                onClick={() => setScheduleToggle(!scheduleToggle)}
              >
                <div style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  background: scheduleToggle ? '#F07020' : '#ddd',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: '#fff',
                    position: 'absolute',
                    top: 2,
                    left: scheduleToggle ? 18 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>
                  Schedule for later
                </span>
              </div>

              {scheduleToggle && (
                <div style={{ marginTop: 10 }}>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '0.5px solid #e8e8e4',
                      borderRadius: 8,
                      fontSize: 14,
                      color: '#1a1a1a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#F07020'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e8e8e4'; }}
                  />
                </div>
              )}
            </div>

            {/* Error message */}
            {submitError && (
              <div style={{
                padding: '10px 14px',
                background: '#FCEBEB',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                color: '#A32D2D',
              }}>
                {submitError}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => {
                  setShowNewTask(false);
                  setNewTitle('');
                  setNewDescription('');
                  setScheduleToggle(false);
                  setScheduleDate('');
                  setSubmitError('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f0f0ec',
                  color: '#555',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e8e8e4'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f0f0ec'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={submitting || !newTitle.trim()}
                style={{
                  padding: '10px 20px',
                  background: (!newTitle.trim() || submitting) ? '#ccc' : '#F07020',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: (!newTitle.trim() || submitting) ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (newTitle.trim() && !submitting) {
                    (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                }}
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={statBoxStyle}>
          <p style={statLabelStyle}>Total tasks</p>
          <p style={statValueStyle}>{totalCount}</p>
        </div>
        <div style={statBoxStyle}>
          <p style={statLabelStyle}>Active</p>
          <p style={statValueStyle}>{activeCount}</p>
        </div>
        <div style={statBoxStyle}>
          <p style={statLabelStyle}>Completed</p>
          <p style={statValueStyle}>{completedCount}</p>
        </div>
        <div style={statBoxStyle}>
          <p style={statLabelStyle}>Scheduled</p>
          <p style={statValueStyle}>{scheduledCount}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {tabs.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'background 0.15s, color 0.15s',
                background: isActive ? '#1e2a3a' : 'transparent',
                color: isActive ? '#fff' : '#888',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#f0f0ec';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div style={{
          background: '#fff',
          border: '0.5px solid #e8e8e4',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
            {filter === 'all' ? 'No tasks yet.' : `No ${filter} tasks.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTasks.map((task) => {
            const isCompleted = completedIds.has(task.id);
            const effectiveStatus = getEffectiveStatus(task);
            const typeLower = task.type.toLowerCase();
            const typeStyle = TYPE_BADGE_STYLES[typeLower] || TYPE_BADGE_STYLES.auto;
            const statusStyle = STATUS_BADGE_STYLES[effectiveStatus] || STATUS_BADGE_STYLES.active;

            const displayStatus = effectiveStatus === 'pending' ? 'Scheduled'
              : effectiveStatus === 'processing' ? 'Running'
              : effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1);

            const displayType = typeLower === 'king_mouse_task' ? 'Task'
              : typeLower === 'king_mouse_chat' ? 'Chat'
              : typeLower.charAt(0).toUpperCase() + typeLower.slice(1);

            return (
              <div
                key={task.id}
                style={{
                  background: '#fff',
                  border: '0.5px solid #e8e8e4',
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  opacity: isCompleted ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Checkbox */}
                <div
                  onClick={() => toggleComplete(task.id)}
                  style={{
                    width: 18,
                    height: 18,
                    border: isCompleted ? 'none' : '0.5px solid #ccc',
                    borderRadius: 4,
                    background: isCompleted ? '#1D9E75' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                    transition: 'background 0.15s',
                  }}
                >
                  {isCompleted && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="#fff"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#1a1a1a',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                    }}>
                      {task.title}
                    </span>

                    {/* Type badge */}
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: typeStyle.bg,
                      color: typeStyle.text,
                      whiteSpace: 'nowrap',
                    }}>
                      {displayType}
                    </span>

                    {/* Status badge */}
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      whiteSpace: 'nowrap',
                    }}>
                      {displayStatus}
                    </span>
                  </div>

                  {task.description && (
                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                      {task.description}
                    </p>
                  )}

                  {/* Show scheduled time for scheduled tasks */}
                  {task.run_at && (task.status === 'pending' || task.status === 'scheduled') && (
                    <p style={{ fontSize: 12, color: '#2563EB', margin: '4px 0 0 0' }}>
                      Scheduled: {new Date(task.run_at).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Right side: hours + date */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  {task.hours_used > 0 && (
                    <span style={{ fontSize: 13, color: '#888' }}>
                      {task.hours_used.toFixed(2)}h
                    </span>
                  )}
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                    {new Date(task.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
