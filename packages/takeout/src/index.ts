/**
 * Takeout CLI - Library exports
 *
 * Use these utilities programmatically in your own scripts
 */

// Types
export type * from './types'

// Prerequisites checking
export {
  checkAllPrerequisites,
  checkBun,
  checkDocker,
  checkGit,
  checkNode,
  hasRequiredPrerequisites,
} from './utils/prerequisites'

// Port management
export {
  checkAllPorts,
  checkPort,
  getConflictingPorts,
  hasPortConflicts,
  TAKEOUT_PORTS,
} from './utils/ports'

// Environment file operations
export {
  copyEnvFile,
  createEnvLocal,
  envFileExists,
  generateSecret,
  readEnvVariable,
  updateEnvVariable,
} from './utils/env'

// File operations
export {
  checkOnboarded,
  markOnboarded,
  updateAppConfig,
  updatePackageJson,
} from './utils/files'

// Prompts (for building custom CLIs)
export {
  confirmContinue,
  displayOutro,
  displayPortConflicts,
  displayPrerequisites,
  displayWelcome,
  promptPassword,
  promptSelect,
  promptText,
  showError,
  showInfo,
  showSpinner,
  showStep,
  showSuccess,
  showWarning,
} from './utils/prompts'
