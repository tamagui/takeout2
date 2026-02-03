import { Config } from '@remotion/cli/config'

// use swangle for Three.js/WebGL content - works better on macOS
Config.setChromiumOpenGlRenderer('swangle')

// limit concurrency to avoid WebGL context exhaustion
Config.setConcurrency(1)
