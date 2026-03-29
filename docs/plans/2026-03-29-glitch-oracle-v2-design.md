# Glitch Oracle v2: Wall of Corrupted Text

**Date:** 2026-03-29
**Status:** Approved
**Supersedes:** 2026-03-29-glitch-oracle-design.md

## Summary

Complete rewrite of the Glitch Oracle canvas rendering. Instead of a single centered arrow, the canvas fills with 40-60 arrows simultaneously as a dense wall of text. A continuous corruption layer (noise, scanlines, RGB micro-separation) makes the wall barely readable. Hovering reveals a circular clarity zone around the cursor (fog-wipe). Clicking sends a radial shockwave that rebuilds the wall with fresh arrows. The section uses atmospheric containment (vignette, grain, intensified scanlines) to feel like a separate space.

## The Wall

- 40-60 arrows displayed simultaneously
- Text sizes: 14px-32px, varying per arrow block
- Packed tight in a flowing grid with slight entropy (±2deg rotation, variable spacing)
- Opacity range: 0.3-1.0 for depth
- Colors: mostly --neon-green at varying opacities, occasional --neon-blue and --text-muted
- Each arrow measured by pretext's layoutWithLines() at its assigned width
- On init and each click-reshuffle: random selection of 40-60 from the 320 arrows

## Corruption Layer (Continuous)

Three sub-layers composited every frame:

### Per-pixel noise
- Random opacity modulation across canvas pixels
- Shifts every 2-3 frames (not every frame — saves GPU)
- Intensity: ~30% opacity noise at rest

### Scan-line bands
- Horizontal bands 4-8px tall that drift vertically at ~0.5px/frame
- Dim pixels by 20-40% within bands
- 3-5 active bands at any time

### RGB micro-separation
- Constant 1-2px channel offset across entire canvas
- Slow oscillation (sine wave, period ~4s)

Combined effect: text is visible as shapes/texture but not comfortably readable without the hover reveal.

## Hover Reveal (Fog-Wipe)

- Circular clarity zone centered on cursor, radius ~120px
- Inside the circle:
  - Noise drops to 0
  - RGB channels snap together (offset = 0)
  - Text at full opacity and sharpness
  - Scan-lines suppressed
- Edge: soft gaussian falloff over ~40px (not hard cutoff)
- Subtle glow at circle edge (faint green tint)
- Cursor position tracked with slight easing (lerp factor ~0.15) for embodied feel
- Mobile: touch-and-hold creates reveal at touch point, drag to explore

## Click Shockwave

Timeline:
```
t=0ms:       White/green flash at click point (20px radius)
t=0-300ms:   Ring of heavy displacement + RGB explosion expands at ~800px/s
t=300-600ms: Behind the wave, wall rebuilds with fresh 40-60 arrows
t=600-1000ms: Everything settles to corrupted baseline
```

- Wave is a circular front moving outward
- Inside the wave ring: heavy horizontal displacement (40-80px), max RGB split (10px)
- Behind the wave (already passed): new arrow text fading in
- Fresh random selection of 40-60 arrows on each click

## Atmospheric Containment

No hard frame. Atmosphere does the work:

- **Vignette:** Heavy dark vignette on canvas edges (radial gradient, black at edges)
- **Background grain:** Subtle noise texture on section background (not pure #050505)
- **Entry animation:** Section fades in from pure static noise when scrolling into viewport (IntersectionObserver, ~800ms transition)
- **Exit:** Dissolves back to noise when leaving viewport

## CSS Changes

- Add noise grain background to .glitch-oracle section
- Increase scanline intensity within the section via a modifier class
- Vignette as a CSS pseudo-element overlay (pointer-events: none)

## Counter & Accessibility

- Counter text: "40 arrows . click to reshuffle"
- aria-live region: lists 3-5 arrows currently near cursor reveal zone (debounced 500ms)
- prefers-reduced-motion: no corruption, clean text at reduced opacity, hover brightens, click does instant swap (no wave animation)

## Architecture

Single file rewrite of glitch-oracle.js. Keep:
- Pretext import and CDN fallback
- arrows.json loading
- ResizeObserver
- IntersectionObserver structure
- Reduced motion detection

Replace:
- Single-arrow rendering -> multi-arrow wall layout
- Simple glitch effects -> continuous corruption layer
- Click transition -> shockwave system
- Add hover reveal system
- Add atmospheric entry/exit

## Performance

- Corruption layer: only manipulate ImageData every 2-3 frames (not every rAF)
- Hover reveal: use distance calculation per-pixel only within bounding box of reveal circle (not entire canvas)
- Arrow layout: computed once per reshuffle, cached until next click
- IntersectionObserver gates all animation to visible-only
- Target: 30fps minimum on mid-range devices (corruption can drop frames gracefully)
