'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, FileText, Trash2, Eye, Edit2, X, Save, Loader2, CheckCircle, ChevronRight, TrendingUp, Hash, Calendar, MapPin, MessageCircle, Copy } from 'lucide-react'

type PriceTier = 'dealer' | 'msp' | 'specifiors'
type ShapeType = 'rectangle' | 'circle' | 'l-shape'
type LightType = 'none' | 'single_color' | 'single_color_dimmable' | 'tunable' | 'rgb' | 'rgbw'
type GripperType = 'CW' | 'CC' | 'Profile' | 'Flexible CW' | 'Flexible CC'

interface CeilingItem {
  id: string
  name: string
  shape: ShapeType
  unit: 'feet' | 'meters'
  dimensions: Record<string, number>
  fabricType: string
  withPrinting: boolean
  withFleece: boolean
  lightType: LightType
  lightDepth: number
  ledWidth: 'standard' | 'wider'
  gripperType: GripperType
  surface: 'ceiling' | 'wall'
  quantity: number
  notes: string
}

interface Quote {
  id: string
  quoteNumber: string
  leadId?: number | null
  clientName: string
  projectName: string
  location: string
  date: string
  validUntil: string
  priceTier: PriceTier
  markupPercent: number
  items: CeilingItem[]
  installationRatePerSqft: number
  notes: string
  grandTotal?: number
  createdAt: string
  updatedAt: string
}

const FABRIC_OPTIONS = ['Descor Premium', 'Descor Premium Acoustic', 'Descor Translucent', 'Soundscape Directex', 'Silencio 10', 'Silencio 5', 'Akustico Weiss', 'Descor Premium Dry & Clean', 'Diffuser']
const TIER_OPTS: { value: PriceTier; label: string; desc: string }[] = [
  { value: 'dealer', label: 'Dealer', desc: 'Dealer pricing' },
  { value: 'msp', label: 'MSP', desc: 'Market selling price' },
  { value: 'specifiors', label: 'Specifiors', desc: 'Architects / Specifiers' },
]

function fmtINR(n: number) { return '₹' + Math.round(n).toLocaleString('en-IN') }
function rid() { return Math.random().toString(36).slice(2) }
function defaultItem(): CeilingItem {
  return { id: rid(), name: '', shape: 'rectangle', unit: 'feet', dimensions: { length: 10, width: 10 }, fabricType: 'Descor Premium', withPrinting: false, withFleece: false, lightType: 'none', lightDepth: 6, ledWidth: 'standard', gripperType: 'CW', surface: 'ceiling', quantity: 1, notes: '' }
}

export function QuotesView() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [panel, setPanel] = useState<'none' | 'new' | 'edit' | 'view'>('none')
  const [editing, setEditing] = useState<Quote | null>(null)
  const [viewing, setViewing] = useState<Quote | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchQuotes = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/quotes?q=${encodeURIComponent(q)}`)
      if (res.ok) setQuotes(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])
  useEffect(() => {
    const t = setTimeout(() => fetchQuotes(search), 300)
    return () => clearTimeout(t)
  }, [search, fetchQuotes])

  async function handleDelete(q: Quote) {
    if (!confirm(`Delete quote ${q.quoteNumber} for "${q.clientName}"?`)) return
    setDeleting(q.id)
    await fetch(`/api/quotes/${q.id}`, { method: 'DELETE' })
    setQuotes(prev => prev.filter(x => x.id !== q.id))
    setDeleting(null)
    if (viewing?.id === q.id) setPanel('none')
  }

  async function handleDuplicate(q: Quote) {
    const payload = { ...q, clientName: q.clientName + ' (Copy)', date: new Date().toISOString().split('T')[0], validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] }
    const res = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const created = await res.json()
    setQuotes(prev => [created, ...prev])
    setEditing(created)
    setPanel('edit')
  }

  function openNew() { setEditing(null); setPanel('new') }
  function openEdit(q: Quote) { setEditing(q); setPanel('edit') }
  function openView(q: Quote) { setViewing(q); setPanel('view') }

  function onSaved(q: Quote) {
    setQuotes(prev => {
      const idx = prev.findIndex(x => x.id === q.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = q; return next }
      return [q, ...prev]
    })
    setPanel('view')
    setViewing(q)
  }

  const totalValue = quotes.reduce((s, q) => s + (q.grandTotal || 0), 0)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: list */}
      <div className={`flex flex-col transition-all duration-300 ${panel !== 'none' ? 'w-[380px] shrink-0' : 'flex-1'} h-full overflow-hidden border-r border-border`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-foreground">Quotations</h2>
              <p className="text-xs text-muted-foreground">{quotes.length} quotes</p>
            </div>
            <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-xs font-semibold transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Quote
            </button>
          </div>
          {/* Stats */}
          {!loading && quotes.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Quotes</p>
                  <p className="text-sm font-bold text-foreground">{quotes.length}</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Pipeline</p>
                  <p className="text-sm font-bold text-foreground">{fmtINR(totalValue)}</p>
                </div>
              </div>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder:text-muted-foreground" placeholder="Search quotes…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
              <FileText className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{search ? 'No quotes found' : 'No quotes yet'}</p>
              {!search && <button onClick={openNew} className="text-xs text-amber-500 hover:underline">Create first quote</button>}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {quotes.map(q => (
                <button key={q.id} onClick={() => openView(q)} className={`w-full text-left px-4 py-3.5 hover:bg-muted/40 transition-colors group ${viewing?.id === q.id && panel === 'view' ? 'bg-primary/5 border-l-2 border-l-amber-500' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-semibold text-foreground truncate">{q.clientName}</span>
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium shrink-0">{q.quoteNumber}</span>
                      </div>
                      {q.projectName && <p className="text-xs text-muted-foreground truncate">{q.projectName}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {q.grandTotal != null && q.grandTotal > 0 && <span className="text-xs font-bold text-amber-500">{fmtINR(q.grandTotal)}</span>}
                        <span className="text-[10px] text-muted-foreground">{new Date(q.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        {q.location && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{q.location}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: panel */}
      {panel !== 'none' && (
        <div className="flex-1 overflow-y-auto">
          {(panel === 'new' || panel === 'edit') && (
            <QuoteBuilderPanel
              initial={panel === 'edit' ? editing ?? undefined : undefined}
              mode={panel}
              onSaved={onSaved}
              onClose={() => setPanel('none')}
            />
          )}
          {panel === 'view' && viewing && (
            <QuoteDetailPanel
              quote={viewing}
              onEdit={() => { setEditing(viewing); setPanel('edit') }}
              onDelete={() => handleDelete(viewing)}
              onDuplicate={() => handleDuplicate(viewing)}
              onClose={() => setPanel('none')}
              deleting={deleting === viewing.id}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Quote detail panel

function QuoteDetailPanel({ quote, onEdit, onDelete, onDuplicate, onClose, deleting }: {
  quote: Quote
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onClose: () => void
  deleting: boolean
}) {
  const dateStr = new Date(quote.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const waMsg = encodeURIComponent(`*PONGS Stretch Ceiling – Quotation*\n\n*Quote:* ${quote.quoteNumber}\n*Client:* ${quote.clientName}\n*Project:* ${quote.projectName || '—'}\n*Date:* ${dateStr}\n\n*Grand Total: ${fmtINR(quote.grandTotal || 0)}* (Excl. GST)\n\n_Sidharth Trading Co._`)
  const TIER: Record<string, string> = { dealer: 'Dealer', msp: 'MSP', specifiors: 'Specifiors' }
  const LIGHT: Record<string, string> = { none: 'No lighting', single_color: 'Single Colour LED', single_color_dimmable: 'Dimmable LED', tunable: 'Tunable White', rgb: 'RGB', rgbw: 'RGBW' }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-amber-500/15 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">{quote.quoteNumber}</span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{TIER[quote.priceTier]}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">{quote.clientName}</h2>
          {quote.projectName && <p className="text-sm text-muted-foreground">{quote.projectName}</p>}
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Grand total */}
      {(quote.grandTotal ?? 0) > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 text-center">
          <p className="text-xs text-muted-foreground mb-1">Grand Total (Excl. GST)</p>
          <p className="text-3xl font-black text-amber-500">{fmtINR(quote.grandTotal || 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{quote.items.length} ceiling item{quote.items.length !== 1 ? 's' : ''} · ₹{quote.installationRatePerSqft}/sqft installation</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium text-foreground transition-colors">
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onDuplicate} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium text-foreground transition-colors">
          <Copy className="w-3.5 h-3.5" />
        </button>
        <a href={`https://wa.me/?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 border border-green-500/20 rounded-lg text-sm font-medium transition-colors">
          <MessageCircle className="w-3.5 h-3.5" /> Share
        </a>
        <button onClick={onDelete} disabled={deleting} className="flex items-center justify-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Details</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{dateStr}</span></div>
            {quote.validUntil && <div className="flex justify-between"><span className="text-muted-foreground">Valid until</span><span className="font-medium text-foreground">{new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>}
            {quote.location && <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium text-foreground">{quote.location}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Pricing tier</span><span className="font-medium text-foreground">{TIER[quote.priceTier]}{quote.markupPercent > 0 ? ` +${quote.markupPercent}%` : ''}</span></div>
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ceiling Items</p>
          <div className="space-y-2">
            {quote.items.map((item, idx) => (
              <div key={item.id} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name || `Item ${idx + 1}`}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.fabricType} · {item.shape} · {item.quantity > 1 ? `×${item.quantity}` : ''}</p>
                    {item.lightType !== 'none' && <p className="text-xs text-amber-500 mt-0.5">{LIGHT[item.lightType]}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {quote.notes && (
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
            <p className="text-sm text-foreground whitespace-pre-line">{quote.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Quote builder panel

function QuoteBuilderPanel({ initial, mode, onSaved, onClose }: {
  initial?: Quote
  mode: 'new' | 'edit'
  onSaved: (q: Quote) => void
  onClose: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const valid30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [meta, setMeta] = useState({
    clientName: initial?.clientName ?? '',
    projectName: initial?.projectName ?? '',
    location: initial?.location ?? '',
    date: initial?.date ?? today,
    validUntil: initial?.validUntil ?? valid30,
    priceTier: (initial?.priceTier ?? 'msp') as PriceTier,
    markupPercent: initial?.markupPercent ?? 0,
    installationRatePerSqft: initial?.installationRatePerSqft ?? 60,
    notes: initial?.notes ?? '',
  })

  const [items, setItems] = useState<CeilingItem[]>(initial?.items?.length ? initial.items : [defaultItem()])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function addItem() { setItems(prev => [...prev, defaultItem()]) }
  function updateItem(idx: number, item: CeilingItem) { setItems(prev => prev.map((p, i) => i === idx ? item : p)) }
  function removeItem(idx: number) { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    if (!meta.clientName.trim()) return alert('Please enter a client name.')
    setSaving(true)
    const payload = { ...meta, items }
    const url = mode === 'edit' ? `/api/quotes/${initial!.id}` : '/api/quotes'
    const method = mode === 'edit' ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await res.json()
      setSaved(true)
      setTimeout(() => { onSaved(result); setSaved(false) }, 600)
    } finally { setSaving(false) }
  }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-foreground">{mode === 'new' ? 'New Quote' : 'Edit Quote'}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <div className="space-y-5">
        {/* Project details */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Project Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Client Name *</label>
              <input className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40" placeholder="ABC Corporation" value={meta.clientName} onChange={e => setMeta(m => ({ ...m, clientName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Project Name</label>
              <input className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40" placeholder="Office Renovation" value={meta.projectName} onChange={e => setMeta(m => ({ ...m, projectName: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Location</label>
              <input className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40" placeholder="Mumbai" value={meta.location} onChange={e => setMeta(m => ({ ...m, location: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Quote Date</label>
              <input type="date" className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40" value={meta.date} onChange={e => setMeta(m => ({ ...m, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Valid Until</label>
              <input type="date" className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40" value={meta.validUntil} onChange={e => setMeta(m => ({ ...m, validUntil: e.target.value }))} />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pricing</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {TIER_OPTS.map(t => (
              <button key={t.value} type="button" onClick={() => setMeta(m => ({ ...m, priceTier: t.value }))}
                className={`p-2.5 rounded-lg border text-left transition-all text-xs ${meta.priceTier === t.value ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-border text-muted-foreground hover:border-border/80 bg-muted/30'}`}>
                <div className="font-semibold">{t.label}</div>
                <div className="text-[10px] mt-0.5 opacity-70">{t.desc}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Markup (%)</label>
              <input type="number" min="0" max="200" className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40" value={meta.markupPercent} onChange={e => setMeta(m => ({ ...m, markupPercent: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Installation (₹/sqft)</label>
              <input type="number" min="0" className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40" value={meta.installationRatePerSqft} onChange={e => setMeta(m => ({ ...m, installationRatePerSqft: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
        </section>

        {/* Items */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ceiling Items</p>
            <button onClick={addItem} className="text-xs text-amber-500 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <InlineItemForm key={item.id} item={item} index={idx} onChange={u => updateItem(idx, u)} onRemove={() => removeItem(idx)} canRemove={items.length > 1} />
            ))}
          </div>
        </section>

        {/* Notes */}
        <section>
          <label className="block text-xs text-muted-foreground mb-1">Notes / Terms</label>
          <textarea className="w-full px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none h-20" placeholder="Any special notes…" value={meta.notes} onChange={e => setMeta(m => ({ ...m, notes: e.target.value }))} />
        </section>

        {/* Save */}
        <button onClick={handleSave} disabled={saving || saved} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-black'}`}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : saved ? <><CheckCircle className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />{mode === 'edit' ? 'Update Quote' : 'Save Quote'}</>}
        </button>
      </div>
    </div>
  )
}

function InlineItemForm({ item, index, onChange, onRemove, canRemove }: {
  item: CeilingItem; index: number; onChange: (i: CeilingItem) => void; onRemove: () => void; canRemove: boolean
}) {
  const up = (p: Partial<CeilingItem>) => onChange({ ...item, ...p })
  const upDim = (k: string, v: number) => onChange({ ...item, dimensions: { ...item.dimensions, [k]: v } })

  return (
    <div className="bg-muted/30 border border-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-foreground">Item {index + 1}</span>
        {canRemove && <button onClick={onRemove} className="text-red-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="block text-[10px] text-muted-foreground mb-1">Item Name</label>
          <input className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40" placeholder="Main lobby ceiling" value={item.name} onChange={e => up({ name: e.target.value })} />
        </div>
        <div>
          <label className="block text-[10px] text-muted-foreground mb-1">Shape</label>
          <select className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.shape} onChange={e => up({ shape: e.target.value as ShapeType })}>
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="l-shape">L-Shape</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-muted-foreground mb-1">Unit</label>
          <select className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.unit} onChange={e => up({ unit: e.target.value as 'feet' | 'meters' })}>
            <option value="feet">Feet</option>
            <option value="meters">Meters</option>
          </select>
        </div>
        {item.shape === 'rectangle' && (
          <>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Length ({item.unit === 'feet' ? 'ft' : 'm'})</label>
              <input type="number" min="0" step="0.1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.dimensions.length ?? 0} onChange={e => upDim('length', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">Width ({item.unit === 'feet' ? 'ft' : 'm'})</label>
              <input type="number" min="0" step="0.1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.dimensions.width ?? 0} onChange={e => upDim('width', parseFloat(e.target.value) || 0)} />
            </div>
          </>
        )}
        {item.shape === 'circle' && (
          <div className="col-span-2">
            <label className="block text-[10px] text-muted-foreground mb-1">Diameter ({item.unit === 'feet' ? 'ft' : 'm'})</label>
            <input type="number" min="0" step="0.1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.dimensions.diameter ?? 0} onChange={e => upDim('diameter', parseFloat(e.target.value) || 0)} />
          </div>
        )}
        {item.shape === 'l-shape' && (
          <>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">L1 Length</label>
              <input type="number" min="0" step="0.1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.dimensions.length1 ?? 0} onChange={e => upDim('length1', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">L1 Width</label>
              <input type="number" min="0" step="0.1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.dimensions.width1 ?? 0} onChange={e => upDim('width1', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">L2 Length</label>
              <input type="number" min="0" step="0.1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.dimensions.length2 ?? 0} onChange={e => upDim('length2', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1">L2 Width</label>
              <input type="number" min="0" step="0.1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.dimensions.width2 ?? 0} onChange={e => upDim('width2', parseFloat(e.target.value) || 0)} />
            </div>
          </>
        )}
        <div className="col-span-2">
          <label className="block text-[10px] text-muted-foreground mb-1">Fabric</label>
          <select className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.fabricType} onChange={e => up({ fabricType: e.target.value })}>
            {FABRIC_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-muted-foreground mb-1">Gripper</label>
          <select className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.gripperType} onChange={e => up({ gripperType: e.target.value as GripperType })}>
            {['CW','CC','Profile','Flexible CW','Flexible CC'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-muted-foreground mb-1">Qty</label>
          <input type="number" min="1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.quantity} onChange={e => up({ quantity: parseInt(e.target.value) || 1 })} />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] text-muted-foreground mb-1">Lighting</label>
          <select className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.lightType} onChange={e => up({ lightType: e.target.value as LightType })}>
            <option value="none">No lighting</option>
            <option value="single_color">Single Colour LED</option>
            <option value="single_color_dimmable">Dimmable LED</option>
            <option value="tunable">Tunable White</option>
            <option value="rgb">RGB</option>
            <option value="rgbw">RGBW</option>
          </select>
        </div>
        {item.lightType !== 'none' && (
          <div className="col-span-2">
            <label className="block text-[10px] text-muted-foreground mb-1">Cove Depth (inches)</label>
            <input type="number" min="1" className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none" value={item.lightDepth} onChange={e => up({ lightDepth: parseInt(e.target.value) || 6 })} />
          </div>
        )}
        <div className="col-span-2 flex gap-4">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" className="rounded" checked={item.withPrinting} onChange={e => up({ withPrinting: e.target.checked })} />
            With Printing
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" className="rounded" checked={item.withFleece} onChange={e => up({ withFleece: e.target.checked })} />
            With Fleece
          </label>
        </div>
      </div>
    </div>
  )
}
