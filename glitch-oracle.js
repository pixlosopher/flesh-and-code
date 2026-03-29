// ============================================
// GLITCH ORACLE v2 - Wall of Corrupted Text
// Uses pretext for DOM-free text measurement
// ============================================

let prepareWithSegments, layoutWithLines;
let pretextAvailable = false;

try {
  const pretext = await import('https://esm.sh/@chenglou/pretext@0.0.3');
  prepareWithSegments = pretext.prepareWithSegments;
  layoutWithLines = pretext.layoutWithLines;
  pretextAvailable = true;
} catch (e) {
  console.warn('Glitch Oracle: pretext not available, using canvas fallback', e);
}

const FONT_FAMILY = "'Share Tech Mono', monospace";
const ARROW_COUNT = 50;
const REVEAL_RADIUS = 120;
const REVEAL_FALLOFF = 40;

const COLORS = {
  green: '#00ff99',
  blue: '#00ccff',
  muted: '#666677',
  bg: '#050505',
};

const FONT_SIZES = [14, 16, 18, 20, 24, 28, 32];
const MOBILE_FONT_SIZES = [12, 14, 16, 18, 20];

class GlitchOracle {
  constructor() {
    this.canvas = document.getElementById('oracle-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.counterEl = document.querySelector('.oracle-arrow-num');
    this.a11yEl = document.getElementById('oracle-a11y');

    this.arrows = [];
    this.wallBlocks = [];
    this.isVisible = false;
    this.animFrameId = null;
    this.frameCount = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.mouse = { x: -9999, y: -9999, smoothX: -9999, smoothY: -9999 };

    this.shockwave = null;

    this.corruption = {
      rgbPhase: 0,
      scanlineOffset: 0,
      noiseFrame: 0,
    };

    this.init();
  }

  get isMobile() {
    return window.innerWidth <= 768;
  }

  get fontSizes() {
    return this.isMobile ? MOBILE_FONT_SIZES : FONT_SIZES;
  }

  async init() {
    try {
      const res = await fetch('arrows.json');
      const data = await res.json();
      this.arrows = Object.values(data);
    } catch (e) {
      console.warn('Glitch Oracle: could not load arrows.json', e);
      return;
    }

    this.resizeCanvas();
    this.buildWall();
    this.setupObserver();
    this.setupInteractions();
    this.setupResize();
    this.renderWallClean();
    this.updateCounter();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  shuffleArrows(count) {
    const indices = [];
    const used = new Set();
    while (indices.length < count && indices.length < this.arrows.length) {
      const idx = Math.floor(Math.random() * this.arrows.length);
      if (!used.has(idx)) {
        used.add(idx);
        indices.push(idx);
      }
    }
    return indices;
  }

  buildWall() {
    const count = this.isMobile ? 30 : ARROW_COUNT;
    const indices = this.shuffleArrows(count);
    const padding = this.isMobile ? 15 : 30;
    const colCount = this.isMobile ? 2 : 3;
    const colWidth = (this.displayWidth - padding * (colCount + 1)) / colCount;

    this.wallBlocks = [];
    const colHeights = new Array(colCount).fill(padding);

    for (const idx of indices) {
      const text = this.arrows[idx];
      const fontSize = this.fontSizes[Math.floor(Math.random() * this.fontSizes.length)];
      const lineHeight = fontSize * 1.5;
      const fontStr = `${fontSize}px ${FONT_FAMILY}`;

      let col = 0;
      for (let c = 1; c < colCount; c++) {
        if (colHeights[c] < colHeights[col]) col = c;
      }

      const x = padding + col * (colWidth + padding);
      const y = colHeights[col];

      let lines;
      if (pretextAvailable) {
        const prepared = prepareWithSegments(text, fontStr);
        const result = layoutWithLines(prepared, colWidth, lineHeight);
        lines = result.lines;
      } else {
        lines = this.fallbackLayout(text, colWidth, fontSize);
      }

      const blockHeight = lines.length * lineHeight;

      const colorRoll = Math.random();
      const color = colorRoll < 0.7 ? COLORS.green : colorRoll < 0.9 ? COLORS.blue : COLORS.muted;
      const opacity = 0.3 + Math.random() * 0.7;

      this.wallBlocks.push({
        text, lines, x, y, fontSize, lineHeight, fontStr, color, opacity, arrowIndex: idx,
      });

      colHeights[col] += blockHeight + padding * 0.8;
    }
  }

  fallbackLayout(text, maxWidth, fontSize) {
    const ctx = this.ctx;
    ctx.font = `${fontSize}px ${FONT_FAMILY}`;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
    }
    return lines;
  }

  renderWallClean() {
    const { ctx, displayWidth, displayHeight } = this;
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    ctx.textBaseline = 'alphabetic';

    for (const block of this.wallBlocks) {
      ctx.font = block.fontStr;
      ctx.globalAlpha = block.opacity;
      ctx.fillStyle = block.color;

      for (let i = 0; i < block.lines.length; i++) {
        const line = block.lines[i];
        ctx.fillText(line.text, block.x, block.y + (i + 1) * block.lineHeight);
      }
    }

    ctx.globalAlpha = 1;
  }

  setupObserver() {
    const section = document.getElementById('glitch-oracle');
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) {
          if (!this.animFrameId) this.tick();
        } else {
          if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(section);
  }

  setupInteractions() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = touch.clientX - rect.left;
      this.mouse.y = touch.clientY - rect.top;
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      this.triggerShockwave(cx, cy);
    });

    this.canvas.style.cursor = 'none';
  }

  setupResize() {
    const ro = new ResizeObserver(() => {
      this.resizeCanvas();
      this.buildWall();
      this.renderWallClean();
    });
    ro.observe(this.canvas.parentElement);
  }

  triggerShockwave(cx, cy) {
    if (this.reducedMotion) {
      this.buildWall();
      this.renderWallClean();
      this.updateCounter();
      return;
    }

    this.shockwave = {
      cx, cy,
      radius: 0,
      maxRadius: Math.max(this.displayWidth, this.displayHeight) * 1.2,
      startTime: performance.now(),
      newWallBuilt: false,
    };
  }

  updateShockwave(now) {
    if (!this.shockwave) return;
    const elapsed = now - this.shockwave.startTime;
    this.shockwave.radius = (elapsed / 1000) * 800;

    if (!this.shockwave.newWallBuilt && elapsed > 300) {
      this.buildWall();
      this.updateCounter();
      this.shockwave.newWallBuilt = true;
    }

    if (this.shockwave.radius > this.shockwave.maxRadius) {
      this.shockwave = null;
    }
  }

  updateCounter() {
    if (this.counterEl) {
      this.counterEl.textContent = `${this.wallBlocks.length} arrows \u00b7 click to reshuffle`;
    }
  }

  updateA11y() {
    if (!this.a11yEl) return;
    const nearbyTexts = [];
    for (const block of this.wallBlocks) {
      const bCenterX = block.x + 100;
      const bCenterY = block.y + block.lines.length * block.lineHeight / 2;
      const dist = Math.hypot(this.mouse.smoothX - bCenterX, this.mouse.smoothY - bCenterY);
      if (dist < REVEAL_RADIUS * 2) {
        nearbyTexts.push(block.text);
        if (nearbyTexts.length >= 3) break;
      }
    }
    this.a11yEl.textContent = nearbyTexts.join(' | ');
  }

  tick() {
    if (!this.isVisible) {
      this.animFrameId = null;
      return;
    }

    this.mouse.smoothX += (this.mouse.x - this.mouse.smoothX) * 0.15;
    this.mouse.smoothY += (this.mouse.y - this.mouse.smoothY) * 0.15;

    const now = performance.now();
    this.updateShockwave(now);
    this.frameCount++;

    // For now, just render clean — corruption added in Task 3
    this.renderWallClean();

    if (this.frameCount % 30 === 0) this.updateA11y();

    this.animFrameId = requestAnimationFrame(() => this.tick());
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new GlitchOracle());
} else {
  new GlitchOracle();
}
