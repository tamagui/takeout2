export interface FlattenedScript {
  name: string
  command: string
  /** true when the script name doesn't exist in package.json */
  isRaw: boolean
  /** scripts to spawn in parallel after command completes successfully */
  deferredScripts?: FlattenedScript[]
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
function parseTkoRun(command: string): { scriptNames: string[]; noRoot: boolean } | null {
  const match = command.match(TKO_RUN_RE)
  if (!match) return null

  const argsPart = match[2]!
  const args = argsPart.split(/\s+/)
  const scriptNames: string[] = []
  let noRoot = false

  for (const arg of args) {
    if (arg === '--no-root') {
      noRoot = true
      continue
    }
    if (arg.startsWith('--')) continue
    scriptNames.push(arg)
  }

  return { scriptNames, noRoot }
}

/**
 * split a shell command on &&, ||, ; while respecting quotes.
 * returns null if no operators found (command is not a compound).
 */
export function splitCompound(
  command: string
): { segments: string[]; operators: string[] } | null {
  const segments: string[] = []
  const operators: string[] = []
  let current = ''
  let inSingle = false
  let inDouble = false
  let i = 0

  while (i < command.length) {
    const ch = command[i]!

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      current += ch
      i++
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      current += ch
      i++
    } else if (ch === '\\' && !inSingle) {
      current += ch + (command[i + 1] || '')
      i += 2
    } else if (!inSingle && !inDouble) {
      if (command[i] === '&' && command[i + 1] === '&') {
        segments.push(current.trim())
        operators.push('&&')
        current = ''
        i += 2
      } else if (command[i] === '|' && command[i + 1] === '|') {
        segments.push(current.trim())
        operators.push('||')
        current = ''
        i += 2
      } else if (command[i] === ';') {
        segments.push(current.trim())
        operators.push(';')
        current = ''
        i++
      } else {
        current += ch
        i++
      }
    } else {
      current += ch
      i++
    }
  }

  if (current.trim()) segments.push(current.trim())
  if (operators.length === 0) return null
  return { segments, operators }
}

/**
 * match "bun <name> [args...]" where <name> is a package.json script.
 * returns the script name and any trailing args, or null if no match.
 */
function matchBunRun(
  segment: string,
  scripts: Record<string, string>
): { name: string; args: string[] } | null {
  const parts = segment.trim().split(/\s+/)
  if (parts[0] !== 'bun' || parts.length < 2) return null
  const name = parts[1]!
  if (name.startsWith('-')) return null
  if (scripts[name] === undefined) return null
  return { name, args: parts.slice(2) }
}

/**
 * recursively flatten script references into leaf commands.
 * resolves tko run/run-all chains AND shell compounds (&&, ;, ||).
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
      // --no-root means this will be handled by a separate tko process
      // scoped to workspace packages — don't resolve against root scripts
      if (parsed.noRoot) {
        results.push({ name, command: scriptCommand, isRaw: false })
        return
      }
      visited.add(name)
      for (const childName of parsed.scriptNames) {
        resolve(childName, visited)
      }
      return
    }

    // try to parse as shell compound (&&, ;, ||)
    const compound = splitCompound(scriptCommand)
    if (compound) {
      const resolvedSegments: string[] = []
      let deferredScripts: FlattenedScript[] | undefined

      for (let idx = 0; idx < compound.segments.length; idx++) {
        const segment = compound.segments[idx]!
        const isLast = idx === compound.segments.length - 1
        const bunMatch = matchBunRun(segment, packageJsonScripts)

        if (bunMatch) {
          const innerCommand = packageJsonScripts[bunMatch.name]!
          const innerParsed = parseTkoRun(innerCommand)

          if (innerParsed && innerParsed.noRoot) {
            // --no-root: keep as-is, will be handled by separate tko process
            resolvedSegments.push(segment)
          } else if (innerParsed && isLast) {
            // last segment is a tko run → defer its children for parallel spawn
            deferredScripts = flattenScripts(
              innerParsed.scriptNames,
              packageJsonScripts,
              options
            )
          } else if (innerParsed && !isLast) {
            // non-last segment is a tko run — can't inline parallel, keep as bun run
            resolvedSegments.push(segment)
          } else {
            // simple script → inline its command with any extra args
            const inlined = bunMatch.args.length
              ? `${innerCommand} ${bunMatch.args.join(' ')}`
              : innerCommand
            resolvedSegments.push(inlined)
          }
        } else {
          resolvedSegments.push(segment)
        }
      }

      // reconstruct the compound from resolved segments
      let reconstructed = resolvedSegments[0] || ''
      for (let idx = 0; idx < compound.operators.length; idx++) {
        if (idx < resolvedSegments.length - 1) {
          reconstructed += ` ${compound.operators[idx]} ${resolvedSegments[idx + 1]}`
        }
      }

      results.push({ name, command: reconstructed, isRaw: false, deferredScripts })
      return
    }

    // leaf command - not a tko run/run-all or compound
    results.push({ name, command: scriptCommand, isRaw: false })
  }

  for (const cmd of commands) {
    resolve(cmd, new Set())
  }

  return results
}
