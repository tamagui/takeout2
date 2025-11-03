export interface PrerequisiteCheck {
  name: string
  required: boolean
  installed: boolean
  version?: string
  requiredVersion?: string
  message?: string
  installUrl?: string
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
