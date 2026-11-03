/**
 * cursor-field.js
 * Fixed full-screen canvas of tiny dashes that fan out radially around the cursor.
 * Vanilla JS, no dependencies. Works in Astro (call from a client-side <script>).
 *
 * Usage:
 *   import { initCursorField } from './cursor-field.js';
 *   const field = initCursorField();   // call once
 *   // field.destroy() to remove it
 *
 * Page requirement: main content wrapper needs `position: relative; z-index: 1;`
 * so the canvas (z-index 0) stays behind it. The canvas has pointer-events: none.
 */

const DEFAULTS = {
  radius: 95,          // influence radius in px
  count: 1500,         // dashes on desktop
  countMobile: 600,    // dashes on small screens (<= 768px wide)
  push: 12,            // outward push in px at the cursor
  maxLength: 9,        // dash length in px at the cursor
  restLength: 1.5,     // dash length far from the cursor
  lineWidth: 1.6,
  idleDrift: true,     // slow wandering attractor when the mouse is still
  idleAfterMs: 2500,
  colors: [            // Microsoft colors, blended around the cursor
    [0, 164, 239],     // blue
    [127, 186, 0],     // green
    [255, 185, 0],     // yellow
    [242, 80, 34],     // red
  ],
  zIndex: 0,
};

export function initCursorField(options = {}) {
  const S = { ...DEFAULTS, ...options };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: String(S.zIndex),
  });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let pts = [];
  let mx = -9999, my = -9999;   // eased cursor position
  let tx = -9999, ty = -9999;   // target cursor position
  let lastMove = 0, hasMoved = false;
  let raf = 0;

  // 256-step palette: color changes with the angle around the cursor
  const palette = [];
  for (let i = 0; i < 256; i++) {
    const t = (i / 256) * S.colors.length;
    const k = Math.floor(t);
    const f = t - k;
    const a = S.colors[k % S.colors.length];
    const b = S.colors[(k + 1) % S.colors.length];
    const c = a.map((v, j) => v + (b[j] - v) * f);
    palette.push(`rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`);
  }

  function build() {
    const n = window.innerWidth <= 768 ? S.countMobile : S.count;
    const cols = Math.max(1, Math.round(Math.sqrt((n * W) / H)));
    const rows = Math.max(1, Math.round(n / cols));
    const cw = W / cols, ch = H / rows;
    pts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pts.push({
          x: (c + Math.random()) * cw,
          y: (r + Math.random()) * ch,
          a: Math.random() * Math.PI,   // resting angle
          ox: 0, oy: 0, vx: 0, vy: 0,   // spring offset + velocity
        });
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineWidth = S.lineWidth;
    const R2 = S.radius * S.radius;

    for (const p of pts) {
      const px = p.x + p.ox, py = p.y + p.oy;
      const dx = px - mx, dy = py - my;
      const d2 = dx * dx + dy * dy;
      const inf = Math.exp(-d2 / R2);            // 1 at cursor, 0 far away
      const radial = Math.atan2(dy, dx);

      // rotate from resting angle toward the radial direction
      const delta = Math.atan2(Math.sin(radial - p.a), Math.cos(radial - p.a));
      const ang = p.a + delta * inf;
      const len = S.restLength + (S.maxLength - S.restLength) * inf;
      const alpha = 0.14 + 0.86 * Math.pow(inf, 0.7);

      // spring push outward, eases back when the cursor leaves
      let gx = 0, gy = 0;
      if (inf > 0.001) {
        const d = Math.sqrt(d2) || 1;
        gx = (dx / d) * S.push * inf;
        gy = (dy / d) * S.push * inf;
      }
      p.vx = (p.vx + (gx - p.ox) * 0.08) * 0.82;
      p.vy = (p.vy + (gy - p.oy) * 0.08) * 0.82;
      p.ox += p.vx;
      p.oy += p.vy;

      const hue = (((radial + Math.PI) / (Math.PI * 2)) * 256) | 0;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = palette[hue & 255];
      const cx = (Math.cos(ang) * len) / 2;
      const cy = (Math.sin(ang) * len) / 2;
      ctx.beginPath();
      ctx.moveTo(px - cx, py - cy);
      ctx.lineTo(px + cx, py + cy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    // idle drift: invisible attractor wanders so the field is never dead
    if (S.idleDrift && (!hasMoved || now - lastMove > S.idleAfterMs)) {
      const t = now / 1000;
      tx = W * (0.5 + 0.32 * Math.sin(t * 0.6));
      ty = H * (0.45 + 0.28 * Math.sin(t * 0.9 + 1));
    }
    mx += (tx - mx) * 0.14;   // ease the cursor so the burst feels fluid
    my += (ty - my) * 0.14;
    draw();
    raf = requestAnimationFrame(frame);
  }

  function onPointer(e) {
    tx = e.clientX;
    ty = e.clientY;
    lastMove = performance.now();
    hasMoved = true;
  }

  function onVisibility() {
    cancelAnimationFrame(raf);
    if (!document.hidden && !reduce) raf = requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);

  resize();
  // prefers-reduced-motion: draw one static frame of faint dots, no animation
  if (!reduce) raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
    },
  };
}

