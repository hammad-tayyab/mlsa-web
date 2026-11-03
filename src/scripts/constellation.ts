/**
 * Fixed Full-Viewport Tessellation (Constellation Network)
 * - Low opacity, subtle cursor attraction, high text readability
 * - Pauses when document tab is hidden
 * - Fewer points on mobile (35)
 * - Single static frame for prefers-reduced-motion (no RAF loop)
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
const LINE_DIST = 120; // connection distance
const CURSOR_RADIUS = 160;
const CURSOR_PULL = 0.008; // very subtle attraction

export class TessellationCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId: number | null = null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private isVisible = true;
  private isTabVisible = true;
  private pointer = { x: -9999, y: -9999 };
  private prefersReducedMotion = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D context for tessellation');
    this.ctx = ctx;

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.handleResize = this.handleResize.bind(this);
    this.handleMouse = this.handleMouse.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('mousemove', this.handleMouse, { passive: true });
    document.addEventListener('mouseleave', this.handleMouseLeave);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.handleResize();

    // If reduced motion is requested, render one static frame and exit
    if (this.prefersReducedMotion) {
      this.drawFrame();
    } else {
      this.rafId = requestAnimationFrame(this.animate);
    }
  }

  private handleVisibilityChange() {
    this.isTabVisible = document.visibilityState === 'visible';
    if (this.isTabVisible && !this.rafId && !this.prefersReducedMotion) {
      this.rafId = requestAnimationFrame(this.animate);
    } else if (!this.isTabVisible && this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.buildParticles();

    if (this.prefersReducedMotion) {
      this.drawFrame();
    }
  }

  private buildParticles() {
    const isMobile = this.width < 768;
    const count = isMobile ? 32 : 75; // light density for maximum text readability
    this.particles = [];

    for (let i = 0; i < count; i++) {
      const isAccent = Math.random() < 0.22;
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        baseAlpha: isAccent ? 0.38 : 0.12,
        alpha: isAccent ? 0.38 : 0.12,
        radius: isAccent ? 2.0 : 1.2,
        color: isAccent ? MS_COLORS[Math.floor(Math.random() * 4)] : '#A0B4D8',
      });
    }
  }

  private handleMouse(e: MouseEvent) {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  }

  private handleMouseLeave() {
    this.pointer.x = -9999;
    this.pointer.y = -9999;
  }

  private updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around screen boundaries
      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      // Subtle cursor reaction
      const dx = this.pointer.x - p.x;
      const dy = this.pointer.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CURSOR_RADIUS && dist > 1) {
        const force = (1 - dist / CURSOR_RADIUS) * CURSOR_PULL;
        p.vx += dx * force * 0.05;
        p.vy += dy * force * 0.05;
        p.alpha = Math.min(0.65, p.baseAlpha + (1 - dist / CURSOR_RADIUS) * 0.35);
      } else {
        p.alpha += (p.baseAlpha - p.alpha) * 0.04;
      }

      p.vx *= 0.992;
      p.vy *= 0.992;
    }
  }

  private drawFrame() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Subtle connecting lines
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < LINE_DIST) {
          const lineAlpha = (1 - dist / LINE_DIST) * 0.08;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(160, 180, 220, ${lineAlpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Nodes
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private animate() {
    if (!this.isTabVisible) {
      this.rafId = null;
      return;
    }

    this.updateParticles();
    this.drawFrame();

    this.rafId = requestAnimationFrame(this.animate);
  }

  public destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouse);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
