// Seed data — products, agents, deals, queue, ideas, activity
// Names pulled from Colton's repos: FrankenClip, Mouse, Mio.ai, OpenClaw M5, Solar Autopilot, Ghost Editor, Cat Signal

const SEED_AGENTS = [
  { id: 'a1', name: 'Forge', role: 'Builder', model: 'sonnet-4.5', tone: 'brand', health: 'working', task: 't3', mood: 'in flow', cpu: 78, cost: 4.21, tasksDone: 47 },
  { id: 'a2', name: 'Anvil', role: 'Builder', model: 'sonnet-4.5', tone: 'brand', health: 'working', task: 't7', mood: 'building', cpu: 64, cost: 2.18, tasksDone: 31 },
  { id: 'a3', name: 'Sentinel', role: 'Tester', model: 'haiku-4.5', tone: 'info', health: 'working', task: 't2', mood: 'running suite', cpu: 42, cost: 0.84, tasksDone: 89 },
  { id: 'a4', name: 'Lens', role: 'Reviewer', model: 'sonnet-4.5', tone: 'purple', health: 'idle', task: null, mood: 'standing by', cpu: 0, cost: 0.00, tasksDone: 62 },
  { id: 'a5', name: 'Scout', role: 'Researcher', model: 'sonnet-4.5', tone: 'success', health: 'working', task: 't1', mood: 'scanning competitors', cpu: 51, cost: 1.92, tasksDone: 124 },
  { id: 'a6', name: 'Muse', role: 'Ideator', model: 'opus-4', tone: 'pink', health: 'working', task: 'cyc-12', mood: 'generating ideas', cpu: 88, cost: 6.40, tasksDone: 38 },
  { id: 'a7', name: 'Closer', role: 'Sales', model: 'sonnet-4.5', tone: 'cyan', health: 'working', task: 'd2', mood: 'drafting proposal', cpu: 33, cost: 0.71, tasksDone: 19 },
  { id: 'a8', name: 'Loom', role: 'Learner', model: 'haiku-4.5', tone: 'neutral', health: 'stalled', task: null, mood: 'last seen 14m ago', cpu: 2, cost: 0.04, tasksDone: 211 },
];

const SEED_PRODUCTS = [
  { id: 'p1', name: 'FrankenClip', desc: '1-click hosted Paperclip for SMBs', repo: 'frankenclip/core', live: 'frankenclip.app', icon: 'F', tone: 'brand', mrr: 8470, ideas: 23, building: 4, shipped: 31, health: 92, cycles: { research: 'now', ideation: '2h' }, sparkline: [12,14,18,22,19,28,34,42,38,47,55,62] },
  { id: 'p2', name: 'Mouse', desc: 'AI ops runtime · OpenClaw fork', repo: 'mouse-platform', live: 'mice.ink', icon: 'M', tone: 'info', mrr: 14210, ideas: 17, building: 6, shipped: 84, health: 88, cycles: { research: '6h', ideation: '12h' }, sparkline: [38,42,49,51,57,63,68,72,79,84,89,94] },
  { id: 'p3', name: 'Mio.ai', desc: 'AI receptionist for trades', repo: 'mio-ai-website', live: 'mio.ai', icon: 'M', tone: 'success', mrr: 4120, ideas: 9, building: 1, shipped: 14, health: 76, cycles: { research: '1d', ideation: '4h' }, sparkline: [4,5,5,7,9,11,12,14,15,18,21,24] },
  { id: 'p4', name: 'Solar Autopilot', desc: 'Aging-roof solar deal generator', repo: 'solar-autopilot', live: 'solar.crsh.dn', icon: 'S', tone: 'purple', mrr: 2890, ideas: 14, building: 2, shipped: 9, health: 81, cycles: { research: '3h', ideation: '8h' }, sparkline: [0,1,2,4,5,7,9,11,14,17,21,28] },
  { id: 'p5', name: 'Ghost Editor', desc: 'Clip-worthy moments, scored', repo: 'ghost-editor', live: 'ghosted.live', icon: 'G', tone: 'pink', mrr: 1740, ideas: 11, building: 0, shipped: 6, health: 64, cycles: { research: '2d', ideation: '1d' }, sparkline: [2,3,4,4,5,5,6,7,7,8,9,11] },
  { id: 'p6', name: 'Cat Signal', desc: 'Multimodal cat communication', repo: 'cat-signal', live: 'catsignal.lol', icon: 'C', tone: 'cyan', mrr: 0, ideas: 6, building: 1, shipped: 2, health: 48, cycles: { research: '5d', ideation: '3d' }, sparkline: [0,0,0,0,0,0,0,0,0,0,0,0] },
];

const STATUSES = [
  { id: 'inbox', label: 'Inbox', tone: 'neutral' },
  { id: 'planning', label: 'Planning', tone: 'info' },
  { id: 'assigned', label: 'Assigned', tone: 'brand' },
  { id: 'in_progress', label: 'Building', tone: 'brand' },
  { id: 'testing', label: 'Testing', tone: 'warning' },
  { id: 'review', label: 'Review', tone: 'purple' },
  { id: 'done', label: 'Shipped', tone: 'success' },
];

const SEED_TASKS = [
  // INBOX = capture only / not committed yet
  { id: 't10', title: 'Twitch livestream', product: 'p2', status: 'inbox', agent: null, priority: 'low', cost: 0, estCost: 0, source: 'manual', impact: 45, complexity: 'M', age: '2d', progress: 0, pr: null },
  { id: 't11', title: 'Desk', product: 'p2', status: 'inbox', agent: null, priority: 'low', cost: 0, estCost: 0, source: 'manual', impact: 30, complexity: 'S', age: '2d', progress: 0, pr: null },
  { id: 't12', title: 'Whiteboard', product: 'p2', status: 'inbox', agent: null, priority: 'low', cost: 0, estCost: 0, source: 'manual', impact: 30, complexity: 'S', age: '2d', progress: 0, pr: null },
  { id: 't16', title: 'Ad video for hext.ai', product: 'p2', status: 'inbox', agent: null, priority: 'normal', cost: 0, estCost: 0, source: 'manual', impact: 65, complexity: 'M', age: '1d', progress: 0, pr: null },

  // PLANNING = needs shape/spec before agents build
  { id: 't8', title: 'Outbound automations', product: 'p2', status: 'planning', agent: null, priority: 'high', cost: 0, estCost: 0, source: 'manual', impact: 82, complexity: 'L', age: '1h', progress: 12, pr: null },
  { id: 't9', title: 'Social DM automations', product: 'p2', status: 'planning', agent: null, priority: 'normal', cost: 0, estCost: 0, source: 'manual', impact: 68, complexity: 'M', age: '1h', progress: 10, pr: null },
  { id: 't13', title: 'Template building system', product: 'p2', status: 'planning', agent: null, priority: 'normal', cost: 0, estCost: 0, source: 'manual', impact: 70, complexity: 'L', age: '1h', progress: 18, pr: null },
  { id: 't14', title: 'True schedule that protects your energy', product: 'p2', status: 'planning', agent: null, priority: 'high', cost: 0, estCost: 0, source: 'manual', impact: 85, complexity: 'M', age: '1h', progress: 15, pr: null },
  { id: 't19', title: 'Inbound setup', product: 'p2', status: 'planning', agent: null, priority: 'high', cost: 0, estCost: 0, source: 'manual', impact: 78, complexity: 'M', age: '45m', progress: 22, pr: null },

  // ASSIGNED = clear owner/next action, not actively building yet
  { id: 't1', title: "Sydney's app", product: 'p3', status: 'assigned', agent: 'a5', priority: 'high', cost: 0.42, estCost: 0, source: 'manual', impact: 80, complexity: 'L', age: '4h', progress: 35, pr: null },
  { id: 't6', title: 'Proposal to Shannon', product: 'p2', status: 'assigned', agent: 'a7', priority: 'high', cost: 0.18, estCost: 0, source: 'manual', impact: 72, complexity: 'S', age: '3h', progress: 30, pr: null },
  { id: 't15', title: 'OpenAI + Google Studio API credits (buy)', product: 'p2', status: 'assigned', agent: null, priority: 'high', cost: 0, estCost: 0, source: 'manual', impact: 60, complexity: 'S', age: '2h', progress: 20, pr: null },
  { id: 't17', title: 'System for Digital Wave to send their lead list', product: 'p2', status: 'assigned', agent: 'a5', priority: 'high', cost: 0.22, estCost: 0, source: 'manual', impact: 75, complexity: 'M', age: '2h', progress: 28, pr: null },

  // BUILDING = current highest-value work
  { id: 't2', title: 'Personal command center', product: 'p2', status: 'in_progress', agent: 'a3', priority: 'high', cost: 0.84, estCost: 0, source: 'manual', impact: 75, complexity: 'L', age: 'now', progress: 58, pr: null },
  { id: 't3', title: 'FrankenClip', product: 'p1', status: 'in_progress', agent: 'a1', priority: 'high', cost: 4.21, estCost: 0, source: 'manual', impact: 80, complexity: 'XL', age: 'now', progress: 46, pr: null },
  { id: 't4', title: "Jarid's Paperclip company (built + trained)", product: 'p2', status: 'in_progress', agent: 'a2', priority: 'urgent', cost: 2.18, estCost: 0, source: 'manual', impact: 90, complexity: 'M', age: 'now', progress: 72, pr: null },
  { id: 't18', title: 'Automated follow-up system', product: 'p2', status: 'in_progress', agent: 'a7', priority: 'high', cost: 0.71, estCost: 0, source: 'manual', impact: 80, complexity: 'L', age: 'now', progress: 40, pr: null },

  // TESTING = built enough to verify / QA
  { id: 't5', title: 'Digital Wave auditor + questionnaire (questionnaire first)', product: 'p2', status: 'testing', agent: 'a5', priority: 'high', cost: 1.92, estCost: 0, source: 'manual', impact: 78, complexity: 'L', age: '1h', progress: 76, pr: null },
  { id: 't20', title: 'Fix openclaw-control-ui message-drop bug (issue #1)', product: 'p2', status: 'testing', agent: 'a3', priority: 'urgent', cost: 0.84, estCost: 0, source: 'manual', impact: 75, complexity: 'M', age: '1h', progress: 82, pr: null },

  // REVIEW = human decision / approval before it moves
  { id: 't7', title: 'Solar thing (send/build)', product: 'p4', status: 'review', agent: null, priority: 'normal', cost: 0, estCost: 0, source: 'manual', impact: 65, complexity: 'M', age: '2h', progress: 90, pr: null },
];
const SEED_DEALS = [
  { id: 'd1', name: "Sue's Roofing Co.", owner: 'Sue Patel', stage: 'qualified', value: 497, mrr: true, source: 'cold-call', next: 'demo Tue 2pm', heat: 'hot', lastTouch: '14m', agent: 'a7', city: 'Austin, TX' },
  { id: 'd2', name: 'Apex Plumbing', owner: 'Marco Rivera', stage: 'proposal', value: 197, mrr: true, source: 'referral', next: 'follow up — proposal sent', heat: 'hot', lastTouch: '2h', agent: 'a7', city: 'Phoenix, AZ' },
  { id: 'd3', name: 'Brightway Solar Co.', owner: 'Jen Kim', stage: 'discovery', value: 397, mrr: true, source: 'inbound', next: 'discovery call Fri', heat: 'warm', lastTouch: '1d', agent: null, city: 'Denver, CO' },
  { id: 'd4', name: 'Northpoint Hardware', owner: 'Rick D.', stage: 'closed_won', value: 297, mrr: true, source: 'cold-call', next: 'kickoff scheduled', heat: 'won', lastTouch: '3h', agent: 'a7', city: 'Boise, ID' },
  { id: 'd5', name: 'Lakeside Electrical', owner: 'Casey M.', stage: 'qualified', value: 197, mrr: true, source: 'lead-finder', next: 'send pricing', heat: 'warm', lastTouch: '4h', agent: null, city: 'Spokane, WA' },
  { id: 'd6', name: 'Iron Vine Coffee', owner: 'Anita K.', stage: 'discovery', value: 97, mrr: true, source: 'lead-finder', next: 'qualify need', heat: 'cold', lastTouch: '2d', agent: null, city: 'Portland, OR' },
  { id: 'd7', name: 'Summit HVAC', owner: 'Dave T.', stage: 'proposal', value: 497, mrr: true, source: 'referral', next: 'awaiting response', heat: 'warm', lastTouch: '1d', agent: 'a7', city: 'Salt Lake City, UT' },
  { id: 'd8', name: 'Coastal Realty Group', owner: 'Mira L.', stage: 'closed_won', value: 397, mrr: true, source: 'inbound', next: 'onboarding active', heat: 'won', lastTouch: '6h', agent: null, city: 'San Diego, CA' },
];

const DEAL_STAGES = [
  { id: 'discovery', label: 'Discovery', tone: 'info' },
  { id: 'qualified', label: 'Qualified', tone: 'brand' },
  { id: 'proposal', label: 'Proposal', tone: 'warning' },
  { id: 'closed_won', label: 'Won', tone: 'success' },
];

const SEED_IDEAS = [
  { id: 'i1', product: 'p1', title: 'Add monthly digest email — show MoM growth %', desc: 'Customer churn is high in months 2-3. A digest showing their numbers improving creates a "loss aversion" moment that retains 30%+ in similar SaaS plays.', category: 'growth', impact: 86, feasibility: 78, complexity: 'M', tags: ['retention','email','growth'], research: 'Stripe blog · 2024 SaaS retention study', source: 'research' },
  { id: 'i2', product: 'p1', title: 'Inline error explainer — "what does this mean for me?"', desc: 'Power users skip past technical errors. A one-line plain-language translation under each error reduces support tickets ~20%.', category: 'ux', impact: 72, feasibility: 88, complexity: 'S', tags: ['errors','copy','support'], research: 'Linear changelog · "humanized errors" pattern', source: 'research' },
  { id: 'i3', product: 'p2', title: 'Convoy mode: 3-agent parallel for big tasks', desc: 'Large features stall single agents. Parallel decomposition with DAG dependency would cut wall-clock 60%.', category: 'feature', impact: 94, feasibility: 64, complexity: 'XL', tags: ['agents','parallel','build'], research: 'Karpathy AutoResearch · 2025 paper', source: 'research' },
  { id: 'i4', product: 'p1', title: 'Pricing page: stick the CTA on scroll', desc: 'Competitors all stick. Frankenclip\'s pricing CTA is below the fold on mobile. Easy lift, measurable.', category: 'growth', impact: 68, feasibility: 92, complexity: 'S', tags: ['cta','pricing','mobile'], research: 'Stripe / Linear / Vercel pricing pages', source: 'manual' },
  { id: 'i5', product: 'p4', title: 'Auto-disqualify roofs <5yr old', desc: 'Solar pitches on new roofs waste 40% of outreach. Aging detection from satellite already in pipeline; just gate on it.', category: 'feature', impact: 79, feasibility: 71, complexity: 'M', tags: ['filter','roi','solar'], research: 'Internal — last 90d outreach data', source: 'research' },
];

const SEED_ACTIVITY = [
  { id: 'ev1', t: '14:32:08', type: 'task_status_changed', agent: 'a1', task: 't3', msg: 'Forge moved t3 to in_progress', tone: 'brand' },
  { id: 'ev2', t: '14:31:44', type: 'idea_swiped', agent: null, task: 'i4', msg: 'You approved "stick the CTA on scroll"', tone: 'success' },
  { id: 'ev3', t: '14:30:22', type: 'agent_status_changed', agent: 'a3', task: 't2', msg: 'Sentinel: 4 of 6 tests passing', tone: 'warning' },
  { id: 'ev4', t: '14:29:51', type: 'cost_event', agent: 'a6', task: 'cyc-12', msg: 'Muse: ideation cycle · $1.42 · 12 ideas', tone: 'neutral' },
  { id: 'ev5', t: '14:28:15', type: 'pr_created', agent: 'a4', task: 't10', msg: 'PR opened: frankenclip/411 — idea dedup', tone: 'info' },
  { id: 'ev6', t: '14:26:02', type: 'lead_hot', agent: null, task: 'd1', msg: "Sue's Roofing replied — demo confirmed Tue 2pm", tone: 'success' },
  { id: 'ev7', t: '14:24:38', type: 'research', agent: 'a5', task: 'p1', msg: 'Scout: research cycle complete on FrankenClip · 7 findings', tone: 'info' },
  { id: 'ev8', t: '14:22:11', type: 'cash', agent: null, task: null, msg: '+$497 · Sue\'s Roofing · subscription started', tone: 'success' },
  { id: 'ev9', t: '14:19:55', type: 'agent_health', agent: 'a8', task: null, msg: 'Loom: stalled · auto-nudge sent', tone: 'warning' },
  { id: 'ev10', t: '14:17:30', type: 'task_status_changed', agent: 'a4', task: 't10', msg: 'Lens marked t10 ready for review', tone: 'purple' },
  { id: 'ev11', t: '14:15:02', type: 'idea_swiped', agent: null, task: 'i2', msg: 'You marked "humanized errors" as Maybe', tone: 'neutral' },
  { id: 'ev12', t: '14:12:48', type: 'task_completed', agent: 'a2', task: 't12', msg: 'Anvil shipped t12 · Stripe receipts merged', tone: 'success' },
];

// Live stream — events that get added on a tick
const LIVE_STREAM = [
  { type: 'agent_status', agent: 'a1', task: 't3', msg: 'Forge: refactored handler in router.ts', tone: 'brand' },
  { type: 'cash', msg: '+$197 · Apex Plumbing · subscription started', tone: 'success' },
  { type: 'idea_arrived', msg: 'Muse: 3 new ideas landed in swipe deck', tone: 'pink' },
  { type: 'agent_status', agent: 'a3', task: 't2', msg: 'Sentinel: 5 of 6 tests passing', tone: 'warning' },
  { type: 'lead_arrived', msg: 'Lead Finder: 12 new prospects in roofing/HVAC', tone: 'info' },
  { type: 'agent_status', agent: 'a2', task: 't7', msg: 'Anvil: A/B variant 2 deployed to staging', tone: 'brand' },
  { type: 'pr_created', task: 't4', msg: 'PR opened: mio-ai/142 — proposal preview fix', tone: 'info' },
  { type: 'agent_status', agent: 'a5', task: 'p1', msg: 'Scout: scanning competitor pricing pages', tone: 'success' },
  { type: 'cash', msg: '+$397 · Brightway Solar · proposal accepted', tone: 'success' },
  { type: 'idea_arrived', msg: 'Muse: ideation cycle complete · 9 new ideas', tone: 'pink' },
  { type: 'agent_status', agent: 'a1', task: 't3', msg: 'Forge: tests passing locally · pushing branch', tone: 'brand' },
  { type: 'lead_arrived', msg: 'Hot lead: Pinnacle Plumbing replied to outreach', tone: 'success' },
];

Object.assign(window, { SEED_AGENTS, SEED_PRODUCTS, SEED_TASKS, SEED_DEALS, SEED_IDEAS, SEED_ACTIVITY, LIVE_STREAM, STATUSES, DEAL_STAGES });
