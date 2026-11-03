/**
 * Live interactive tile grid on Canvas 2D
 * Microsoft 4-square physics & cursor torch effect
 */

interface Tile {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  rotation: number;
  baseColor: string;
  litColor: string;
  isAccent: boolean;
  opacity: number;
  targetOpacity: number;
}

const MS_COLORS = ['#F25022', '#7FBA00', '#00A4EF', '#FFB900'];
const DARK_TILE_COLOR = '#0D162C';

export class TileGridCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tiles: Tile[] = [];
  private rafId: number | null = null;
  private isVisible = true;
  private width = 0;
  private height = 0;
  private dpr = 1;

  // Pointer smoothing & spring physics
  private pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
  private touchRadius = 220; // 220px torch radius from prompt
  private ripples: { x: number; y: number; radius: number; maxRadius: number; speed: number; alpha: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get Canvas 2D context');
    this.ctx = ctx;

    this.init();
  }

  private init() {
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.animate = this.animate.bind(this);

    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });

    // IntersectionObserver to pause when hero is off-screen
    const observer = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
      if (this.isVisible && !this.rafId) {
        this.rafId = requestAnimationFrame(this.animate);
      }
    }, { threshold: 0.05 });
    observer.observe(this.canvas);

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
    this.ctx.scale(this.dpr, this.dpr);

    this.buildTiles();
  }

  private buildTiles() {
    this.tiles = [];
    const isMobile = window.innerWidth < 768;
    const targetCount = isMobile ? 400 : 1600;

    // Calculate grid dimensions to hit approximately targetCount
    const area = this.width * this.height;
    if (area <= 0) return;

    const tileArea = area / targetCount;
    const step = Math.max(14, Math.sqrt(tileArea));
    const tileSize = step * 0.72;
    const gap = step - tileSize;

    const cols = Math.floor(this.width / step);
    const rows = Math.floor(this.height / step);

    const offsetX = (this.width - cols * step) / 2;
    const offsetY = (this.height - rows * step) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * step + step / 2;
        const y = offsetY + r * step + step / 2;

        // Roughly 10-15% of tiles are naturally ambient MS colors, others dark
        const isAccent = Math.random() < 0.12;
        const randomColor = MS_COLORS[Math.floor(Math.random() * MS_COLORS.length)];

        this.tiles.push({
          x,
          y,
          size: tileSize,
          baseSize: tileSize,
          rotation: 0,
          baseColor: isAccent ? randomColor : DARK_TILE_COLOR,
          litColor: randomColor,
          isAccent,
          opacity: isAccent ? 0.35 : 0.12,
          targetOpacity: isAccent ? 0.35 : 0.12,
        });
      }
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.targetX = e.clientX - rect.left;
    this.pointer.targetY = e.clientY - rect.top;
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const tx = touch.clientX - rect.left;
      const ty = touch.clientY - rect.top;

      this.pointer.targetX = tx;
      this.pointer.targetY = ty;
      this.pointer.x = tx;
      this.pointer.y = ty;

      // Ripple on tap
      this.ripples.push({
        x: tx,
        y: ty,
        radius: 0,
        maxRadius: 280,
        speed: 7,
        alpha: 1,
      });
    }
  }

  private handleTouchMove(e: TouchEvent) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.targetX = touch.clientX - rect.left;
      this.pointer.targetY = touch.clientY - rect.top;
    }
  }

  private handleTouchEnd() {
    // Fade out pointer when finger lifted
    setTimeout(() => {
      this.pointer.targetX = -1000;
      this.pointer.targetY = -1000;
    }, 400);
  }

  private animate() {
    if (!this.isVisible) {
      this.rafId = null;
      return;
    }

    // Pointer smoothing (120ms ease follow)
    this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.14;
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.14;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed;
      rip.alpha = Math.max(0, 1 - rip.radius / rip.maxRadius);
      if (rip.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }

    const radiusSq = this.touchRadius * this.touchRadius;

    // Draw & update tiles
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      const dx = tile.x - this.pointer.x;
      const dy = tile.y - this.pointer.y;
      const distSq = dx * dx + dy * dy;

      let influence = 0;

      // Cursor torch proximity
      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        influence = Math.max(0, 1 - dist / this.touchRadius);
      }

      // Check ripple hits
      for (const rip of this.ripples) {
        const rdx = tile.x - rip.x;
        const rdy = tile.y - rip.y;
        const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
        const ripDiff = Math.abs(rDist - rip.radius);
        if (ripDiff < 40) {
          const ripInfluence = (1 - ripDiff / 40) * rip.alpha;
          if (ripInfluence > influence) {
            influence = ripInfluence;
          }
        }
      }

      // Physics: grow size, rotate up to 90 deg, brighten
      const targetSize = tile.baseSize * (1 + influence * 0.65);
      const targetRotation = influence * (Math.PI / 2); // 90 degrees
      const targetOpacity = tile.isAccent
        ? Math.min(1, 0.4 + influence * 0.6)
        : Math.min(0.9, 0.12 + influence * 0.78);

      // Smooth interpolation
      tile.size += (targetSize - tile.size) * 0.2;
      tile.rotation += (targetRotation - tile.rotation) * 0.18;
      tile.opacity += (targetOpacity - tile.opacity) * 0.2;

      // Draw rounded tile
      this.ctx.save();
      this.ctx.translate(tile.x, tile.y);
      if (tile.rotation !== 0) {
        this.ctx.rotate(tile.rotation);
      }

      const drawColor = influence > 0.08 ? tile.litColor : tile.baseColor;
      this.ctx.fillStyle = drawColor;
      this.ctx.globalAlpha = tile.opacity;

      // Glow when lit
      if (influence > 0.3) {
        this.ctx.shadowColor = tile.litColor;
        this.ctx.shadowBlur = influence * 12;
      }

      const half = tile.size / 2;
      const r = Math.min(3, tile.size * 0.2);

      // Rounded rect
      this.ctx.beginPath();
      this.ctx.moveTo(-half + r, -half);
      this.ctx.lineTo(half - r, -half);
      this.ctx.quadraticCurveTo(half, -half, half, -half + r);
      this.ctx.lineTo(half, half - r);
      this.ctx.quadraticCurveTo(half, half, half - r, half);
      this.ctx.lineTo(-half + r, half);
      this.ctx.quadraticCurveTo(-half, half, -half, half - r);
      this.ctx.lineTo(-half, -half + r);
      this.ctx.quadraticCurveTo(-half, -half, -half + r, -half);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();
    }

    this.rafId = requestAnimationFrame(this.animate);
  }

  public destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
  }
}
