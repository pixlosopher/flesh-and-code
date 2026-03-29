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

  initDisplacement() {
    const slices = [];
    const sliceCount = Math.floor(this.displayHeight / 4);
    for (let i = 0; i < sliceCount; i++) {
      slices.push({
        y: i * 4,
        height: 2 + Math.floor(Math.random() * 6),
        offset: (Math.random() - 0.5) * 80,
        active: Math.random() < 0.3,
      });
    }
    this.glitch.displacement = slices;
  }

  decayDisplacement(dt) {
    const decay = dt / 400;
    for (const slice of this.glitch.displacement) {
      slice.offset *= Math.max(0, 1 - decay);
      if (Math.abs(slice.offset) < 0.5) {
        slice.offset = 0;
        slice.active = false;
      }
    }
  }

  applyDisplacement() {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);

    for (const slice of this.glitch.displacement) {
      if (!slice.active || slice.offset === 0) continue;

      const yStart = Math.floor(slice.y * dpr);
      const yEnd = Math.min(h, yStart + Math.floor(slice.height * dpr));
      const shift = Math.floor(slice.offset * dpr);

      for (let y = yStart; y < yEnd; y++) {
        for (let x = 0; x < w; x++) {
          const srcX = x - shift;
          const dstIdx = (y * w + x) * 4;
          if (srcX >= 0 && srcX < w) {
            const srcIdx = (y * w + srcX) * 4;
            data[dstIdx] = copy[srcIdx];
            data[dstIdx + 1] = copy[srcIdx + 1];
            data[dstIdx + 2] = copy[srcIdx + 2];
            data[dstIdx + 3] = copy[srcIdx + 3];
          } else {
            data[dstIdx + 3] = 0;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  renderWithRGB(lines, startY, padding, rgbOffset) {
    const { ctx, displayWidth } = this;

    const channels = [
      { color: COLORS.pink, offsetX: -rgbOffset },
      { color: COLORS.green, offsetX: 0 },
      { color: COLORS.blue, offsetX: rgbOffset },
    ];

    ctx.font = this.fontString;
    ctx.textBaseline = 'alphabetic';
    ctx.globalCompositeOperation = 'screen';

    for (const channel of channels) {
      ctx.fillStyle = channel.color;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const x = (displayWidth - line.width) / 2 + channel.offsetX;
        const y = startY + i * this.lineHeight;
        ctx.fillText(line.text, x, y);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  initScramble(lines) {
    this.glitch.scrambleChars = [];
    for (const line of lines) {
      const chars = [...line.text];
      for (const ch of chars) {
        this.glitch.scrambleChars.push({
          target: ch,
          current: ch === ' ' ? ' ' : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)],
          resolved: false,
        });
      }
      this.glitch.scrambleChars.push({ target: '\n', current: '\n', resolved: true });
    }
    this.glitch.scrambleProgress = 0;
  }

  advanceScramble(dt) {
    const chars = this.glitch.scrambleChars;
    const totalNonSpace = chars.filter(c => c.target !== ' ' && c.target !== '\n').length;
    if (totalNonSpace === 0) return;

    this.glitch.scrambleProgress = Math.min(1, this.glitch.scrambleProgress + dt / 600);
    const resolveUpTo = Math.floor(this.glitch.scrambleProgress * chars.length);

    let idx = 0;
    for (const ch of chars) {
      if (ch.target === ' ' || ch.target === '\n') { idx++; continue; }
      if (idx < resolveUpTo) {
        ch.current = ch.target;
        ch.resolved = true;
      } else if (!ch.resolved) {
        ch.current = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
      idx++;
    }
  }

  renderScrambled(lines, startY, padding, rgbOffset) {
    const { ctx, displayWidth } = this;
    const channels = [
      { color: COLORS.pink, offsetX: -rgbOffset },
      { color: COLORS.green, offsetX: 0 },
      { color: COLORS.blue, offsetX: rgbOffset },
    ];

    ctx.font = this.fontString;
    ctx.textBaseline = 'alphabetic';
    ctx.globalCompositeOperation = 'screen';

    const scrambledLines = [];
    let lineChars = [];
    for (const ch of this.glitch.scrambleChars) {
      if (ch.target === '\n') {
        scrambledLines.push(lineChars.join(''));
        lineChars = [];
      } else {
        lineChars.push(ch.current);
      }
    }
    if (lineChars.length > 0) scrambledLines.push(lineChars.join(''));

    for (const channel of channels) {
      ctx.fillStyle = channel.color;
      for (let i = 0; i < scrambledLines.length && i < lines.length; i++) {
        const x = (displayWidth - lines[i].width) / 2 + channel.offsetX;
        const y = startY + i * this.lineHeight;
        ctx.fillText(scrambledLines[i], x, y);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  setupObserver() {
    const section = document.getElementById('glitch-oracle');
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) {
          this.startIdleTimer();
          if (!this.animFrameId) this.tick();
        } else {
          this.stopIdleTimer();
          if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
          }
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(section);

    let lastScrollArrow = this.currentIndex;
    const scrollHandler = () => {
      if (!this.isVisible || this.isTransitioning) return;

      const rect = section.getBoundingClientRect();
      const sectionTop = -rect.top;
      const sectionHeight = rect.height - window.innerHeight;
      const progress = Math.max(0, Math.min(1, sectionTop / sectionHeight));
      const targetIndex = Math.floor(progress * (this.arrows.length - 1));

      if (targetIndex !== lastScrollArrow && targetIndex >= 0 && targetIndex < this.arrows.length) {
        lastScrollArrow = targetIndex;
        this.transitionTo(targetIndex);
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  setupInteractions() {
    this.canvas.addEventListener('click', () => {
      if (this.isTransitioning) return;
      let next;
      do {
        next = Math.floor(Math.random() * this.arrows.length);
      } while (next === this.currentIndex && this.arrows.length > 1);
      this.transitionTo(next);
    });

    this.canvas.style.cursor = 'none';
  }

  setupResize() {
    const ro = new ResizeObserver(() => {
      this.resizeCanvas();
      this.prepareAllArrows();
      this.renderClean();
    });
    ro.observe(this.canvas.parentElement);
  }

  startIdleTimer() {
    this.stopIdleTimer();
    this.idleActive = false;
    this.idleTimer = setTimeout(() => {
      this.idleActive = true;
      if (!this.animFrameId) this.tick();
    }, 5000);
  }

  stopIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.idleActive = false;
  }

  transitionTo(index) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.stopIdleTimer();
    this.idleActive = false;

    this.currentIndex = index;
    this.updateCounter();
    this.updateA11y();

    const layout = this.getLines();

    if (!this.reducedMotion) {
      this.initScramble(layout.lines);
      this.initDisplacement();
      this.glitch.rgbOffset = 8;
      this.glitch.targetRgbOffset = 0;
    }

    this.transitionStart = performance.now();
    this.transitionLayout = layout;

    if (!this.animFrameId) this.tick();
  }

  tick() {
    if (!this.isVisible) {
      this.animFrameId = null;
      return;
    }

    const now = performance.now();
    const { ctx, displayWidth, displayHeight } = this;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const layout = this.transitionLayout || this.getLines();
    const totalHeight = layout.lines.length * this.lineHeight;
    const startY = (displayHeight - totalHeight) / 2 + this.fontSize;
    const padding = window.innerWidth <= 768 ? 30 : 60;

    if (this.isTransitioning && !this.reducedMotion) {
      const elapsed = now - this.transitionStart;
      const dt = 16;

      this.advanceScramble(dt);
      this.decayDisplacement(dt);

      const rgbProgress = Math.min(1, elapsed / 500);
      this.glitch.rgbOffset = 8 * (1 - this.easeOutCubic(rgbProgress));

      this.renderScrambled(layout.lines, startY, padding, this.glitch.rgbOffset);
      this.applyDisplacement();

      if (elapsed > 700) {
        this.isTransitioning = false;
        this.transitionLayout = null;
        this.renderClean();
        this.startIdleTimer();
      }
    } else if (this.idleActive && !this.reducedMotion) {
      this.glitch.idleRgbPhase += 0.02;
      const idleRgb = Math.sin(this.glitch.idleRgbPhase) * 1.5;

      this.renderWithRGB(layout.lines, startY, padding, idleRgb);

      this.glitch.idleFlickerTimer += 16;
      if (this.glitch.idleFlickerTimer > 3000 + Math.random() * 4000) {
        this.glitch.idleFlickerTimer = 0;
        this.applyIdleFlicker();
      }
    } else {
      this.renderClean();
      if (!this.isTransitioning && !this.idleActive) {
        this.animFrameId = null;
        return;
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.tick());
  }

  applyIdleFlicker() {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const y = Math.floor(Math.random() * canvas.height);
    const h = Math.floor((2 + Math.random() * 4) * dpr);
    const imageData = ctx.getImageData(0, y, w, h);
    const shift = Math.floor((Math.random() - 0.5) * 20 * dpr);

    const copy = new Uint8ClampedArray(imageData.data);
    for (let row = 0; row < h; row++) {
      for (let x = 0; x < w; x++) {
        const srcX = x - shift;
        const dstIdx = (row * w + x) * 4;
        if (srcX >= 0 && srcX < w) {
          const srcIdx = (row * w + srcX) * 4;
          imageData.data[dstIdx] = copy[srcIdx];
          imageData.data[dstIdx + 1] = copy[srcIdx + 1];
          imageData.data[dstIdx + 2] = copy[srcIdx + 2];
        }
      }
    }
    ctx.putImageData(imageData, 0, y);
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
