# Glitch Oracle v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the Glitch Oracle as a dense wall of 40-60 simultaneous arrows with continuous corruption, hover-to-reveal, and click-shockwave.

**Architecture:** Complete rewrite of `glitch-oracle.js` as a single ES module. The canvas fills with arrow blocks laid out in a packed grid. A corruption layer (noise + scanlines + RGB split) runs continuously via ImageData manipulation. Mouse position creates a clarity circle. Click triggers a radial shockwave that rebuilds the wall. CSS changes add atmospheric containment (vignette, grain).

**Tech Stack:** Canvas 2D, pretext (esm.sh CDN), vanilla JS ES module

---

### Task 1: CSS Atmospheric Containment

**Files:**
- Modify: `style.css` (lines 1987-2038, the `.glitch-oracle` block)
- Modify: `index.html` (the oracle section HTML — update subtitle and counter text)

**Step 1: Update the CSS for atmospheric containment**

Replace the existing `.glitch-oracle` CSS block (lines 1984-2038) with:

```css
/* ============================================
   GLITCH ORACLE - Wall of Corrupted Text
   ============================================ */
.glitch-oracle {
  position: relative;
  padding: 4rem 0 0;
  background: var(--bg-darker);
  overflow: hidden;
}

.oracle-subtitle {
  text-align: center;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 2rem;
}

.oracle-stage {
  position: relative;
  width: 100%;
  height: 80vh;
  min-height: 500px;
  max-height: 800px;
}

/* Vignette overlay — dark edges for atmospheric containment */
.oracle-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.6) 70%, rgba(5,5,5,0.95) 100%);
  pointer-events: none;
  z-index: 2;
}

/* Grain texture overlay */
.oracle-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  pointer-events: none;
  z-index: 3;
  opacity: 0.5;
}

#oracle-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--bg-darker);
  position: relative;
  z-index: 1;
}

.oracle-counter {
  position: absolute;
  bottom: 1.5rem;
  right: 2rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.6;
  pointer-events: none;
  z-index: 4;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**Step 2: Update the responsive styles**

In the existing mobile media query, replace the oracle responsive rules with:

```css
  .oracle-stage {
    height: 60vh;
    min-height: 400px;
  }

  .oracle-subtitle {
    font-size: 0.75rem;
  }
```

**Step 3: Update the HTML subtitle and counter**

In `index.html`, change the oracle subtitle text from:
```
Click to summon. Scroll to corrupt.
```
to:
```
Hover to read. Click to reshuffle.
```

Change the counter span's initial content — it will be set by JS, so no change needed there.

**Step 4: Commit**

```bash
git add style.css index.html
git commit -m "feat: atmospheric containment CSS for Glitch Oracle v2 — vignette, grain, larger stage"
```

---

### Task 2: Core Rewrite — Wall Layout Engine

**Files:**
- Rewrite: `glitch-oracle.js` (complete replacement)

This is the foundation. Write the new file with: pretext import, arrow loading, wall layout, clean rendering. NO corruption/hover/shockwave yet — just the wall of text.

**Step 1: Write the new glitch-oracle.js**

Replace the entire file with:

```javascript
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
const ARROW_COUNT = 50; // arrows on screen at once
const REVEAL_RADIUS = 120;
const REVEAL_FALLOFF = 40;

const COLORS = {
  green: '#00ff99',
  blue: '#00ccff',
  muted: '#666677',
  bg: '#050505',
};

// Font sizes to pick from for variety
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
    this.wallBlocks = []; // Current wall layout: [{text, lines, x, y, fontSize, opacity, color}]
    this.isVisible = false;
    this.animFrameId = null;
    this.frameCount = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse state
    this.mouse = { x: -9999, y: -9999, smoothX: -9999, smoothY: -9999 };

    // Shockwave state
    this.shockwave = null; // { cx, cy, radius, maxRadius, startTime }

    // Corruption state
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

  // === WALL LAYOUT ===

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

      // Pick the shortest column
      let col = 0;
      for (let c = 1; c < colCount; c++) {
        if (colHeights[c] < colHeights[col]) col = c;
      }

      const x = padding + col * (colWidth + padding);
      const y = colHeights[col];

      // Layout text with pretext or fallback
      let lines;
      if (pretextAvailable) {
        const prepared = prepareWithSegments(text, fontStr);
        const result = layoutWithLines(prepared, colWidth, lineHeight);
        lines = result.lines;
      } else {
        lines = this.fallbackLayout(text, colWidth, fontSize);
      }

      const blockHeight = lines.length * lineHeight;

      // Pick color and opacity
      const colorRoll = Math.random();
      const color = colorRoll < 0.7 ? COLORS.green : colorRoll < 0.9 ? COLORS.blue : COLORS.muted;
      const opacity = 0.3 + Math.random() * 0.7;

      this.wallBlocks.push({
        text,
        lines,
        x,
        y,
        fontSize,
        lineHeight,
        fontStr,
        color,
        opacity,
        arrowIndex: idx,
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

  // === CLEAN RENDER (no corruption) ===

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

  // === OBSERVERS & INTERACTIONS ===

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
    // Mouse tracking
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });

    // Touch support
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

    // Click shockwave
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

  // === SHOCKWAVE ===

  triggerShockwave(cx, cy) {
    if (this.reducedMotion) {
      this.buildWall();
      this.renderWallClean();
      this.updateCounter();
      return;
    }

    this.shockwave = {
      cx,
      cy,
      radius: 0,
      maxRadius: Math.max(this.displayWidth, this.displayHeight) * 1.2,
      startTime: performance.now(),
      newWallBuilt: false,
    };
  }

  updateShockwave(now) {
    if (!this.shockwave) return;
    const elapsed = now - this.shockwave.startTime;
    this.shockwave.radius = (elapsed / 1000) * 800; // 800px/s

    // Build new wall once wave passes halfway
    if (!this.shockwave.newWallBuilt && elapsed > 300) {
      this.buildWall();
      this.updateCounter();
      this.shockwave.newWallBuilt = true;
    }

    // End shockwave
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
    // Show arrows near cursor
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

  // === MAIN ANIMATION LOOP (placeholder — Tasks 3-5 fill this in) ===

  tick() {
    if (!this.isVisible) {
      this.animFrameId = null;
      return;
    }

    // Smooth mouse
    this.mouse.smoothX += (this.mouse.x - this.mouse.smoothX) * 0.15;
    this.mouse.smoothY += (this.mouse.y - this.mouse.smoothY) * 0.15;

    const now = performance.now();
    this.updateShockwave(now);
    this.frameCount++;

    // For now, just render clean
    this.renderWallClean();

    // Update a11y (debounced)
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
```

**Step 2: Verify the wall renders**

Open in browser. The Glitch Oracle should show 50 arrows filling the canvas in a 3-column masonry layout at varying sizes and opacities. No corruption effects yet — just clean text. Click should reshuffle with new arrows (no animation yet).

**Step 3: Commit**

```bash
git add glitch-oracle.js
git commit -m "feat: Glitch Oracle v2 core — wall layout engine with multi-arrow masonry"
```

---

### Task 3: Corruption Layer — Noise + Scanlines + RGB Split

**Files:**
- Modify: `glitch-oracle.js` (add corruption rendering to the tick loop)

**Step 1: Add corruption rendering methods**

Add these methods to the GlitchOracle class, before the `tick()` method:

```javascript
  // === CORRUPTION LAYER ===

  renderWallWithCorruption() {
    const { ctx, displayWidth, displayHeight } = this;

    // Step 1: Render the wall with RGB channel separation
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    this.corruption.rgbPhase += 0.015;
    const rgbOffset = Math.sin(this.corruption.rgbPhase) * 2;

    // Render 3 passes: R, G, B channels offset
    const channels = [
      { color: '#ff004430', offsetX: -rgbOffset },  // red-pink, left
      { color: '#00ff9940', offsetX: 0 },            // green, center
      { color: '#00ccff30', offsetX: rgbOffset },     // blue, right
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

    // Step 2: Apply scanlines and noise via ImageData (every 2-3 frames)
    if (this.frameCount % 2 === 0) {
      this.applyCorruptionPass();
    }
  }

  applyCorruptionPass() {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Scanline offset drifts slowly
    this.corruption.scanlineOffset += 0.5;
    this.corruption.noiseFrame++;

    // Use a simple seed for deterministic-ish noise per frame
    let noiseSeed = this.corruption.noiseFrame * 1337;

    for (let y = 0; y < h; y++) {
      // Scanline band: darken every 6-8 pixel rows in a drifting pattern
      const scanY = (y + Math.floor(this.corruption.scanlineOffset * dpr)) % Math.floor(8 * dpr);
      const inScanline = scanY < 2 * dpr;

      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (data[idx + 3] === 0) continue; // Skip fully transparent

        // Noise: slight random opacity modulation
        noiseSeed = (noiseSeed * 16807 + 0) % 2147483647;
        const noise = (noiseSeed / 2147483647);
        const noiseFactor = 0.7 + noise * 0.3; // 0.7-1.0

        data[idx] = Math.floor(data[idx] * noiseFactor);
        data[idx + 1] = Math.floor(data[idx + 1] * noiseFactor);
        data[idx + 2] = Math.floor(data[idx + 2] * noiseFactor);

        // Scanline dimming
        if (inScanline) {
          data[idx] = Math.floor(data[idx] * 0.6);
          data[idx + 1] = Math.floor(data[idx + 1] * 0.6);
          data[idx + 2] = Math.floor(data[idx + 2] * 0.6);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
```

**Step 2: Update `tick()` to use corruption rendering**

Replace the `this.renderWallClean()` line in tick with:

```javascript
    if (this.reducedMotion) {
      this.renderWallClean();
    } else {
      this.renderWallWithCorruption();
    }
```

**Step 3: Verify**

The wall should now shimmer with noise, subtle scanlines should drift vertically, and the text should have a slight RGB color fringe. Text should be visible but harder to read.

**Step 4: Commit**

```bash
git add glitch-oracle.js
git commit -m "feat: continuous corruption layer — noise, scanlines, RGB micro-separation"
```

---

### Task 4: Hover Reveal — Clarity Circle

**Files:**
- Modify: `glitch-oracle.js` (add reveal logic to the corruption pass)

**Step 1: Add the reveal circle to `applyCorruptionPass`**

Replace the `applyCorruptionPass` method with an updated version that checks distance from the smooth mouse position and reduces corruption within the reveal radius:

```javascript
  applyCorruptionPass() {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    this.corruption.scanlineOffset += 0.5;
    this.corruption.noiseFrame++;

    // Mouse position in canvas pixel space
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

        // Calculate reveal intensity (0 = full corruption, 1 = fully clear)
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

        const corruptionStrength = 1 - clarity;

        // Noise
        noiseSeed = (noiseSeed * 16807 + 0) % 2147483647;
        const noise = noiseSeed / 2147483647;
        const noiseFactor = 1 - corruptionStrength * (0.3 * noise);

        data[idx] = Math.floor(data[idx] * noiseFactor);
        data[idx + 1] = Math.floor(data[idx + 1] * noiseFactor);
        data[idx + 2] = Math.floor(data[idx + 2] * noiseFactor);

        // Scanline dimming (suppressed in reveal)
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
```

**Step 2: Update `renderWallWithCorruption` to suppress RGB split in reveal zone**

In the `renderWallWithCorruption` method, update the wall rendering to draw an additional clean pass within the reveal circle. After the `ctx.globalCompositeOperation = 'source-over';` line, add:

```javascript
    // Clean pass in reveal zone
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

      // Draw clean text (no RGB split) in reveal zone
      for (const block of this.wallBlocks) {
        ctx.font = block.fontStr;
        ctx.globalAlpha = Math.min(1, block.opacity + 0.3); // Brighten in reveal
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
```

**Step 3: Add subtle glow at reveal edge**

After the clean pass, still inside `renderWallWithCorruption`, add:

```javascript
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
```

**Step 4: Verify**

Hover over the canvas. A clarity circle should follow the cursor with easing. Inside the circle, text should be sharp and bright. Outside, the corruption shimmer continues. Moving the cursor should feel embodied — like holding a candle.

**Step 5: Commit**

```bash
git add glitch-oracle.js
git commit -m "feat: hover reveal — clarity circle with fog-wipe and soft glow edge"
```

---

### Task 5: Click Shockwave Animation

**Files:**
- Modify: `glitch-oracle.js` (add shockwave rendering to tick loop)

**Step 1: Add shockwave rendering method**

Add this method to the class:

```javascript
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
      gradient.addColorStop(1, `rgba(0, 255, 153, 0)`);
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

    // Only process pixels near the ring (bounding box)
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
          // Inside the ring: displace and RGB-split
          const ringPos = (dist - riPx) / rwPx; // 0-1 within ring
          const intensity = Math.sin(ringPos * Math.PI); // peaks at center of ring
          const shift = Math.floor(intensity * 40 * dpr);
          const rgbShift = Math.floor(intensity * 10 * dpr);

          const idx = (y * w + x) * 4;

          // Horizontal displacement
          const srcX = Math.min(w - 1, Math.max(0, x + shift));
          const srcIdx = (y * w + srcX) * 4;

          // RGB split: red from left, blue from right
          const srcR = Math.min(w - 1, Math.max(0, x - rgbShift));
          const srcB = Math.min(w - 1, Math.max(0, x + rgbShift));

          data[idx] = copy[(y * w + srcR) * 4];       // R from left
          data[idx + 1] = copy[srcIdx + 1];             // G from displaced
          data[idx + 2] = copy[(y * w + srcB) * 4 + 2]; // B from right
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
```

**Step 2: Wire shockwave into tick**

In the `tick()` method, add after the corruption/clean render block and before the a11y update:

```javascript
    // Shockwave overlay
    if (this.shockwave) {
      this.renderShockwave();
    }
```

**Step 3: Verify**

Click the canvas. A flash should appear at the click point, then a ring of distortion expands outward. When the ring passes, the wall rebuilds with new arrows. The ring should take ~1-1.5s to clear the screen.

**Step 4: Commit**

```bash
git add glitch-oracle.js
git commit -m "feat: click shockwave — radial displacement ring with flash and wall rebuild"
```

---

### Task 6: Polish — Entry Animation, Performance, Edge Cases

**Files:**
- Modify: `glitch-oracle.js`
- Modify: `style.css` (minor)

**Step 1: Add entry fade-from-noise animation**

In the `setupObserver` method, when `isVisible` becomes true for the first time, trigger a fade-in. Add a property `this.hasEnteredView = false;` in the constructor, then update the observer callback:

```javascript
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
```

Then in `applyCorruptionPass`, at the start, calculate an entry fade factor:

```javascript
    // Entry fade: extra corruption in first 800ms
    let entryFade = 1; // 1 = normal, >1 = extra corruption
    if (this.entryStart) {
      const entryElapsed = performance.now() - this.entryStart;
      if (entryElapsed < 800) {
        entryFade = 1 + 2 * (1 - entryElapsed / 800); // 3 -> 1 over 800ms
      } else {
        this.entryStart = null; // Done with entry
      }
    }
```

Use `entryFade` to multiply `corruptionStrength`:

```javascript
        const corruptionStrength = Math.min(1, (1 - clarity) * entryFade);
```

**Step 2: Performance guard — skip corruption on low-end devices**

Add to the constructor:

```javascript
    this.skipCorruptionPixels = false;
```

In `tick()`, measure frame time. If frames consistently take >32ms (below 30fps), set `this.skipCorruptionPixels = true` to bypass the per-pixel ImageData loop:

```javascript
    // Performance monitoring
    if (!this._lastFrameTime) this._lastFrameTime = now;
    const frameDelta = now - this._lastFrameTime;
    this._lastFrameTime = now;
    if (frameDelta > 32 && this.frameCount > 10) {
      this._slowFrames = (this._slowFrames || 0) + 1;
      if (this._slowFrames > 10) this.skipCorruptionPixels = true;
    }
```

In `applyCorruptionPass`, add at the very top:

```javascript
    if (this.skipCorruptionPixels) return; // Performance bailout
```

**Step 3: Commit**

```bash
git add glitch-oracle.js
git commit -m "feat: entry animation fade, performance guard for low-end devices"
```

---

### Task 7: Final Integration & Browser Test

**Files:**
- All modified files

**Step 1: Start local server and test**

```bash
cd "/Users/pedrohernandezbaez/Documents/flesh and code"
python3 -m http.server 8090
```

Open http://localhost:8090 in browser.

**Step 2: Full test checklist**

- [ ] Section shows between Themes and Gallery
- [ ] Wall fills with ~50 arrows in masonry layout
- [ ] Corruption layer: noise shimmer, scanlines, RGB fringe
- [ ] Hover: clarity circle follows cursor with easing
- [ ] Hover edge: soft green glow at circle boundary
- [ ] Click: flash + expanding ring + wall rebuilds with new arrows
- [ ] Counter shows "50 arrows · click to reshuffle"
- [ ] Vignette darkens edges
- [ ] Grain texture visible
- [ ] Entry animation: extra corruption fading to normal on first view
- [ ] Mobile: touch-to-reveal works, tap reshuffles
- [ ] Reduced motion: clean text, no corruption, click does instant swap
- [ ] No console errors
- [ ] No visible performance issues (check FPS in DevTools)

**Step 3: Fix any issues found in testing**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Glitch Oracle v2 complete — wall of corrupted text with hover reveal and click shockwave"
```
