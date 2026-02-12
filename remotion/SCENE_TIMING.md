# ONE Promo Scene — Timing Pattern Reference

Based on `RoutingWindowScene.tsx` (the approved reference). All values at **60fps**.

## Scene Structure

A scene has **1 to 3 stages**. Each stage is one of two types:

- **LEFT + RIGHT stage** — subtitle, left element, interaction, arrow, right element, bottom label (sequential reveal with 1.5s gaps)
- **Single-content stage** — one piece of content springs in (typically code snippets side-by-side, used as the final stage)

---

## Opening Sequence (fixed, every scene)

```
Frame 3        Cursor fades in (5-frame fade)
Frame 8–35     Cursor moves to desktop icon (Easing.bezier(0.4, 0, 0.2, 1))
Frame 40–48    Click bounce (scale: 0.82 for 8 frames)
Frame 40–67    Icon highlight visible
Frame 52       Window opens (spring: damping:16, stiffness:100, mass:0.9, 35 frames)
Frame 62–107   Shimmer skeleton (spring in at WINDOW_OPEN+10, fade out by S1_ENTER-15)
Frame 87–117   Camera zoom in (1 → 1.18, Easing.inOut(cubic))
Frame 112      Cursor fully hidden
```

**Key constant:** `WINDOW_OPEN = 52`

---

## Stage Timeline (relative to WINDOW_OPEN)

### 3 stages (2 LEFT+RIGHT + 1 single-content) — TOTAL = 1340

```
S1_ENTER  = WINDOW_OPEN + 70     frame 122
S1_EXIT   = WINDOW_OPEN + 460    frame 512   (390 frames visible)
S2_ENTER  = WINDOW_OPEN + 480    frame 532   (20-frame gap)
S2_EXIT   = WINDOW_OPEN + 870    frame 922   (390 frames visible)
S3_ENTER  = WINDOW_OPEN + 890    frame 942   (20-frame gap)
                                  S3 holds ~298 frames until close
STAGE_FADE = 20
TOTAL = 1340 frames (~22.3s)
```

### 2 stages (1 LEFT+RIGHT + 1 single-content) — TOTAL ~ 930

```
S1_ENTER  = WINDOW_OPEN + 70
S1_EXIT   = WINDOW_OPEN + 460
S2_ENTER  = WINDOW_OPEN + 480    S2 holds ~250 frames until close
TOTAL ~ 930 frames (~15.5s)
```

### 1 stage (single LEFT+RIGHT) — TOTAL ~ 620

```
S1_ENTER  = WINDOW_OPEN + 70     S1 holds ~330 frames until close
TOTAL ~ 620 frames (~10.3s)
```

---

## LEFT + RIGHT Stage Sub-Animations

All times are **local frames** from that stage's enter (`sLocal = frame - S_ENTER`):

```
Local 0–25      Stage spring entrance (damping:20, stiffness:140, 25 frames)
                translateY: 15→0, opacity via spring

Local 30–42     Subtitle + left content fade in (opacity 0→1, 12 frames)

Local 60        Interaction animation starts on left element
                (ripple / glow / highlight, ~18–20 frames)

Local 150–160   Arrow fades in (opacity 0→1, 10 frames)
                ** 1.5s gap after interaction **

Local 156       Right content springs in (damping:18, stiffness:120, 25 frames)
                scale: 0.85→1, opacity in first 30% of spring

Local 270–283   Bottom label fades in (opacity 0→1, 13 frames)
                ** 1.5s gap after right content **
```

### Gap pattern summary

```
stage enters     → 0.5s  → left + subtitle appear
left appears     → 0.3s  → interaction plays
interaction      → 1.5s  → arrow appears
arrow            → ~0s   → right springs in (6 frames after arrow start)
right appears    → 1.5s  → label appears
label appears    → ~1.8s → stage exits (hold for reading)
```

---

## Single-Content Stage (code display, typically last)

```
Local 0–25      Stage spring entrance (same config as LEFT+RIGHT)
                Content visible immediately with the spring
                No sub-element sequential animation
                No exit — holds until closing sequence
```

---

## Closing Sequence (last 100 frames)

All offsets are **from the end** of total duration, making this portable to any scene length:

```
TOTAL - 100     Zoom out starts (1.18→1, Easing.inOut(cubic))
TOTAL - 63      Zoom out complete
TOTAL - 60      Close cursor fades in + starts moving to X button
TOTAL - 35      Close cursor arrives at X button
TOTAL - 31      Close click bounce (scale: 0.82, 6 frames)
TOTAL - 27      Window shrink + fade starts (Easing.inOut(cubic))
TOTAL - 7       Window fully closed, cursor fades out
TOTAL           Scene ends
```

Close cursor: starts at `(700, 650)`, moves to `CLOSE_BTN = (182, 122)`.

---

## Duration Formula

```
TOTAL = 122                                     // opening (WINDOW_OPEN + 70)
      + (NUM_LR_STAGES × 390)                   // each LEFT+RIGHT stage
      + ((NUM_STAGES - 1) × 20)                 // gaps between stages
      + LAST_STAGE_HOLD                          // reading time for last stage
      + 100                                      // closing sequence

LAST_STAGE_HOLD:
  Single-content (code):  ~250–300 frames (~4–5s reading time)
  LEFT+RIGHT as last:     ~110 frames after label finishes (label at +283)
```

---

## Visual Style Constants

```
Window:         1600×880, borderRadius 12
Title bar:      44px height, macOS traffic lights, centered title (fontSize 13)
Feature title:  fontSize 76, fontWeight 700, centered, color #1f2328
Subtitle:       fontSize 48, fontWeight 600, color #57606a
Bottom label:   fontSize 66, fontWeight 600, color #57606a
Arrow:          fontSize 36, color #3b82f6, fontWeight 700, unicode →
Stage layout:   flexDirection column, justifyContent space-around, alignItems center
Dot grid:       radial-gradient(circle, #d8d8d8 1px, transparent 1px), 24px spacing
Camera zoom:    transformOrigin 960px 540px, scale 1→1.18→1
Background:     #f5f5f5
```

### Syntax highlight colors

```
keyword:    #cf222e    (import, export, const, return, if)
func:       #8250df    (function names, methods)
component:  #0550ae    (JSX component names)
param:      #953800    (props, parameters, object keys)
text:       #1f2328    (brackets, punctuation, general)
punct:      #6e7781    (secondary punctuation)
string:     #0a3069    (string literals)
```

### Font stacks

```
MONO = 'SF Mono', 'Fira Code', 'Cascadia Code', monospace
UI   = 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif
```

---

## Spring Configs Reference

| Usage | damping | stiffness | mass | duration |
|-------|---------|-----------|------|----------|
| Window open | 16 | 100 | 0.9 | 35 frames |
| Stage entrance | 20 | 140 | — | 25 frames |
| Right element entrance | 18 | 120 | — | 25 frames |
| Shimmer placeholder | 20 | 140 | — | 25 frames |
