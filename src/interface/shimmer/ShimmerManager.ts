import { useEffect, useRef } from 'react'

type ShimmerOptions = {
  cols: number
  rows: number
  width: number
  height: number
}

class ShimmerManager {
  private static instance: ShimmerManager
  private canvas: HTMLCanvasElement | null = null
  private gl: WebGLRenderingContext | null = null
  private animationFrame: number | null = null
  private program: WebGLProgram | null = null
  private observers: Set<Function> = new Set()
  private isRunning = false

  // Cache for the rendered image
  private outputCanvas: HTMLCanvasElement | null = null
  private outputCtx: CanvasRenderingContext2D | null = null

  private constructor() {
    // Private constructor for singleton pattern
  }

  render: () => void = () => {}

  public static getInstance(): ShimmerManager {
    if (!ShimmerManager.instance) {
      ShimmerManager.instance = new ShimmerManager()
    }
    return ShimmerManager.instance
  }

  public initialize(options: ShimmerOptions) {
    if (this.isRunning) return

    // Create offscreen canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = options.width
    this.canvas.height = options.height

    // Create output canvas for caching
    this.outputCanvas = document.createElement('canvas')
    this.outputCanvas.width = options.width
    this.outputCanvas.height = options.height
    this.outputCtx = this.outputCanvas.getContext('2d')

    // Initialize WebGL
    this.gl = this.canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    })

    if (!this.gl) {
      console.error('WebGL not supported')
      return
    }

    this.setupWebGL(options)
    this.isRunning = true
  }

  private setupWebGL(options: ShimmerOptions) {
    const gl = this.gl!
    const { cols, rows, width, height } = options

    // Define vertex shader - this handles positioning and animation
    const vertexShaderSource = `
      precision highp float;
      
      // Position of dot in the grid
      attribute vec2 a_gridPosition;
      
      uniform vec2 u_resolution;   // Canvas size
      uniform float u_time;        // Current time in seconds
      uniform float u_dotSpacing;  // Spacing between dots
      uniform vec2 u_gridOffset;   // Starting position offset
      uniform vec2 u_gridSize;     // Grid size in dots (cols, rows)
      
      void main() {
        // Calculate the actual position in pixels
        vec2 pixelPosition = u_gridOffset + a_gridPosition * u_dotSpacing;
        
        // Simple horizontal wave that moves across the grid
        float waveSpeed = 0.04;     // Complete cycle in ~1 second
        float waveWidth = 30.0;    // Wide effect radius
        float maxDisplacement = 250.0; // Subtle but visible displacement
        
        // Create a moving wave pattern
        float normalized = mod(u_time * waveSpeed, 1.0);  // 0.0 to 1.0 cycle
        float wavePosition = normalized * u_gridSize.x;   // Position along x-axis
        
        // Distance from the wave center
        float distFromWave = abs(a_gridPosition.x - wavePosition);
        
        // Create a bell curve displacement that's strongest at the wave center
        float displacement = maxDisplacement * exp(-distFromWave * distFromWave / (2.0 * waveWidth * waveWidth));
        
        // Apply horizontal displacement only, no vertical movement
        // Positive displacement on left side of wave, negative on right side
        vec2 offset = vec2(0.0, 0.0);
        if (a_gridPosition.x < wavePosition) {
          offset.x = displacement; // Push right
        } else {
          offset.x = -displacement; // Push left
        }
        
        // Apply calculated offset
        vec2 position = pixelPosition + offset;
        
        // Convert to clip space (-1 to +1)
        vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
        
        // Flip y-coordinate for WebGL
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0, 1);
        
        // Set point size to exactly 1.0
        gl_PointSize = 1.0;
      }
    `

    // Define fragment shader - this handles the appearance of each dot
    const fragmentShaderSource = `
      precision mediump float;
      
      void main() {
        // Color - more visible in light mode while still balanced for dark mode
        gl_FragColor = vec4(0.2, 0.2, 0.2, 0.9);
      }
    `

    // Create shaders
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

    // Create program
    this.program = this.createProgram(vertexShader, fragmentShader)

    // Get attribute and uniform locations
    const gridPositionLocation = gl.getAttribLocation(this.program, 'a_gridPosition')
    const resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution')
    const timeLocation = gl.getUniformLocation(this.program, 'u_time')
    const dotSpacingLocation = gl.getUniformLocation(this.program, 'u_dotSpacing')
    const gridOffsetLocation = gl.getUniformLocation(this.program, 'u_gridOffset')
    const gridSizeLocation = gl.getUniformLocation(this.program, 'u_gridSize')

    // Create a buffer for the grid positions
    const positionBuffer = gl.createBuffer()

    // Generate grid positions
    const positions = new Float32Array(cols * rows * 2)
    let index = 0

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        positions[index++] = x
        positions[index++] = y
      }
    }

    // Upload position data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    // Start time for animation
    const startTime = performance.now() / 1000

    // Calculate grid positioning to center it
    const dotSpacing = 4
    const gridWidth = cols * dotSpacing
    const gridHeight = rows * dotSpacing
    const startX = (width - gridWidth) / 2
    const startY = (height - gridHeight) / 2

    // Animation loop
    this.render = () => {
      if (!this.observers.size) {
        // stop doing work once no more observers!
        return
      }

      // Calculate elapsed time
      const currentTime = performance.now() / 1000
      const elapsedTime = currentTime - startTime

      // Set viewport and clear
      gl.viewport(0, 0, width, height)
      gl.clearColor(0.0, 0.0, 0.0, 0.0)
      gl.clear(gl.COLOR_BUFFER_BIT)

      // Enable the program
      // eslint-disable-next-line react-hooks/rules-of-hooks -- not a hook
      gl.useProgram(this.program)

      // Set up attributes
      gl.enableVertexAttribArray(gridPositionLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.vertexAttribPointer(
        gridPositionLocation,
        2, // size (num values to pull from buffer per iteration)
        gl.FLOAT, // type of data in buffer
        false, // normalize
        0, // stride
        0 // offset in buffer
      )

      // Set uniforms
      gl.uniform2f(resolutionLocation, width, height)
      gl.uniform1f(timeLocation, elapsedTime)
      gl.uniform1f(dotSpacingLocation, dotSpacing)
      gl.uniform2f(gridOffsetLocation, startX, startY)
      gl.uniform2f(gridSizeLocation, cols, rows)

      // Draw the points
      gl.drawArrays(gl.POINTS, 0, cols * rows)

      // Copy to output canvas for reuse
      if (this.outputCtx && this.canvas) {
        this.outputCtx.clearRect(0, 0, width, height)
        this.outputCtx.drawImage(this.canvas, 0, 0)
      }

      // Notify observers
      this.notifyObservers()

      // Continue animation
      this.animationFrame = requestAnimationFrame(this.render)
    }

    // Start animation
    this.animationFrame = requestAnimationFrame(this.render)
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl!
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Failed to create shader')

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (!success) {
      console.error(gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      throw new Error('Failed to compile shader')
    }

    return shader
  }

  private createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram {
    const gl = this.gl!
    const program = gl.createProgram()
    if (!program) throw new Error('Failed to create program')

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    const success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!success) {
      console.error(gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      throw new Error('Failed to link program')
    }

    return program
  }

  public subscribe = (callback: Function): (() => void) => {
    this.observers.add(callback)

    if (this.observers.size === 1) {
      this.render()
    }

    return () => this.observers.delete(callback)
  }

  private notifyObservers() {
    this.observers.forEach((callback) => callback())
  }

  public getOutputCanvas(): HTMLCanvasElement | null {
    return this.outputCanvas
  }

  public cleanup() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
    }

    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program)

      // Release WebGL context
      const loseContextExt = this.gl.getExtension('WEBGL_lose_context')
      if (loseContextExt) {
        loseContextExt.loseContext()
      }
    }

    this.isRunning = false
    this.observers.clear()
  }
}

export const useShimmerEffect = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: ShimmerOptions = { cols: 200, rows: 10, width: 1000, height: 200 }
) => {
  const callbackRef = useRef<Function | null>(null)

  useEffect(() => {
    const manager = ShimmerManager.getInstance()

    // Initialize the manager if it's not already running
    if (!manager.getOutputCanvas()) {
      manager.initialize(options)
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Function to copy from shared canvas to this instance's canvas
    const updateCanvas = () => {
      const outputCanvas = manager.getOutputCanvas()
      if (outputCanvas && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(outputCanvas, 0, 0)
      }
    }

    callbackRef.current = updateCanvas

    // Subscribe to updates
    const unsubscribe = manager.subscribe(updateCanvas)

    // Initial draw
    updateCanvas()

    return () => {
      unsubscribe()
    }
  }, [canvasRef, options])
}

export const cleanupShimmerManager = () => {
  ShimmerManager.getInstance().cleanup()
}
