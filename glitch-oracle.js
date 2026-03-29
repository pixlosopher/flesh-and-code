// ============================================
// GLITCH ORACLE - Canvas Aphorisms Engine
// Uses pretext for DOM-free text measurement
// ============================================

import { prepareWithSegments, layoutWithLines } from 'https://esm.sh/@chenglou/pretext@0.0.3';

const FONT_SIZE_DESKTOP = 28;
const FONT_SIZE_MOBILE = 20;
const LINE_HEIGHT_MULTIPLIER = 1.8;
const FONT_FAMILY = "'Share Tech Mono', monospace";
const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// Colors from CSS variables
const COLORS = {
  green: '#00ff99',
  pink: '#ff00aa',
  blue: '#00ccff',
  bg: '#050505',
  muted: '#666677',
};

class GlitchOracle {
  constructor() {
    this.canvas = document.getElementById('oracle-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.counterEl = document.querySelector('.oracle-arrow-num');
    this.a11yEl = document.getElementById('oracle-a11y');
    this.arrows = [];
    this.prepared = [];
    this.currentIndex = 0;
    this.isVisible = false;
    this.isTransitioning = false;
    this.idleTimer = null;
    this.idleActive = false;
    this.animFrameId = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Glitch state
    this.glitch = {
      displacement: [],
      scrambleChars: [],
      scrambleProgress: 0,
      rgbOffset: 0,
      targetRgbOffset: 0,
      idleRgbPhase: 0,
      idleFlickerTimer: 0,
    };

    this.init();
  }

  get fontSize() {
    return window.innerWidth <= 768 ? FONT_SIZE_MOBILE : FONT_SIZE_DESKTOP;
  }

  get fontString() {
    return `${this.fontSize}px ${FONT_FAMILY}`;
  }

  get lineHeight() {
    return this.fontSize * LINE_HEIGHT_MULTIPLIER;
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
    this.prepareAllArrows();
    this.setupObserver();
    this.setupInteractions();
    this.setupResize();

    this.currentIndex = Math.floor(Math.random() * this.arrows.length);
    this.renderClean();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  prepareAllArrows() {
    this.prepared = this.arrows.map(text =>
      prepareWithSegments(text, this.fontString)
    );
  }

  getLines() {
    const padding = window.innerWidth <= 768 ? 30 : 60;
    const maxWidth = this.displayWidth - padding * 2;
    const result = layoutWithLines(
      this.prepared[this.currentIndex],
      maxWidth,
      this.lineHeight
    );
    return result;
  }

  renderClean() {
    const { ctx, displayWidth, displayHeight } = this;
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const layout = this.getLines();
    const totalHeight = layout.lines.length * this.lineHeight;
    const startY = (displayHeight - totalHeight) / 2 + this.fontSize;

    ctx.font = this.fontString;
    ctx.fillStyle = COLORS.green;
    ctx.textBaseline = 'alphabetic';

    for (let i = 0; i < layout.lines.length; i++) {
      const line = layout.lines[i];
      const x = (displayWidth - line.width) / 2;
      const y = startY + i * this.lineHeight;
      ctx.fillText(line.text, x, y);
    }

    this.updateCounter();
    this.updateA11y();
  }

  updateCounter() {
    if (this.counterEl) {
      this.counterEl.textContent = `→ ${this.currentIndex + 1} / ${this.arrows.length}`;
    }
  }

  updateA11y() {
    if (this.a11yEl) {
      this.a11yEl.textContent = this.arrows[this.currentIndex];
    }
  }

  // Placeholder methods — will be implemented in Tasks 4-8
  setupObserver() {}
  setupInteractions() {}
  setupResize() {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new GlitchOracle());
} else {
  new GlitchOracle();
}
