"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#043222", "#397451", "#a2c4ad", "#f3e7b3", "#e0c567"];
const MAX_PIECES = 240;
const LIFETIME = 1.8; // seconds

type Piece = { x: number; y: number; vx: number; vy: number; angle: number; spin: number; size: number; color: string; age: number };

// One burst on arrival, then a small one wherever the screen is tapped.
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pieces: Piece[] = [];
    let frame = 0;
    let last = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces = pieces.filter((p) => (p.age += dt) < LIFETIME);
      for (const p of pieces) {
        p.vx *= 1 - 1.8 * dt;
        p.vy = p.vy * (1 - 1.8 * dt) + 420 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (LIFETIME - p.age) / 0.6);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      frame = pieces.length ? requestAnimationFrame(draw) : 0;
    };

    const burst = (x: number, y: number, count: number, power: number) => {
      if (reducedMotion.matches) return;
      for (let i = 0; i < count; i++) {
        const direction = Math.random() * Math.PI * 2;
        const speed = power * (0.3 + Math.random() * 0.7);
        pieces.push({
          x,
          y,
          vx: Math.cos(direction) * speed,
          vy: Math.sin(direction) * speed - power * 0.4,
          angle: direction,
          spin: (Math.random() - 0.5) * 10,
          size: 6 + Math.random() * 5,
          color: COLORS[i % COLORS.length],
          age: 0,
        });
      }
      pieces = pieces.slice(-MAX_PIECES);
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    const onTap = (e: PointerEvent) => burst(e.clientX, e.clientY, 28, 300);

    resize();
    const arrival = setTimeout(() => burst(window.innerWidth / 2, window.innerHeight * 0.38, 80, 480), 450);
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onTap);
    return () => {
      clearTimeout(arrival);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onTap);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-40 size-full" />;
}
