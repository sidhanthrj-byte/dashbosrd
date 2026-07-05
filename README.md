# Dashbosrd

A Next.js 16 workspace hosting two independent apps that share the same UI kit:

| App | Route | Purpose |
| --- | --- | --- |
| **Pongs CRM** | `/` and `/login` | AI-assisted CRM for stretch-ceiling architect leads (auth-gated). |
| **Relive Control Room** | `/relive` | Live-operations command center for the event industry. |

The two apps are fully separate — their own routes, API namespaces, database files,
and theme — so working on one never touches the other.

## Getting Started

```bash
npm install
npm run dev
```

- CRM: [http://localhost:3000](http://localhost:3000) (redirects to `/login`)
- Relive Control Room: [http://localhost:3000/relive](http://localhost:3000/relive)

The Relive app is **not** auth-gated (the middleware skips `/relive` and
`/api/relive`) and seeds a live demo wedding plus a corporate event on first run,
so it works the moment you open it.

## Relive Control Room

A single command center for running an event as it happens. Deep mallard-green /
mustard-gold theme, scoped so the CRM's look is unchanged.

**Boards**

- **Overview** — headline stat tiles, now/next segment, live check-in meter,
  dietary-plate breakdown, transport snapshot, latest alerts, and the **Aura
  briefing**.
- **Run of Show** — day-grouped timeline; start / complete / skip / reopen and
  add segments.
- **Guests** — search & filter, one-tap check-in (VIP welcome auto-logged),
  per-guest profile with pickup assignment and notes, and CSV export.
- **Transport** — vehicle fleet with capacity meters and **auto-assign** that
  packs guests into the emptiest vehicles first.
- **Vendors** — crew roster with status workflow (pending → confirmed → on-site →
  ready → issue).
- **Cues & SFX** — a cue stack you arm and fire by department, plus instant SFX
  with a **safety interlock** that blocks pyro until released.
- **Alerts** — a live ops feed; every action across the app logs here, and you can
  post notes at info / warning / critical levels.

Header controls: live global clock, **Broadcast** (simulated guest/VIP/crew
message), **Go live / Go dark**, and **Panic** (raises a critical alert).

**Aura briefing** reads the whole board and returns a situational summary plus a
prioritized action list. It uses Claude when `ANTHROPIC_API_KEY` is set and falls
back to deterministic heuristics otherwise, so it always works.

> All SFX/pyro triggers are **simulated** — never wire this to real hardware
> without physical safety interlocks.

## Environment variables

All optional — the app runs on local SQLite files with sensible defaults.

| Variable | Used by | Default |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Aura briefing, CRM next-steps | (heuristic fallback) |
| `RELIVE_DB_URL` / `RELIVE_DB_AUTH_TOKEN` | Relive Control Room | `file:./relive.db` |
| `TURSO_URL` / `TURSO_AUTH_TOKEN` | Pongs CRM | `file:./crm.db` |
| `JWT_SECRET` | CRM auth | dev fallback |

## Tech

Next.js 16 (App Router) · React 19 · Tailwind v4 · base-ui + shadcn components ·
libSQL (SQLite / Turso) · Anthropic SDK.
