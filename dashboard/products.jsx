// Products grid + product detail
const { useState: uSt_PR } = React;

function ProductsScreen({ tasks, onOpenProduct }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
      <SectionHeader label="All products" count={SEED_PRODUCTS.length} action={<span className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>from gh repo list</span>}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
        {SEED_PRODUCTS.map(p => <ProductCard key={p.id} product={p} tasks={tasks.filter(t=>t.product===p.id)} onClick={()=>onOpenProduct(p)}/>)}
      </div>
    </div>
  );
}

function ProductCard({ product, tasks, onClick }) {
  const inProgress = tasks.filter(t=>t.status==='in_progress').length;
  const inbox = tasks.filter(t=>t.status==='inbox' || t.status==='planning').length;
  const colorMap = { brand: '#f97316', info: '#3b82f6', success: '#22c55e', purple: '#a855f7', pink: '#ec4899', cyan: '#22d3ee' };
  const color = colorMap[product.tone] || '#a0a0a8';
  return (
    <div onClick={onClick} className="card-h" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 8, background: `${color}1f`, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{product.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{product.name}</div>
          <div className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>{product.live}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Money value={product.mrr} size="md" tone={product.mrr>0?'primary':'secondary'}/>
          <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)', marginTop: 2 }}>MRR</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginBottom: 12 }}>{product.desc}</div>
      <div style={{ marginBottom: 12 }}>
        <Sparkline data={product.sparkline} color={color} width={328} height={32}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {[
          { l: 'Ideas', v: product.ideas, c: 'var(--fg-primary)' },
          { l: 'Building', v: inProgress, c: 'var(--accent)' },
          { l: 'Shipped', v: product.shipped, c: '#22c55e' },
          { l: 'Health', v: product.health+'%', c: product.health>80?'#22c55e':product.health>60?'#f59e0b':'#ef4444' },
        ].map(s => (
          <div key={s.l} style={{ background: 'var(--surface)', padding: '8px 10px' }}>
            <div className="section-label" style={{ marginBottom: 2 }}>{s.l}</div>
            <div className="mono-num" style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <Icons.Refresh size={11} style={{ color: 'var(--fg-tertiary)' }}/>
        <span className="term" style={{ fontSize: 11, color: 'var(--fg-tertiary)' }}>research {product.cycles.research} · ideation {product.cycles.ideation}</span>
      </div>
    </div>
  );
}

function ProductDetail({ product, tasks, onClose, onOpenTask }) {
  if (!product) return null;
  const colorMap = { brand: '#f97316', info: '#3b82f6', success: '#22c55e', purple: '#a855f7', pink: '#ec4899', cyan: '#22d3ee' };
  const color = colorMap[product.tone] || '#a0a0a8';
  const productTasks = tasks.filter(t=>t.product===product.id);
  const ideas = SEED_IDEAS.filter(i=>i.product===product.id);
  return (
    <div className="backdrop" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width: 880, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 8, background: `${color}1f`, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{product.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>{product.name}</div>
            <div className="term" style={{ fontSize: 11.5, color: 'var(--fg-tertiary)' }}>{product.repo} · {product.live} · {product.desc}</div>
          </div>
          {product.live && <Button variant="secondary" size="sm" icon={<Icons.Globe size={13}/>} onClick={() => window.open(product.live, '_blank')}>Open repo</Button>}
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}><Icons.X size={14}/></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
            <Stat label="MRR" value={<Money value={product.mrr} size="lg" tone="primary"/>} delta="+18% MoM" deltaTone="success" sub="last 30d"/>
            <Stat label="Health" value={<span className="mono-num" style={{ fontSize: 28, fontWeight: 700, color: product.health>80?'#22c55e':'#f59e0b' }}>{product.health}<span style={{ fontSize: 16, color: 'var(--fg-tertiary)' }}>/100</span></span>} delta="stable" deltaTone="neutral" sub="composite score"/>
            <Stat label="Ideas pending" value={<span className="mono-num" style={{ fontSize: 28, fontWeight: 700 }}>{product.ideas}</span>} delta={`${ideas.length} ready`} deltaTone="brand" sub="from research"/>
            <Stat label="Shipped" value={<span className="mono-num" style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{product.shipped}</span>} delta="lifetime" deltaTone="neutral" sub="features merged"/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <SectionHeader label="In flight" count={productTasks.filter(t=>['in_progress','testing','review'].includes(t.status)).length}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {productTasks.filter(t=>['in_progress','testing','review'].includes(t.status)).map(t => (
                  <TaskCard key={t.id} task={t} onDragStart={()=>{}} onDragEnd={()=>{}} onClick={()=>onOpenTask(t)} dense/>
                ))}
                {productTasks.filter(t=>['in_progress','testing','review'].includes(t.status)).length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 11.5, color: 'var(--fg-tertiary)', border: '1px dashed var(--border)', borderRadius: 8 }}>nothing in flight</div>}
              </div>
            </div>
            <div>
              <SectionHeader label="Top ideas" count={ideas.length}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ideas.map(i => (
                  <Card key={i.id} padding={10} hover>
                    <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>{i.title}</div>
                    <div className="term" style={{ fontSize: 10.5, color: 'var(--fg-tertiary)' }}>imp {i.impact} · feas {i.feasibility}% · {i.complexity} · {i.tags.slice(0,2).join(' · ')}</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProductsScreen, ProductDetail });
