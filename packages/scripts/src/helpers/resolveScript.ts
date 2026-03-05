export interface FlattenedScript {
  name: string
  command: string
  /** true when the script name doesn't exist in package.json */
  isRaw: boolean
}

export interface FlattenOptions {
  /** scripts already running (from BUN_RUN_SCRIPTS), will be filtered out */
  runningScripts?: string[]
}

// matches: "bun tko run ...", "bun tko run-all ...", "tko run ...", "tko run-all ..."
// but NOT "bun run:dev tko run-all ..." (has extra words between bun and tko)
const TKO_RUN_RE = /^(?:bun\s+)?tko\s+(run(?:-all)?)\s+(.+)$/

/**
 * parse a tko run/run-all command string, extracting script names and flags
 * returns null if the command is not a tko run/run-all pattern
 */
function parseTkoRun(command: string): { scriptNames: string[] } | null {
  const match = command.match(TKO_RUN_RE)
  if (!match) return null

  const argsPart = match[2]!
  const args = argsPart.split(/\s+/)
  const scriptNames: string[] = []

  for (const arg of args) {
    if (arg.startsWith('--')) {
      // skip known flags
      continue
    }
    scriptNames.push(arg)
  }

  return { scriptNames }
}

/**
 * recursively flatten script references into leaf commands.
 * a "leaf" is anything that is NOT a tko run/run-all command,
 * or a script whose definition contains shell operators (&&, ;, ||).
 */
export function flattenScripts(
  commands: string[],
  packageJsonScripts: Record<string, string>,
  options?: FlattenOptions
): FlattenedScript[] {
  const runningScripts = new Set(options?.runningScripts ?? [])
  const results: FlattenedScript[] = []

  function resolve(name: string, visited: Set<string>) {
    if (runningScripts.has(name)) return

    const scriptCommand = packageJsonScripts[name]

    // script doesn't exist in package.json - treat as raw command
    if (scriptCommand === undefined) {
      results.push({ name, command: name, isRaw: true })
      return
    }

    // cycle detected - emit as leaf to avoid infinite recursion
    if (visited.has(name)) {
      results.push({ name, command: scriptCommand, isRaw: false })
      return
    }

    // try to parse as tko run/run-all
    const parsed = parseTkoRun(scriptCommand)

    if (parsed) {
      // recurse into child scripts
      visited.add(name)
      for (const childName of parsed.scriptNames) {
        resolve(childName, visited)
      }
      return
    }

    // leaf command - not a tko run/run-all pattern
    results.push({ name, command: scriptCommand, isRaw: false })
  }

  for (const cmd of commands) {
    resolve(cmd, new Set())
  }

  return results
}
