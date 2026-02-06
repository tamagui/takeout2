/**
 * parse a .env file, handling multi-line quoted values (PEM keys etc)
 */
export function parseEnvFile(
  content: string,
  options?: { allowedKeys?: string[] }
): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = content.split('\n')
  let currentKey: string | null = null
  let currentValue: string[] = []
  let inMultiline = false

  const save = () => {
    if (!currentKey) return
    if (options?.allowedKeys && !options.allowedKeys.includes(currentKey)) {
      currentKey = null
      currentValue = []
      inMultiline = false
      return
    }
    let value = currentValue.join('\n')
    // remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    value = value.replace(/\\"/g, '"')
    result[currentKey] = value
    currentKey = null
    currentValue = []
    inMultiline = false
  }

  for (const line of lines) {
    if (inMultiline) {
      currentValue.push(line)
      if (line.trim().endsWith('"') || line.trim().endsWith("'")) {
        save()
      }
      continue
    }

    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match && match[1]) {
      if (currentKey) save()

      currentKey = match[1]
      const valueStart = match[2] || ''

      if (
        (valueStart.startsWith('"') && !valueStart.endsWith('"')) ||
        (valueStart.startsWith("'") && !valueStart.endsWith("'"))
      ) {
        inMultiline = true
        currentValue = [valueStart]
      } else {
        currentValue = [valueStart]
        save()
      }
    }
  }
  if (currentKey) save()

  return result
}
