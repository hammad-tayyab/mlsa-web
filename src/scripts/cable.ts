/**
 * Interactive 4-strand cable system
 * Starts at tower crown hub, loose end trails cursor on a spring in Hero
 */

export class HeroCable {
  private container: HTMLElement;
  private paths: SVGPathElement[] = [];
  private pulseCircle: SVGCircleElement | null = null;
  private rafId: number | null = null;

  // Spring & trail physics for loose cable end
  private current = { x: 0, y: 0, vx: 0, vy: 0 };
  private target = { x: 0, y: 0 };
  private origin = { x: 0, y: 0 };
  private isPlugged = false;
  private tension = 0.04;
  private damping = 0.82;

  constructor(container: HTMLElement) {
    this.container = container;
    this.paths = Array.from(container.querySelectorAll('.cable-strand'));
    this.pulseCircle = container.querySelector('.cable-pulse');

    this.init();
  }

  private init() {
    this.updateOrigin();
    this.current.x = this.origin.x;
    this.current.y = this.origin.y + 120;
    this.target.x = this.current.x;
    this.target.y = this.current.y;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onTowerClick = this.onTowerClick.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });

    // Click on tower or hero to toggle plug / pulse
    const tower = document.getElementById('hero-clock-tower');
    if (tower) {
      tower.addEventListener('click', this.onTowerClick);
    }

    this.rafId = requestAnimationFrame(this.animate);
  }

  private updateOrigin() {
    const hub = document.getElementById('tower-cable-port');
    if (hub) {
      const rect = hub.getBoundingClientRect();
      const parentRect = this.container.getBoundingClientRect();
      this.origin.x = rect.left - parentRect.left + rect.width / 2;
      this.origin.y = rect.top - parentRect.top + rect.height / 2;
    } else {
      this.origin.x = window.innerWidth / 2;
      this.origin.y = window.innerHeight * 0.35;
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isPlugged) return;
    const parentRect = this.container.getBoundingClientRect();
    this.target.x = e.clientX - parentRect.left;
    this.target.y = e.clientY - parentRect.top;
  }

  private onResize() {
    this.updateOrigin();
  }

  private onTowerClick() {
    // Light pulse and plug effect
    this.isPlugged = true;
    this.target.x = this.origin.x;
    this.target.y = this.origin.y;

    // Trigger visual light pulse
    if (this.pulseCircle) {
      this.pulseCircle.setAttribute('cx', String(this.origin.x));
      this.pulseCircle.setAttribute('cy', String(this.origin.y));
      this.pulseCircle.classList.remove('pulse-active');
      // Trigger reflow
      void this.pulseCircle.offsetWidth;
      this.pulseCircle.classList.add('pulse-active');
    }

    // Unplug after a short interval so user can continue trailing
    setTimeout(() => {
      this.isPlugged = false;
    }, 1800);
  }

  private animate() {
    this.updateOrigin();

    // Spring calculation
    const ax = (this.target.x - this.current.x) * this.tension;
    const ay = (this.target.y - this.current.y) * this.tension;

    this.current.vx = (this.current.vx + ax) * this.damping;
    this.current.vy = (this.current.vy + ay) * this.damping;

    this.current.x += this.current.vx;
    this.current.y += this.current.vy;

    // Render 4 parallel bezier curves with offsets
    const offsets = [-4.5, -1.5, 1.5, 4.5];
    const dx = this.current.x - this.origin.x;
    const dy = this.current.y - this.origin.y;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;

    // Control point with natural gravitational catenary sag
    const midX = (this.origin.x + this.current.x) / 2;
    const sag = Math.min(220, Math.max(40, len * 0.35));
    const midY = (this.origin.y + this.current.y) / 2 + sag;

    for (let i = 0; i < this.paths.length; i++) {
      const off = offsets[i] || 0;
      const x1 = this.origin.x + nx * off;
      const y1 = this.origin.y + ny * off;
      const cx = midX + nx * off;
      const cy = midY + ny * off;
      const x2 = this.current.x + nx * off;
      const y2 = this.current.y + ny * off;

      const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      this.paths[i].setAttribute('d', d);
    }

    this.rafId = requestAnimationFrame(this.animate);
  }

  public destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
  }
}

