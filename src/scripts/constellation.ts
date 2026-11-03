/**
 * Constellation particle system — Antigravity-style background effect.
 * Dots drift slowly; lines connect nearby ones. Cursor attracts and
 * brightens particles within radius, creating a living network.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  alpha: number;
  radius: number;
  color: string;
}

const MS_COLORS = ['#F25022', '#7FBA00', '#00A4EF', '#FFB900'];
const LINE_DIST = 140;  // max line connection distance
const CURSOR_RADIUS = 200;
const CURSOR_PUSH = 0.015;

export class ConstellationCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId: number | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private isVisible = true;
  private pointer = { x: -9999, y: -9999 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    this.ctx = ctx;

    this.handleResize = this.handleResize.bind(this);
    this.handleMouse = this.handleMouse.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('mousemove', this.handleMouse, { passive: true });
    document.addEventListener('mouseleave', this.handleMouseLeave);

    const obs = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
      if (this.isVisible && !this.rafId) this.rafId = requestAnimationFrame(this.animate);
    }, { threshold: 0.05 });
    obs.observe(this.canvas);

    this.handleResize();
    this.rafId = requestAnimationFrame(this.animate);
  }

  private handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.buildParticles();
  }

  private buildParticles() {
    const isMobile = this.width < 768;
    const count = isMobile ? 50 : 120;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const isAccent = Math.random() < 0.25;
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        baseAlpha: isAccent ? 0.5 : 0.18,
        alpha: isAccent ? 0.5 : 0.18,
        radius: isAccent ? 2.5 : 1.5,
        color: isAccent ? MS_COLORS[Math.floor(Math.random() * 4)] : '#FFFFFF',
      });
    }
  }

  private handleMouse(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = e.clientX - rect.left;
    this.pointer.y = e.clientY - rect.top;
  }

  private handleMouseLeave() {
    this.pointer.x = -9999;
    this.pointer.y = -9999;
  }

  private animate() {
    if (!this.isVisible) { this.rafId = null; return; }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Update particles
    for (const p of this.particles) {
      // Drift
      p.x += p.vx;
      p.y += p.vy;

      // Wrap edges
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      // Cursor attraction
      const dx = this.pointer.x - p.x;
      const dy = this.pointer.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CURSOR_RADIUS && dist > 1) {
        const force = (1 - dist / CURSOR_RADIUS) * CURSOR_PUSH;
        p.vx += dx / dist * force;
        p.vy += dy / dist * force;
        p.alpha = Math.min(1, p.baseAlpha + (1 - dist / CURSOR_RADIUS) * 0.6);
      } else {
        p.alpha += (p.baseAlpha - p.alpha) * 0.05;
      }

      // Speed damping
      p.vx *= 0.995;
      p.vy *= 0.995;
    }

    // Draw lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINE_DIST) {
          const lineAlpha = (1 - dist / LINE_DIST) * 0.12;

          // Near cursor? Brighten lines
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const cursorDist = Math.sqrt(
            (midX - this.pointer.x) ** 2 + (midY - this.pointer.y) ** 2
          );
          const boost = cursorDist < CURSOR_RADIUS ? (1 - cursorDist / CURSOR_RADIUS) * 0.25 : 0;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha + boost})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    this.rafId = requestAnimationFrame(this.animate);
  }

  public destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouse);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
  }
}

