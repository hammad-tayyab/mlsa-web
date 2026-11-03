/**
 * Custom cursor system (desktop fine pointer only)
 * Mix-blend aware ring + dot, 120ms ease follow, magnetic CTAs, states
 */

export class CustomCursor {
  private el: HTMLElement;
  private dot: HTMLElement;
  private ring: HTMLElement;
  private rafId: number | null = null;

  private current = { x: -100, y: -100 };
  private target = { x: -100, y: -100 };
  private ringPos = { x: -100, y: -100 };
  private isVisible = false;

  constructor(el: HTMLElement) {
    this.el = el;
    this.dot = el.querySelector('.cursor-dot') as HTMLElement;
    this.ring = el.querySelector('.cursor-ring') as HTMLElement;

    // Only enable on devices with a fine pointer (mouse / trackpad)
    if (window.matchMedia('(pointer: fine)').matches) {
      this.init();
    } else {
      this.el.style.display = 'none';
    }
  }

  private init() {
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    document.addEventListener('mouseleave', this.onMouseLeave);

    this.setupMagneticButtons();
    this.setupInteractiveStates();

    this.rafId = requestAnimationFrame(this.animate);
  }

  private onMouseMove(e: MouseEvent) {
    this.target.x = e.clientX;
    this.target.y = e.clientY;

    if (!this.isVisible) {
      this.isVisible = true;
      this.el.style.opacity = '1';
      this.current.x = this.target.x;
      this.current.y = this.target.y;
      this.ringPos.x = this.target.x;
      this.ringPos.y = this.target.y;
    }
  }

  private onMouseLeave() {
    this.isVisible = false;
    this.el.style.opacity = '0';
  }

  private setupInteractiveStates() {
    // Torch state over hero sky
    const hero = document.getElementById('home');
    if (hero) {
      hero.addEventListener('mouseenter', () => this.el.classList.add('cursor--torch'));
      hero.addEventListener('mouseleave', () => this.el.classList.remove('cursor--torch'));
    }

    // Default pointer states for links, buttons, inputs
    const interactables = document.querySelectorAll('a, button, input, .clock-tower-wrapper');
    interactables.forEach((item) => {
      item.addEventListener('mouseenter', () => this.el.classList.add('cursor--active'));
      item.addEventListener('mouseleave', () => this.el.classList.remove('cursor--active'));
    });
  }

  private setupMagneticButtons() {
    const buttons = document.querySelectorAll<HTMLElement>('.btn, .nav__logo');
    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.hypot(dx, dy);

        // Magnetic radius ~80px
        if (dist < 80) {
          const power = (1 - dist / 80) * 0.35;
          btn.style.transform = `translate(${dx * power}px, ${dy * power}px)`;
        }
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  private animate() {
    // 120ms smooth ease
    this.current.x += (this.target.x - this.current.x) * 0.35;
    this.current.y += (this.target.y - this.current.y) * 0.35;

    this.ringPos.x += (this.target.x - this.ringPos.x) * 0.16;
    this.ringPos.y += (this.target.y - this.ringPos.y) * 0.16;

    this.dot.style.transform = `translate3d(${this.current.x}px, ${this.current.y}px, 0)`;
    this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`;

    this.rafId = requestAnimationFrame(this.animate);
  }

  public destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseleave', this.onMouseLeave);
  }
}

