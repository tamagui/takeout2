import fs from 'node:fs'

// make values safe for yaml map syntax (KEY: value)
// handles multi-line values, special chars that break yaml parsing
function yamlSafe(value: string): string {
  const needsQuoting =
    value.includes('\n') ||
    value.includes(':') ||
    value.includes('#') ||
    value.startsWith('-') ||
    value.startsWith('{') ||
    value.startsWith('[') ||
    value.startsWith('"') ||
    value.startsWith("'")

  if (!needsQuoting) return value

  // escape backslashes and double quotes, collapse newlines
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')

  return `"${escaped}"`
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
  let content = fs.readFileSync(composeFile, 'utf-8')

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

  fs.writeFileSync(outputFile, content)
  console.info(`✅ processed compose file: ${outputFile}`)
}
