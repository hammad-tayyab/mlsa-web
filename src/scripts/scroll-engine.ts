/**
 * Master Scroll Engine
 * Drives:
 * 1. Clock tower hour & minute hands rotation (7:00 PM -> 6:00 AM Sunrise)
 * 2. Dynamic sky gradient color interpolation across dusk -> night -> dawn
 * 3. 4-strand cable draw
 */

interface ColorStop {
  stop: number; // 0 to 1
  night0: [number, number, number];
  night1: [number, number, number];
}

// Color stops for the night cycle (7 PM to Sunrise 6 AM)
// Dusk: #1a103c / #2A1B5E -> Deep Night: #070B1A / #0B1230 -> Pre-dawn: #1B1838 -> Dawn: #3D1C2A / #FF8A3D
const STOPS: ColorStop[] = [
  { stop: 0.0, night0: [7, 11, 26],   night1: [11, 18, 48] },   // 7 PM Hero (Dusk settling into night)
  { stop: 0.25, night0: [5, 8, 20],   night1: [9, 14, 38] },   // 10 PM Projects
  { stop: 0.55, night0: [4, 6, 16],   night1: [7, 10, 30] },   // 1 AM Events
  { stop: 0.80, night0: [15, 12, 32], night1: [32, 20, 60] },  // 4 AM Pre-dawn
  { stop: 1.0, night0: [26, 14, 36], night1: [62, 28, 52] },  // 6 AM Sunrise
];

function interpolateRGB(c1: [number, number, number], c2: [number, number, number], factor: number): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * factor);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * factor);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

export class ScrollEngine {
  private hourHand: HTMLElement | null = null;
  private minHand: HTMLElement | null = null;
  private ticking = false;

  constructor() {
    this.init();
  }

  private init() {
    this.hourHand = document.getElementById('clock-hour-hand');
    this.minHand = document.getElementById('clock-minute-hand');

    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        requestAnimationFrame(() => {
          this.onScroll();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }, { passive: true });

    // Initial update
    this.onScroll();
  }

  private onScroll() {
    const docEl = document.documentElement;
    const maxScroll = docEl.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    // 1. Clock hands
    // 7:00 PM start = 210 deg. At sunrise (6:00 AM = 11 hours later), hour hand turns 11 * 30 = 330 deg.
    if (this.hourHand && this.minHand) {
      // Check if easter egg is not currently spinning
      if (!this.hourHand.dataset.easterEggActive) {
        const hourDeg = 210 + progress * 330;
        const minDeg = progress * 11 * 360;
        this.hourHand.style.transform = `rotate(${hourDeg}deg)`;
        this.minHand.style.transform = `rotate(${minDeg}deg)`;
      }
    }

    // 2. Sky Color Interpolation
    let lower = STOPS[0];
    let upper = STOPS[STOPS.length - 1];

    for (let i = 0; i < STOPS.length - 1; i++) {
      if (progress >= STOPS[i].stop && progress <= STOPS[i + 1].stop) {
        lower = STOPS[i];
        upper = STOPS[i + 1];
        break;
      }
    }

    const range = upper.stop - lower.stop;
    const t = range > 0 ? (progress - lower.stop) / range : 0;

    const currentNight0 = interpolateRGB(lower.night0, upper.night0, t);
    const currentNight1 = interpolateRGB(lower.night1, upper.night1, t);

    docEl.style.setProperty('--night-0', currentNight0);
    docEl.style.setProperty('--night-1', currentNight1);
    docEl.style.setProperty('--sky-current', currentNight1);
  }
}

// Auto-instantiate on client
if (typeof window !== 'undefined') {
  new ScrollEngine();
}

