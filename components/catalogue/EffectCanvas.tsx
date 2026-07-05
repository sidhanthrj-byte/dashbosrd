'use client';

// Restrained, physically-plausible effect rendering.
// Transparent canvas layered over the machine drawing; every effect
// emits from the machine's nozzle position (defined in art coordinates).

import { useEffect, useRef } from 'react';
import type { EffectType } from './data';

interface P {
  x: number; y: number; px: number; py: number;
  vx: number; vy: number;
  life: number; max: number; size: number;
  a: number; // base alpha
  hue: number; sat: number; lit: number;
  kind: 'spark' | 'fog' | 'flame' | 'confetti' | 'bubble' | 'haze';
  rot: number; vr: number; wob: number; ws: number;
  color?: string;
}

// Emitters in art coordinates (art viewBox 200x140, bottom-aligned, centered)
type Emitter = { x: number; y: number; angle: number };
const EMITTERS: Record<string, Emitter[]> = {
  'sparks':         [{ x: 100, y: 84, angle: -90 }],
  'spin-sparks':    [{ x: 100, y: 88, angle: -90 }],
  'spin-pyro':      [{ x: 100, y: 88, angle: -90 }],
  'co2':            [{ x: 99, y: 85, angle: -100 }],
  'eco2':           [{ x: 99, y: 85, angle: -100 }],
  'co2-gun':        [{ x: 112, y: 95, angle: -32 }],
  'pyro-gun':       [{ x: 109, y: 96, angle: -32 }],
  'confetti-flow':  [{ x: 120, y: 92, angle: -28 }],
  'confetti-dmx':   [{ x: 120, y: 92, angle: -28 }],
  'confetti-aero':  [{ x: 88, y: 86, angle: -97 }, { x: 100, y: 80, angle: -90 }, { x: 112, y: 86, angle: -83 }],
  'flame':          [{ x: 100, y: 90, angle: -90 }],
  'cold-fire':      [{ x: 65, y: 100, angle: -90 }, { x: 101, y: 100, angle: -90 }, { x: 137, y: 100, angle: -90 }],
  'bubbles':        [{ x: 100, y: 100, angle: -70 }],
  'smoke-bubbles':  [{ x: 100, y: 100, angle: -70 }],
};

const CONFETTI_COLORS = ['#e7e2d6', '#d3bf8e', '#b3a27a', '#98938a', '#c9c4b8'];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const rad = (d: number) => (d * Math.PI) / 180;

interface Props {
  effect: EffectType;
  playing: boolean;
  burstKey?: number; // increment to force an immediate burst
  artWidth?: number; // rendered art width in px (default 200)
  className?: string;
}

export function EffectCanvas({ effect, playing, burstKey = 0, artWidth = 200, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const burstRef = useRef(burstKey);
  const kick = burstRef.current !== burstKey;
  if (kick) burstRef.current = burstKey;
  const kickRef = useRef(false);
  if (kick) kickRef.current = true;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, W * dpr);
      canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const scale = artWidth / 200;
    const pad = 10; // stage bottom padding
    const toStage = (e: Emitter) => ({
      x: W / 2 + (e.x - 100) * scale,
      y: H - pad - (140 - e.y) * scale,
      angle: e.angle,
    });

    const ps: P[] = [];
    let t = 0;
    let raf = 0;
    const emitters = EMITTERS[effect] || EMITTERS['sparks'];

    const spawnSpark = (x: number, y: number, angle: number, spread: number, speed: [number, number], n: number) => {
      for (let i = 0; i < n; i++) {
        const a = rad(angle) + rand(-spread, spread);
        const sp = rand(speed[0], speed[1]);
        ps.push({
          x, y, px: x, py: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, max: rand(30, 70), size: rand(0.5, 1.3),
          a: rand(0.5, 0.95), hue: rand(36, 46), sat: rand(55, 75), lit: rand(66, 84),
          kind: 'spark', rot: 0, vr: 0, wob: 0, ws: 0,
        });
      }
    };

    const spawnFog = (x: number, y: number, angle: number, speed: [number, number], n: number, spread = 0.10) => {
      for (let i = 0; i < n; i++) {
        const a = rad(angle) + rand(-spread, spread);
        const sp = rand(speed[0], speed[1]);
        ps.push({
          x, y, px: x, py: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, max: rand(36, 60), size: rand(6, 12),
          a: rand(0.05, 0.11), hue: 40, sat: 4, lit: 92,
          kind: 'fog', rot: 0, vr: 0, wob: rand(0, 6.28), ws: rand(0.05, 0.12),
        });
      }
    };

    const spawnConfetti = (x: number, y: number, angle: number, spread: number, speed: [number, number], n: number) => {
      for (let i = 0; i < n; i++) {
        const a = rad(angle) + rand(-spread, spread);
        const sp = rand(speed[0], speed[1]);
        ps.push({
          x, y, px: x, py: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0, max: rand(160, 260), size: rand(2.6, 4.6),
          a: 1, hue: 0, sat: 0, lit: 0,
          color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
          kind: 'confetti', rot: rand(0, 6.28), vr: rand(-0.18, 0.18),
          wob: rand(0, 6.28), ws: rand(0.06, 0.14),
        });
      }
    };

    const CYCLE: Record<string, number> = {
      co2: 190, eco2: 190, 'co2-gun': 200, flame: 170, 'confetti-aero': 320, 'pyro-gun': 220,
    };

    const spawn = () => {
      if (!playingRef.current && !kickRef.current) return;
      t++;
      if (kickRef.current) { t = 1; kickRef.current = false; }
      const cyc = CYCLE[effect];
      const phase = cyc ? t % cyc : t;

      switch (effect) {
        case 'sparks': {
          const e = toStage(emitters[0]);
          spawnSpark(e.x, e.y, -90, 0.09, [3.4, 6.2], 8);
          break;
        }
        case 'spin-sparks':
        case 'spin-pyro': {
          const e = toStage(emitters[0]);
          const speed = effect === 'spin-pyro' ? 0.09 : 0.045;
          const armLen = 28 * scale;
          for (const side of [0, Math.PI]) {
            const a = t * speed + side;
            const ex = e.x + Math.cos(a) * armLen;
            const ey = e.y + Math.sin(a) * armLen * 0.28; // perspective flatten
            const dir = effect === 'spin-pyro' ? (a * 180) / Math.PI - 90 : -90;
            spawnSpark(ex, ey, dir, 0.10, [2.6, 4.6], 3);
          }
          break;
        }
        case 'co2':
        case 'eco2': {
          if (phase > 20 && phase < (effect === 'co2' ? 85 : 110)) {
            const e = toStage(emitters[0]);
            const power = effect === 'co2' ? [5.5, 8] : [4, 6];
            spawnFog(e.x, e.y, e.angle, power as [number, number], 4, 0.08);
          }
          break;
        }
        case 'co2-gun': {
          if (phase > 20 && phase < 90) {
            const e = toStage(emitters[0]);
            spawnFog(e.x, e.y, e.angle + Math.sin(t * 0.05) * 6, [4.5, 6.5], 3, 0.07);
          }
          break;
        }
        case 'flame': {
          const shot = (phase > 18 && phase < 40) || (phase > 78 && phase < 92);
          if (shot) {
            const e = toStage(emitters[0]);
            for (let i = 0; i < 6; i++) {
              ps.push({
                x: e.x + rand(-4, 4) * scale, y: e.y, px: e.x, py: e.y,
                vx: rand(-0.4, 0.4), vy: -rand(4.5, 7),
                life: 0, max: rand(22, 38), size: rand(5, 10) * scale,
                a: rand(0.35, 0.6), hue: rand(18, 40), sat: 92, lit: rand(52, 62),
                kind: 'flame', rot: 0, vr: 0, wob: rand(0, 6.28), ws: rand(0.1, 0.2),
              });
            }
          }
          break;
        }
        case 'cold-fire': {
          // travelling wave across three positions
          emitters.forEach((em, i) => {
            const w = Math.sin(t * 0.045 - i * 1.15);
            if (w > 0.55) {
              const e = toStage(em);
              spawnSpark(e.x, e.y, -90, 0.08, [3, 5.2], 4);
            }
          });
          break;
        }
        case 'pyro-gun': {
          if (phase > 20 && phase < 110) {
            const e = toStage(emitters[0]);
            spawnSpark(e.x, e.y, e.angle, 0.07, [4, 7], 6);
          }
          break;
        }
        case 'confetti-flow':
        case 'confetti-dmx': {
          const rate = effect === 'confetti-dmx' ? (1.6 + Math.sin(t * 0.02) * 1.2) : 1.4;
          if (Math.random() < rate / 2) {
            const e = toStage(emitters[0]);
            spawnConfetti(e.x, e.y, e.angle, 0.16, [3.5, 5.5], 1);
          }
          break;
        }
        case 'confetti-aero': {
          if (phase === 20) {
            for (const em of emitters) {
              const e = toStage(em);
              spawnConfetti(e.x, e.y, e.angle, 0.12, [6, 9.5], 26);
            }
          }
          break;
        }
        case 'bubbles':
        case 'smoke-bubbles': {
          if (t % 14 === 0) {
            const e = toStage(emitters[0]);
            ps.push({
              x: e.x + rand(-12, 12) * scale, y: e.y - 6, px: e.x, py: e.y,
              vx: rand(-0.25, 0.45), vy: -rand(0.5, 1.1),
              life: 0, max: rand(180, 300), size: rand(3.5, 8) * scale,
              a: rand(0.4, 0.7), hue: 45, sat: 8, lit: 85,
              kind: 'bubble', rot: 0, vr: 0, wob: rand(0, 6.28), ws: rand(0.02, 0.05),
            });
          }
          break;
        }
      }
      if (ps.length > 700) ps.splice(0, ps.length - 700);
    };

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      spawn();

      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life++;
        p.px = p.x; p.py = p.y;
        const r = p.life / p.max;
        const fade = r > 0.72 ? 1 - (r - 0.72) / 0.28 : 1;

        if (p.kind === 'spark') {
          p.vy += 0.115; p.vx *= 0.992;
          p.x += p.vx; p.y += p.vy;
          const flick = 0.75 + Math.random() * 0.25;
          ctx.strokeStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${p.a * fade * flick})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } else if (p.kind === 'fog') {
          p.vx *= 0.965; p.vy *= 0.965;
          p.wob += p.ws;
          p.x += p.vx + Math.sin(p.wob) * 0.3;
          p.y += p.vy - 0.12; // buoyant drift
          p.size += 0.55;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${p.a * fade})`);
          g.addColorStop(1, `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
        } else if (p.kind === 'flame') {
          p.wob += p.ws;
          p.vy *= 0.965;
          p.x += p.vx + Math.sin(p.wob) * 0.5;
          p.y += p.vy;
          p.size *= 0.975;
          const h = p.hue + (1 - r) * 14;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, `hsla(${h}, ${p.sat}%, ${p.lit + 12}%, ${p.a * fade})`);
          g.addColorStop(1, `hsla(${h - 10}, ${p.sat}%, ${p.lit - 12}%, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
        } else if (p.kind === 'confetti') {
          p.vy += 0.085;
          if (p.vy > 1.5) p.vy = 1.5; // flutter terminal velocity
          p.vx *= 0.985;
          p.wob += p.ws;
          p.x += p.vx + Math.sin(p.wob) * 0.7;
          p.y += p.vy;
          p.rot += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          const flutter = Math.abs(Math.cos(p.wob)) * 0.9 + 0.1;
          ctx.globalAlpha = fade * 0.9;
          ctx.fillStyle = p.color!;
          ctx.fillRect(-p.size / 2, (-p.size / 2) * flutter, p.size, p.size * flutter);
          ctx.restore();
          ctx.globalAlpha = 1;
        } else if (p.kind === 'bubble') {
          p.wob += p.ws;
          p.x += p.vx + Math.sin(p.wob) * 0.35;
          p.y += p.vy;
          const isSmoke = effect === 'smoke-bubbles';
          if (isSmoke && p.y < H * 0.34 && Math.random() < 0.03) {
            ps.push({
              ...p, kind: 'haze', life: 0, max: 50, size: p.size * 0.8,
              vx: rand(-0.3, 0.3), vy: -0.2, a: 0.12,
            });
            ps.splice(i, 1);
            continue;
          }
          const al = p.a * fade * 0.5;
          ctx.strokeStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${al})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.stroke();
          ctx.fillStyle = `hsla(${p.hue}, ${p.sat + 10}%, 95%, ${al * 0.8})`;
          ctx.beginPath(); ctx.arc(p.x - p.size * 0.32, p.y - p.size * 0.32, p.size * 0.14, 0, 6.283); ctx.fill();
          if (isSmoke) {
            ctx.fillStyle = `hsla(${p.hue}, 6%, 82%, ${al * 0.35})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.85, 0, 6.283); ctx.fill();
          }
        } else if (p.kind === 'haze') {
          p.x += p.vx; p.y += p.vy;
          p.size += 0.4;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, `hsla(45, 6%, 80%, ${p.a * fade})`);
          g.addColorStop(1, 'hsla(45, 6%, 80%, 0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
        }

        if (p.life >= p.max || p.y > H + 20 || p.x < -30 || p.x > W + 30) ps.splice(i, 1);
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [effect, artWidth]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
