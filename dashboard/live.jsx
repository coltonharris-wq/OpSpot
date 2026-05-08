// live.jsx — wire the cockpit to a real OpenClaw gateway via the local proxy.
// Falls back to seed data on connect failure so the page never goes blank.

(function () {
  const BOOT = window.__MC_BOOT__ || { proxyPath: '/oc', hasToken: false };

  // ── role mapping: agent id → cockpit "role" + tone (palette cycle) ────────
  const ROLE_MAP = {
    'mouse-ceo':              { role: 'CEO',         tone: 'brand'   },
    'backend-builder':        { role: 'Builder',     tone: 'brand'   },
    'frontend-builder':       { role: 'Builder',     tone: 'pink'    },
    'builder-cto':            { role: 'CTO',         tone: 'purple'  },
    'ops-automation':         { role: 'Operator',    tone: 'info'    },
    'sales-engine-ceo-codex': { role: 'Sales',       tone: 'cyan'    },
    'young-dolph':            { role: 'Closer',      tone: 'success' },
    'research-agent-marley':  { role: 'Researcher',  tone: 'success' },
  };
  const PALETTE = ['brand', 'info', 'success', 'purple', 'pink', 'cyan'];

  function shortModel(m) {
    if (!m) return 'unknown';
    return String(m).split('/').pop();
  }
  function ageMs(ms) {
    if (!ms) return '—';
    const d = Date.now() - ms;
    if (d < 60_000)         return Math.floor(d/1000) + 's';
    if (d < 3_600_000)      return Math.floor(d/60_000) + 'm';
    if (d < 86_400_000)     return Math.floor(d/3_600_000) + 'h';
    return Math.floor(d/86_400_000) + 'd';
  }

  // ── client ────────────────────────────────────────────────────────────────
  function GatewayClient(url, onEvent) {
    const pending = new Map();
    let ws = null, ready = false, retryDelay = 1000;
    const queue = [];
    const listeners = new Set();
    const status = { connected: false, error: null, version: null };

    const emit = () => listeners.forEach(fn => fn(status));

    function call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
        pending.set(id, { resolve, reject });
        const frame = JSON.stringify({ type: 'req', id, method, params });
        // Send when the socket is OPEN — the connect handshake itself goes
        // through this path before `ready` flips, so guarding on `ready` would
        // deadlock the bootstrap.
        if (ws && ws.readyState === 1) ws.send(frame);
        else queue.push(frame);
        setTimeout(() => {
          if (pending.has(id)) { pending.delete(id); reject(new Error('timeout: ' + method)); }
        }, 8000);
      });
    }

    function open() {
      ws = new WebSocket(url);
      ws.addEventListener('open', () => { /* wait for challenge */ });
      ws.addEventListener('message', async (e) => {
        let m; try { m = JSON.parse(e.data); } catch { return; }
        if (m.type === 'event' && m.event === 'connect.challenge') {
          try {
            const hello = await call('connect', {
              minProtocol: 3, maxProtocol: 3,
              client: {
                id: 'openclaw-control-ui', version: 'mission-control', platform: 'web',
                mode: 'webchat',
                instanceId: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
              },
              role: 'operator', scopes: ['operator.admin'],
              caps: ['tool-events'],
              auth: {},  // proxy injects the token
              userAgent: navigator.userAgent, locale: navigator.language,
            });
            ready = true;
            status.connected = true;
            status.error = null;
            status.version = hello?.gateway?.version || null;
            retryDelay = 1000;
            emit();
            for (const f of queue) ws.send(f);
            queue.length = 0;
          } catch (err) {
            status.error = String(err.message || err);
            emit();
          }
          return;
        }
        if (m.type === 'event' && onEvent) onEvent(m);
        if (m.type === 'res') {
          const p = pending.get(m.id); if (!p) return;
          pending.delete(m.id);
          if (m.ok) p.resolve(m.payload); else p.reject(new Error((m.error && m.error.message) || 'rpc error'));
        }
      });
      ws.addEventListener('close', () => {
        ready = false; status.connected = false; emit();
        // reconnect with backoff
        setTimeout(open, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 15000);
      });
      ws.addEventListener('error', () => {
        status.error = 'gateway unreachable'; emit();
      });
    }

    open();
    return {
      call,
      onStatus(fn) { listeners.add(fn); fn(status); return () => listeners.delete(fn); },
      get status() { return status; },
    };
  }

  // ── React provider ────────────────────────────────────────────────────────
  const { useState, useEffect, useRef } = React;
  const OpenClawCtx = React.createContext({ live: false, agents: null, tasks: null, status: null, events: null });

  function OpenClawProvider({ children }) {
    const [state, setState] = useState({ live: false, agents: null, tasks: null, status: null, error: null, events: [] });
    const clientRef = useRef(null);
    const agentsRef = useRef([]);
    const jobsRef = useRef(new Map());

    useEffect(() => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${location.host}${BOOT.proxyPath || '/oc'}`;
      const fmtT = (ms) => {
        const d = new Date(ms || Date.now());
        return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2,'0')).join(':');
      };
      const toneFor = (ev) => {
        if (ev.event === 'cron') {
          if (ev.payload?.status === 'failed' || ev.payload?.status === 'error') return 'critical';
          if (ev.payload?.action === 'started') return 'brand';
          return 'success';
        }
        return 'info';
      };
      const eventToActivity = (ev) => {
        if (ev.event !== 'cron') return null;
        const p = ev.payload || {};
        const fromJobs = jobsRef.current.get(p.jobId) || {};
        const agentId = p.sessionKey?.split(':')?.[1] || fromJobs.agentId || null;
        const agentName = agentsRef.current.find(a => a.id === agentId)?.name || agentId || 'gateway';
        const tok = p.usage?.total_tokens ? ` · ${(p.usage.total_tokens/1000).toFixed(1)}k tok` : '';
        const dur = p.durationMs ? ` · ${(p.durationMs/1000).toFixed(1)}s` : '';
        const model = p.model ? ` · ${p.model}` : '';
        const job = p.jobName || fromJobs.name || (p.jobId || '').slice(0, 8);
        return {
          id: `oc-live-${p.jobId}-${p.runAtMs || Date.now()}-${Math.random().toString(36).slice(2,6)}`,
          t: fmtT(p.runAtMs),
          agent: agentId, task: p.jobId,
          msg: `${agentName} · ${job} ${p.action}${dur}${tok}${model}`,
          tone: toneFor(ev),
        };
      };
      const onEvent = (ev) => {
        const entry = eventToActivity(ev);
        if (!entry) return;
        setState(s => ({ ...s, events: [entry, ...(s.events || [])].slice(0, 60) }));
      };
      const c = GatewayClient(url, onEvent);
      clientRef.current = c;

      let cancelled = false;
      const refresh = async () => {
        if (!c.status.connected) return;
        try {
          const [agentsRaw, statusRaw, cronRaw, runsRaw, vaultLeads, vaultRepos, vaultBuilt] = await Promise.all([
            c.call('agents.list'),
            c.call('status'),
            c.call('cron.list').catch(() => ({ jobs: [] })),
            c.call('cron.runs').catch(() => ({ entries: [] })),
            fetch('/__vault/leads').then(r => r.ok ? r.json() : { leads: [] }).catch(() => ({ leads: [] })),
            fetch('/__vault/repos').then(r => r.ok ? r.json() : { repos: [] }).catch(() => ({ repos: [] })),
            fetch('/__vault/built').then(r => r.ok ? r.json() : { entries: [] }).catch(() => ({ entries: [] })),
          ]);
          if (cancelled) return;

          const heartbeat = new Map((statusRaw?.heartbeat?.agents || []).map(h => [h.agentId, h]));
          const cronByAgent = new Map();
          for (const j of (cronRaw?.jobs || [])) {
            if (!cronByAgent.has(j.agentId)) cronByAgent.set(j.agentId, []);
            cronByAgent.get(j.agentId).push(j);
          }

          // Approximate $/day from cron.runs token usage in last 24h.
          // Per-1M-token blended rates (rough public pricing — accurate enough
          // for an at-a-glance cockpit number, not a finance report).
          const RATE_PER_M = (model) => {
            const m = String(model || '').toLowerCase();
            if (m.includes('opus'))   return 30;
            if (m.includes('sonnet')) return 9;
            if (m.includes('haiku'))  return 2;
            if (m.includes('gpt-5'))  return 8;
            if (m.includes('kimi'))   return 1;
            return 5;
          };
          const dayAgo = Date.now() - 86_400_000;
          const costByAgent = new Map();
          const runsByAgent = new Map();
          for (const r of (runsRaw?.entries || [])) {
            const ts = r.runAtMs || r.ts || 0;
            if (ts < dayAgo) continue;
            const agentId = r.sessionKey?.split(':')?.[1];
            if (!agentId) continue;
            const tok = r.usage?.total_tokens || 0;
            const cost = (tok / 1_000_000) * RATE_PER_M(r.model);
            costByAgent.set(agentId, (costByAgent.get(agentId) || 0) + cost);
            runsByAgent.set(agentId, (runsByAgent.get(agentId) || 0) + 1);
          }

          const agents = (agentsRaw?.agents || []).map((a, i) => {
            const map = ROLE_MAP[a.id] || { role: 'Agent', tone: PALETTE[i % PALETTE.length] };
            const hb = heartbeat.get(a.id);
            const jobs = cronByAgent.get(a.id) || [];
            const enabled = jobs.some(j => j.enabled);
            const lastOk = Math.max(0, ...jobs.map(j => j.state?.lastRunAtMs || 0));
            const lastErr = jobs.some(j => j.state?.lastRunStatus && j.state.lastRunStatus !== 'ok');
            return {
              id: a.id,
              name: a.identity?.name || a.name || a.id,
              role: map.role,
              model: shortModel(a.model?.primary),
              tone: map.tone,
              health: lastErr ? 'stalled' : (enabled || hb?.enabled ? 'working' : 'idle'),
              task: jobs[0]?.name || null,
              mood: jobs.length
                ? `${jobs.length} cron · last run ${ageMs(lastOk)} ago`
                : (a.id === statusRaw?.heartbeat?.defaultAgentId ? 'standing by' : 'idle'),
              cpu: enabled ? 40 + Math.floor(Math.random() * 50) : 0,
              cost: costByAgent.get(a.id) || 0,
              tasksDone: runsByAgent.get(a.id) || jobs.length,
              workspace: a.workspace,
              modelFallbacks: (a.model?.fallbacks || []).map(shortModel),
            };
          });

          // Map cron jobs → "tasks" so Mission Queue shows real recurring work.
          const STATUS_FROM_CRON = (j) => {
            if (!j.enabled) return 'inbox';
            const s = j.state?.lastRunStatus;
            if (s === 'failed' || s === 'error') return 'review';
            if (j.state?.nextRunAtMs && j.state.nextRunAtMs <= Date.now() + 30_000) return 'in_progress';
            return 'planning';
          };
          // Map cron job → product. First try matching repo name in the
          // job's payload/title (case-insensitive substring); else use a
          // per-agent default; else round-robin.
          const productPicks = (vaultRepos?.repos || []).slice().sort((a,b)=>String(b.pushedAt).localeCompare(String(a.pushedAt))).slice(0,8);
          const productByName = new Map(productPicks.map((r, i) => [r.name.toLowerCase(), 'p' + (i+1)]));
          const AGENT_DEFAULT_PRODUCT = {
            'mouse-ceo': 'mouse.is', 'jordan-belfort-sales-ceo': 'sales-engine',
            'sales-engine-ceo-codex': 'sales-engine', 'young-dolph': 'sales-engine',
            'backend-builder': 'mouse', 'frontend-builder': 'HEXT.AI',
            'builder-cto': 'mouse-platform', 'ops-automation': 'mission-control',
            'research-agent-marley': 'mission-control',
          };
          const findProduct = (j) => {
            const hay = ((j.name || '') + ' ' + (j.payload?.message || '')).toLowerCase();
            for (const [n, id] of productByName) if (hay.includes(n)) return id;
            const def = AGENT_DEFAULT_PRODUCT[j.agentId];
            if (def && productByName.has(def.toLowerCase())) return productByName.get(def.toLowerCase());
            return 'p1';  // fallback
          };
          const tasks = (cronRaw?.jobs || []).map((j, i) => ({
            id: 'oc-' + j.id.slice(0, 8),
            cronId: j.id,
            title: j.name || j.payload?.message?.slice(0, 80) || j.id,
            product: findProduct(j),
            status: STATUS_FROM_CRON(j),
            agent: j.agentId,
            priority: j.enabled ? (j.schedule?.everyMs && j.schedule.everyMs < 600_000 ? 'high' : 'normal') : 'low',
            cost: 0, estCost: 0,
            source: 'cron',
            impact: 60,
            complexity: 'M',
            age: ageMs(j.state?.lastRunAtMs || j.createdAtMs),
            progress: j.state?.lastRunStatus === 'ok' ? 100 : 0,
            pr: null,
            convoy: false,
            cron: { everyMs: j.schedule?.everyMs, nextRunAtMs: j.state?.nextRunAtMs, lastRunStatus: j.state?.lastRunStatus, enabled: j.enabled },
          }));

          // cron.runs → activity rail events. Newest first, no duplicates,
          // capped so the rail doesn't grow forever.
          const fmtT = (ms) => {
            const d = new Date(ms);
            return [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2,'0')).join(':');
          };
          const toneFromStatus = (s) => s === 'ok' ? 'success' : (s === 'failed' || s === 'error') ? 'critical' : 'info';
          const events = (runsRaw?.entries || []).slice(0, 30).map((r, i) => {
            const agentId = r.sessionKey?.split(':')?.[1] || null;
            const agentName = agents.find(a => a.id === agentId)?.name || agentId || 'gateway';
            const tok = r.usage?.total_tokens ? ` · ${(r.usage.total_tokens/1000).toFixed(1)}k tok` : '';
            const dur = r.durationMs ? ` · ${(r.durationMs/1000).toFixed(1)}s` : '';
            const model = r.model ? ` · ${r.model}` : '';
            return {
              id: `oc-run-${r.jobId}-${r.runAtMs || r.ts}-${i}`,
              t: fmtT(r.runAtMs || r.ts),
              agent: agentId,
              task: r.jobId,
              msg: `${agentName} · ${r.jobName} ${r.action}${dur}${tok}${model}`,
              tone: toneFromStatus(r.status),
            };
          });

          // Vault leads → deal kanban cards. Best-effort mapping from
          // free-form frontmatter (status / deal_size_monthly / next_action)
          // into the prototype's discovery → qualified → proposal → won shape.
          const STAGE_FROM_STATUS = (s) => {
            const k = String(s || '').toLowerCase();
            if (k.includes('active-build') || k.includes('won') || k.includes('closed')) return 'closed_won';
            if (k.includes('proposal') || k.includes('waiting') || k.includes('sent')) return 'proposal';
            if (k.includes('warm') || k.includes('qualified') || k.includes('pitch')) return 'qualified';
            return 'discovery';
          };
          const HEAT_FROM_STATUS = (s) => {
            const k = String(s || '').toLowerCase();
            if (k.includes('active-build') || k.includes('won')) return 'won';
            if (k.includes('hot') || k.includes('pitch-prep')) return 'hot';
            if (k.includes('cold') || k.includes('stalled')) return 'cold';
            return 'warm';
          };
          const parseDollars = (l) => {
            const n = (s) => { const m = String(s||'').match(/\$?\s*([\d,]+(?:\.\d+)?)/); return m ? Math.round(Number(m[1].replace(/,/g,''))) : null; };
            return n(l.deal_size_monthly) ?? n(l['deal-value']) ?? n(l.deal_size) ?? 100;
          };
          const slugId = (f) => 'lead-' + f.replace(/\.md$/,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().slice(0, 28);
          const deals = (vaultLeads?.leads || [])
            .filter(l => l.company || l.contact)  // skip prebrief / un-front-mattered notes
            .map(l => ({
              id: slugId(l.file),
              name: l.company || l.file.replace(/\.md$/, ''),
              owner: (l.contact || '').replace(/\s*\(.*$/, ''),
              stage: STAGE_FROM_STATUS(l.status),
              value: parseDollars(l),
              mrr: true,
              source: l.source || 'vault',
              next: l.next_action || l['proposal_sent'] ? `proposal sent ${l.proposal_sent}` : (l.meeting ? `meeting ${l.meeting}` : 'no next action'),
              heat: HEAT_FROM_STATUS(l.status),
              lastTouch: ageMs(l.mtimeMs),
              agent: null,
              city: l.location || 'unknown',
              vaultFile: l.file,
            }));

          // GitHub repos → products. Take the 8 most-recently-pushed.
          const repoTone = ['brand','info','success','purple','pink','cyan'];
          const products = (vaultRepos?.repos || [])
            .slice()
            .sort((a, b) => String(b.pushedAt).localeCompare(String(a.pushedAt)))
            .slice(0, 8)
            .map((r, i) => {
              const ageDays = Math.max(1, Math.floor((Date.now() - new Date(r.pushedAt).getTime()) / 86_400_000));
              return {
                id: 'p' + (i + 1),  // keep p1..pN so SEED_IDEAS/tasks keep finding products
                name: r.name,
                desc: r.description || '',
                repo: 'coltonharris-wq/' + r.name,
                live: r.url || '',
                icon: r.name[0].toUpperCase(),
                tone: repoTone[i % repoTone.length],
                mrr: 0,
                ideas: 0,
                building: 0,  // task #14 will fill this
                shipped: 0,
                health: Math.max(20, 100 - ageDays * 4),
                cycles: { research: ageDays + 'd', ideation: '—' },
                sparkline: (r.commits && r.commits.length) ? r.commits : [0,0,0,0,0,0,0,0,0,0,0,0],
                language: r.primaryLanguage?.name || '',
                pushedAt: r.pushedAt,
              };
            });

          // Update agent + job name lookup so onEvent can render proper labels.
          agentsRef.current = agents;
          jobsRef.current = new Map((cronRaw?.jobs || []).map(j => [j.id, { agentId: j.agentId, name: j.name }]));

          setState(s => {
            // Merge polled backfill events with any live-streamed events
            // already in state. Live events win on dup (same jobId+runAtMs).
            const liveOnly = (s.events || []).filter(e => String(e.id).startsWith('oc-live-'));
            const seen = new Set(liveOnly.map(e => `${e.task}-${e.t}`));
            const merged = [...liveOnly, ...events.filter(e => !seen.has(`${e.task}-${e.t}`))].slice(0, 60);
            return { ...s, live: true, agents, tasks, events: merged, deals, products, built: vaultBuilt?.entries || [], status: statusRaw, error: null };
          });
        } catch (err) {
          setState(s => ({ ...s, error: String(err.message || err) }));
        }
      };

      const off = c.onStatus(s => {
        if (s.connected) {
          // Open the live event stream once per connection. Future cron events
          // arrive via onEvent; refresh() still runs as a 5s safety net.
          c.call('sessions.subscribe', {}).catch(() => {});
          refresh();
        }
        else setState(prev => ({ ...prev, live: false, error: s.error }));
      });
      const tick = setInterval(refresh, 5000);
      return () => { cancelled = true; clearInterval(tick); off(); };
    }, []);

    // Expose a call() so UI buttons can fire write methods (cron.run, etc.).
    const value = { ...state, call: (m, p) => clientRef.current?.call(m, p) };
    return React.createElement(OpenClawCtx.Provider, { value }, children);
  }

  function useOpenClaw() { return React.useContext(OpenClawCtx); }

  Object.assign(window, { OpenClawProvider, useOpenClaw, OpenClawCtx });
})();
