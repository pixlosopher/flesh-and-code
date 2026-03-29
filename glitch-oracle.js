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

    this.hasEnteredView = false;
    this.entryStart = null;
    this.skipCorruptionPixels = false;
    this._lastFrameTime = 0;
    this._slowFrames = 0;

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
        const wasVisible = this.isVisible;
        this.isVisible = entry.isIntersecting;
        if (this.isVisible) {
          if (!wasVisible && !this.hasEnteredView) {
            this.hasEnteredView = true;
            this.entryStart = performance.now();
          }
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

  // === CORRUPTION LAYER ===

  renderWallWithCorruption() {
    const { ctx, displayWidth, displayHeight } = this;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    this.corruption.rgbPhase += 0.015;
    const rgbOffset = Math.sin(this.corruption.rgbPhase) * 2;

    const channels = [
      { color: '#ff004430', offsetX: -rgbOffset },
      { color: '#00ff9940', offsetX: 0 },
      { color: '#00ccff30', offsetX: rgbOffset },
    ];

    ctx.textBaseline = 'alphabetic';
    ctx.globalCompositeOperation = 'screen';

    for (const channel of channels) {
      ctx.fillStyle = channel.color;
      for (const block of this.wallBlocks) {
        ctx.font = block.fontStr;
        ctx.globalAlpha = block.opacity;
        for (let i = 0; i < block.lines.length; i++) {
          ctx.fillText(
            block.lines[i].text,
            block.x + channel.offsetX,
            block.y + (i + 1) * block.lineHeight
          );
        }
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // Clean pass in reveal zone — sharp text without RGB split
    if (this.mouse.smoothX > -1000) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.mouse.smoothX, this.mouse.smoothY, REVEAL_RADIUS + REVEAL_FALLOFF, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(
        this.mouse.smoothX - REVEAL_RADIUS - REVEAL_FALLOFF - 5,
        this.mouse.smoothY - REVEAL_RADIUS - REVEAL_FALLOFF - 5,
        (REVEAL_RADIUS + REVEAL_FALLOFF) * 2 + 10,
        (REVEAL_RADIUS + REVEAL_FALLOFF) * 2 + 10
      );

      for (const block of this.wallBlocks) {
        ctx.font = block.fontStr;
        ctx.globalAlpha = Math.min(1, block.opacity + 0.3);
        ctx.fillStyle = block.color;
        for (let i = 0; i < block.lines.length; i++) {
          ctx.fillText(
            block.lines[i].text,
            block.x,
            block.y + (i + 1) * block.lineHeight
          );
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Glow at reveal circle edge
    if (this.mouse.smoothX > -1000 && !this.reducedMotion) {
      const gradient = ctx.createRadialGradient(
        this.mouse.smoothX, this.mouse.smoothY, REVEAL_RADIUS - 10,
        this.mouse.smoothX, this.mouse.smoothY, REVEAL_RADIUS + REVEAL_FALLOFF
      );
      gradient.addColorStop(0, 'rgba(0, 255, 153, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 153, 0.06)');
      gradient.addColorStop(1, 'rgba(0, 255, 153, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    }

    if (this.frameCount % 2 === 0) {
      this.applyCorruptionPass();
    }
  }

  applyCorruptionPass() {
    if (this.skipCorruptionPixels) return;

    // Entry fade: extra corruption in first 800ms
    let entryFade = 1;
    if (this.entryStart) {
      const entryElapsed = performance.now() - this.entryStart;
      if (entryElapsed < 800) {
        entryFade = 1 + 2 * (1 - entryElapsed / 800);
      } else {
        this.entryStart = null;
      }
    }

    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    this.corruption.scanlineOffset += 0.5;
    this.corruption.noiseFrame++;

    const mx = this.mouse.smoothX * dpr;
    const my = this.mouse.smoothY * dpr;
    const revealR = REVEAL_RADIUS * dpr;
    const falloff = REVEAL_FALLOFF * dpr;
    const mouseActive = this.mouse.smoothX > -1000;

    let noiseSeed = this.corruption.noiseFrame * 1337;

    for (let y = 0; y < h; y++) {
      const scanY = (y + Math.floor(this.corruption.scanlineOffset * dpr)) % Math.floor(8 * dpr);
      const inScanline = scanY < 2 * dpr;
      const dy = y - my;

      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (data[idx + 3] === 0) continue;

        let clarity = 0;
        if (mouseActive) {
          const dx = x - mx;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < revealR) {
            clarity = 1;
          } else if (dist < revealR + falloff) {
            clarity = 1 - (dist - revealR) / falloff;
          }
        }

        const corruptionStrength = Math.min(1, (1 - clarity) * entryFade);

        noiseSeed = (noiseSeed * 16807 + 0) % 2147483647;
        const noise = noiseSeed / 2147483647;
        const noiseFactor = 1 - corruptionStrength * (0.3 * noise);

        data[idx] = Math.floor(data[idx] * noiseFactor);
        data[idx + 1] = Math.floor(data[idx + 1] * noiseFactor);
        data[idx + 2] = Math.floor(data[idx + 2] * noiseFactor);

        if (inScanline && corruptionStrength > 0.3) {
          const scanDim = 0.6 + 0.4 * (1 - corruptionStrength);
          data[idx] = Math.floor(data[idx] * scanDim);
          data[idx + 1] = Math.floor(data[idx + 1] * scanDim);
          data[idx + 2] = Math.floor(data[idx + 2] * scanDim);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // === SHOCKWAVE RENDERING ===

  renderShockwave() {
    if (!this.shockwave) return;

    const { ctx, displayWidth, displayHeight, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const { cx, cy, radius, startTime } = this.shockwave;
    const elapsed = performance.now() - startTime;

    // Flash at click point (first 100ms)
    if (elapsed < 100) {
      const flashAlpha = 1 - elapsed / 100;
      const flashR = 20 + elapsed * 0.5;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
      gradient.addColorStop(0, `rgba(0, 255, 153, ${flashAlpha})`);
      gradient.addColorStop(1, 'rgba(0, 255, 153, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, displayWidth, displayHeight);
    }

    // Ring displacement
    const ringWidth = 60;
    const ringInner = Math.max(0, radius - ringWidth);
    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);

    const cxPx = cx * dpr;
    const cyPx = cy * dpr;
    const rPx = radius * dpr;
    const riPx = ringInner * dpr;
    const rwPx = ringWidth * dpr;

    const yMin = Math.max(0, Math.floor(cyPx - rPx - rwPx));
    const yMax = Math.min(h, Math.ceil(cyPx + rPx + rwPx));
    const xMin = Math.max(0, Math.floor(cxPx - rPx - rwPx));
    const xMax = Math.min(w, Math.ceil(cxPx + rPx + rwPx));

    for (let y = yMin; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {
        const dx = x - cxPx;
        const dy = y - cyPx;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > riPx && dist < rPx) {
          const ringPos = (dist - riPx) / rwPx;
          const intensity = Math.sin(ringPos * Math.PI);
          const shift = Math.floor(intensity * 40 * dpr);
          const rgbShift = Math.floor(intensity * 10 * dpr);

          const idx = (y * w + x) * 4;

          const srcX = Math.min(w - 1, Math.max(0, x + shift));
          const srcIdx = (y * w + srcX) * 4;

          const srcR = Math.min(w - 1, Math.max(0, x - rgbShift));
          const srcB = Math.min(w - 1, Math.max(0, x + rgbShift));

          data[idx] = copy[(y * w + srcR) * 4];
          data[idx + 1] = copy[srcIdx + 1];
          data[idx + 2] = copy[(y * w + srcB) * 4 + 2];
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
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

    // Performance monitoring
    if (this._lastFrameTime) {
      const frameDelta = now - this._lastFrameTime;
      if (frameDelta > 32 && this.frameCount > 10) {
        this._slowFrames++;
        if (this._slowFrames > 10) this.skipCorruptionPixels = true;
      }
    }
    this._lastFrameTime = now;

    if (this.reducedMotion) {
      this.renderWallClean();
    } else {
      this.renderWallWithCorruption();
    }

    // Shockwave overlay
    if (this.shockwave) {
      this.renderShockwave();
    }

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
