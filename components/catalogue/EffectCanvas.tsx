'use client';

import { useEffect, useRef } from 'react';
import type { EffectType } from './data';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  hue: number;
  sat: number;
  light: number;
  kind: 'spark' | 'fog' | 'confetti' | 'flame' | 'bubble' | 'smoke';
  rot: number;
  vr: number;
  wob: number;
  wobSpeed: number;
}

interface Props {
  effect: EffectType;
  hue: number;
  playing?: boolean;
  intensity?: number; // multiplier for particle spawn (mini previews use < 1)
  className?: string;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function EffectCanvas({ effect, hue, playing = true, intensity = 1, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number>(0);
  const t = useRef(0);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const P = particles.current;
    const cap = 900 * intensity;

    const spark = (x: number, y: number, vx: number, vy: number, h: number, size = 2) => {
      if (P.length > cap) return;
      P.push({
        x, y, vx, vy, life: 0, max: rand(40, 90), size,
        hue: h + rand(-8, 8), sat: rand(80, 100), light: rand(60, 80),
        kind: 'spark', rot: 0, vr: 0, wob: 0, wobSpeed: 0,
      });
    };

    const spawn = () => {
      if (!playingRef.current) return;
      const n = (k: number) => Math.round(k * intensity);
      const cx = W / 2;
      t.current += 1;

      switch (effect) {
        case 'sparks': {
          for (let i = 0; i < n(6); i++) {
            const a = -Math.PI / 2 + rand(-0.32, 0.32);
            const sp = rand(6, 12);
            spark(cx + rand(-14, 14), H - 6, Math.cos(a) * sp, Math.sin(a) * sp, hue, rand(1.4, 2.8));
          }
          break;
        }
        case 'pyro-gun': {
          const a = -Math.PI / 2 + Math.sin(t.current * 0.02) * 0.15 + rand(-0.18, 0.18);
          for (let i = 0; i < n(7); i++) {
            const sp = rand(7, 14);
            spark(W * 0.28, H * 0.82, Math.cos(a) * sp, Math.sin(a) * sp, hue, rand(1.4, 3));
          }
          break;
        }
        case 'spin-sparks':
        case 'spin-pyro': {
          const spin = t.current * 0.12;
          const arms = effect === 'spin-pyro' ? 3 : 2;
          for (let arm = 0; arm < arms; arm++) {
            const a = spin + (arm * Math.PI * 2) / arms;
            const sp = rand(5, 10);
            for (let i = 0; i < n(3); i++) {
              spark(cx, H * 0.55, Math.cos(a) * sp, Math.sin(a) * sp, hue, rand(1.4, 2.6));
            }
          }
          break;
        }
        case 'co2':
        case 'eco2': {
          const height = effect === 'co2' ? 1 : 0.72;
          for (let i = 0; i < n(5); i++) {
            P.push({
              x: cx + rand(-18, 18), y: H - 4,
              vx: rand(-0.6, 0.6), vy: -rand(7, 11) * height, life: 0, max: rand(40, 70),
              size: rand(16, 34), hue: 200, sat: 12, light: 96,
              kind: 'fog', rot: 0, vr: 0, wob: 0, wobSpeed: 0,
            });
          }
          break;
        }
        case 'co2-gun': {
          const a = -Math.PI / 4.2;
          for (let i = 0; i < n(5); i++) {
            const sp = rand(7, 11);
            P.push({
              x: W * 0.2, y: H * 0.8,
              vx: Math.cos(a) * sp + rand(-0.5, 0.5), vy: Math.sin(a) * sp, life: 0, max: rand(35, 60),
              size: rand(12, 26), hue: 200, sat: 12, light: 96,
              kind: 'fog', rot: 0, vr: 0, wob: 0, wobSpeed: 0,
            });
          }
          break;
        }
        case 'confetti-flow':
        case 'confetti-dmx': {
          const rate = effect === 'confetti-dmx' ? 6 : 4;
          for (let i = 0; i < n(rate); i++) {
            P.push({
              x: rand(-10, 10), y: rand(0, H * 0.3),
              vx: rand(3, 6), vy: rand(-1, 1.5), life: 0, max: rand(120, 200),
              size: rand(5, 9), hue: rand(0, 360), sat: 85, light: 60,
              kind: 'confetti', rot: rand(0, 6.28), vr: rand(-0.3, 0.3),
              wob: rand(0, 6.28), wobSpeed: rand(0.1, 0.25),
            });
          }
          break;
        }
        case 'confetti-aero': {
          // periodic big bursts
          if (t.current % 78 === 0 || t.current === 1) {
            for (let i = 0; i < n(90); i++) {
              const a = -Math.PI / 2 + rand(-0.5, 0.5);
              const sp = rand(9, 17);
              P.push({
                x: cx + rand(-20, 20), y: H - 4,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rand(150, 240),
                size: rand(5, 10), hue: rand(0, 360), sat: 85, light: 62,
                kind: 'confetti', rot: rand(0, 6.28), vr: rand(-0.4, 0.4),
                wob: rand(0, 6.28), wobSpeed: rand(0.1, 0.28),
              });
            }
          }
          break;
        }
        case 'flame': {
          for (let i = 0; i < n(10); i++) {
            P.push({
              x: cx + rand(-22, 22), y: H - 4,
              vx: rand(-0.8, 0.8), vy: -rand(6, 11), life: 0, max: rand(28, 52),
              size: rand(14, 30), hue: rand(8, 44), sat: 100, light: 58,
              kind: 'flame', rot: 0, vr: 0, wob: 0, wobSpeed: 0,
            });
          }
          break;
        }
        case 'cold-fire': {
          // sequenced emitters firing as a travelling wave
          const bays = 5;
          for (let b = 0; b < bays; b++) {
            const phase = Math.sin(t.current * 0.08 - b * 0.9);
            if (phase > 0.72) {
              const x = W * (0.12 + (b * 0.76) / (bays - 1));
              for (let i = 0; i < n(4); i++) {
                const a = -Math.PI / 2 + rand(-0.18, 0.18);
                const sp = rand(7, 12);
                spark(x, H - 6, Math.cos(a) * sp, Math.sin(a) * sp, hue, rand(1.4, 2.6));
              }
            }
          }
          break;
        }
        case 'bubbles':
        case 'smoke-bubbles': {
          for (let i = 0; i < n(2); i++) {
            P.push({
              x: rand(W * 0.2, W * 0.8), y: H + 10,
              vx: rand(-0.4, 0.4), vy: -rand(1.4, 3), life: 0, max: rand(150, 260),
              size: rand(8, 22), hue, sat: 40, light: 80,
              kind: 'bubble', rot: 0, vr: 0,
              wob: rand(0, 6.28), wobSpeed: rand(0.03, 0.08),
            });
          }
          break;
        }
      }
    };

    const usesGlow = ['sparks', 'spin-sparks', 'spin-pyro', 'pyro-gun', 'co2', 'eco2', 'co2-gun', 'flame', 'cold-fire'].includes(effect);
    const trail = ['sparks', 'spin-sparks', 'spin-pyro', 'pyro-gun', 'flame', 'cold-fire'].includes(effect) ? 0.22 : 0.34;

    const frame = () => {
      // fade previous frame for motion trails
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(8, 8, 10, ${trail})`;
      ctx.fillRect(0, 0, W, H);

      spawn();
      if (usesGlow) ctx.globalCompositeOperation = 'lighter';

      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.life++;
        const lifeR = p.life / p.max;

        if (p.kind === 'spark') {
          p.vy += 0.28; // gravity
          p.vx *= 0.99;
          p.x += p.vx;
          p.y += p.vy;
          const a = (1 - lifeR) * (0.6 + Math.random() * 0.4);
          ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - lifeR * 0.5), 0, 6.283);
          ctx.fill();
        } else if (p.kind === 'fog') {
          p.vy *= 0.95;
          p.vx *= 0.98;
          p.x += p.vx;
          p.y += p.vy;
          p.size += 0.9;
          const a = (1 - lifeR) * 0.5;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, `hsla(200, 15%, 98%, ${a})`);
          g.addColorStop(1, `hsla(200, 20%, 90%, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 6.283);
          ctx.fill();
        } else if (p.kind === 'flame') {
          p.vy *= 0.96;
          p.x += p.vx;
          p.y += p.vy;
          p.size *= 0.97;
          const h = 8 + (1 - lifeR) * 42;
          const a = (1 - lifeR) * 0.6;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, `hsla(${h}, 100%, 70%, ${a})`);
          g.addColorStop(1, `hsla(${h - 8}, 100%, 45%, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 6.283);
          ctx.fill();
        } else if (p.kind === 'confetti') {
          p.vy += 0.14; // gravity
          if (p.vy > 3.2) p.vy = 3.2; // terminal
          p.vx *= 0.985;
          p.wob += p.wobSpeed;
          p.x += p.vx + Math.sin(p.wob) * 1.1;
          p.y += p.vy;
          p.rot += p.vr;
          const a = p.life > p.max - 40 ? (p.max - p.life) / 40 : 1;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          const flutter = Math.abs(Math.cos(p.wob));
          ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${a})`;
          ctx.fillRect(-p.size / 2, -p.size / 2 * flutter, p.size, p.size * flutter + 1);
          ctx.restore();
        } else if (p.kind === 'bubble') {
          p.wob += p.wobSpeed;
          p.x += p.vx + Math.sin(p.wob) * 0.8;
          p.y += p.vy;
          const popped = effect === 'smoke-bubbles' && p.y < H * 0.32;
          if (popped) {
            // convert to smoke puff
            p.kind = 'smoke';
            p.life = 0;
            p.max = 40;
            p.vx = rand(-0.6, 0.6);
            p.vy = -rand(0.3, 1);
            continue;
          }
          const a = p.life > p.max - 30 ? (p.max - p.life) / 30 : 0.9;
          ctx.strokeStyle = `hsla(${p.hue}, 70%, 85%, ${a})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 6.283);
          ctx.stroke();
          // highlight
          ctx.fillStyle = `hsla(${p.hue}, 80%, 95%, ${a * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.18, 0, 6.283);
          ctx.fill();
          // soft body
          ctx.fillStyle = `hsla(${p.hue}, 60%, 80%, ${a * 0.08})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 6.283);
          ctx.fill();
        } else if (p.kind === 'smoke') {
          p.x += p.vx;
          p.y += p.vy;
          p.size += 0.6;
          const a = (1 - lifeR) * 0.35;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          g.addColorStop(0, `hsla(220, 8%, 80%, ${a})`);
          g.addColorStop(1, `hsla(220, 8%, 70%, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 6.283);
          ctx.fill();
        }

        if (p.life >= p.max || p.y > H + 60 || p.x > W + 60 || p.x < -60) {
          P.splice(i, 1);
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      raf.current = requestAnimationFrame(frame);
    };

    raf.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      particles.current = [];
    };
  }, [effect, hue, intensity]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
