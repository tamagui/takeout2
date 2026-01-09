export interface PrerequisiteCheck {
  name: string
  required: boolean
  installed: boolean
  version?: string
  requiredVersion?: string
  message?: string
  installUrl?: string
  recommendation?: string
}

export interface PortCheck {
  port: number
  name: string
  inUse: boolean
  pid?: number
}

export interface ProjectIdentity {
  name: string
  bundleId: string
  domain: string
}

export interface OnboardingConfig {
  skipPrerequisites?: boolean
  skipServices?: boolean
  skipMigrations?: boolean
  autoStart?: boolean
}

export interface EnvironmentSetup {
  authSecret: string
  githubClientId?: string
  githubClientSecret?: string
  domain: string
  serverUrl: string
}

export interface EnvVariable {
  key: string
  label: string
  description: string
  instructions: string
  required: boolean
  type: 'text' | 'secret' | 'multiline'
  default?: string
  placeholder?: string
  generator?: () => string
}

export interface EnvCategory {
  id: string
  name: string
  description: string
  required: boolean
  setupTime?: string
  variables: EnvVariable[]
}
