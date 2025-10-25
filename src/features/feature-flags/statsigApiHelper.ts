/**
 * Helper utilities for creating and managing Statsig feature gates programmatically
 * Uses Statsig Console API to create gates and configure rules
 */

interface StatsigGateConfig {
  name: string // gate id (e.g., 'enable_push_notifications')
  displayName: string // human-readable name
  description?: string
  defaultEnabled?: boolean // default pass percentage (0 or 100)
  environmentRules?: {
    development?: boolean
    staging?: boolean
    production?: boolean
  }
  // App version-based rules for specific versions
  appVersionRules?: {
    hideForVersions?: string[] // versions where this feature should be hidden
    showForVersions?: string[] // versions where this feature should be shown (overrides hideForVersions)
    // Environment-specific app version rules
    environmentSpecific?: {
      staging?: {
        hideForVersions?: string[]
        showForVersions?: string[]
      }
      production?: {
        hideForVersions?: string[]
        showForVersions?: string[]
      }
      // Note: development environment ignores app version rules by design
    }
  }
}

interface StatsigRuleCondition {
  type: string
  operator: string
  targetValue: any
}

interface StatsigRule {
  name: string
  passPercent: number
  conditions?: StatsigRuleCondition[]
}

/**
 * Creates a Statsig feature gate with environment-based rules
 *
 * NOTE: This requires Statsig Console API access (server-side only)
 * You'll need to set up API keys in Statsig Console
 *
 * @example
 * const gateConfig = {
 *   name: 'new_feature_flag',
 *   displayName: 'New Feature Flag',
 *   description: 'Controls new feature visibility',
 *   environmentRules: {
 *     development: true,
 *     staging: false,
 *     production: false
 *   }
 * }
 */
export function generateStatsigGateConfig(config: StatsigGateConfig) {
  const rules: StatsigRule[] = []

  // Add app version-based rules first (higher priority)
  if (config.appVersionRules) {
    // Environment-specific app version rules for staging
    if (config.appVersionRules.environmentSpecific?.staging?.hideForVersions?.length) {
      rules.push({
        name: 'Hide for App Versions in Staging',
        passPercent: 0,
        conditions: [
          {
            type: 'environment',
            operator: 'is',
            targetValue: { tier: 'staging' },
          },
          {
            type: 'app_version',
            operator: 'any',
            targetValue:
              config.appVersionRules.environmentSpecific.staging.hideForVersions,
          },
        ],
      })
    }

    // Environment-specific app version rules for production
    if (config.appVersionRules.environmentSpecific?.production?.hideForVersions?.length) {
      rules.push({
        name: 'Hide for App Versions in Production',
        passPercent: 0,
        conditions: [
          {
            type: 'environment',
            operator: 'is',
            targetValue: { tier: 'production' },
          },
          {
            type: 'app_version',
            operator: 'any',
            targetValue:
              config.appVersionRules.environmentSpecific.production.hideForVersions,
          },
        ],
      })
    }

    // Global app version rules (fallback for environments not specified above)
    if (config.appVersionRules.hideForVersions?.length) {
      rules.push({
        name: 'Hide for App Versions',
        passPercent: 0,
        conditions: [
          {
            type: 'app_version',
            operator: 'any',
            targetValue: config.appVersionRules.hideForVersions,
          },
        ],
      })
    }

    // Rule to show feature for specific app versions (overrides hide rule)
    if (config.appVersionRules.showForVersions?.length) {
      rules.push({
        name: 'Show for App Versions',
        passPercent: 100,
        conditions: [
          {
            type: 'app_version',
            operator: 'any',
            targetValue: config.appVersionRules.showForVersions,
          },
        ],
      })
    }
  }

  // add environment-specific rules
  if (config.environmentRules) {
    if (config.environmentRules.development !== undefined) {
      rules.push({
        name: 'Development Environment',
        passPercent: config.environmentRules.development ? 100 : 0,
        conditions: [
          {
            type: 'environment',
            operator: 'is',
            targetValue: { tier: 'development' },
          },
        ],
      })
    }

    if (config.environmentRules.staging !== undefined) {
      rules.push({
        name: 'Staging Environment',
        passPercent: config.environmentRules.staging ? 100 : 0,
        conditions: [
          {
            type: 'environment',
            operator: 'is',
            targetValue: { tier: 'staging' },
          },
        ],
      })
    }

    if (config.environmentRules.production !== undefined) {
      rules.push({
        name: 'Production Environment',
        passPercent: config.environmentRules.production ? 100 : 0,
        conditions: [
          {
            type: 'environment',
            operator: 'is',
            targetValue: { tier: 'production' },
          },
        ],
      })
    }
  }

  // add default rule (catches all other cases)
  rules.push({
    name: 'Default',
    passPercent: config.defaultEnabled ? 100 : 0,
  })

  return {
    name: config.name,
    displayName: config.displayName,
    description: config.description || `Feature flag: ${config.displayName}`,
    rules,
  }
}

/**
 * Helper to generate multiple feature gates at once
 * Useful for initial setup or bulk configuration
 */
export function generateBulkGateConfigs(configs: StatsigGateConfig[]) {
  return configs.map(generateStatsigGateConfig)
}

/**
 * Example configurations for common v0 feature flags
 */
export const V0_FEATURE_GATES: StatsigGateConfig[] = [
  {
    name: 'enable_push_notifications',
    displayName: 'Enable Push Notifications',
    description: 'Controls push notification feature visibility',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'crypto_show_earnings',
    displayName: 'Crypto: Show Earnings',
    description: 'Shows crypto earnings display in feed posts',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'crypto_enable_buy_button',
    displayName: 'Crypto: Enable Buy Button',
    description: 'Enables crypto purchase functionality',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'feed_show_comment_button',
    displayName: 'Feed: Show Comment Button',
    description: 'Shows comment button on feed posts',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'feed_show_magic_wand',
    displayName: 'Feed: Show Magic Wand',
    description: 'Shows AI/magic wand interaction button',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'feed_show_reactions',
    displayName: 'Feed: Show Reactions',
    description: 'Enables emoji reactions on posts',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'feed_enable_sharing',
    displayName: 'Feed: Enable Sharing',
    description: 'Enables post sharing functionality',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'auth_enable_social_login',
    displayName: 'Auth: Enable Social Login',
    description: 'Shows social login options (Google, Apple) in login screen',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'auth_enable_phone_login',
    displayName: 'Auth: Enable Phone Login',
    description: 'Shows phone number login option in login screen',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'profile_enable_report_block',
    displayName: 'Profile: Enable Report/Block User',
    description: 'Shows report and block user options in profile menu',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'profile_enable_account_switching',
    displayName: 'Profile: Enable Account Switching',
    description: 'Shows account switching dropdown menu in profile header',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'profile_enable_crypto_trading',
    displayName: 'Profile: Enable Crypto Trading',
    description: 'Shows crypto trading card and trade button in profile',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'profile_enable_wallet',
    displayName: 'Profile: Enable Wallet',
    description: 'Shows wallet section in profile settings',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'profile_enable_trading_tabs',
    displayName: 'Profile: Enable Trading Tabs',
    description: 'Shows ArrowDownUp and ChartBar tabs in profile, hides Characters tab',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
  {
    name: 'profile_show_completion_cards',
    displayName: 'Profile: Show Completion Cards',
    description: 'Shows profile completion cards when profile is incomplete',
    environmentRules: {
      development: true,
      staging: true,
      production: true,
    },
    appVersionRules: {
      environmentSpecific: {
        staging: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in staging
        },
        production: {
          hideForVersions: ['0.0.2'], // Hide for v0 app store submission in production
        },
      },
    },
  },
]

/**
 * Generate a CLI script to create gates via Statsig API
 * This can be run as a Node script with proper API credentials
 */
export function generateStatsigAPIScript(configs: StatsigGateConfig[]): string {
  const gateConfigs = generateBulkGateConfigs(configs)

  // generate typescript version matching the existing create-statsig-gates.ts format
  return `// Statsig Gate Creation Script
// Run this with your Statsig Console API key
// Docs: https://docs.statsig.com/console-api/gates

interface StatsigCondition {
  type: 
    | 'app_version' 
    | 'browser_name' 
    | 'browser_version' 
    | 'country' 
    | 'custom_field' 
    | 'email' 
    | 'environment_tier' 
    | 'fails_gate' 
    | 'fails_segment' 
    | 'ip_address' 
    | 'locale' 
    | 'os_name' 
    | 'os_version' 
    | 'passes_gate' 
    | 'passes_segment' 
    | 'public' 
    | 'time' 
    | 'unit_id' 
    | 'user_id' 
    | 'url' 
    | 'javascript' 
    | 'device_model' 
    | 'target_app'
  targetValue?: any
  operator?: string
  field?: string
}

interface StatsigRule {
  name: string
  passPercentage: number
  conditions: StatsigCondition[]
}

interface StatsigGateConfig {
  name: string
  description: string
  isEnabled: boolean
  idType: 'userID' | 'unitID'
  rules: StatsigRule[]
}

const STATSIG_API_KEY = process.env.STATSIG_CONSOLE_API_KEY
const STATSIG_API_URL = 'https://statsigapi.net/console/v1'

async function createGate(gateConfig: StatsigGateConfig) {
  const response = await fetch(\`\${STATSIG_API_URL}/gates\`, {
    method: 'POST',
    headers: {
      'STATSIG-API-KEY': STATSIG_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gateConfig),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.info(\`Response status: \${response.status} \${response.statusText}\`)
    console.info(\`Error details: \${errorBody}\`)
    throw new Error(
      \`Failed to create gate \${gateConfig.name}: \${response.status} \${response.statusText}\`
    )
  }

  return response.json()
}

async function main() {
  const gates: StatsigGateConfig[] = ${JSON.stringify(
    gateConfigs.map((config) => ({
      name: config.name,
      description: config.description,
      isEnabled: true,
      idType: 'userID',
      rules: config.rules.map((rule) => ({
        name: rule.name,
        passPercentage: rule.passPercent,
        conditions:
          rule.conditions?.map((c: any) => {
            // Handle app version conditions
            if (c.type === 'app_version') {
              return {
                type: 'app_version',
                targetValue: c.targetValue,
                operator: c.operator,
              }
            }
            // Handle environment conditions
            if (c.type === 'environment') {
              return {
                type: 'environment_tier',
                targetValue: [c.targetValue.tier],
                operator: 'any',
              }
            }
            // Default case
            return c
          }) || [],
      })),
    })),
    null,
    2
  )}

  for (const gate of gates) {
    try {
      console.info(\`Creating gate: \${gate.name}...\`)
      await createGate(gate)
      console.info(\`✅ Created gate: \${gate.name}\`)
    } catch (error) {
      console.error(
        \`❌ Failed to create gate \${gate.name}:\`,
        error instanceof Error ? error.message : String(error)
      )
    }
  }
}

main().catch(console.error)
`
}

/**
 * Generate siggy CLI commands to create gates
 * Uses the siggy CLI tool instead of direct API calls
 */
export function generateSiggyCLICommands(configs: StatsigGateConfig[]): {
  createCommands: string[]
  updateCommands: string[]
  deleteCommands: string[]
  shellScript: string
} {
  const gateConfigs = generateBulkGateConfigs(configs)
  const createCommands: string[] = []
  const updateCommands: string[] = []
  const deleteCommands: string[] = []

  gateConfigs.forEach((config) => {
    // Generate create command
    const gateProperties = {
      description: config.description,
      isEnabled: true,
      idType: 'userID',
      rules: config.rules.map((rule) => ({
        name: rule.name,
        passPercentage: rule.passPercent,
        conditions:
          rule.conditions?.map((c: any) => {
            // Handle app version conditions
            if (c.type === 'app_version') {
              return {
                type: 'app_version',
                targetValue: c.targetValue,
                operator: c.operator,
              }
            }
            // Handle environment conditions
            if (c.type === 'environment') {
              return {
                type: 'environment_tier',
                targetValue: [c.targetValue.tier],
                operator: 'any',
              }
            }
            return c
          }) || [],
      })),
    }

    // Create command
    createCommands.push(`siggy gates create ${config.name}`)

    // Update command with properties (to set rules after creation)
    const propertiesJson = JSON.stringify(gateProperties).replace(/"/g, '\\"')
    updateCommands.push(`siggy gates update ${config.name} "${propertiesJson}"`)

    // Delete command
    deleteCommands.push(`siggy gates delete ${config.name}`)
  })

  // Generate a complete shell script
  const shellScript = `#!/bin/bash
# Statsig Feature Gates Management Script
# Generated automatically from V0_FEATURE_GATES configuration

set -e  # Exit on any error

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "\${GREEN}[INFO]\${NC} $1"
}

print_warning() {
    echo -e "\${YELLOW}[WARN]\${NC} $1"
}

print_error() {
    echo -e "\${RED}[ERROR]\${NC} $1"
}

# Check if siggy is installed
if ! command -v siggy &> /dev/null; then
    print_error "siggy CLI is not installed. Please install it first."
    exit 1
fi

# Function to create all gates
create_gates() {
    print_status "Creating feature gates..."
    
${createCommands
  .map(
    (cmd) => `    echo "Creating gate: $(echo '${cmd}' | cut -d' ' -f4)"
    ${cmd} || print_warning "Failed to create gate or gate already exists"`
  )
  .join('\n')}
    
    print_status "✅ Gate creation completed"
}

# Function to update all gates with rules
update_gates() {
    print_status "Updating gate rules..."
    
${updateCommands
  .map((cmd) => {
    const gateName = cmd.split(' ')[3]
    return `    echo "Updating rules for: ${gateName}"
    ${cmd} || print_error "Failed to update ${gateName}"`
  })
  .join('\n')}
    
    print_status "✅ Gate updates completed"
}

# Function to delete all gates
delete_gates() {
    print_warning "This will delete ALL feature gates. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Deleting feature gates..."
        
${deleteCommands.map((cmd) => `        ${cmd} || print_warning "Failed to delete gate or gate doesn't exist"`).join('\n')}
        
        print_status "✅ Gate deletion completed"
    else
        print_status "Deletion cancelled"
    fi
}

# Function to list all gates
list_gates() {
    print_status "Listing all feature gates..."
    siggy gates list
}

# Main script logic
case "\${1:-}" in
    "create")
        create_gates
        ;;
    "update")
        update_gates
        ;;
    "delete")
        delete_gates
        ;;
    "setup")
        print_status "Setting up all feature gates (create + update)..."
        create_gates
        echo ""
        update_gates
        ;;
    "list")
        list_gates
        ;;
    *)
        echo "Usage: $0 {create|update|delete|setup|list}"
        echo ""
        echo "Commands:"
        echo "  create  - Create all feature gates"
        echo "  update  - Update all gates with rules"
        echo "  setup   - Create and update all gates (recommended for first run)"
        echo "  delete  - Delete all feature gates (with confirmation)"
        echo "  list    - List all existing gates"
        echo ""
        echo "Examples:"
        echo "  $0 setup    # First time setup"
        echo "  $0 update   # Update rules after config changes"
        echo "  $0 list     # See current gates"
        exit 1
        ;;
esac
`

  return {
    createCommands,
    updateCommands,
    deleteCommands,
    shellScript,
  }
}

/**
 * Helper to check if a gate should be enabled based on current environment and app version
 * This is for local testing/debugging without hitting Statsig
 */
export function shouldEnableLocally(
  config: StatsigGateConfig,
  environment: 'development' | 'staging' | 'production' = 'development',
  appVersion?: string
): boolean {
  // Development environment always follows environment rules (ignores app version)
  if (environment === 'development') {
    if (!config.environmentRules) {
      return config.defaultEnabled || false
    }
    return config.environmentRules.development ?? (config.defaultEnabled || false)
  }

  // Check environment-specific app version rules first (higher priority)
  if (config.appVersionRules && appVersion) {
    const envSpecific = config.appVersionRules.environmentSpecific?.[environment]

    if (envSpecific) {
      // If app version is in environment-specific hideForVersions, disable the feature
      if (envSpecific.hideForVersions?.includes(appVersion)) {
        return false
      }
      // If app version is in environment-specific showForVersions, enable the feature
      if (envSpecific.showForVersions?.includes(appVersion)) {
        return true
      }
    }

    // Check global app version rules
    if (config.appVersionRules.hideForVersions?.includes(appVersion)) {
      return false
    }
    if (config.appVersionRules.showForVersions?.includes(appVersion)) {
      return true
    }
  }

  // Fall back to environment rules
  if (!config.environmentRules) {
    return config.defaultEnabled || false
  }

  return config.environmentRules[environment] ?? (config.defaultEnabled || false)
}
