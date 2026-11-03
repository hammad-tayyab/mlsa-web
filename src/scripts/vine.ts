/**
 * Pixel-style stepped vine generator and scroll driver
 * Connects sections from Hero to Join with orthogonal jogs and MS-colored pixel leaves
 */

const SECTION_IDS = ['home', 'about', 'projects', 'events', 'podcast', 'blog', 'join'];

const NODE_COLORS = [
  '#7FBA00', // Hero: Green
  '#00A4EF', // About: Blue
  '#FFB900', // Projects: Yellow
  '#F25022', // Events: Red
  '#7FBA00', // Podcast: Green
  '#00A4EF', // Blog: Blue
  '#FFB900', // Join: Yellow/Multi
];

export function initVine() {
  const container = document.getElementById('vine-container');
  const pathLive = document.getElementById('vine-path') as SVGPathElement | null;
  const pathBg = document.getElementById('vine-path-bg') as SVGPathElement | null;
  const nodesGroup = document.getElementById('vine-nodes-group');

  if (!container || !pathLive || !pathBg || !nodesGroup) return;

  let totalLength = 0;

  function buildPath() {
    const isMobile = window.innerWidth < 768;
    const baseCol = isMobile ? 12 : 36;
    const jogDistance = isMobile ? 8 : 18;

    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );

    // Get section centers
    const points: { y: number; x: number; id: string }[] = [];
    let currentX = baseCol;

    SECTION_IDS.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        const top = window.scrollY + rect.top + (id === 'home' ? 120 : rect.height * 0.3);
        // Alternate stepped jogs
        currentX = baseCol + (idx % 2 === 0 ? 0 : jogDistance);
        points.push({ y: top, x: currentX, id });
      }
    });

    if (points.length === 0) return;

    // Construct pixel stepped orthogonal path (H / V segments)
    let d = `M ${baseCol} 0`;
    let lastX = baseCol;
    let lastY = 0;

    points.forEach((pt) => {
      // Step vertically to halfway
      const midY = (lastY + pt.y) / 2;
      d += ` L ${lastX} ${midY}`;
      // Step horizontally (pure 90 degree corner)
      d += ` L ${pt.x} ${midY}`;
      // Step vertically to section node
      d += ` L ${pt.x} ${pt.y}`;

      lastX = pt.x;
      lastY = pt.y;
    });

    // Final extension to bottom of join
    d += ` L ${lastX} ${docHeight}`;

    pathLive.setAttribute('d', d);
    pathBg.setAttribute('d', d);

    totalLength = pathLive.getTotalLength();
    pathLive.style.strokeDasharray = `${totalLength}`;
    pathLive.style.strokeDashoffset = `${totalLength}`;

    // Render pixel leaves / nodes
    nodesGroup.innerHTML = '';
    points.forEach((pt, idx) => {
      const color = NODE_COLORS[idx % NODE_COLORS.length];
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'vine-node');
      g.setAttribute('data-section', pt.id);
      g.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);

      // 8x8 retro pixel leaf flower
      g.innerHTML = `
        <rect x="-4" y="-4" width="8" height="8" fill="#0C152B" />
        <rect x="-3" y="-3" width="6" height="6" fill="${color}" />
        <rect x="-1" y="-1" width="2" height="2" fill="#FFFFFF" />
        <!-- Pixel leaf sprig -->
        <rect x="${idx % 2 === 0 ? '4' : '-8'}" y="-2" width="4" height="4" fill="#7FBA00" opacity="0.9" />
      `;

      nodesGroup.appendChild(g);
    });

    updateScroll();
  }

  function updateScroll() {
    if (!pathLive || totalLength <= 0) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    // Draw vine by scroll progress
    const drawLength = totalLength * progress;
    pathLive.style.strokeDashoffset = `${totalLength - drawLength}`;

    // Highlight active section node
    const nodes = document.querySelectorAll<SVGGElement>('.vine-node');
    nodes.forEach((node) => {
      const transform = node.getAttribute('transform');
      if (transform) {
        const match = /translate\([^,]+,\s*([^)]+)\)/.exec(transform);
        if (match) {
          const nodeY = parseFloat(match[1]);
          const isPassed = window.scrollY + window.innerHeight * 0.65 >= nodeY;
          node.style.opacity = isPassed ? '1' : '0.35';
          node.style.filter = isPassed ? 'drop-shadow(0 0 5px currentColor)' : 'none';
        }
      }
    });
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', () => {
    buildPath();
    updateScroll();
  }, { passive: true });

  // Initial build
  buildPath();
}

