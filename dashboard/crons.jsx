// Crons — recurring scheduled jobs from the OpenClaw gateway.
// Lives separate from Mission Queue (which is for one-shot user tasks).
const { useState: uSt_C, useMemo: uMe_C } = React;

function fmtEvery(ms) {
  if (!ms) return 'on demand';
  if (ms < 60_000) return Math.round(ms / 1000) + 's';
  if (ms < 3_600_000) return Math.round(ms / 60_000) + 'm';
  if (ms < 86_400_000) return Math.round(ms / 3_600_000) + 'h';
  return Math.round(ms / 86_400_000) + 'd';
}
function fmtNext(ms) {
  if (!ms) return '—';
  const d = ms - Date.now();
  if (d <= 0) return 'due';
  if (d < 60_000) return 'in ' + Math.round(d / 1000) + 's';
  if (d < 3_600_000) return 'in ' + Math.round(d / 60_000) + 'm';
  if (d < 86_400_000) return 'in ' + Math.round(d / 3_600_000) + 'h';
  return 'in ' + Math.round(d / 86_400_000) + 'd';
}

function CronRow({ task, onRun, onPauseToggle, onClick }) {
  const product = SEED_PRODUCTS.find(p => p.id === task.product);
  const agent = task.agent ? SEED_AGENTS.find(a => a.id === task.agent) : null;
  const lastStatus = task.cron?.lastRunStatus;
  const failed = lastStatus === 'failed' || lastStatus === 'error';
  const paused = task.cron?.enabled === false || (task.cron?.enabled == null && task.priority === 'low');
  return (
    <div onClick={onClick} className="card-h" style={{
      display: 'grid', gridTemplateColumns: '22px 1fr 110px 140px 130px 120px',
      alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
      cursor: 'pointer',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 5,
        background: failed ? 'rgba(239,68,68,0.18)' : paused ? 'rgba(160,160,168,0.18)' : 'rgba(34,197,94,0.18)',
        color: failed ? '#ef4444' : paused ? 'var(--fg-tertiary)' : '#22c55e',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-mono)',
      }}>{product?.icon || '·'}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
        <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', marginTop: 2, display: 'flex', gap: 8 }}>
          <span>{product?.name || '—'}</span>
          {agent && <><span>·</span><span>{agent.name}</span></>}
        </div>
      </div>
      <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>every {fmtEvery(task.cron?.everyMs)}</span>
      <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>next {fmtNext(task.cron?.nextRunAtMs)}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: failed ? 'var(--critical)' : paused ? 'var(--fg-tertiary)' : 'var(--success)' }}>
        {failed ? 'last: failed' : paused ? 'paused' : 'healthy'}
      </span>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button onClick={(e)=>{ e.stopPropagation(); onRun(task); }} className="btn-h" style={{
          height: 24, padding: '0 8px', borderRadius: 5, background: 'var(--surface-elevated)',
          border: '1px solid var(--border)', color: 'var(--fg-primary)',
          fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <Icons.Bolt size={10}/> Run
        </button>
        <button onClick={(e)=>{ e.stopPropagation(); onPauseToggle(task); }} className="btn-h" style={{
          height: 24, padding: '0 8px', borderRadius: 5, background: 'transparent',
          border: '1px solid var(--border)', color: 'var(--fg-tertiary)',
          fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {paused ? <><Icons.Play size={10}/> Resume</> : <><Icons.Pause size={10}/> Pause</>}
        </button>
      </div>
    </div>
  );
}

function CronsScreen({ tasks, onOpenTask }) {
  const [agentFilter, setAgentFilter] = uSt_C('all');
  const [statusFilter, setStatusFilter] = uSt_C('all');
  const oc = (typeof useOpenClaw === 'function') ? useOpenClaw() : null;

  const crons = uMe_C(() => tasks.filter(t => t.source === 'cron'), [tasks]);
  const cronState = (t) => {
    const s = t.cron?.lastRunStatus;
    const failed = s === 'failed' || s === 'error';
    const paused = t.cron?.enabled === false || (t.cron?.enabled == null && t.priority === 'low');
    return { failed, paused };
  };

  const visible = uMe_C(() => crons.filter(t => {
    if (agentFilter !== 'all' && t.agent !== agentFilter) return false;
    const { failed, paused } = cronState(t);
    if (statusFilter === 'failed' && !failed) return false;
    if (statusFilter === 'paused' && !paused) return false;
    if (statusFilter === 'healthy' && (failed || paused)) return false;
    return true;
  }), [crons, agentFilter, statusFilter]);

  const totals = uMe_C(() => {
    let healthy = 0, failed = 0, paused = 0;
    for (const t of crons) {
      const st = cronState(t);
      if (st.failed) failed++;
      else if (st.paused) paused++;
      else healthy++;
    }
    return { total: crons.length, healthy, failed, paused };
  }, [crons]);

  const runCron = async (task) => {
    if (!task.cronId || !oc?.call) return;
    try { await oc.call('cron.run', { id: task.cronId }); } catch (e) { console.warn('cron.run failed', e); }
  };
  const pauseToggleCron = async (task) => {
    if (!task.cronId || !oc?.call) return;
    const isEnabled = task.cron?.enabled ?? task.priority !== 'low';
    try { await oc.call('cron.update', { id: task.cronId, patch: { enabled: !isEnabled } }); } catch (e) { console.warn('cron.update failed', e); }
  };

  // Group by agent for readability
  const byAgent = uMe_C(() => {
    const m = new Map();
    for (const t of visible) {
      const k = t.agent || 'unassigned';
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(t);
    }
    return Array.from(m.entries());
  }, [visible]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--canvas)' }}>
        <Icons.Refresh size={14} style={{ color: 'var(--fg-secondary)' }}/>
        <div style={{ display: 'flex', gap: 12 }}>
          <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 700 }}>TOTAL <span style={{ color: 'var(--fg-primary)', marginLeft: 4 }}>{totals.total}</span></span>
          <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 700 }}>HEALTHY <span style={{ color: 'var(--success)', marginLeft: 4 }}>{totals.healthy}</span></span>
          <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 700 }}>FAILED <span style={{ color: 'var(--critical)', marginLeft: 4 }}>{totals.failed}</span></span>
          <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 700 }}>PAUSED <span style={{ color: 'var(--fg-secondary)', marginLeft: 4 }}>{totals.paused}</span></span>
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--border)' }}/>
        {['all','healthy','failed','paused'].map(s => (
          <Button key={s} variant="ghost" size="xs" active={statusFilter===s} onClick={()=>setStatusFilter(s)}>{s}</Button>
        ))}
        <div style={{ width: 1, height: 18, background: 'var(--border)' }}/>
        <span className="section-label">Agent</span>
        <select value={agentFilter} onChange={e=>setAgentFilter(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-primary)', height: 28, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
          <option value="all">All agents</option>
          {SEED_AGENTS.map(a => <option key={a.id} value={a.id}>{a.name} · {a.role}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {byAgent.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 10 }}>
            No crons match these filters.
          </div>
        )}
        {byAgent.map(([agentId, list]) => {
          const agent = agentId !== 'unassigned' ? SEED_AGENTS.find(a => a.id === agentId) : null;
          return (
            <div key={agentId} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {agent ? <Avatar name={agent.name} size={20} tone={agent.tone}/> : <span style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--surface)', border: '1px dashed var(--border-strong)' }}/>}
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--fg-primary)' }}>{agent?.name || 'Unassigned'}</div>
                <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{list.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.map(t => (
                  <CronRow key={t.id} task={t} onRun={runCron} onPauseToggle={pauseToggleCron} onClick={()=>onOpenTask(t)}/>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { CronsScreen });
