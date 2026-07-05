'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Flame, Snowflake, PartyPopper, Wind, X, Plus, Check,
  ArrowRight, ArrowDown, Send, ShieldCheck, Play, Star, Trash2, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { EffectCanvas } from './EffectCanvas';
import { categories, machines, type Machine, type Category } from './data';
import './catalogue.css';

const catIcon: Record<string, React.ComponentType<{ size?: number }>> = {
  'cold-spark': Sparkles,
  cryo: Snowflake,
  confetti: PartyPopper,
  'flame-pyro': Flame,
  atmosphere: Wind,
};

export function Catalogue() {
  const [filter, setFilter] = useState<string>('all');
  const [open, setOpen] = useState<Machine | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [enquiry, setEnquiry] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);

  const inEnquiry = (id: string) => enquiry.includes(id);
  const toggleEnquiry = (m: Machine) => {
    setEnquiry((prev) => {
      if (prev.includes(m.id)) {
        toast(`${m.name} removed from enquiry`);
        return prev.filter((x) => x !== m.id);
      }
      toast.success(`${m.name} added to your enquiry`);
      return [...prev, m.id];
    });
  };

  // lock body scroll when an overlay is open
  useEffect(() => {
    const lock = open || drawer;
    document.body.style.overflow = lock ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open, drawer]);

  // esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(null); setDrawer(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const visibleCats = useMemo<Category[]>(
    () => (filter === 'all' ? categories : categories.filter((c) => c.id === filter)),
    [filter],
  );

  return (
    <div className="rl-root">
      <div className="rl-ambient" />

      {/* NAV */}
      <nav className="rl-nav">
        <div className="rl-shell rl-nav-inner">
          <div className="rl-brand">
            <span className="rl-brand-mark"><Sparkles size={17} /></span>
            <span>
              Relive Events
              <small>SFX Catalogue</small>
            </span>
          </div>
          <button className="rl-nav-cta" onClick={() => setDrawer(true)}>
            Enquiry
            {enquiry.length > 0 && <span className="rl-nav-count">{enquiry.length}</span>}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="rl-hero">
        <div className="rl-hero-canvas">
          <EffectCanvas effect="sparks" hue={42} intensity={0.6} className="rl-card-canvas" />
        </div>
        <div className="rl-shell" style={{ position: 'relative', zIndex: 2 }}>
          <span className="rl-eyebrow"><Zap size={13} /> Special Effects · For Event Planners</span>
          <h1>
            Turn the{' '}
            <span className="rl-rotator" aria-hidden="true">
              <span>first dance</span>
              <span>beat drop</span>
              <span>grand entrance</span>
              <span>final bow</span>
              <span>big reveal</span>
              <span>first dance</span>
            </span>
            <br />
            into something <span className="rl-grad">unforgettable</span>
          </h1>
          <p>
            Sparks, cryo, confetti, flame and dreamy atmosphere — engineered for the beat drop,
            the first dance and the final bow. Tap any machine to watch its effect come alive,
            then build a shortlist to send our team.
          </p>
          <div className="rl-hero-actions">
            <a className="rl-btn rl-btn-primary" href="#catalogue">
              Explore the machines <ArrowDown size={16} />
            </a>
            <button className="rl-btn rl-btn-ghost" onClick={() => setDrawer(true)}>
              Start an enquiry <ArrowRight size={16} />
            </button>
          </div>
          <div className="rl-stats">
            <div className="rl-stat"><b>14</b><span>Signature effects</span></div>
            <div className="rl-stat"><b>5</b><span>Effect families</span></div>
            <div className="rl-stat"><b>100%</b><span>Indoor-safe options</span></div>
          </div>
          <div className="rl-trusted">
            <b>Weddings</b> <i /> <b>Festivals</b> <i /> <b>Concerts</b> <i /> <b>Corporate</b> <i /> <b>Nightclubs</b>
          </div>
        </div>
      </header>

      {/* FILTERS */}
      <div className="rl-filters-wrap" id="catalogue">
        <div className="rl-shell">
          <div className="rl-filters">
            <button
              className="rl-chip"
              data-active={filter === 'all'}
              style={{ ['--rl-hue' as string]: 42 }}
              onClick={() => setFilter('all')}
            >
              <Star size={14} /> All effects
            </button>
            {categories.map((c) => {
              const Icon = catIcon[c.id];
              return (
                <button
                  key={c.id}
                  className="rl-chip"
                  data-active={filter === c.id}
                  style={{ ['--rl-hue' as string]: c.hue }}
                  onClick={() => setFilter(c.id)}
                >
                  <span className="rl-chip-dot" />
                  <Icon size={14} /> {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTIONS */}
      <main className="rl-shell rl-section">
        {visibleCats.map((cat) => {
          const items = machines.filter((m) => m.categoryId === cat.id);
          return (
            <section key={cat.id} style={{ ['--rl-hue' as string]: cat.hue }}>
              <div className="rl-cat-head">
                <h2>{cat.name}</h2>
                <p>{cat.blurb}</p>
              </div>
              <div className="rl-grid">
                {items.map((m, i) => (
                  <MachineCard
                    key={m.id}
                    machine={m}
                    index={i}
                    added={inEnquiry(m.id)}
                    onOpen={() => { setOpen(m); setReplayKey((k) => k + 1); }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* FOOTER */}
      <footer className="rl-footer">
        <div className="rl-shell">
          <h3>Let’s design your <span className="rl-grad">show-stopping</span> moment</h3>
          <p>
            Tell us about your event and the effects that caught your eye — our team will handle
            the rigging, safety, timing and licensing so you can enjoy the show.
          </p>
          <div className="rl-hero-actions" style={{ marginTop: 28 }}>
            <button className="rl-btn rl-btn-primary" onClick={() => setDrawer(true)}>
              <Send size={16} /> Send an enquiry
            </button>
          </div>
          <div className="rl-footer-meta">
            Relive Events · Special Effects & Show Production · Effects operated by trained crew
          </div>
        </div>
      </footer>

      {/* FLOATING ENQUIRY FAB */}
      <button
        className={`rl-fab ${enquiry.length > 0 ? 'rl-show' : ''}`}
        onClick={() => setDrawer(true)}
      >
        <Send size={16} /> View enquiry
        <span className="rl-fab-badge">{enquiry.length}</span>
      </button>

      {/* MACHINE MODAL */}
      {open && (
        <MachineModal
          machine={open}
          replayKey={replayKey}
          added={inEnquiry(open.id)}
          onReplay={() => setReplayKey((k) => k + 1)}
          onToggle={() => toggleEnquiry(open)}
          onClose={() => setOpen(null)}
        />
      )}

      {/* ENQUIRY DRAWER */}
      {drawer && (
        <EnquiryDrawer
          items={machines.filter((m) => enquiry.includes(m.id))}
          onRemove={(id) => setEnquiry((prev) => prev.filter((x) => x !== id))}
          onClose={() => setDrawer(false)}
          onBrowse={() => setDrawer(false)}
        />
      )}
    </div>
  );
}

/* -------------------- Machine Card -------------------- */
function MachineCard({
  machine, index, added, onOpen,
}: { machine: Machine; index: number; added: boolean; onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`rl-card ${visible ? 'rl-in' : ''} ${machine.hero ? 'rl-hero-card' : ''}`}
      style={{ ['--rl-hue' as string]: machine.hue, transitionDelay: `${(index % 3) * 70}ms` }}
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="rl-card-visual">
        <span className="rl-card-badge">{machine.name}</span>
        {(hover || machine.hero) && (
          <EffectCanvas
            effect={machine.effect}
            hue={machine.hue}
            playing={hover || machine.hero}
            intensity={0.5}
            className="rl-card-canvas"
          />
        )}
        <span className="rl-card-play"><Play size={12} /> See it live</span>
      </div>
      <div className="rl-card-body">
        <h3>{machine.name}</h3>
        <p className="rl-tag">{machine.tagline}</p>
        <div className="rl-pills">
          {machine.specs.slice(0, 2).map((s) => (
            <span key={s.label} className="rl-pill">{s.value}</span>
          ))}
        </div>
      </div>
      {added && <span className="rl-card-added" />}
    </div>
  );
}

/* -------------------- Machine Modal -------------------- */
function MachineModal({
  machine, replayKey, added, onReplay, onToggle, onClose,
}: {
  machine: Machine; replayKey: number; added: boolean;
  onReplay: () => void; onToggle: () => void; onClose: () => void;
}) {
  const cat = categories.find((c) => c.id === machine.categoryId);
  return (
    <div className="rl-modal-scrim" onClick={onClose}>
      <div
        className="rl-modal"
        style={{ ['--rl-hue' as string]: machine.hue }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rl-modal-stage">
          <EffectCanvas key={replayKey} effect={machine.effect} hue={machine.hue} className="rl-modal-canvas" />
          <span className="rl-modal-cat">{cat?.name}</span>
          <button className="rl-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
          <button className="rl-modal-replay" onClick={onReplay}><Play size={13} /> Replay effect</button>
        </div>
        <div className="rl-modal-body">
          <h2>{machine.name}</h2>
          <p className="rl-tag">{machine.tagline}</p>
          <p className="rl-desc">{machine.description}</p>

          <div className="rl-spec-grid">
            {machine.specs.map((s) => (
              <div key={s.label} className="rl-spec">
                <span>{s.label}</span>
                <b>{s.value}</b>
              </div>
            ))}
          </div>

          <div className="rl-block-title">Perfect for</div>
          <div className="rl-best">
            {machine.bestFor.map((b) => <span key={b}>{b}</span>)}
          </div>

          <div className="rl-safety">
            <ShieldCheck size={18} style={{ flex: '0 0 auto', marginTop: 1 }} />
            <span>{machine.safety}</span>
          </div>

          <div className="rl-modal-actions">
            <button className="rl-btn rl-btn-cat" data-added={added} onClick={onToggle}>
              {added ? <><Check size={16} /> Added to enquiry</> : <><Plus size={16} /> Add to enquiry</>}
            </button>
            <button className="rl-btn rl-btn-ghost" onClick={onClose}>Keep browsing</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Enquiry Drawer -------------------- */
function EnquiryDrawer({
  items, onRemove, onClose, onBrowse,
}: {
  items: Machine[]; onRemove: (id: string) => void; onClose: () => void; onBrowse: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Please add your name and email so we can reply.');
      return;
    }
    const lines = [
      `New effects enquiry from ${name}`,
      email ? `Email: ${email}` : '',
      date ? `Event date: ${date}` : '',
      '',
      'Effects of interest:',
      ...items.map((m) => ` • ${m.name} — ${m.tagline}`),
      items.length === 0 ? ' • (no specific machines selected yet)' : '',
      '',
      note ? `Notes: ${note}` : '',
    ].filter(Boolean);
    const body = encodeURIComponent(lines.join('\n'));
    const subject = encodeURIComponent(`SFX Enquiry — ${name}${items.length ? ` (${items.length} effects)` : ''}`);
    window.location.href = `mailto:hello@relive.events?subject=${subject}&body=${body}`;
    toast.success('Opening your email to send the enquiry…');
  };

  return (
    <>
      <div className="rl-drawer-scrim" onClick={onClose} />
      <aside className="rl-drawer">
        <div className="rl-drawer-head">
          <div>
            <h3>Your enquiry</h3>
            <p>{items.length} effect{items.length === 1 ? '' : 's'} shortlisted</p>
          </div>
          <button className="rl-modal-close" style={{ position: 'static' }} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="rl-drawer-body">
          {items.length === 0 ? (
            <div className="rl-empty">
              <PartyPopper size={30} />
              <p style={{ marginTop: 12 }}>No effects added yet.<br />Tap “Add to enquiry” on any machine.</p>
              <button className="rl-btn rl-btn-ghost" style={{ marginTop: 16 }} onClick={onBrowse}>
                Browse effects
              </button>
            </div>
          ) : (
            items.map((m) => (
              <div key={m.id} className="rl-enq-item" style={{ ['--rl-hue' as string]: m.hue }}>
                <div className="rl-enq-swatch" />
                <div>
                  <h4>{m.name}</h4>
                  <small>{m.tagline}</small>
                </div>
                <button className="rl-enq-remove" onClick={() => onRemove(m.id)} aria-label="Remove">
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}

          <div style={{ marginTop: 18 }}>
            <div className="rl-field">
              <label>Your name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" />
            </div>
            <div className="rl-field">
              <label>Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" />
            </div>
            <div className="rl-field">
              <label>Event date</label>
              <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. 14 Feb 2027" />
            </div>
            <div className="rl-field">
              <label>Tell us about your event</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Venue, guest count, the moment you want to elevate…" />
            </div>
          </div>
        </div>

        <div className="rl-drawer-foot">
          <button className="rl-btn rl-btn-primary" onClick={submit}>
            <Send size={16} /> Send enquiry to Relive Events
          </button>
        </div>
      </aside>
    </>
  );
}
