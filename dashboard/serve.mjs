// Local runner: serves Mission Control + proxies WS to OpenClaw gateway.
//
// Why a proxy: the gateway enforces Origin = its own host. A page served from
// http://localhost:8001 can't connect to ws://127.0.0.1:18789 directly without
// adding allowedOrigins to ~/.openclaw/openclaw.json (requires gateway restart).
// This proxy reuses the gateway's bundled `ws` lib and rewrites Origin so we
// can wire the cockpit live without touching OpenClaw config.
//
// Run:  node serve.mjs
// Then open http://localhost:8001/

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import os from 'node:os';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8001);
const GATEWAY = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
const GATEWAY_HOST = new URL(GATEWAY.replace(/^ws/, 'http')).host;
const GATEWAY_ORIGIN = `http://${GATEWAY_HOST}`;

// Load OpenClaw's bundled ws (no install needed if openclaw is on the system).
function loadWs() {
  const candidates = [
    path.join(os.homedir(), '.npm-global/lib/node_modules/openclaw/node_modules/ws'),
    '/usr/local/lib/node_modules/openclaw/node_modules/ws',
    path.join(os.homedir(), '.openclaw/plugin-runtime-deps'),
  ];
  for (const p of candidates) {
    try {
      const r = createRequire(path.join(p, 'package.json'));
      return r('ws');
    } catch {}
  }
  // last resort: regular require from cwd
  try { return createRequire(import.meta.url)('ws'); } catch {}
  throw new Error('Could not locate the `ws` package. Install with: npm i ws');
}
const WebSocket = loadWs();
const { WebSocketServer } = WebSocket;

function readAuth() {
  let masterToken = null, deviceToken = null, deviceId = null, privateKeyPem = null, publicKeyRawB64url = null;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.openclaw/openclaw.json'), 'utf8'));
    masterToken = cfg?.gateway?.auth?.token || null;
  } catch {}
  try {
    const da = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.openclaw/identity/device-auth.json'), 'utf8'));
    deviceToken = da?.tokens?.operator?.token || null;
  } catch {}
  try {
    const id = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.openclaw/identity/device.json'), 'utf8'));
    deviceId = id?.deviceId || null;
    privateKeyPem = id?.privateKeyPem || null;
    if (id?.publicKeyPem) {
      // Extract the raw 32-byte ed25519 key from the PEM (last 32 bytes of SPKI DER).
      const der = crypto.createPublicKey(id.publicKeyPem).export({ type: 'spki', format: 'der' });
      publicKeyRawB64url = der.subarray(der.length - 32).toString('base64url');
    }
  } catch {}
  return { masterToken, deviceToken, deviceId, privateKeyPem, publicKeyRawB64url };
}
const AUTH = readAuth();
const TOKEN = AUTH.masterToken;
const DEVICE_TOKEN = AUTH.deviceToken;

// Build an ed25519-signed device-identity blob the gateway expects in the
// connect frame. Payload format mirrors the OpenClaw control-ui client.
function signDeviceIdentity({ clientId, clientMode, role, scopes, nonce }) {
  if (!AUTH.deviceId || !AUTH.privateKeyPem) return null;
  const signedAtMs = Date.now();
  // Match B() in the OpenClaw client: scopes joined in-order, token may be ''.
  const payload = [
    'v2',
    AUTH.deviceId,
    clientId,
    clientMode,
    role,
    (scopes || []).join(','),
    String(signedAtMs),
    TOKEN || '',
    nonce || '',
  ].join('|');
  const key = crypto.createPrivateKey(AUTH.privateKeyPem);
  const sig = crypto.sign(null, Buffer.from(payload, 'utf8'), key);
  return {
    id: AUTH.deviceId,
    publicKey: AUTH.publicKeyRawB64url,
    signature: sig.toString('base64url'),
    signedAt: signedAtMs,
    nonce: nonce || '',
  };
}

// ─── static file server ─────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.jsx':  'text/babel; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
};

function serveFile(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

// expose token + gateway URL to the page so live.jsx knows where to connect
function serveBootstrap(req, res) {
  const body = `window.__MC_BOOT__ = ${JSON.stringify({
    proxyPath: '/oc',
    gatewayHost: GATEWAY_HOST,
    hasToken: !!TOKEN,
  })};\n`;
  res.writeHead(200, { 'content-type': MIME['.js'] });
  res.end(body);
}

// Minimal YAML frontmatter reader: just `key: value` (string), no nested lists.
function readFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w_-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
    out[kv[1]] = v;
  }
  return out;
}

import { spawn } from 'node:child_process';
import vm from 'node:vm';

const VAULT_LEADS_DIR = path.join(os.homedir(), 'colton-brain-vault/Leads');
const STATE_DIR = path.join(ROOT, 'state');
const STATE_FILE = path.join(STATE_DIR, 'mission-control.json');
const RECEIPTS_FILE = path.join(STATE_DIR, 'receipts.jsonl');

// Cache `gh repo list` for 5min — it shells out and we don't need it fresh.
let repoCache = { ts: 0, data: null };

function shGh(args) {
  return new Promise(resolve => {
    const p = spawn('gh', args);
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.on('error', () => resolve(null));
    p.on('close', () => { try { resolve(JSON.parse(out)); } catch { resolve(null); } });
  });
}

// Last 12 days of commit counts per day, oldest → newest. Missing days = 0.
async function readDailyCommits(name) {
  const since = new Date(Date.now() - 12 * 86_400_000).toISOString();
  const commits = await shGh(['api', `repos/coltonharris-wq/${name}/commits?since=${encodeURIComponent(since)}&per_page=100`]);
  const counts = new Map();
  if (Array.isArray(commits)) {
    for (const c of commits) {
      const day = String(c.commit?.author?.date || '').slice(0, 10);
      if (day) counts.set(day, (counts.get(day) || 0) + 1);
    }
  }
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    out.push(counts.get(d) || 0);
  }
  return out;
}

async function readGhRepos() {
  if (Date.now() - repoCache.ts < 5 * 60_000 && repoCache.data) return repoCache.data;
  const list = await shGh(['repo', 'list', 'coltonharris-wq', '--limit', '50', '--json', 'name,description,pushedAt,isPrivate,primaryLanguage,url']);
  if (!list) return [];
  // Top 8 most-recently-pushed get sparkline data.
  const top8 = list.slice().sort((a, b) => String(b.pushedAt).localeCompare(String(a.pushedAt))).slice(0, 8);
  const sparks = await Promise.all(top8.map(r => readDailyCommits(r.name)));
  const sparkByName = new Map(top8.map((r, i) => [r.name, sparks[i]]));
  const data = list.map(r => ({ ...r, commits: sparkByName.get(r.name) || null }));
  repoCache = { ts: Date.now(), data };
  return data;
}

function readBuiltMd() {
  const file = path.join(os.homedir(), 'colton-brain-vault/BUILT.md');
  let body;
  try { body = fs.readFileSync(file, 'utf8'); } catch { return []; }
  // Match the prose pattern: each entry starts with **Last updated** or **Previously**
  // followed by a date and ends at the next entry / end of file.
  const re = /\*\*(Last updated|Previously)\*\*:\s*([^—\n]+?)\s*—\s*(?:\*\*([^*]+?)\*\*)?(.*?)(?=\n\*\*(?:Last updated|Previously)\*\*|\n## |$)/gs;
  const out = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    const dateField = m[2].trim();
    const headline = (m[3] || '').replace(/\.$/, '').trim();
    const rest = (m[4] || '');
    const status = rest.includes('🟢') ? 'green' : rest.includes('🔴') ? 'red' : rest.includes('🟡') || /IN PROGRESS|Stays 🟡/.test(rest) ? 'yellow' : null;
    if (!headline) continue;
    out.push({ date: dateField, headline, status });
    if (out.length >= 8) break;
  }
  return out;
}

function readVaultLeads() {
  let files;
  try { files = fs.readdirSync(VAULT_LEADS_DIR); } catch { return []; }
  const leads = [];
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const full = path.join(VAULT_LEADS_DIR, f);
    let st, body;
    try { st = fs.statSync(full); body = fs.readFileSync(full, 'utf8'); } catch { continue; }
    if (!st.isFile()) continue;
    const fm = readFrontmatter(body);
    leads.push({ file: f, mtimeMs: st.mtimeMs, ...fm });
  }
  return leads;
}

// Surgical write: replace the `status: ...` line in a vault lead's frontmatter.
function writeLeadStatus(file, status) {
  if (!/^[\w. -]+\.md$/.test(file)) return { ok: false, error: 'bad filename' };
  const full = path.join(VAULT_LEADS_DIR, file);
  let body;
  try { body = fs.readFileSync(full, 'utf8'); } catch { return { ok: false, error: 'not found' }; }
  const fmEnd = body.indexOf('\n---', 4);
  if (!body.startsWith('---\n') || fmEnd < 0) return { ok: false, error: 'no frontmatter' };
  const fm = body.slice(4, fmEnd);
  const rest = body.slice(fmEnd);
  const safeStatus = String(status).replace(/[\n\r]/g, ' ').slice(0, 80);
  let newFm;
  if (/^status:\s*.*$/m.test(fm)) {
    newFm = fm.replace(/^status:\s*.*$/m, `status: ${safeStatus}`);
  } else {
    newFm = `status: ${safeStatus}\n${fm}`;
  }
  fs.writeFileSync(full, '---\n' + newFm + rest, 'utf8');
  return { ok: true };
}


function nowIso() { return new Date().toISOString(); }


const AUDIT_SCORE_VERSION = 'audit-score-v1';
const AUDIT_APOLLO_MIN_SCORE = 80;
const AUDIT_HIGH_RANK_LIMIT = 2;
const AUDIT_INDUSTRY_FIT = new Set(['roofing', 'solar', 'construction', 'appliance', 'plumbing', 'hvac', 'electrical', 'landscaping', 'remodeling']);

function auditScoreLead(lead) {
  const vertical = String(lead.vertical || '').toLowerCase();
  const websitePresent = Boolean(String(lead.website || '').trim());
  const reviewsGbpPlaceholder = lead.reviewsGbpPlaceholder ?? (lead.gbpReviews ? String(lead.gbpReviews) : 'GBP/reviews not verified yet');
  const industryFit = AUDIT_INDUSTRY_FIT.has(vertical) ? 25 : 10;
  const missedCallFollowUpFit = Number.isFinite(Number(lead.missedCallFollowUpFit))
    ? Number(lead.missedCallFollowUpFit)
    : ['roofing', 'hvac', 'plumbing', 'electrical', 'appliance'].includes(vertical) ? 30 : 22;
  const websiteScore = websitePresent ? 15 : 4;
  const reviewsScore = String(reviewsGbpPlaceholder).toLowerCase().includes('not verified') ? 8 : 15;
  const auditScore = Math.max(0, Math.min(100, industryFit + missedCallFollowUpFit + websiteScore + reviewsScore + 15));
  const reasonWhy = lead.reasonWhy || `${lead.vertical || 'Local service'} fit: missed calls, estimate booking, and slow follow-up are likely revenue leaks${websitePresent ? '; website exists for audit context' : '; website still needs verification'}.`;
  const angle = lead.angle || (['roofing', 'hvac', 'plumbing', 'electrical'].includes(vertical)
    ? 'AI receptionist + estimate follow-up for missed calls and after-hours leads.'
    : 'AI follow-up employee for booking, reminders, and customer communication.');
  const recommendedFirstTouch = lead.recommendedFirstTouch || 'Draft-only opener: quick audit around missed calls, response time, reviews/GBP, and follow-up leaks; do not send without approval.';
  return { ...lead, websitePresent, reviewsGbpPlaceholder, missedCallFollowUpFit, industryFit, auditScore, reasonWhy, angle, recommendedFirstTouch, auditVersion: AUDIT_SCORE_VERSION };
}

function rankAuditLeads(leads = []) {
  return leads.map(auditScoreLead)
    .sort((a, b) => (b.auditScore || 0) - (a.auditScore || 0))
    .map((lead, idx) => ({
      ...lead,
      auditRank: idx + 1,
      apolloEligible: idx < AUDIT_HIGH_RANK_LIMIT && Number(lead.auditScore || 0) >= AUDIT_APOLLO_MIN_SCORE,
      status: Number(lead.auditScore || 0) >= AUDIT_APOLLO_MIN_SCORE ? 'audit_ranked_high' : 'audit_ranked_hold',
    }));
}

function safeJsonBody(req, max = 128 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > max) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function readSeedState() {
  const code = fs.readFileSync(path.join(ROOT, 'data.jsx'), 'utf8') + `\n;globalThis.__MC_SEED__ = { SEED_TASKS, SEED_DEALS, SEED_IDEAS, SEED_PRODUCTS, SEED_AGENTS };`;
  const ctx = { globalThis: {} };
  ctx.window = ctx.globalThis;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'data.jsx' });
  return ctx.globalThis.__MC_SEED__ || { SEED_TASKS: [], SEED_DEALS: [], SEED_IDEAS: [], SEED_PRODUCTS: [], SEED_AGENTS: [] };
}



function seedAutopilotState() {
  const leadSources = rankAuditLeads(seedLeadSourceState());
  const apolloQueue = leadSources.filter(l => l.apolloEligible);
  return {
    policy: {
      radius: 'Wilmington, NC + 25 miles',
      verticals: ['roofing', 'solar', 'construction', 'appliance', 'plumbing', 'HVAC', 'electrical', 'landscaping', 'remodeling'],
      senders: {
        email: 'colton.harris@automioapp.com',
        imessage: 'Colton personal iPhone / iMessage for now',
        future: 'Dedicated business iPhone on M5 Max',
      },
      dailyCaps: {
        email: { limit: 50, used: 0 },
        imessage: { limit: 50, used: 0 },
      },
      quietHours: { start: 20, end: 8, tz: 'America/New_York' },
      coldCallTarget: '100–200/day',
      mode: 'policy-approved-autopilot',
    },
    runs: [
      { id: 'run-research', name: 'Lead research', status: 'queued', summary: 'Find construction/home-service businesses in Wilmington + 25 miles.', lastRun: 'seeded', nextRun: '8:05am ET', outputCount: leadSources.length, receiptPath: 'dashboard/state/receipts.jsonl' },
      { id: 'run-audit', name: 'Audit Score v1', status: 'complete', summary: 'Ranks local leads by website presence, GBP/review placeholder, missed-call/follow-up fit, industry fit, reason, angle, and first-touch recommendation.', lastRun: 'seeded', nextRun: 'refresh after verified research', outputCount: leadSources.length, receiptPath: 'dashboard/state/receipts.jsonl' },
      { id: 'run-enrich', name: 'Contact enrichment', status: 'queued', summary: 'Apollo/enrichment stays last; only high-ranked audit leads become eligible.', lastRun: 'seeded', nextRun: 'after audit + suppression check', outputCount: apolloQueue.length },
      { id: 'run-email', name: 'Outbound email', status: 'blocked', summary: 'Prepared only. Live send path not enabled tonight.', lastRun: 'not run', nextRun: 'tomorrow send window', outputCount: 0 },
      { id: 'run-imessage', name: 'Outbound iMessage', status: 'blocked', summary: 'Prepared only. No personal iPhone sends until send runner is deliberately enabled.', lastRun: 'not run', nextRun: 'tomorrow send window', outputCount: 0 },
      { id: 'run-replies', name: 'Reply handler', status: 'idle', summary: 'Classify replies, opt-outs, interest, angry replies, and escalation.', lastRun: 'not run', nextRun: 'after first sends', outputCount: 0 },
      { id: 'run-cold-rank', name: 'Cold-call ranker', status: 'queued', summary: 'Rank warmest 100–200/day for Colton from outbound + audit signal.', lastRun: 'seeded', nextRun: 'after first replies/touches', outputCount: 3 },
      { id: 'run-briefs', name: 'Morning/evening briefs', status: 'queued', summary: 'Summarize overnight/day receipts, blockers, and next best moves.', lastRun: 'seeded', nextRun: 'next scheduled brief', outputCount: 0 },
    ],
    queue: apolloQueue.map(lead => ({
      id: `q-audit-${lead.id}`,
      lead: lead.business,
      channel: 'draft-only',
      angle: lead.angle,
      scheduledFor: 'after 8:00am ET + human approval',
      status: 'audit-ranked-prepared-not-sent',
      auditScore: lead.auditScore,
    })),
    leadSources,
    workflowMetadata: seedWorkflowMetadata(),
  };
}

function seedLeadSourceState() {
  const baseReceipt = 'dashboard/state/receipts.jsonl';
  return [
    {
      id: 'lead-source-wilmington-roofing-001',
      business: 'Wilmington roofing contractor placeholder',
      vertical: 'roofing',
      city: 'Wilmington, NC',
      distance: '0–25 mi',
      source: 'Lead Source v1 seed — Wilmington + 25mi construction/home-services',
      website: '',
      websitePresent: false,
      reviewsGbpPlaceholder: 'GBP/reviews not verified yet',
      phone: '',
      email: '',
      researchNotes: 'Seed row for research-agent/lead-hunt output. Needs live source verification before enrichment or outreach.',
      missedCallFollowUpFit: 30,
      auditScore: null,
      reasonWhy: 'Roofing is a strong OpSpot wedge: high-intent calls, estimate booking, after-hours misses, and follow-up leakage.',
      angle: 'AI receptionist + estimate follow-up for roof inspections and quote nudges.',
      recommendedFirstTouch: 'Draft a missed-call/estimate follow-up audit opener; hold all sends until approval.',
      apolloEligible: false,
      ownerContact: { name: '', title: '', phone: '', email: '', source: '' },
      status: 'sourced_needs_research',
      receipts: [{ type: 'lead-source.seeded', path: baseReceipt }],
    },
    {
      id: 'lead-source-wilmington-hvac-001',
      business: 'Wilmington HVAC company placeholder',
      vertical: 'HVAC',
      city: 'Wilmington, NC',
      distance: '0–25 mi',
      source: 'Lead Source v1 seed — Wilmington + 25mi construction/home-services',
      website: '',
      websitePresent: false,
      reviewsGbpPlaceholder: 'GBP/reviews not verified yet',
      phone: '',
      email: '',
      researchNotes: 'Seed row for specialist sourcing. Prioritize service-area fit, missed-call pain, reviews, and appointment-booking leak.',
      missedCallFollowUpFit: 30,
      auditScore: null,
      reasonWhy: 'HVAC has urgent call demand, appointment booking, seasonal spikes, and service follow-up that maps cleanly to an AI employee.',
      angle: 'After-hours call capture + booked service appointments + maintenance follow-up.',
      recommendedFirstTouch: 'Draft a “missed service calls after hours” audit opener; no send during quiet hours.',
      apolloEligible: false,
      ownerContact: { name: '', title: '', phone: '', email: '', source: '' },
      status: 'sourced_needs_research',
      receipts: [{ type: 'lead-source.seeded', path: baseReceipt }],
    },
    {
      id: 'lead-source-wilmington-plumbing-001',
      business: 'Wilmington plumbing company placeholder',
      vertical: 'plumbing',
      city: 'Wilmington, NC',
      distance: '0–25 mi',
      source: 'Lead Source v1 seed — Wilmington + 25mi construction/home-services',
      website: '',
      websitePresent: false,
      reviewsGbpPlaceholder: 'GBP/reviews not verified yet',
      phone: '',
      email: '',
      researchNotes: 'Seed row only. No outbound until source verified, audit scored, suppression checked, and Colton approval gate passes.',
      missedCallFollowUpFit: 30,
      auditScore: null,
      reasonWhy: 'Plumbing has urgent lead intent and obvious missed-call/booking leakage, but still needs source verification before enrichment.',
      angle: 'Emergency call capture + estimate scheduling + follow-up reminders.',
      recommendedFirstTouch: 'Draft a short audit-first opener around missed urgent calls; hold for approval.',
      apolloEligible: false,
      ownerContact: { name: '', title: '', phone: '', email: '', source: '' },
      status: 'sourced_needs_research',
      receipts: [{ type: 'lead-source.seeded', path: baseReceipt }],
    },
  ];
}

function seedWorkflowMetadata() {
  return [
    {
      id: 'lead-source-v1-wilmington',
      workflow: 'Lead Source v1 — Wilmington construction/home-services',
      orchestratorRole: 'parent orchestrator routes each stage; does not become a 50-tool mega-agent',
      specialistAgent: 'research-agent-marley / lead-hunt specialist for sourcing; auditor specialist for scoring; lead-enrich specialist for contact data; outreach-compose specialist for drafts',
      requiredTools: ['web/local source research', 'business listing source notes', 'website audit', 'contact enrichment', 'receipt writer'],
      requiredPlugins: ['OpenClaw sessions/delegation', 'dashboard state API', 'receipts.jsonl'],
      approvalPolicy: 'Local research/audit/enrich only overnight. External sends, replies, calls, customer-visible changes, private/financial access, and purchases require explicit human approval; quiet hours freeze 8pm–8am ET.',
      receiptPath: 'dashboard/state/receipts.jsonl',
      status: 'foundation_seeded',
    },
  ];
}

function seedColdCallLeads() {
  return [
    {
      id: 'lead-sues-roofing',
      business: "Sue's Roofing",
      phone: '(910) 555-0198',
      score: 92,
      stage: 'researched',
      status: 'ready_to_call',
      lastTouch: 'Demo email drafted, not sent',
      nextAsk: 'Book 15-min AI receptionist/audit call',
      why: 'Roofing companies lose money when missed calls and slow follow-up turn into lost estimates. This is an easy OpSpot wedge.',
      angle: 'Lead with missed calls + estimate follow-up: “If I could show you 3 calls answered, 2 estimates booked, and follow-ups sent without hiring, would you look at it?”',
      opener: 'Hey, this is Colton with OpSpot. Quick one — are you the right person for how Sue’s Roofing handles missed calls and estimate follow-up?',
      objections: ['Already have someone answering phones', 'Busy season / call me later', 'Does AI sound weird?', 'Need to talk to owner'],
      touches: [{ channel: 'email', status: 'drafted', summary: 'AI receptionist / follow-up angle prepared; send requires approval.' }],
    },
    {
      id: 'lead-george-preferred-appliance',
      business: 'George / Preferred Appliance',
      phone: '(910) 555-0144',
      score: 84,
      stage: 'waiting_reply',
      status: 'ready_to_call',
      lastTouch: 'Prior nudge; no active escalation',
      nextAsk: 'Ask if appliance service follow-up is still a pain',
      why: 'Existing relationship/context. Good fit for appointment handling, reminders, and post-service follow-up.',
      angle: 'Keep it warm and simple: missed calls, service reminders, estimate follow-up, and fewer dropped customers.',
      opener: 'George, it’s Colton. I’m building OpSpot around AI employees for local businesses — wanted to ask if missed calls or follow-ups are still a problem over there.',
      objections: ['Not ready', 'Already has CRM', 'Wants proof first'],
      touches: [{ channel: 'iMessage', status: 'sent earlier', summary: 'Binary nudge sent; no reply logged.' }],
    },
    {
      id: 'lead-aaron-roofco',
      business: 'Aaron / RoofCo',
      phone: '(910) 555-0171',
      score: 81,
      stage: 'waiting_reply',
      status: 'ready_to_call',
      lastTouch: 'Personal nudge sent earlier',
      nextAsk: 'Clarify GHL status and offer 1-hour pilot',
      why: 'Roofing + possible GHL workflow pain. Strong vertical match for outbound/follow-up AI employee.',
      angle: 'Position as an AI worker that makes the existing system useful instead of replacing everything.',
      opener: 'Aaron, it’s Colton. Quick question — are you still using GHL for RoofCo follow-up, or did that get dropped?',
      objections: ['Too much setup', 'Already paying for GHL', 'Need examples'],
      touches: [{ channel: 'iMessage', status: 'sent earlier', summary: 'Personal GHL/status nudge already sent.' }],
    }
  ];
}

function ensureState() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) {
    const seed = readSeedState();
    const state = {
      version: 1,
      updatedAt: nowIso(),
      tasks: seed.SEED_TASKS || [],
      deals: seed.SEED_DEALS || [],
      ideas: seed.SEED_IDEAS || [],
      products: seed.SEED_PRODUCTS || [],
      agents: seed.SEED_AGENTS || [],
      coldCallLeads: seedColdCallLeads(),
      autopilotPolicy: seedAutopilotState().policy,
      automationRuns: seedAutopilotState().runs,
      outboundQueue: seedAutopilotState().queue,
      leadSources: seedAutopilotState().leadSources,
      workflowMetadata: seedAutopilotState().workflowMetadata,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  }
  if (!fs.existsSync(RECEIPTS_FILE)) fs.writeFileSync(RECEIPTS_FILE, '', 'utf8');
}

function readMcState() {
  ensureState();
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  let changed = false;
  if (!state.coldCallLeads) {
    state.coldCallLeads = seedColdCallLeads();
    changed = true;
  }
  const auto = seedAutopilotState();
  if (!state.autopilotPolicy) { state.autopilotPolicy = auto.policy; changed = true; }
  if (!state.automationRuns) { state.automationRuns = auto.runs; changed = true; }
  if (!state.outboundQueue) { state.outboundQueue = auto.queue; changed = true; }
  if (!state.leadSources) { state.leadSources = auto.leadSources; changed = true; }
  if (!state.workflowMetadata) { state.workflowMetadata = auto.workflowMetadata; changed = true; }
  const researchRun = (state.automationRuns || []).find(r => r.id === 'run-research');
  if (researchRun && !researchRun.receiptPath) { researchRun.receiptPath = 'dashboard/state/receipts.jsonl'; changed = true; }
  if (researchRun && Number(researchRun.outputCount || 0) < (state.leadSources || []).length) { researchRun.outputCount = (state.leadSources || []).length; changed = true; }
  const ranked = rankAuditLeads(state.leadSources || []);
  if (JSON.stringify(ranked) !== JSON.stringify(state.leadSources || [])) { state.leadSources = ranked; changed = true; }
  const auditRun = (state.automationRuns || []).find(r => r.id === 'run-audit');
  if (auditRun) {
    auditRun.name = 'Audit Score v1';
    auditRun.status = 'complete';
    auditRun.outputCount = state.leadSources.length;
    auditRun.receiptPath = 'dashboard/state/receipts.jsonl';
    auditRun.summary = 'Ranks local leads by website presence, GBP/review placeholder, missed-call/follow-up fit, industry fit, reason, angle, and first-touch recommendation.';
    changed = true;
  }
  const enrichRun = (state.automationRuns || []).find(r => r.id === 'run-enrich');
  const apolloQueue = state.leadSources.filter(l => l.apolloEligible);
  if (enrichRun) {
    enrichRun.summary = 'Apollo/enrichment stays last; only high-ranked audit leads become eligible.';
    enrichRun.outputCount = apolloQueue.length;
    changed = true;
  }
  const auditQueue = apolloQueue.map(lead => ({
    id: `q-audit-${lead.id}`,
    lead: lead.business,
    channel: 'draft-only',
    angle: lead.angle,
    scheduledFor: 'after 8:00am ET + human approval',
    status: 'audit-ranked-prepared-not-sent',
    auditScore: lead.auditScore,
  }));
  if (JSON.stringify(state.outboundQueue || []) !== JSON.stringify(auditQueue)) { state.outboundQueue = auditQueue; changed = true; }
  if (changed) writeMcState(state);
  return state;
}

function writeMcState(state) {
  state.updatedAt = nowIso();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function appendReceipt(event) {
  ensureState();
  const receipt = { id: `r-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, at: nowIso(), ...event };
  fs.appendFileSync(RECEIPTS_FILE, JSON.stringify(receipt) + '\n', 'utf8');
  return receipt;
}

function sendJson(res, obj, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function actionPatch(action) {
  const byAction = {
    approve: { status: 'done' },
    deny: { status: 'review' },
    defer: { status: 'planning' },
  };
  return { ...(byAction[action] || {}), lastAction: action, actionedAt: nowIso() };
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/__boot.js') return serveBootstrap(req, res);
  if (req.url === '/__mc/state') return sendJson(res, readMcState());
  if (req.url === '/__mc/receipts') {
    ensureState();
    const receipts = fs.readFileSync(RECEIPTS_FILE, 'utf8').split('\n').filter(Boolean).slice(-200).map(line => JSON.parse(line));
    return sendJson(res, { receipts });
  }
  if (req.method === 'POST' && req.url === '/__mc/task') {
    try {
      const body = await safeJsonBody(req);
      const state = readMcState();
      const idx = state.tasks.findIndex(t => t.id === body.id);
      if (idx < 0) return sendJson(res, { ok: false, error: 'task not found' }, 404);
      state.tasks[idx] = { ...state.tasks[idx], ...(body.patch || {}) };
      writeMcState(state);
      const receipt = appendReceipt({ type: 'task.patch', taskId: body.id, patch: body.patch || {}, meta: body.meta || {} });
      return sendJson(res, { ok: true, task: state.tasks[idx], receipt });
    } catch (e) { return sendJson(res, { ok: false, error: String(e.message || e) }, 400); }
  }
  if (req.method === 'POST' && req.url === '/__mc/tasks') {
    try {
      const body = await safeJsonBody(req);
      const state = readMcState();
      const task = { ...(body.task || {}), id: body.task?.id || `t-${Date.now()}`, createdAt: nowIso() };
      if (!task.title) return sendJson(res, { ok: false, error: 'title required' }, 400);
      const idx = state.tasks.findIndex(t => t.id === task.id);
      if (idx >= 0) state.tasks[idx] = { ...state.tasks[idx], ...task };
      else state.tasks.push(task);
      writeMcState(state);
      const receipt = appendReceipt({ type: 'task.create', taskId: task.id, task, meta: body.meta || {} });
      return sendJson(res, { ok: true, task, receipt });
    } catch (e) { return sendJson(res, { ok: false, error: String(e.message || e) }, 400); }
  }
  if (req.method === 'POST' && req.url === '/__mc/automation/log') {
    try {
      const body = await safeJsonBody(req);
      const state = readMcState();
      const runId = body.runId;
      const idx = (state.automationRuns || []).findIndex(r => r.id === runId);
      if (idx >= 0) {
        state.automationRuns[idx] = { ...state.automationRuns[idx], ...(body.patch || {}), lastRun: nowIso() };
        writeMcState(state);
      }
      const receipt = appendReceipt({ type: 'automation.log', runId, action: body.action || 'log', meta: body.meta || {}, patch: body.patch || {} });
      return sendJson(res, { ok: true, run: idx >= 0 ? state.automationRuns[idx] : null, receipt });
    } catch (e) { return sendJson(res, { ok: false, error: String(e.message || e) }, 400); }
  }
  if (req.method === 'POST' && req.url === '/__mc/coldcall/outcome') {
    try {
      const body = await safeJsonBody(req);
      const state = readMcState();
      const idx = (state.coldCallLeads || []).findIndex(l => l.id === body.leadId);
      if (idx < 0) return sendJson(res, { ok: false, error: 'lead not found' }, 404);
      const lead = state.coldCallLeads[idx];
      const action = body.action || 'note';
      lead.lastOutcome = action;
      lead.lastTouch = `${action} · ${nowIso()}`;
      lead.updatedAt = nowIso();
      if (action === 'meeting_booked') { lead.stage = 'call_booked'; lead.status = 'meeting_booked'; }
      if (action === 'not_fit') { lead.stage = 'closed_lost'; lead.status = 'closed_lost'; }
      if (action === 'interested') { lead.stage = 'replied'; lead.status = 'follow_up'; }
      if (action === 'no_answer') { lead.stage = 'contacted'; lead.status = 'follow_up'; }
      if (action === 'called') { lead.stage = 'contacted'; lead.status = 'called'; }
      lead.touches = lead.touches || [];
      lead.touches.push({ channel: 'call', status: action, summary: body.meta?.note || (body.meta?.recording ? 'Recording started placeholder; transcript not wired yet.' : 'Outcome logged from Cold Call tab.') });
      writeMcState(state);
      const receipt = appendReceipt({ type: 'coldcall.outcome', leadId: body.leadId, action, meta: body.meta || {} });
      return sendJson(res, { ok: true, lead, receipt });
    } catch (e) { return sendJson(res, { ok: false, error: String(e.message || e) }, 400); }
  }
  if (req.method === 'POST' && req.url === '/__mc/action') {
    try {
      const body = await safeJsonBody(req);
      const state = readMcState();
      const idx = state.tasks.findIndex(t => t.id === body.id);
      if (idx < 0) return sendJson(res, { ok: false, error: 'task not found' }, 404);
      const patch = actionPatch(body.action);
      state.tasks[idx] = { ...state.tasks[idx], ...patch };
      writeMcState(state);
      const receipt = appendReceipt({ type: 'task.action', taskId: body.id, action: body.action, patch, meta: body.meta || {} });
      return sendJson(res, { ok: true, task: state.tasks[idx], receipt });
    } catch (e) { return sendJson(res, { ok: false, error: String(e.message || e) }, 400); }
  }
  if (req.method === 'POST' && req.url === '/__vault/leads/status') {
    let raw = '';
    req.on('data', c => { raw += c; if (raw.length > 4096) req.destroy(); });
    req.on('end', () => {
      let body; try { body = JSON.parse(raw); } catch { return res.writeHead(400).end('bad json'); }
      const result = writeLeadStatus(body.file, body.status);
      res.writeHead(result.ok ? 200 : 400, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }
  if (req.url === '/__vault/leads') {
    const data = JSON.stringify({ leads: readVaultLeads() });
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(data);
  }
  if (req.url === '/__vault/repos') {
    const repos = await readGhRepos();
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ repos }));
  }
  if (req.url === '/__vault/built') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ entries: readBuiltMd() }));
  }
  serveFile(req, res);
});

// ─── WS proxy ───────────────────────────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/oc')) { socket.destroy(); return; }
  if (!TOKEN) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (browserWs) => onProxy(browserWs));
});

function onProxy(browserWs) {
  const upstream = new WebSocket(GATEWAY, { headers: { Origin: GATEWAY_ORIGIN } });
  let upstreamReady = false;
  const pendingFromBrowser = [];
  let nonce = null;  // captured from upstream's connect.challenge

  // Inject auth + signed device identity before forwarding the connect frame
  // so the page never has to know any of it.
  const interceptAndForward = (raw) => {
    const text = typeof raw === 'string' ? raw : raw.toString('utf8');
    let msg;
    try { msg = JSON.parse(text); } catch { return upstream.send(text); }
    if (msg?.type === 'req' && msg?.method === 'connect') {
      const auth = { ...(msg.params?.auth || {}) };
      if (TOKEN) auth.token = TOKEN;
      if (DEVICE_TOKEN) auth.deviceToken = DEVICE_TOKEN;
      // Match the pinned client identity (this device was paired from CLI).
      const client = {
        version: 'mission-control',
        instanceId: crypto.randomUUID(),
        ...(msg.params?.client || {}),
        id: 'cli',
        mode: 'probe',
        platform: process.platform,  // device was pinned to host platform
      };
      const params = {
        ...(msg.params || {}),
        client,
        role: 'operator',
        scopes: ['operator.read', 'operator.admin', 'operator.write', 'operator.approvals', 'operator.pairing'],
        auth,
      };
      const device = signDeviceIdentity({
        clientId: client.id,
        clientMode: client.mode,
        role: params.role,
        scopes: params.scopes,
        nonce,
      });
      if (device) params.device = device;
      msg.params = params;
      return upstream.send(JSON.stringify(msg));
    }
    upstream.send(text);
  };

  upstream.on('open', () => {
    upstreamReady = true;
    for (const m of pendingFromBrowser) interceptAndForward(m);
    pendingFromBrowser.length = 0;
  });
  upstream.on('message', (d) => {
    // Gateway always sends JSON text. The `ws` lib hands us a Buffer; if we
    // forward it as-is the browser sees a binary Blob and JSON.parse breaks.
    const text = typeof d === 'string' ? d : d.toString('utf8');
    try {
      const m = JSON.parse(text);
      if (m?.type === 'event' && m?.event === 'connect.challenge' && m.payload?.nonce) {
        nonce = m.payload.nonce;
      }
    } catch {}
    if (browserWs.readyState === 1) browserWs.send(text);
  });
  upstream.on('close', (c, r) => {
    if (browserWs.readyState !== 1) return;
    // ws throws if code isn't a valid 1000-4999 number; coerce or drop.
    const code = (typeof c === 'number' && c >= 1000 && c <= 4999) ? c : 1000;
    try { browserWs.close(code, r ? String(r) : undefined); } catch {}
  });
  upstream.on('error', () => { try { browserWs.close(1011, 'upstream error'); } catch {} });

  browserWs.on('message', (d) => {
    if (!upstreamReady) pendingFromBrowser.push(d);
    else interceptAndForward(d);
  });
  browserWs.on('close', () => upstream.readyState <= 1 && upstream.close());
  browserWs.on('error', () => upstream.close());
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`mission control: http://localhost:${PORT}/`);
  console.log(`proxy:           ws://localhost:${PORT}/oc → ${GATEWAY}`);
  console.log(`token loaded:    ${TOKEN ? 'yes' : 'NO — page will run in seed-only mode'}`);
});
