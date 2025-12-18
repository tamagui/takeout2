import { readFileSync, writeFileSync } from 'node:fs'

/**
 * processes docker-compose file, replacing ${VAR:-default} with actual env values
 */
export function processComposeEnv(
  composeFile: string,
  outputFile: string,
  envVars: Record<string, string | undefined>
): void {
  let content = readFileSync(composeFile, 'utf-8')

  // replace all ${VAR:-default} patterns with actual env values
  content = content.replace(
    /\$\{([A-Z_]+):-([^}]+)\}/g,
    (match, varName, defaultValue) => {
      const value = envVars[varName]
      if (value) {
        console.info(`  ${varName}: ${value.slice(0, 50)}...`)
      }
      return value || defaultValue
    }
  )

  // replace standalone ${VAR} patterns
  content = content.replace(/\$\{([A-Z_]+)\}/g, (match, varName) => {
    return envVars[varName] || match
  })

  writeFileSync(outputFile, content)
  console.info(`✅ processed compose file: ${outputFile}`)
}
