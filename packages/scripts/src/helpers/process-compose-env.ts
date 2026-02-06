import { readFileSync, writeFileSync } from 'node:fs'

// collapse multi-line values (like PEM keys) to single line for yaml compatibility
function yamlSafe(value: string): string {
  if (value.includes('\n')) {
    return value.replace(/\n/g, '\\n')
  }
  return value
}

/**
 * processes docker-compose file, replacing ${VAR:-default} with actual env values.
 * handles multi-line values (PEM keys etc) by escaping newlines for yaml.
 */
export function processComposeEnv(
  composeFile: string,
  outputFile: string,
  envVars: Record<string, string | undefined>
): void {
  let content = readFileSync(composeFile, 'utf-8')

  // replace all ${VAR:-default} patterns with actual env values
  content = content.replace(
    /\$\{([A-Z_][A-Z0-9_]*):-([^}]*)\}/g,
    (_match, varName, defaultValue) => {
      const value = envVars[varName]
      if (value) {
        console.info(
          `  ${varName}: ${value.slice(0, 50)}${value.length > 50 ? '...' : ''}`
        )
      }
      return value ? yamlSafe(value) : defaultValue
    }
  )

  // replace standalone ${VAR} patterns
  content = content.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_match, varName) => {
    const value = envVars[varName]
    return value ? yamlSafe(value) : _match
  })

  writeFileSync(outputFile, content)
  console.info(`✅ processed compose file: ${outputFile}`)
}
