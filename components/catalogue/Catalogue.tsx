'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EffectCanvas } from './EffectCanvas';
import { MachineArt } from './MachineArt';
import { categories, machines, type Machine } from './data';
import './catalogue.css';

export function Catalogue() {
  const [enquiry, setEnquiry] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [activeCat, setActiveCat] = useState<string>('');

  const toggle = (m: Machine) => {
    setEnquiry((prev) =>
      prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id],
    );
    if (!enquiry.includes(m.id)) toast(`${m.name} added to enquiry`, { duration: 1800 });
  };

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // scrollspy for family index
  useEffect(() => {
    const els = categories
      .map((c) => document.getElementById(`family-${c.id}`))
      .filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveCat(e.target.id.replace('family-', ''));
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const selected = useMemo(
    () => machines.filter((m) => enquiry.includes(m.id)),
    [enquiry],
  );

  return (
    <div className="ct">
      {/* ---- nav ---- */}
      <nav className="ct-nav">
        <div className="ct-wrap ct-nav-in">
          <span className="ct-wordmark">Relive <em>Events</em></span>
          <div className="ct-nav-links ct-mono">
            {categories.map((c) => (
              <a key={c.id} href={`#family-${c.id}`}>{c.name.split(' ')[0]}</a>
            ))}
          </div>
          <button className="ct-nav-enq ct-mono" onClick={() => setDrawer(true)}>
            Enquiry{enquiry.length > 0 && <b>{enquiry.length}</b>}
          </button>
        </div>
      </nav>

      {/* ---- hero ---- */}
      <header className="ct-hero">
        <div className="ct-wrap">
          <span className="ct-kicker ct-mono">Special Effects — Technical Catalogue</span>
          <div className="ct-hero-grid">
            <div>
              <h1>Precision effects for<br />live <em>moments.</em></h1>
              <p className="ct-hero-sub">
                Fourteen effect systems across five families — cold spark, cryogenic,
                confetti, flame and atmospheric — specified, installed and operated by
                our own crew. This catalogue sets out what each system does, what it
                needs, and where it works best.
              </p>
            </div>
            <aside className="ct-hero-aside">
              <dl>
                <dt className="ct-mono">Systems</dt>
                <dd>14 machines, 5 families</dd>
                <dt className="ct-mono">Operation</dt>
                <dd>Crewed, insured, venue-approved</dd>
                <dt className="ct-mono">Control</dt>
                <dd>DMX 512 · timecode · manual</dd>
              </dl>
            </aside>
          </div>
          <div className="ct-hero-foot ct-mono">
            <span>Relive Events — SFX Division</span>
            <span>Edition 2026 · For event planners & producers</span>
          </div>
        </div>
      </header>

      {/* ---- family index ---- */}
      <div className="ct-idx">
        <div className="ct-wrap ct-idx-in ct-mono">
          {categories.map((c) => (
            <a key={c.id} href={`#family-${c.id}`} className={activeCat === c.id ? 'on' : ''}>
              {c.no}. {c.name}
            </a>
          ))}
        </div>
      </div>

      {/* ---- catalogue ---- */}
      <main className="ct-wrap">
        {categories.map((cat) => (
          <section key={cat.id} id={`family-${cat.id}`} className="ct-family">
            <div className="ct-family-head">
              <span className="no">{cat.no}.</span>
              <h2>{cat.name}</h2>
            </div>
            <p className="ct-family-blurb">{cat.blurb}</p>
            {machines
              .filter((m) => m.categoryId === cat.id)
              .map((m) => (
                <Entry
                  key={m.id}
                  machine={m}
                  added={enquiry.includes(m.id)}
                  onToggle={() => toggle(m)}
                />
              ))}
          </section>
        ))}

        {/* ---- process ---- */}
        <section className="ct-process">
          <h2>How we deliver</h2>
          <div className="ct-process-grid">
            <div className="ct-step">
              <span className="ct-mono">01 — Specify</span>
              <h4>Site survey & compliance</h4>
              <p>
                We walk the venue, confirm clearances, detector zones and power, and
                produce the risk assessment and any permits. You receive one effects
                plan the venue has already signed off.
              </p>
            </div>
            <div className="ct-step">
              <span className="ct-mono">02 — Integrate</span>
              <h4>Programmed to your show</h4>
              <p>
                Effects are patched to the lighting desk or timecode and rehearsed
                against your run sheet — cues land on the beat, the vow, the reveal,
                not somewhere near it.
              </p>
            </div>
            <div className="ct-step">
              <span className="ct-mono">03 — Operate</span>
              <h4>Crewed on the night</h4>
              <p>
                Every system arrives with our technicians, who install, fire and
                strike it. Consumables, cylinders and reloads are managed without a
                single question reaching you mid-event.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ---- cta ---- */}
      <section className="ct-cta">
        <div className="ct-wrap">
          <h2>Tell us the moment. We&rsquo;ll build the <em>effect.</em></h2>
          <p>
            Shortlist the systems that fit your event and send them across — we
            respond with availability, a specification and a quote within one
            working day.
          </p>
          <button className="ct-cta-btn" onClick={() => setDrawer(true)}>
            Start an enquiry
          </button>
        </div>
      </section>

      <footer className="ct-foot">
        <div className="ct-wrap ct-mono" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span>© Relive Events — Special Effects</span>
          <span>All effects crewed & insured</span>
        </div>
      </footer>

      {/* ---- shortlist pill ---- */}
      <button
        className={`ct-pill ${enquiry.length === 0 ? 'hide' : ''}`}
        onClick={() => setDrawer(true)}
      >
        Enquiry shortlist<b>{enquiry.length}</b>
      </button>

      {/* ---- drawer ---- */}
      {drawer && (
        <Drawer
          items={selected}
          onRemove={(id) => setEnquiry((p) => p.filter((x) => x !== id))}
          onClose={() => setDrawer(false)}
        />
      )}
    </div>
  );
}

/* ---------------- catalogue entry ---------------- */
function Entry({ machine, added, onToggle }: {
  machine: Machine; added: boolean; onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [shown, setShown] = useState(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setShown(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article ref={ref} className={`ct-entry ${shown ? 'in' : ''}`} id={machine.id}>
      <div className="ct-stage-col">
        <div className="ct-stage">
          <div className="ct-art"><MachineArt id={machine.id} /></div>
          {shown && (
            <EffectCanvas
              effect={machine.effect}
              playing={inView}
              burstKey={burst}
              artWidth={240}
              className="ct-fx"
            />
          )}
        </div>
        <div className="ct-stage-meta ct-mono">
          <span>Fig. {machine.index} — {machine.name}</span>
          <button className="ct-replay" onClick={() => setBurst((b) => b + 1)}>
            Replay effect
          </button>
        </div>
      </div>

      <div>
        <div className="ct-entry-head">
          <span className="ct-entry-no">{machine.index}</span>
          <h3>{machine.name}</h3>
        </div>
        <p className="ct-entry-tagline ct-mono">{machine.tagline} · {machine.environment}</p>
        <p className="ct-entry-overview">{machine.overview}</p>

        <dl className="ct-specs">
          {machine.specs.map((s) => (
            <div key={s.label} className="ct-spec-row">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>

        <p className="ct-note"><b>In practice — </b>{machine.deployment}</p>

        <div className="ct-entry-foot">
          <p className="ct-apps ct-mono">
            For — <span>{machine.applications.join(' · ')}</span>
            <br />
            Pairs with — <span>{machine.pairsWith.join(' · ')}</span>
          </p>
          <button className={`ct-add ${added ? 'added' : ''}`} onClick={onToggle}>
            {added ? '✓ On shortlist' : 'Add to enquiry'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------------- drawer ---------------- */
function Drawer({ items, onRemove, onClose }: {
  items: Machine[]; onRemove: (id: string) => void; onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      toast('Please add your name and email so we can respond.', { duration: 2400 });
      return;
    }
    const lines = [
      `Effects enquiry — ${name}`,
      `Email: ${email}`,
      date ? `Event date: ${date}` : '',
      '',
      'Systems of interest:',
      ...(items.length
        ? items.map((m) => `  ${m.index}. ${m.name} — ${m.tagline}`)
        : ['  (to be discussed)']),
      '',
      note ? `Event notes: ${note}` : '',
    ].filter(Boolean);
    const subject = encodeURIComponent(`SFX enquiry — ${name}`);
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:hello@relive.events?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div className="ct-scrim" onClick={onClose} />
      <aside className="ct-drawer">
        <div className="ct-drawer-head">
          <div>
            <h3>Enquiry</h3>
            <span className="ct-mono">
              {items.length} system{items.length === 1 ? '' : 's'} shortlisted
            </span>
          </div>
          <button className="ct-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="ct-drawer-body">
          {items.length === 0 ? (
            <p className="ct-empty">
              Nothing shortlisted yet — you can still send a general enquiry, or add
              systems from the catalogue with &ldquo;Add to enquiry&rdquo;.
            </p>
          ) : (
            items.map((m) => (
              <div key={m.id} className="ct-enq-row">
                <span><span className="no">{m.index}</span><span className="nm">{m.name}</span></span>
                <button className="ct-enq-rm" onClick={() => onRemove(m.id)}>Remove</button>
              </div>
            ))
          )}
          <div className="ct-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="ct-field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="ct-field">
            <label>Event date</label>
            <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="If known" />
          </div>
          <div className="ct-field">
            <label>About the event</label>
            <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Venue, audience size, the moments you want to build…" />
          </div>
        </div>
        <div className="ct-drawer-foot">
          <button className="ct-send" onClick={submit}>Send enquiry</button>
        </div>
      </aside>
    </>
  );
}
