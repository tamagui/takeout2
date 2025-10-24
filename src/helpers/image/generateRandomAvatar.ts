import { randomHex } from '~/helpers/color/toHex'
import { colors } from '~/interface/colors/colors'

// ============================================================================
// TYPES
// ============================================================================

interface Layer {
  name: string
  weight: number // probability weight for selection
  create: (size: number, palette: AvatarPalette) => HTMLCanvasElement
}

interface Effect {
  name: string
  weight: number
  apply: (
    canvas: HTMLCanvasElement,
    strength?: number,
    depth?: number
  ) => HTMLCanvasElement
  layerOnly?: boolean // can only be applied to individual layers
  globalOnly?: boolean // can only be applied to final canvas
}

type AvatarPalette = {
  colors: string[]
  bgColor: string
  isWhiteBg: boolean
}

interface AvatarResult {
  dataUrl: string
  rarity: number
}

// ============================================================================
// CANVAS HELPERS
// ============================================================================

function createCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function cloneCanvasWithEffect(
  sourceCanvas: HTMLCanvasElement,
  effectFn: (imageData: ImageData, newImageData: ImageData, size: number) => void
): HTMLCanvasElement {
  const size = sourceCanvas.width
  const newCanvas = createCanvas(size)
  const ctx = newCanvas.getContext('2d')!

  const imageData = sourceCanvas.getContext('2d')!.getImageData(0, 0, size, size)
  const newImageData = ctx.createImageData(size, size)

  effectFn(imageData, newImageData, size)

  ctx.putImageData(newImageData, 0, 0)
  return newCanvas
}

// ============================================================================
// PALETTE SELECTION
// ============================================================================

const PASTEL_NEUTRALS = ['#c9b8a0', '#b8a694', '#c0b0b0', '#c9c0b0']
const BLACK_COLORS = ['#000000', '#000000'] // Add pure blacks to increase likelihood
const WHITE_COLOR = ['#ffffff'] // Add pure white

function pickAvatarPalette(): AvatarPalette {
  const extendedColors = [...colors, ...PASTEL_NEUTRALS, ...BLACK_COLORS, ...WHITE_COLOR]

  const bgRoll = Math.random()
  let bgColor: string
  let isWhiteBg: boolean

  if (bgRoll < 0.2) {
    bgColor = '#000000'
    isWhiteBg = false
  } else if (bgRoll < 0.4) {
    bgColor = '#ffffff'
    isWhiteBg = true
  } else {
    bgColor = extendedColors[Math.floor(Math.random() * extendedColors.length)]!
    isWhiteBg = false
  }

  const numColors = 2 + Math.floor(Math.random() ** 2 * 6) // 2-8 colors, biased towards fewer
  const selectedColors: string[] = []
  const usedIndices = new Set<number>()

  for (let i = 0; i < numColors; i++) {
    let index = Math.floor(Math.random() * extendedColors.length)
    while (usedIndices.has(index)) {
      index = Math.floor(Math.random() * extendedColors.length)
    }
    usedIndices.add(index)
    selectedColors.push(extendedColors[index]!)
  }

  return { colors: selectedColors, bgColor, isWhiteBg }
}

// ============================================================================
// LAYER DEFINITIONS
// ============================================================================

const LAYERS: Layer[] = [
  {
    name: 'ribbon',
    weight: 12,
    create: createRibbonLayer,
  },
  {
    name: 'dither',
    weight: 8, // Reduced from 12
    create: createDitherLayer,
  },
  {
    name: 'moire',
    weight: 10, // Increased from 5
    create: createMoireLayer,
  },
  {
    name: 'stripe',
    weight: 5,
    create: createStripeLayer,
  },
]

// ============================================================================
// EFFECT DEFINITIONS
// ============================================================================

const EFFECTS: Effect[] = [
  {
    name: 'swirl',
    weight: 8,
    apply: (canvas, strength = 0.15) => applySwirlToCanvas(canvas, strength),
  },
  {
    name: 'kaleidoscope',
    weight: 3,
    apply: (canvas, strength = 0.1) => applyKaleidoscopeToCanvas(canvas, strength),
  },
  {
    name: 'fisheye',
    weight: 4,
    apply: (canvas, strength = 0.4) => applyFisheyeToCanvas(canvas, strength),
  },
  {
    name: 'noise',
    weight: 2,
    apply: (canvas) => applyNoise(canvas, 0.1 + Math.random() * 0.3),
  },
  {
    name: 'distortion',
    weight: 10,
    apply: (canvas, _, depth = 0) =>
      applyDistortion(canvas, Math.random() < 0.6 ? 'subtle' : 'strong', depth),
  },
  {
    name: 'grayscale',
    weight: 1,
    apply: (canvas) => applyGrayscale(canvas),
  },
  {
    name: 'smear',
    weight: 4,
    apply: (canvas, _, depth = 0) => applySmearEffect(canvas, depth),
  },
]

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export function generateRandomAvatar(size = 256, depth = 0): AvatarResult {
  // prevent infinite recursion
  if (depth > 2 || size < 32) {
    const canvas = createCanvas(Math.max(32, size))
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = randomHex()
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return {
      dataUrl: canvas.toDataURL('image/png'),
      rarity: 1,
    }
  }

  const palette = pickAvatarPalette()

  // create base canvas
  let canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')!

  // fill background
  ctx.fillStyle = palette.bgColor
  ctx.fillRect(0, 0, size, size)

  // decide how many layers and effects - reduced for recursive generation
  let numLayers: number
  let numGlobalEffects: number

  if (depth === 0) {
    // full complexity at top level
    numLayers = 2 + Math.floor(Math.random() ** 1.2 * 8) // 2-10 layers
    numGlobalEffects = Math.floor(Math.random() ** 1.5 * 7) // 0-7 global effects
  } else if (depth === 1) {
    // moderate complexity at depth 1
    numLayers = 1 + Math.floor(Math.random() ** 1.5 * 4) // 1-5 layers
    numGlobalEffects = Math.floor(Math.random() ** 2 * 3) // 0-3 effects, heavily biased towards 0-1
  } else {
    // minimal complexity at depth 2+
    numLayers = 1 + Math.floor(Math.random() * 2) // 1-2 layers
    numGlobalEffects = Math.random() < 0.3 ? 1 : 0 // 30% chance of 1 effect
  }

  // randomly select and apply layers
  const layerEffects = EFFECTS.filter((e) => !e.globalOnly)

  // apply about half the layers first
  const firstPassLayers = Math.floor(numLayers / 2) || 1

  for (let i = 0; i < firstPassLayers; i++) {
    const layer = selectWeighted(LAYERS)
    const layerCanvas = layer.create(size, palette)

    // apply 0-4 effects to this layer before compositing
    const numLayerEffects = Math.floor(Math.random() ** 1.8 * 5) // 0-4, biased towards 0-1
    let processedLayer = layerCanvas

    for (let j = 0; j < numLayerEffects; j++) {
      const effect = selectWeighted(layerEffects)
      const strength = 0.1 + Math.random() * 0.4
      // skip smear in recursive generation by checking depth
      if (effect.name === 'smear' && depth > 0) {
        continue
      }
      processedLayer = effect.apply(processedLayer, strength, depth)
    }

    // composite layer onto canvas
    const blendMode = pickBlendMode(palette.isWhiteBg)
    ctx.globalCompositeOperation = blendMode.mode
    ctx.globalAlpha = blendMode.opacity
    ctx.drawImage(processedLayer, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  // MIDDLE PASS: splits and logo (but not at deep recursion)
  let midCanvas = canvas
  if (depth === 0) {
    if (Math.random() < 0.5) {
      midCanvas = applySplitEffect(midCanvas, depth + 1)
    }

    if (Math.random() < 0.25) {
      // Reduced from 50% to 25% chance
      midCanvas = applyLogoOverlay(midCanvas, size, palette, depth + 1)
    }

    // 70% chance to apply kaleidoscope or wave effect to the logo
    if (Math.random() < 0.3) {
      // apply kaleidoscope
      midCanvas = applyKaleidoscopeToCanvas(midCanvas, 0.2 + Math.random() * 0.3)
    }
  }

  // update canvas to include the middle pass changes
  canvas = midCanvas
  ctx.drawImage(canvas, 0, 0)

  // apply remaining layers
  for (let i = firstPassLayers; i < numLayers; i++) {
    const layer = selectWeighted(LAYERS)
    const layerCanvas = layer.create(size, palette)

    // apply 0-4 effects to this layer before compositing
    const numLayerEffects = Math.floor(Math.random() ** 1.8 * 5) // 0-4, biased towards 0-1
    let processedLayer = layerCanvas

    for (let j = 0; j < numLayerEffects; j++) {
      const effect = selectWeighted(layerEffects)
      const strength = 0.1 + Math.random() * 0.4
      // skip smear in recursive generation by checking depth
      if (effect.name === 'smear' && depth > 0) {
        continue
      }
      processedLayer = effect.apply(processedLayer, strength, depth)
    }

    // composite layer onto canvas
    const blendMode = pickBlendMode(palette.isWhiteBg)
    ctx.globalCompositeOperation = blendMode.mode
    ctx.globalAlpha = blendMode.opacity
    ctx.drawImage(processedLayer, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  // apply global effects
  let finalCanvas = canvas
  const globalEffects = EFFECTS.filter((e) => !e.layerOnly)

  for (let i = 0; i < numGlobalEffects; i++) {
    const effect = selectWeighted(globalEffects)
    const strength = 0.2 + Math.random() * 0.5
    // skip smear in recursive generation
    if (effect.name === 'smear' && depth > 0) {
      continue
    }
    finalCanvas = effect.apply(finalCanvas, strength, depth)
  }

  // calculate rarity based on complexity
  const rarity = calculateRarity(numLayers, numGlobalEffects)

  return {
    dataUrl: finalCanvas.toDataURL('image/png'),
    rarity,
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function selectWeighted<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item
  }

  return items[items.length - 1]!
}

function calculateRarity(numLayers: number, numEffects: number): number {
  // simple rarity calculation based on complexity
  const baseRarity = 10
  const layerBonus = numLayers * 15
  const effectBonus = numEffects * 10
  const total = baseRarity + layerBonus + effectBonus
  return Math.min(100, Math.max(1, total))
}

function pickBlendMode(isWhiteBg: boolean): {
  mode: GlobalCompositeOperation
  opacity: number
} {
  const roll = Math.random()

  if (isWhiteBg) {
    if (roll < 0.2) return { mode: 'color-burn', opacity: 0.5 + Math.random() * 0.5 }
    if (roll < 0.4) return { mode: 'difference', opacity: 0.4 + Math.random() * 0.4 }
    if (roll < 0.6) return { mode: 'multiply', opacity: 0.6 + Math.random() * 0.4 }
    return { mode: 'source-over', opacity: 0.5 + Math.random() * 0.5 }
  } else {
    if (roll < 0.15) return { mode: 'lighten', opacity: 0.3 + Math.random() * 0.4 }
    if (roll < 0.4) return { mode: 'color-dodge', opacity: 0.4 + Math.random() * 0.4 }
    if (roll < 0.65) return { mode: 'difference', opacity: 0.4 + Math.random() * 0.4 }
    return { mode: 'source-over', opacity: 0.4 + Math.random() * 0.4 }
  }
}

// ============================================================================
// LAYER CREATION FUNCTIONS
// ============================================================================

function createRibbonLayer(size: number, palette: AvatarPalette): HTMLCanvasElement {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')!

  const color = palette.colors[Math.floor(Math.random() * palette.colors.length)]!
  const waviness = 1 + Math.random() * 7
  const width = 0.25 + Math.random() * 0.65
  const isGradient = Math.random() < 0.85
  const isLightning = Math.random() < 0.6

  ctx.strokeStyle = color
  ctx.lineWidth = size * width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (isGradient) {
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, color)
    gradient.addColorStop(
      0.5,
      palette.colors[Math.floor(Math.random() * palette.colors.length)]!
    )
    gradient.addColorStop(1, color)
    ctx.strokeStyle = gradient
  }

  ctx.beginPath()

  if (isLightning) {
    // zigzag pattern
    const points = 18 + Math.floor(Math.random() * 10)
    for (let i = 0; i <= points; i++) {
      const t = i / points
      const x = t * size
      const baseY = size * (0.3 + Math.sin(t * Math.PI * waviness) * 0.2)
      const zigzag = (i % 2 === 0 ? 1 : -1) * size * 0.4 * Math.random()
      const y = baseY + zigzag

      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  } else {
    // smooth wave
    const points = 100
    for (let i = 0; i <= points; i++) {
      const t = i / points
      const x = t * size
      const y = size / 2 + Math.sin(t * Math.PI * waviness) * size * 0.15

      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }

  ctx.stroke()

  // sometimes add a second ribbon
  if (Math.random() < 0.3) {
    ctx.globalAlpha = 0.5
    ctx.beginPath()

    const offset = size * (0.1 + Math.random() * 0.2)
    for (let i = 0; i <= 100; i++) {
      const t = i / 100
      const x = t * size
      const y = size / 2 + offset + Math.sin(t * Math.PI * (waviness + 1)) * size * 0.1

      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.stroke()
  }

  return canvas
}

function createDitherLayer(size: number, palette: AvatarPalette): HTMLCanvasElement {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')!

  // pick two random symbols
  const allSymbols = [
    '!',
    '@',
    '#',
    '$',
    '%',
    '^',
    '&',
    '*',
    '(',
    ')',
    '_',
    '+',
    '=',
    '~',
    '?',
    '<',
    '>',
    '/',
    '|',
  ]
  const symbol1 = allSymbols[Math.floor(Math.random() * allSymbols.length)]!
  const symbol2 = allSymbols[Math.floor(Math.random() * allSymbols.length)]!

  const gridSize = 12 + Math.floor(Math.random() * 12)
  const fontSize = gridSize * (0.6 + Math.random() * 0.4)

  ctx.font = `bold ${fontSize}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // create clustering pattern with wave distortion
  const waveFreq = (Math.random() * 0.2 + 0.1) / gridSize
  const waveAmp = Math.random() * 0.5 + 0.5

  // two passes for offset layers
  for (let pass = 0; pass < 2; pass++) {
    const isSecondPass = pass === 1
    const offsetX = isSecondPass ? gridSize * 0.3 : 0
    const offsetY = isSecondPass ? gridSize * 0.3 : 0

    ctx.fillStyle = isSecondPass
      ? palette.colors[Math.floor(Math.random() * palette.colors.length)]!
      : Math.random() < 0.5
        ? '#000000'
        : '#ffffff'
    ctx.globalAlpha = isSecondPass ? 0.5 : 0.7

    for (let y = 0; y < size + gridSize; y += gridSize) {
      for (let x = 0; x < size + gridSize; x += gridSize) {
        const centerX = x + offsetX
        const centerY = y + offsetY

        // create clustering effect with wave
        const wave = Math.sin(x * waveFreq) * Math.cos(y * waveFreq) * waveAmp
        const threshold = 0.5 + wave * 0.3

        if (Math.random() < threshold) {
          const symbol = Math.random() < 0.6 ? symbol1 : symbol2

          // add slight rotation for variety
          ctx.save()
          ctx.translate(centerX, centerY)
          ctx.rotate((Math.random() - 0.5) * 0.3)
          ctx.fillText(symbol, 0, 0)
          ctx.restore()
        }
      }
    }
  }

  ctx.globalAlpha = 1
  return canvas
}

function createMoireLayer(size: number, palette: AvatarPalette): HTMLCanvasElement {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')!

  // Create wavy lines that occasionally touch to create moire patterns
  const numLines = 3 + Math.floor(Math.random() * 4) // 3-6 wavy lines

  for (let i = 0; i < numLines; i++) {
    const color = palette.colors[Math.floor(Math.random() * palette.colors.length)]!
    ctx.strokeStyle = color

    // Thin lines for proper moire effect
    const thickness = Math.max(1, Math.min(4, size / 64))
    ctx.lineWidth = thickness

    // Vary opacity for visual interest
    ctx.globalAlpha = 0.3 + Math.random() * 0.5 // 30-80% opacity

    // Wave parameters - each line has different wave characteristics
    const frequency = ((0.5 + Math.random() * 2) / size) * 100 // Frequency of waves
    const amplitude = size * (0.05 + Math.random() * 0.2) // 5-25% of canvas
    const phaseOffset = Math.random() * Math.PI * 2 // Random starting phase
    const yOffset = size * (0.2 + i * 0.15 + Math.random() * 0.1) // Vertical spacing

    // Secondary wave for complexity
    const frequency2 = frequency * (1.5 + Math.random())
    const amplitude2 = amplitude * (0.3 + Math.random() * 0.4)
    const phaseOffset2 = Math.random() * Math.PI * 2

    ctx.beginPath()

    // Draw wavy line across canvas
    for (let x = 0; x <= size; x += 2) {
      // Combine two sine waves for more organic appearance
      const wave1 = Math.sin(x * frequency + phaseOffset) * amplitude
      const wave2 = Math.sin(x * frequency2 + phaseOffset2) * amplitude2
      const y = yOffset + wave1 + wave2

      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()

    // Sometimes add a mirrored/related line for more interaction
    if (Math.random() < 0.4) {
      ctx.globalAlpha *= 0.6 // Make companion line lighter
      ctx.beginPath()

      const mirrorOffset = size * (0.02 + Math.random() * 0.08) // Small offset

      for (let x = 0; x <= size; x += 2) {
        // Similar wave but slightly offset in phase/position
        const wave1 = Math.sin(x * frequency + phaseOffset + 0.5) * amplitude
        const wave2 = Math.sin(x * frequency2 + phaseOffset2 - 0.3) * amplitude2
        const y = yOffset + mirrorOffset + wave1 + wave2

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
    }
  }

  ctx.globalAlpha = 1
  return canvas
}

function createStripeLayer(size: number, palette: AvatarPalette): HTMLCanvasElement {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')!

  const stripeThickness = 0.05 + Math.random() * 0.25
  const isVertical = Math.random() < 0.5

  ctx.fillStyle = palette.colors[Math.floor(Math.random() * palette.colors.length)]!

  if (isVertical) {
    ctx.fillRect(size * (0.5 - stripeThickness / 2), 0, size * stripeThickness, size)
  } else {
    ctx.fillRect(0, size * (0.5 - stripeThickness / 2), size, size * stripeThickness)
  }

  return canvas
}

function applyLogoOverlay(
  sourceCanvas: HTMLCanvasElement,
  size: number,
  palette: AvatarPalette,
  depth = 0
): HTMLCanvasElement {
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')!

  // draw the source first
  ctx.drawImage(sourceCanvas, 0, 0)

  // create a NEW avatar as the background that will show through the logo cutout
  if (depth < 2) {
    // generate a completely new avatar for the background (without logo/splits)
    const bgAvatar = generateBackgroundAvatar(size, depth + 1)

    // 8% chance to blur either foreground or background (reduced from 15%)
    const shouldBlur = Math.random() < 0.08
    const blurBackground = shouldBlur && Math.random() < 0.5

    // create mask for the logo shape
    const maskCanvas = createCanvas(size)
    const maskCtx = maskCanvas.getContext('2d')!

    const centerX = size / 2
    const centerY = size / 2

    // choose random shapes
    const shapes = ['circle', 'triangle', 'square', 'polygon']
    const outerShape = shapes[Math.floor(Math.random() * shapes.length)]!
    const centerShape = shapes[Math.floor(Math.random() * shapes.length)]!

    // sizes for the pattern
    const outerShapeSize = size * (0.2 + Math.random() * 0.15) // 20-35% of canvas
    // Distance should be less than shape radius so they overlap at center
    const distanceFromCenter = outerShapeSize * 0.4 // Shapes will overlap significantly
    const centerSubtractSize = size * (0.05 + Math.random() * 0.1) // 5-15% for center subtraction (smaller)

    // draw 1-4 shapes rotated around center (random count)
    maskCtx.fillStyle = '#ffffff'
    const numShapes = 1 + Math.floor(Math.random() * 4) // 1-4 shapes randomly
    const angleStep = (Math.PI * 2) / numShapes
    const startAngle = Math.random() * Math.PI * 2 // random starting rotation

    for (let i = 0; i < numShapes; i++) {
      const angle = startAngle + i * angleStep
      const x = centerX + Math.cos(angle) * distanceFromCenter
      const y = centerY + Math.sin(angle) * distanceFromCenter

      drawShape(maskCtx, outerShape, x, y, outerShapeSize)
    }

    // subtract a shape from the center (70% chance)
    if (Math.random() < 0.7) {
      maskCtx.globalCompositeOperation = 'destination-out'
      drawShape(maskCtx, centerShape, centerX, centerY, centerSubtractSize)
      maskCtx.globalCompositeOperation = 'source-over'
    }

    // optional mirror for symmetry (50% chance)
    if (Math.random() < 0.5) {
      const mirrorCanvas = createCanvas(size)
      const mirrorCtx = mirrorCanvas.getContext('2d')!

      // copy current mask
      mirrorCtx.drawImage(maskCanvas, 0, 0)

      // decide on mirror axis
      if (Math.random() < 0.5) {
        // horizontal mirror
        mirrorCtx.save()
        mirrorCtx.scale(1, -1)
        mirrorCtx.translate(0, -size)
        mirrorCtx.globalAlpha = 0.5
        mirrorCtx.drawImage(maskCanvas, 0, 0)
        mirrorCtx.restore()
      } else {
        // vertical mirror
        mirrorCtx.save()
        mirrorCtx.scale(-1, 1)
        mirrorCtx.translate(-size, 0)
        mirrorCtx.globalAlpha = 0.5
        mirrorCtx.drawImage(maskCanvas, 0, 0)
        mirrorCtx.restore()
      }

      // update mask with mirrored version
      maskCtx.clearRect(0, 0, size, size)
      maskCtx.drawImage(mirrorCanvas, 0, 0)
    }

    // Always apply fisheye first with low strength
    let processedMask = applyFisheyeToCanvas(maskCanvas, 0.05 + Math.random() * 0.1) // Very low strength fisheye (5-15%)

    // Then apply swirl with low strength
    processedMask = applySwirlToCanvas(processedMask, 0.05 + Math.random() * 0.1) // Very low strength swirl (5-15%)

    // reset composite operation
    maskCtx.globalCompositeOperation = 'source-over'

    // randomly choose a mix blend mode for the logo
    const blendModes: GlobalCompositeOperation[] = [
      'hard-light',
      'color-burn',
      'multiply',
      'difference',
    ]
    const logoBlendMode = blendModes[Math.floor(Math.random() * blendModes.length)]!

    // cut out the logo shape from current canvas
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(processedMask, 0, 0)

    // draw the new background avatar where the logo was cut out
    ctx.globalCompositeOperation = 'destination-over'

    if (shouldBlur && !blurBackground) {
      ctx.filter = `blur(${25 + Math.random() * 30}px)` // reduced from 3-8 to 2-5
    }
    ctx.drawImage(bgAvatar, 0, 0, size, size)
    ctx.restore()

    // apply the mix blend mode on top
    ctx.save()
    ctx.globalCompositeOperation = logoBlendMode
    ctx.globalAlpha = 0.3 + Math.random() * 0.4 // vary opacity for different effects
    ctx.drawImage(processedMask, 0, 0)
    ctx.restore()

    // optionally blur the foreground after
    if (blurBackground) {
      const tempCanvas = createCanvas(size)
      const tempCtx = tempCanvas.getContext('2d')!
      tempCtx.filter = `blur(${20 + Math.random() * 10}px)` // reduced from 3-8 to 2-5
      tempCtx.drawImage(canvas, 0, 0)
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(tempCanvas, 0, 0)
    }
  } else {
    // fallback for deep recursion - just draw iterative shapes
    const iterations = 2 + Math.floor(Math.random() * 6)
    const centerX = size / 2 + (Math.random() - 0.5) * size * 0.1
    const centerY = size / 2 + (Math.random() - 0.5) * size * 0.1

    for (let i = 0; i < iterations; i++) {
      const shapes = ['circle', 'triangle', 'polygon', 'ribbon']
      const shape = shapes[Math.floor(Math.random() * shapes.length)]!
      const iterSize = size * (0.18 + Math.random() * 0.3) * Math.max(0.4, 1 - i * 0.08)

      const offsetX = (Math.random() - 0.5) * size * 0.08 * i
      const offsetY = (Math.random() - 0.5) * size * 0.08 * i

      ctx.fillStyle = palette.colors[Math.floor(Math.random() * palette.colors.length)]!
      ctx.globalAlpha = 0.5 + Math.random() * 0.3

      // very rare subtraction in fallback
      if (i > 1 && Math.random() < 0.1) {
        ctx.globalCompositeOperation = 'destination-out'
      }

      drawShape(ctx, shape, centerX + offsetX, centerY + offsetY, iterSize)
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  ctx.globalAlpha = 1
  return canvas
}

// helper function to generate a background avatar without logo/splits
function generateBackgroundAvatar(size: number, depth: number): HTMLCanvasElement {
  const palette = pickAvatarPalette()

  // create base canvas
  const canvas = createCanvas(size)
  const ctx = canvas.getContext('2d')!

  // fill background
  ctx.fillStyle = palette.bgColor
  ctx.fillRect(0, 0, size, size)

  // limit complexity based on depth
  let numLayers: number
  let numGlobalEffects: number

  if (depth <= 1) {
    // moderate complexity for background avatars
    numLayers = 2 + Math.floor(Math.random() ** 1.5 * 3) // 2-5 layers
    numGlobalEffects = Math.floor(Math.random() ** 2 * 2) // 0-2 effects, heavily biased towards 0
  } else {
    // minimal complexity at higher depths
    numLayers = 1 + Math.floor(Math.random() * 2) // 1-2 layers
    numGlobalEffects = 0 // no global effects at high depth
  }

  // randomly select and apply layers
  const layerEffects = EFFECTS.filter((e) => !e.globalOnly)

  for (let i = 0; i < numLayers; i++) {
    const layer = selectWeighted(LAYERS)
    const layerCanvas = layer.create(size, palette)

    // apply 0-4 effects to this layer before compositing
    const numLayerEffects = Math.floor(Math.random() ** 1.8 * 5) // 0-4, biased towards 0-1
    let processedLayer = layerCanvas

    for (let j = 0; j < numLayerEffects; j++) {
      const effect = selectWeighted(layerEffects)
      const strength = 0.1 + Math.random() * 0.4
      // skip smear in recursive generation by checking depth
      if (effect.name === 'smear' && depth > 0) {
        continue
      }
      processedLayer = effect.apply(processedLayer, strength, depth)
    }

    // composite layer onto canvas
    const blendMode = pickBlendMode(palette.isWhiteBg)
    ctx.globalCompositeOperation = blendMode.mode
    ctx.globalAlpha = blendMode.opacity
    ctx.drawImage(processedLayer, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  // apply global effects (but no splits or logos!)
  let finalCanvas = canvas
  const globalEffects = EFFECTS.filter((e) => !e.layerOnly && e.name !== 'split')

  for (let i = 0; i < numGlobalEffects; i++) {
    const effect = selectWeighted(globalEffects)
    const strength = 0.2 + Math.random() * 0.5
    // skip smear in recursive generation
    if (effect.name === 'smear' && depth > 0) {
      continue
    }
    finalCanvas = effect.apply(finalCanvas, strength, depth)
  }

  // NO splits or logos on background avatars
  return finalCanvas
}

// ============================================================================
// EFFECT FUNCTIONS
// ============================================================================

function applySwirlToCanvas(
  canvas: HTMLCanvasElement,
  strength = 0.2
): HTMLCanvasElement {
  // 30% chance for reverse swirl at the end
  const shouldReverseSwirl = Math.random() < 0.3

  // Add unevenness to the swirl
  const unevenness = Math.random() < 0.5 ? 0.5 + Math.random() * 1.5 : 1 // 50% chance for uneven swirl
  const wobbleFrequency = 2 + Math.random() * 4 // How many wobbles in the swirl
  const wobbleAmplitude = Math.random() * 0.3 // How strong the wobbles are

  const swirlCanvas = cloneCanvasWithEffect(canvas, (imageData, newImageData, size) => {
    const data = imageData.data
    const newData = newImageData.data

    const centerX = size / 2 + (Math.random() - 0.5) * size * 0.1 // Slight offset to center
    const centerY = size / 2 + (Math.random() - 0.5) * size * 0.1
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - centerX
        const dy = y - centerY
        const radius = Math.sqrt(dx * dx + dy * dy)

        const angle = Math.atan2(dy, dx)

        // Add unevenness and wobble to the swirl
        const radiusRatio = radius / maxRadius
        const wobble = Math.sin(angle * wobbleFrequency) * wobbleAmplitude
        const unevenFactor = (1 - radiusRatio) ** unevenness

        const swirl = unevenFactor * strength * Math.PI * 2 * (1 + wobble)
        const newAngle = angle + swirl

        const srcX = Math.floor(centerX + radius * Math.cos(newAngle))
        const srcY = Math.floor(centerY + radius * Math.sin(newAngle))

        if (srcX >= 0 && srcX < size && srcY >= 0 && srcY < size) {
          const srcIndex = (srcY * size + srcX) * 4
          const destIndex = (y * size + x) * 4

          newData[destIndex] = data[srcIndex]!
          newData[destIndex + 1] = data[srcIndex + 1]!
          newData[destIndex + 2] = data[srcIndex + 2]!
          newData[destIndex + 3] = data[srcIndex + 3]!
        }
      }
    }
  })

  // Apply reverse swirl if selected
  if (shouldReverseSwirl) {
    const reverseStrength = strength * (0.3 + Math.random() * 0.4) // 30-70% of original strength

    return cloneCanvasWithEffect(swirlCanvas, (imageData, newImageData, size) => {
      const data = imageData.data
      const newData = newImageData.data

      const centerX = size / 2
      const centerY = size / 2
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY)

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - centerX
          const dy = y - centerY
          const radius = Math.sqrt(dx * dx + dy * dy)

          const angle = Math.atan2(dy, dx)
          // Reverse swirl - opposite direction
          const swirl = -(1 - radius / maxRadius) * reverseStrength * Math.PI * 2
          const newAngle = angle + swirl

          const srcX = Math.floor(centerX + radius * Math.cos(newAngle))
          const srcY = Math.floor(centerY + radius * Math.sin(newAngle))

          if (srcX >= 0 && srcX < size && srcY >= 0 && srcY < size) {
            const srcIndex = (srcY * size + srcX) * 4
            const destIndex = (y * size + x) * 4

            newData[destIndex] = data[srcIndex]!
            newData[destIndex + 1] = data[srcIndex + 1]!
            newData[destIndex + 2] = data[srcIndex + 2]!
            newData[destIndex + 3] = data[srcIndex + 3]!
          }
        }
      }
    })
  }

  return swirlCanvas
}

function applyKaleidoscopeToCanvas(
  canvas: HTMLCanvasElement,
  strength = 0.3
): HTMLCanvasElement {
  const size = canvas.width
  let newCanvas = document.createElement('canvas')
  newCanvas.width = size
  newCanvas.height = size
  const ctx = newCanvas.getContext('2d')!

  const baseSegments = 1 + Math.floor(strength * 6)

  // Add irregularity to the kaleidoscope
  const isIrregular = Math.random() < 0.8
  const segmentVariation = isIrregular ? 0.2 + Math.random() * 0.4 : 0
  const scaleVariation = Math.random() < 0.8
  const rotationOffset = Math.random() * Math.PI * 0.2

  ctx.save()
  ctx.translate(size / 2, size / 2)
  ctx.rotate(rotationOffset) // Apply random rotation to whole pattern

  let currentAngle = 0
  const segments: number[] = []

  // Generate uneven segment angles
  if (isIrregular) {
    for (let i = 0; i < baseSegments; i++) {
      const baseAngle = (Math.PI * 2) / baseSegments
      const variation = baseAngle * segmentVariation * (Math.random() - 0.5)
      segments.push(baseAngle + variation)
    }
    // Normalize to ensure full circle
    const totalAngle = segments.reduce((a, b) => a + b, 0)
    const scaleFactor = (Math.PI * 2) / totalAngle
    for (let i = 0; i < segments.length; i++) {
      segments[i] = segments[i]! * scaleFactor
    }
  } else {
    // Regular segments
    const anglePerSegment = (Math.PI * 2) / baseSegments
    for (let i = 0; i < baseSegments; i++) {
      segments.push(anglePerSegment)
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const segmentAngle = segments[i]!

    ctx.save()
    ctx.rotate(currentAngle)

    // Add scale variation for more organic look
    if (scaleVariation) {
      const scale = 0.9 + Math.random() * 0.5
      ctx.scale(scale, scale)
    }

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, size, 0, segmentAngle)
    ctx.closePath()
    ctx.clip()

    // Mix up the mirroring pattern
    const mirrorType = Math.floor(Math.random() * 3)
    if (mirrorType === 0) {
      ctx.drawImage(canvas, -size / 2, -size / 2)
    } else if (mirrorType === 1) {
      ctx.scale(-1, 1)
      ctx.drawImage(canvas, -size / 2, -size / 2)
    } else {
      ctx.scale(1, -1)
      ctx.drawImage(canvas, -size / 2, -size / 2)
    }

    ctx.restore()
    currentAngle += segmentAngle
  }

  ctx.restore()

  // Sometimes apply a slight swirl to make it more organic
  newCanvas = applySwirlToCanvas(newCanvas, strength * 3)

  return newCanvas
}

function applyFisheyeToCanvas(
  canvas: HTMLCanvasElement,
  strength = 0.3
): HTMLCanvasElement {
  const size = canvas.width
  const newCanvas = document.createElement('canvas')
  newCanvas.width = size
  newCanvas.height = size
  const ctx = newCanvas.getContext('2d')!

  const imageData = canvas.getContext('2d')!.getImageData(0, 0, size, size)
  const data = imageData.data
  const newImageData = ctx.createImageData(size, size)
  const newData = newImageData.data

  const centerX = size / 2
  const centerY = size / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - centerX) / centerX
      const dy = (y - centerY) / centerY
      const r = Math.sqrt(dx * dx + dy * dy)

      if (r <= 1) {
        const theta = Math.atan2(dy, dx)
        const newR = r ** (1 + strength)

        const srcX = Math.floor(centerX + newR * Math.cos(theta) * centerX)
        const srcY = Math.floor(centerY + newR * Math.sin(theta) * centerY)

        if (srcX >= 0 && srcX < size && srcY >= 0 && srcY < size) {
          const srcIndex = (srcY * size + srcX) * 4
          const destIndex = (y * size + x) * 4

          newData[destIndex] = data[srcIndex]!
          newData[destIndex + 1] = data[srcIndex + 1]!
          newData[destIndex + 2] = data[srcIndex + 2]!
          newData[destIndex + 3] = data[srcIndex + 3]!
        }
      }
    }
  }

  ctx.putImageData(newImageData, 0, 0)
  return newCanvas
}

function applyNoise(canvas: HTMLCanvasElement, opacity: number): HTMLCanvasElement {
  const size = canvas.width
  const newCanvas = document.createElement('canvas')
  newCanvas.width = size
  newCanvas.height = size
  const ctx = newCanvas.getContext('2d')!

  ctx.drawImage(canvas, 0, 0)

  const noiseCanvas = document.createElement('canvas')
  noiseCanvas.width = size
  noiseCanvas.height = size
  const noiseCtx = noiseCanvas.getContext('2d')!

  const imageData = noiseCtx.createImageData(size, size)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 255
    data[i] = noise
    data[i + 1] = noise
    data[i + 2] = noise
    data[i + 3] = 255
  }

  noiseCtx.putImageData(imageData, 0, 0)

  ctx.globalAlpha = opacity
  ctx.globalCompositeOperation = 'overlay'
  ctx.drawImage(noiseCanvas, 0, 0)

  return newCanvas
}

function applyDistortion(
  canvas: HTMLCanvasElement,
  mode: 'subtle' | 'strong',
  depth = 0
): HTMLCanvasElement {
  const size = canvas.width
  const newCanvas = document.createElement('canvas')
  newCanvas.width = size
  newCanvas.height = size
  const ctx = newCanvas.getContext('2d')!

  const strength =
    mode === 'subtle' ? 0.03 + Math.random() * 0.09 : 0.05 + Math.random() * 0.05
  const frequency = 0.02

  const imageData = canvas.getContext('2d')!.getImageData(0, 0, size, size)
  const data = imageData.data
  const newImageData = ctx.createImageData(size, size)
  const newData = newImageData.data

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offsetX = Math.sin(y * frequency) * size * strength
      const offsetY = Math.cos(x * frequency) * size * strength

      const srcX = Math.floor(x + offsetX)
      const srcY = Math.floor(y + offsetY)

      if (srcX >= 0 && srcX < size && srcY >= 0 && srcY < size) {
        const srcIndex = (srcY * size + srcX) * 4
        const destIndex = (y * size + x) * 4

        newData[destIndex] = data[srcIndex]!
        newData[destIndex + 1] = data[srcIndex + 1]!
        newData[destIndex + 2] = data[srcIndex + 2]!
        newData[destIndex + 3] = data[srcIndex + 3]!
      }
    }
  }

  ctx.putImageData(newImageData, 0, 0)

  // Create a composite with a new avatar or gradient underneath
  const compositeCanvas = createCanvas(size)
  const compositeCtx = compositeCanvas.getContext('2d')!

  // 50% chance to use gradient, 50% chance to use new avatar
  if (Math.random() < 0.5) {
    // Create a random gradient background
    const gradientType = Math.random() < 0.5 ? 'linear' : 'radial'

    if (gradientType === 'linear') {
      const angle = Math.random() * Math.PI * 2
      const x1 = size / 2 + (Math.cos(angle) * size) / 2
      const y1 = size / 2 + (Math.sin(angle) * size) / 2
      const x2 = size / 2 - (Math.cos(angle) * size) / 2
      const y2 = size / 2 - (Math.sin(angle) * size) / 2

      const gradient = compositeCtx.createLinearGradient(x1, y1, x2, y2)
      gradient.addColorStop(0, randomHex())
      gradient.addColorStop(0.5, randomHex())
      gradient.addColorStop(1, randomHex())

      compositeCtx.fillStyle = gradient
    } else {
      // Radial gradient
      const centerX = size / 2 + (Math.random() - 0.5) * size * 0.3
      const centerY = size / 2 + (Math.random() - 0.5) * size * 0.3
      const radius = size * (0.3 + Math.random() * 0.4)

      const gradient = compositeCtx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      )
      gradient.addColorStop(0, randomHex())
      gradient.addColorStop(0.5, randomHex())
      gradient.addColorStop(1, randomHex())

      compositeCtx.fillStyle = gradient
    }

    compositeCtx.fillRect(0, 0, size, size)
  } else {
    // Generate a new avatar for the background (limit depth to prevent infinite recursion)
    if (depth < 2) {
      const bgAvatar = generateBackgroundAvatar(size, depth + 1)
      compositeCtx.drawImage(bgAvatar, 0, 0)
    } else {
      // Fallback to simple color if depth limit reached
      compositeCtx.fillStyle = randomHex()
      compositeCtx.fillRect(0, 0, size, size)
    }
  }

  const blurredDistortion = newCanvas

  // Apply random mix blend mode for more interesting composition
  const blendModes: GlobalCompositeOperation[] = [
    'multiply',
    'screen',
    'overlay',
    'soft-light',
    'hard-light',
    'color-dodge',
    'color-burn',
    'difference',
    'exclusion',
  ]
  compositeCtx.globalCompositeOperation =
    blendModes[Math.floor(Math.random() * blendModes.length)]!

  // Draw the blurred distortion on top with some transparency
  compositeCtx.globalAlpha = 0.5 + Math.random() * 0.4 // 50-90% opacity
  compositeCtx.drawImage(blurredDistortion, 0, 0)

  return compositeCanvas
}

function applyGrayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const size = canvas.width
  const newCanvas = document.createElement('canvas')
  newCanvas.width = size
  newCanvas.height = size
  const ctx = newCanvas.getContext('2d')!

  // Apply grayscale
  ctx.filter = 'grayscale(100%)'
  ctx.drawImage(canvas, 0, 0)

  // 40% chance to darken significantly
  if (Math.random() < 0.4) {
    const darkenAmount = 0.3 + Math.random() * 0.5 // Darken by 30-80%
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = `rgba(0, 0, 0, ${darkenAmount})`
    ctx.fillRect(0, 0, size, size)

    // Sometimes add some contrast back
    if (Math.random() < 0.5) {
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = 0.3
      ctx.drawImage(newCanvas, 0, 0)
    }
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  return newCanvas
}

function applyBlur(canvas: HTMLCanvasElement, radius: number): HTMLCanvasElement {
  const size = canvas.width
  const newCanvas = document.createElement('canvas')
  newCanvas.width = size
  newCanvas.height = size
  const ctx = newCanvas.getContext('2d')!

  ctx.filter = `blur(${radius}px)`
  ctx.drawImage(canvas, 0, 0)

  // 30% chance to add either noise or dither after blur (reduced from 50%)
  if (Math.random() < 0.3) {
    if (Math.random() < 0.7) {
      // add noise (70% of the time when we add something)
      const noiseOpacity = 0.05 + Math.random() * 0.15 // subtle noise 5-20%
      const noisedCanvas = applyNoise(newCanvas, noiseOpacity)
      return noisedCanvas
    } else {
      // add dither pattern (30% of the time when we add something)
      const ditherCanvas = document.createElement('canvas')
      ditherCanvas.width = size
      ditherCanvas.height = size
      const ditherCtx = ditherCanvas.getContext('2d')!

      // draw the blurred canvas first
      ditherCtx.drawImage(newCanvas, 0, 0)

      // create a simple dither pattern overlay
      const gridSize = 2 + Math.floor(Math.random() * 4) // 2-5 pixel grid
      ditherCtx.globalAlpha = 0.1 + Math.random() * 0.2 // 10-30% opacity
      ditherCtx.fillStyle = Math.random() < 0.5 ? '#000000' : '#ffffff'

      for (let y = 0; y < size; y += gridSize) {
        for (let x = 0; x < size; x += gridSize) {
          // checkerboard pattern
          if ((Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0) {
            ditherCtx.fillRect(x, y, gridSize / 2, gridSize / 2)
            ditherCtx.fillRect(
              x + gridSize / 2,
              y + gridSize / 2,
              gridSize / 2,
              gridSize / 2
            )
          }
        }
      }

      return ditherCanvas
    }
  }

  return newCanvas
}

function applySmearEffect(canvas: HTMLCanvasElement, depth = 0): HTMLCanvasElement {
  // skip smear effect in recursive generation to avoid performance issues
  if (depth > 0) {
    return canvas
  }

  const size = canvas.width
  const newCanvas = createCanvas(size)
  // Set willReadFrequently since we'll be doing multiple getImageData calls
  const ctx = newCanvas.getContext('2d', { willReadFrequently: true })!

  // Draw the original canvas first
  ctx.drawImage(canvas, 0, 0)

  // Random smear parameters - scaled up 5x from original
  const smearLength = size * (0.5 + Math.random() * 0.4) // 50-90% of canvas width
  const smearThickness = size * (0.15 + Math.random() * 0.35) // 15-50% of canvas height (5x bigger)

  // Random position
  const startX = size * (0.1 + Math.random() * 0.3) // Start more centered
  const startY = size * (0.2 + Math.random() * 0.6) // Vertical position
  const angle = -Math.PI * 0.1 + Math.random() * Math.PI * 0.2 // -18 to +18 degrees

  // Calculate end position - clamp to canvas bounds
  const endX = Math.min(size - 10, Math.max(10, startX + Math.cos(angle) * smearLength))
  const endY = Math.min(size - 10, Math.max(10, startY + Math.sin(angle) * smearLength))

  // Sample fewer points for better performance (reduced from 100 to 30 steps)
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'

  const steps = 30 // Reduced from 100 for better performance

  // Get a single sample at the start for the main smear color
  let smearColor = '#888888'
  try {
    const sampleData = ctx.getImageData(Math.floor(startX), Math.floor(startY), 1, 1).data
    const r = sampleData[0] || 128
    const g = sampleData[1] || 128
    const b = sampleData[2] || 128
    smearColor = `rgb(${r}, ${g}, ${b})`
  } catch (e) {
    // Fallback color if sampling fails
  }

  // Create gradient for the smear
  const gradient = ctx.createLinearGradient(startX, startY, endX, endY)
  gradient.addColorStop(0, smearColor)
  gradient.addColorStop(0.5, smearColor)
  gradient.addColorStop(1, smearColor)

  ctx.strokeStyle = gradient
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Draw main smear path with varying thickness
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const currentX = startX + (endX - startX) * t
    const currentY = startY + (endY - startY) * t

    // Vary thickness along the stroke
    const currentThickness = smearThickness * (0.8 + t * 0.6)

    ctx.save()
    ctx.globalAlpha = 0.4 + t * 0.4 // 40% to 80% opacity
    ctx.lineWidth = currentThickness

    // Draw a short segment
    if (i === 0) {
      ctx.beginPath()
      ctx.moveTo(currentX, currentY)
    } else {
      const prevT = (i - 1) / steps
      const prevX = startX + (endX - startX) * prevT
      const prevY = startY + (endY - startY) * prevT

      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(currentX, currentY)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Add a final strong streak at the end
  ctx.globalAlpha = 0.9
  const finalGradient = ctx.createLinearGradient(startX, startY, endX, endY)

  // Convert rgb to rgba for transparency
  const rgbaColor = smearColor.replace('rgb', 'rgba').replace(')', ', 0)')
  const rgbaColorFull = smearColor.replace('rgb', 'rgba').replace(')', ', 1)')

  finalGradient.addColorStop(0, rgbaColor) // Transparent at start
  finalGradient.addColorStop(0.7, rgbaColorFull)
  finalGradient.addColorStop(1, rgbaColorFull)

  ctx.strokeStyle = finalGradient
  ctx.lineWidth = smearThickness * 0.7
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  ctx.restore()

  // Skip blur for performance - the smear already looks smooth
  return newCanvas
}

function applySplitEffect(canvas: HTMLCanvasElement, depth = 0): HTMLCanvasElement {
  const size = canvas.width
  const newCanvas = createCanvas(size)
  const ctx = newCanvas.getContext('2d')!

  // limit splits at deeper recursion levels
  const numSplits = 3 + Math.floor(Math.random() * 5) // 3-7 slices for pizza/spiral effect
  const segments: HTMLCanvasElement[] = []

  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 2

  for (let i = 0; i < numSplits; i++) {
    const subSize = Math.max(32, size / Math.sqrt(numSplits))

    // create the sub-avatar inline
    const subPalette = pickAvatarPalette()
    const tempCanvas = createCanvas(subSize)
    const tempCtx = tempCanvas.getContext('2d')!

    tempCtx.fillStyle = subPalette.bgColor
    tempCtx.fillRect(0, 0, subSize, subSize)

    // add some simple content to make it interesting
    const numElements = 1 + Math.floor(Math.random() * 3)
    for (let j = 0; j < numElements; j++) {
      const layer = selectWeighted(LAYERS)
      const layerCanvas = layer.create(subSize, subPalette)
      const blendMode = pickBlendMode(subPalette.isWhiteBg)
      tempCtx.globalCompositeOperation = blendMode.mode
      tempCtx.globalAlpha = blendMode.opacity
      tempCtx.drawImage(layerCanvas, 0, 0)
      tempCtx.globalCompositeOperation = 'source-over'
      tempCtx.globalAlpha = 1
    }

    // apply a random effect sometimes
    if (Math.random() < 0.3) {
      const effect = selectWeighted(EFFECTS.filter((e) => e.name !== 'smear'))
      const effectCanvas = effect.apply(tempCanvas, 0.2 + Math.random() * 0.3, depth + 1)
      segments.push(effectCanvas)
    } else {
      segments.push(tempCanvas)
    }
  }

  // draw segments in a spiral/pizza slice pattern
  ctx.save()
  ctx.translate(centerX, centerY)

  const angleStep = (Math.PI * 2) / numSplits
  const spiralOffset = Math.random() * Math.PI * 2 // Random starting rotation

  segments.forEach((segment, i) => {
    ctx.save()

    // rotate for this slice
    const angle = spiralOffset + i * angleStep
    ctx.rotate(angle)

    // create clipping path for pizza slice
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, radius, -angleStep / 2, angleStep / 2)
    ctx.closePath()
    ctx.clip()

    // draw the segment, scaled and positioned
    const scale = 1 + Math.random() * 0.2 // Slight size variation
    ctx.scale(scale, scale)

    // offset slightly for spiral effect
    const spiralDistance = (i / numSplits) * radius * 0.1
    ctx.translate(spiralDistance, 0)

    // draw from center
    ctx.drawImage(segment, -segment.width / 2, -segment.height / 2)

    ctx.restore()
  })

  ctx.restore()

  // Apply random effects after the split (2-4 effects)
  let resultCanvas = newCanvas
  const numPostEffects = 2 + Math.floor(Math.random() * 3)
  const postEffects = ['swirl', 'kaleidoscope', 'fisheye', 'noise']

  for (let i = 0; i < numPostEffects; i++) {
    const effectName = postEffects[Math.floor(Math.random() * postEffects.length)]
    const strength = 0.05 + Math.random() * 0.2 // Light application

    switch (effectName) {
      case 'swirl':
        resultCanvas = applySwirlToCanvas(resultCanvas, strength)
        break
      case 'kaleidoscope':
        resultCanvas = applyKaleidoscopeToCanvas(resultCanvas, strength)
        break
      case 'fisheye':
        resultCanvas = applyFisheyeToCanvas(resultCanvas, strength)
        break
      case 'noise':
        resultCanvas = applyNoise(resultCanvas, strength)
        break
    }
  }

  return resultCanvas
}

// ============================================================================
// SHAPE DRAWING HELPER
// ============================================================================

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  x: number,
  y: number,
  size: number
): void {
  ctx.beginPath()

  switch (shape) {
    case 'circle':
      ctx.arc(x, y, size / 2, 0, Math.PI * 2)
      break

    case 'triangle':
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
        const px = x + (Math.cos(angle) * size) / 2
        const py = y + (Math.sin(angle) * size) / 2
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break

    case 'square':
      ctx.rect(x - size / 2, y - size / 2, size, size)
      break

    case 'polygon': {
      const sides = 5 + Math.floor(Math.random() * 4)
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
        const px = x + (Math.cos(angle) * size) / 2
        const py = y + (Math.sin(angle) * size) / 2
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }

    case 'ribbon': {
      const numWaves = 2 + Math.floor(Math.random() * 2)
      const amplitude = size * 0.3
      const width = size

      for (let i = 0; i <= 30; i++) {
        const t = i / 30
        const px = x - width / 2 + t * width
        const py = y + Math.sin(t * Math.PI * numWaves) * amplitude
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }

      for (let i = 30; i >= 0; i--) {
        const t = i / 30
        const px = x - width / 2 + t * width
        const py = y + Math.sin(t * Math.PI * numWaves) * amplitude + size * 0.2
        ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }
  }

  ctx.fill()
}
