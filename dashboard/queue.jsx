// Mission Queue — the spine. Kanban + filters + drag-and-drop + live agents on cards.
const { useState: uSt_Q, useEffect: uEf_Q, useMemo: uMe_Q } = React;

// Persist user edits to task fields across refresh. Stored as
// { [taskId]: { title?, priority?, status?, agent?, cost?, estCost?,
//   impact?, complexity?, notes?, _deleted? } }. Apply on top of seeds
// + live cron after either source loads.
const TASK_PATCH_KEY = 'mc.taskPatches';
const TASK_ADDED_KEY = 'mc.addedTasks';
function readTaskPatches() {
  try { return JSON.parse(localStorage.getItem(TASK_PATCH_KEY) || '{}'); } catch { return {}; }
}
function writeTaskPatch(taskId, field, value) {
  const all = readTaskPatches();
  all[taskId] = { ...(all[taskId] || {}), [field]: value };
  try { localStorage.setItem(TASK_PATCH_KEY, JSON.stringify(all)); } catch {}
  if (window.mcPatchTask) window.mcPatchTask(taskId, { [field]: value }, { actor: 'dashboard' }).catch(e => console.warn('mcPatchTask failed', e));
}
function readAddedTasks() {
  try { return JSON.parse(localStorage.getItem(TASK_ADDED_KEY) || '[]'); } catch { return []; }
}
function writeAddedTask(task) {
  const all = readAddedTasks();
  all.push(task);
  try { localStorage.setItem(TASK_ADDED_KEY, JSON.stringify(all)); } catch {}
  if (window.mcAddTask) window.mcAddTask(task, { actor: 'dashboard' }).catch(e => console.warn('mcAddTask failed', e));
}
function applyTaskPatches(tasks) {
  const all = readTaskPatches();
  const merged = tasks.map(t => all[t.id] ? { ...t, ...all[t.id] } : t);
  // Mix in tasks the user added, with their own patches applied.
  for (const t of readAddedTasks()) {
    if (merged.find(x => x.id === t.id)) continue;
    merged.push(all[t.id] ? { ...t, ...all[t.id] } : t);
  }
  return merged;
}
window.applyTaskPatches = applyTaskPatches;
window.writeTaskPatch = writeTaskPatch;
window.writeAddedTask = writeAddedTask;

function getProduct(id) { return SEED_PRODUCTS.find(p => p.id === id); }
const ME_AGENT = { id: 'me', name: 'Me', role: 'Operator', tone: 'brand', mood: 'on it' };
function getAgent(id) {
  if (id === 'me') return ME_AGENT;
  return SEED_AGENTS.find(a => a.id === id);
}

// ---------------- Task Card ----------------
function TaskCard({ task, onDragStart, onDragEnd, onClick, dragging, ghost, dense }) {
  const product = getProduct(task.product);
  const agent = task.agent ? getAgent(task.agent) : null;
  const priorityTone = { urgent: 'critical', high: 'brand', normal: 'neutral', low: 'neutral' }[task.priority];
  const sourceIcon = task.source === 'idea' ? <Icons.Spark size={11}/> : task.source === 'resurfaced' ? <Icons.Refresh size={11}/> : <Icons.Plus size={11}/>;
  return (
    <div
      draggable
      onDragStart={(e)=>onDragStart(task, e)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`card-h ${dragging ? 'dragging' : ''} ${task.status==='in_progress'?'':''}`}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        padding: dense ? 10 : 12, cursor: 'grab', display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {task.status === 'in_progress' && agent && <div className="scan" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 10 }}/>}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ width: 18, height: 18, borderRadius: 5, background: `rgba(${product.tone==='brand'?'249,115,22':product.tone==='info'?'59,130,246':product.tone==='success'?'34,197,94':product.tone==='purple'?'168,85,247':product.tone==='pink'?'236,72,153':product.tone==='cyan'?'34,211,238':'160,160,168'},0.18)`, color: `var(--${product.tone==='neutral'?'fg-secondary':''})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{product.icon}</span>
        <div style={{ flex: 1, fontSize: 12.5, fontWeight: 700, lineHeight: 1.35, color: 'var(--fg-primary)', minWidth: 0 }}>{task.title}</div>
        {task.priority === 'urgent' && <Pill tone="critical" dot={false}><Icons.Bolt size={10}/></Pill>}
      </div>
      {task.status === 'in_progress' && (
        <div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${task.progress}%` }}/></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="term mono-num" style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>{task.progress}%</span>
            <span className="term mono-num" style={{ fontSize: 10, color: 'var(--fg-tertiary)' }}>${task.cost.toFixed(2)} / ${task.estCost.toFixed(2)}</span>
          </div>
        </div>
      )}
      {task.status !== 'in_progress' && (
        <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{sourceIcon}{task.source}</span>
          <span>·</span>
          <span className="mono-num">imp {task.impact}</span>
          <span>·</span>
          <span className="mono-num">{task.complexity}</span>
          {task.pr && (<><span>·</span><span style={{ color: task.pr.includes('merged')?'var(--success)':'var(--info)' }}>{task.pr.includes('merged')?'merged':'PR open'}</span></>)}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {agent ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px 2px 3px', background: 'var(--surface-elevated)', borderRadius: 999, border: '1px solid var(--border)' }}>
            <Avatar name={agent.name} size={16} tone={agent.tone}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-primary)' }}>{agent.name}</span>
            {task.status==='in_progress' && <span style={{ color: 'var(--accent)' }}><span className="tdot"/><span className="tdot"/><span className="tdot"/></span>}
          </div>
        ) : (
          <span className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', padding: '2px 7px', borderRadius: 999, border: '1px dashed var(--border-strong)' }}>unassigned</span>
        )}
        {task.convoy && <Pill tone="purple" dot={false}><Icons.Layers size={10}/> convoy</Pill>}
        <span style={{ flex: 1 }}/>
        <span className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)' }}>{task.age}</span>
      </div>
    </div>
  );
}

// ---------------- Column ----------------
function Column({ status, tasks, onDrop, onDragOver, dropTarget, onCardDragStart, onCardDragEnd, draggingId, onCardClick, dense, onAddTask }) {
  const totalCost = tasks.reduce((s, t) => s + t.cost, 0);
  return (
    <div
      onDragOver={(e)=>{ e.preventDefault(); onDragOver(status.id); }}
      onDrop={(e)=>{ e.preventDefault(); onDrop(status.id); }}
      className={dropTarget ? 'drop-target' : ''}
      style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: 8, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', minHeight: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 6px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: status.tone==='success'?'#22c55e':status.tone==='warning'?'#f59e0b':status.tone==='brand'?'var(--accent)':status.tone==='info'?'#3b82f6':status.tone==='purple'?'#a855f7':'var(--fg-tertiary)' }}/>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg-primary)', flex: 1 }}>{status.label}</div>
        <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 700 }}>{tasks.length}</span>
        {totalCost > 0 && <span className="term mono-num" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', borderLeft: '1px solid var(--border)', paddingLeft: 6 }}>${totalCost.toFixed(2)}</span>}
        <button onClick={()=>onAddTask(status.id)} className="btn-h" style={{ width: 18, height: 18, borderRadius: 4, background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg-tertiary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <Icons.Plus size={11}/>
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto', minHeight: 80 }}>
        {tasks.map(t => (
          <TaskCard key={t.id} task={t}
            onDragStart={onCardDragStart} onDragEnd={onCardDragEnd}
            dragging={draggingId === t.id}
            onClick={()=>onCardClick(t)}
            dense={dense}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{ padding: '24px 8px', textAlign: 'center', fontSize: 11.5, color: 'var(--fg-tertiary)', border: '1px dashed var(--border)', borderRadius: 8 }}>nothing in {status.label.toLowerCase()}</div>
        )}
      </div>
    </div>
  );
}

// ---------------- Filters Bar ----------------
function FiltersBar({ filter, setFilter, productFilter, setProductFilter, agentFilter, setAgentFilter, dense, setDense, onAdd }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderBottom: '1px solid var(--border)', background: 'var(--canvas)', overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icons.Filter size={13} style={{ color: 'var(--fg-tertiary)' }}/>
        {['all','urgent','mine','convoy'].map(f => (
          <Button key={f} variant="ghost" size="xs" active={filter===f} onClick={()=>setFilter(f)}>{f}</Button>
        ))}
      </div>
      <div style={{ width: 1, height: 18, background: 'var(--border)' }}/>
      <span className="section-label">Product</span>
      <select value={productFilter} onChange={e=>setProductFilter(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-primary)', height: 28, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
        <option value="all">All products</option>
        {SEED_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <span className="section-label">Agent</span>
      <select value={agentFilter} onChange={e=>setAgentFilter(e.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-primary)', height: 28, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
        <option value="all">All agents</option>
        <option value="unassigned">Unassigned</option>
        <option value="me">Me (Colton)</option>
        {SEED_AGENTS.map(a => <option key={a.id} value={a.id}>{a.name} · {a.role}</option>)}
      </select>
      <div style={{ flex: 1 }}/>
      <Button variant="ghost" size="xs" active={!dense} onClick={()=>setDense(false)}>Cozy</Button>
      <Button variant="ghost" size="xs" active={dense} onClick={()=>setDense(true)}>Dense</Button>
      <div style={{ width: 1, height: 18, background: 'var(--border)' }}/>
      <Button variant="primary" size="sm" icon={<Icons.Plus size={13}/>} onClick={()=>onAdd('inbox')}>New task</Button>
    </div>
  );
}

// ---------------- Mission Queue (page) ----------------
function MissionQueueScreen({ tasks, setTasks, onOpenTask }) {
  const [filter, setFilter] = uSt_Q('all');
  const [productFilter, setProductFilter] = uSt_Q('all');
  const [agentFilter, setAgentFilter] = uSt_Q('all');
  const [dense, setDense] = uSt_Q(false);
  const [dragId, setDragId] = uSt_Q(null);
  const [hoverCol, setHoverCol] = uSt_Q(null);

  const visible = uMe_Q(() => tasks.filter(t => {
    if (t.source === 'cron') return false;  // cron jobs live in their own view
    if (filter === 'urgent' && t.priority !== 'urgent' && t.priority !== 'high') return false;
    if (filter === 'mine' && t.agent !== 'me') return false;
    if (filter === 'convoy' && !t.convoy) return false;
    if (productFilter !== 'all' && t.product !== productFilter) return false;
    if (agentFilter === 'unassigned' && t.agent) return false;
    if (agentFilter !== 'all' && agentFilter !== 'unassigned' && t.agent !== agentFilter) return false;
    return true;
  }), [tasks, filter, productFilter, agentFilter]);

  const onCardDragStart = (task) => setDragId(task.id);
  const onCardDragEnd = () => { setDragId(null); setHoverCol(null); };
  const onDrop = (statusId) => {
    if (!dragId) return;
    setTasks(prev => prev.map(t => t.id === dragId ? { ...t, status: statusId } : t));
    writeTaskPatch(dragId, 'status', statusId);
    setDragId(null); setHoverCol(null);
  };

  const onAddTask = (statusId) => {
    const id = 't' + Date.now();
    const t = { id, title: 'New task — describe it', product: SEED_PRODUCTS[0]?.id || 'p1', status: statusId, agent: null, priority: 'normal', cost: 0, estCost: 0, source: 'manual', impact: 50, complexity: 'M', age: '0m', progress: 0, pr: null };
    setTasks(prev => [...prev, t]);
    writeAddedTask(t);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <FiltersBar filter={filter} setFilter={setFilter} productFilter={productFilter} setProductFilter={setProductFilter} agentFilter={agentFilter} setAgentFilter={setAgentFilter} dense={dense} setDense={setDense} onAdd={onAddTask}/>
      <div style={{ flex: 1, overflow: 'auto', padding: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 10, height: '100%', minHeight: 520 }}>
          {STATUSES.map(s => (
            <Column key={s.id} status={s}
              tasks={visible.filter(t => t.status === s.id)}
              onDrop={onDrop}
              onDragOver={setHoverCol}
              dropTarget={hoverCol === s.id && dragId}
              onCardDragStart={onCardDragStart}
              onCardDragEnd={onCardDragEnd}
              draggingId={dragId}
              onCardClick={onOpenTask}
              dense={dense}
              onAddTask={onAddTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Task Detail Modal ----------------
function TaskDetail({ task, onClose, agents, tasks, setTasks }) {
  if (!task) return null;
  const product = getProduct(task.product);
  const agent = task.agent ? getAgent(task.agent) : null;
  const oc = (typeof useOpenClaw === 'function') ? useOpenClaw() : null;
  const [editingTitle, setEditingTitle] = uSt_Q(false);
  const [titleDraft, setTitleDraft] = uSt_Q(task.title);
  uEf_Q(() => { setTitleDraft(task.title); setEditingTitle(false); }, [task.id]);

  // Update React state AND persist patch to localStorage so the edit
  // survives refresh + survives the next live-cron poll overwriting tasks.
  const patch = (field, value) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, [field]: value } : t));
    writeTaskPatch(task.id, field, value);
  };

  const commitTitle = () => {
    const v = titleDraft.trim();
    if (v && v !== task.title) patch('title', v);
    setEditingTitle(false);
  };

  const dispatch = async () => {
    if (!task.cronId || !oc?.call) return;
    try { await oc.call('cron.run', { id: task.cronId }); } catch (e) { console.warn('cron.run failed', e); }
  };
  const pauseToggle = async () => {
    if (!task.cronId || !oc?.call) return;
    const isEnabled = task.cron?.enabled ?? task.priority !== 'low';
    try { await oc.call('cron.update', { id: task.cronId, patch: { enabled: !isEnabled } }); } catch (e) { console.warn('cron.update failed', e); }
  };
  const localAction = async (action) => {
    const statusByAction = { approve: 'done', deny: 'review', defer: 'planning' };
    const patchBody = { lastAction: action, actionedAt: new Date().toISOString() };
    if (statusByAction[action]) patchBody.status = statusByAction[action];
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...patchBody } : t));
    if (window.mcTaskAction) {
      try { await window.mcTaskAction(task.id, action, { actor: 'dashboard', title: task.title }); }
      catch (e) { console.warn('mcTaskAction failed', e); }
    } else {
      Object.entries(patchBody).forEach(([k, v]) => writeTaskPatch(task.id, k, v));
    }
  };

  // Pull this task's real activity from the live event rail, if any.
  const ocEvents = (oc?.events || []).filter(e => task.cronId && e.task === task.cronId).slice(0, 8);

  const numInput = (val, onCommit, opts = {}) => (
    <input
      type="number" defaultValue={val} step={opts.step || 1} min={opts.min} max={opts.max}
      onBlur={e => { const n = Number(e.target.value); if (!Number.isNaN(n) && n !== val) onCommit(n); }}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-primary)', height: 28, padding: '0 8px', fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, outline: 'none' }}
    />
  );
  const textSelect = (val, options, onCommit) => (
    <select value={val} onChange={e => onCommit(e.target.value)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-primary)', height: 30, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="backdrop" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-popover)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ width: 28, height: 28, borderRadius: 7, background: `rgba(${product.tone==='brand'?'249,115,22':product.tone==='info'?'59,130,246':product.tone==='success'?'34,197,94':product.tone==='purple'?'168,85,247':product.tone==='pink'?'236,72,153':product.tone==='cyan'?'34,211,238':'160,160,168'},0.18)`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{product.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{product.name} · task {task.id}</div>
            {editingTitle ? (
              <input
                autoFocus value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleDraft(task.title); setEditingTitle(false); } }}
                style={{ width: '100%', background: 'var(--canvas)', border: '1px solid var(--accent)', borderRadius: 6, color: 'var(--fg-primary)', height: 32, padding: '0 8px', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }}
              />
            ) : (
              <div onClick={() => setEditingTitle(true)} title="Click to rename" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, cursor: 'text', padding: '2px 4px', marginLeft: -4, borderRadius: 4 }}>{task.title}</div>
            )}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.X size={14}/></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 18, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>Pipeline</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {STATUSES.map((s, i) => {
                  const idx = STATUSES.findIndex(x => x.id === task.status);
                  const passed = i <= idx;
                  return (
                    <React.Fragment key={s.id}>
                      <button onClick={()=>patch('status', s.id)} style={{ background: passed ? `rgba(249,115,22,${i===idx?0.25:0.12})` : 'var(--surface)', border: `1px solid ${i===idx?'var(--accent)':'var(--border)'}`, color: passed?'var(--fg-primary)':'var(--fg-tertiary)', padding: '6px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {s.label}
                      </button>
                      {i < STATUSES.length - 1 && <span style={{ flex: 1, height: 1, background: passed ? 'var(--accent)' : 'var(--border)', opacity: 0.4 }}/>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>Notes</div>
              <textarea
                defaultValue={task.notes || ''}
                onBlur={e => { const v = e.target.value; if (v !== (task.notes || '')) patch('notes', v); }}
                placeholder="Notes for this task — saves on blur"
                rows={4}
                style={{ width: '100%', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--fg-primary)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.4 }}
              />
            </div>

            <div>
              <div className="section-label" style={{ marginBottom: 8 }}>Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                {ocEvents.length === 0 && <div style={{ color: 'var(--fg-tertiary)', fontStyle: 'italic' }}>No runs yet for this task.</div>}
                {ocEvents.map((e, i) => (
                  <div key={e.id || i} style={{ display: 'flex', gap: 10 }}>
                    <span className="term mono-num" style={{ fontSize: 11, color: 'var(--fg-tertiary)', width: 56 }}>{e.t}</span>
                    <span style={{ color: 'var(--fg-secondary)' }}>{e.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DetailField label="Status">
              {textSelect(task.status, STATUSES.map(s => s.id), v => patch('status', v))}
            </DetailField>
            <DetailField label="Priority">
              {textSelect(task.priority, ['low','normal','high','urgent'], v => patch('priority', v))}
            </DetailField>
            <DetailField label="Product">
              {textSelect(task.product, SEED_PRODUCTS.map(p => p.id), v => patch('product', v))}
            </DetailField>
            <DetailField label="Agent">
              <select value={task.agent || ''} onChange={e => patch('agent', e.target.value || null)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--fg-primary)', height: 30, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', fontWeight: 500 }}>
                <option value="">Unassigned</option>
                <option value="me">Me (Colton)</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} · {a.role}</option>)}
              </select>
              {task.agent !== 'me' && (
                <button onClick={() => patch('agent', 'me')} style={{ marginTop: 6, width: '100%', background: 'transparent', border: '1px dashed var(--border-strong)', borderRadius: 6, color: 'var(--fg-secondary)', height: 26, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Assign to me
                </button>
              )}
            </DetailField>
            <DetailField label="Cost">{numInput(task.cost, v => patch('cost', v), { step: 0.01, min: 0 })}</DetailField>
            <DetailField label="Est cost">{numInput(task.estCost, v => patch('estCost', v), { step: 0.01, min: 0 })}</DetailField>
            <DetailField label="Impact (0–100)">{numInput(task.impact, v => patch('impact', v), { min: 0, max: 100 })}</DetailField>
            <DetailField label="Complexity">
              {textSelect(task.complexity, ['S','M','L','XL'], v => patch('complexity', v))}
            </DetailField>
            <DetailField label="Source"><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>{task.source}</div></DetailField>
            {task.pr && <DetailField label="PR"><div style={{ fontSize: 12, fontWeight: 700, color: task.pr.includes('merged')?'var(--success)':'var(--info)' }}>{task.pr}</div></DetailField>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              <Button variant="primary" size="sm" icon={<Icons.Check size={13}/>} onClick={() => localAction('approve')}>Approve / ship</Button>
              <Button variant="ghost" size="sm" icon={<Icons.Refresh size={13}/>} onClick={() => localAction('defer')}>Defer</Button>
              <Button variant="ghost" size="sm" icon={<Icons.X size={13}/>} onClick={() => localAction('deny')}>Deny / needs edit</Button>
              <Button variant="primary" size="sm" icon={<Icons.Bolt size={13}/>} onClick={dispatch} disabled={!task.cronId} title={!task.cronId ? 'Only cron-backed tasks can be dispatched' : ''}>Dispatch now</Button>
              <Button variant="ghost" size="sm" icon={<Icons.Pause size={13}/>} onClick={pauseToggle} disabled={!task.cronId} title={!task.cronId ? 'Only cron-backed tasks can be paused' : ''}>Pause</Button>
              <Button variant="danger" size="sm" icon={<Icons.X size={13}/>} onClick={() => { if (confirm('Delete this task?')) { setTasks(prev => prev.filter(t => t.id !== task.id)); writeTaskPatch(task.id, '_deleted', true); onClose(); } }}>Delete task</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, children }) {
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 4 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function ChatMsg({ from, agent, text, time }) {
  const isOp = from === 'op';
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      {isOp ? <Avatar name="Colton Harris" size={22} tone="brand"/> : <Avatar name={agent?.name} size={22} tone={agent?.tone || 'info'}/>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontWeight: 700, marginBottom: 2 }}>
          {isOp ? 'You' : agent?.name} <span className="term" style={{ fontWeight: 500, marginLeft: 4 }}>{time}</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--fg-primary)', lineHeight: 1.4 }}>{text}</div>
      </div>
    </div>
  );
}

Object.assign(window, { MissionQueueScreen, TaskDetail, TaskCard });
