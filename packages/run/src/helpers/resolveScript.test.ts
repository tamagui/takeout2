import { describe, expect, it } from 'vitest'

import { flattenScripts, splitCompound } from './resolveScript'

// scripts modeled after the real chat package.json
const scripts: Record<string, string> = {
  dev: 'bun tko run-all --flags=last backend:delayed agent-gateway frontend',
  'backend:delayed': 'sleep 5 && bun backend',
  backend: 'bun tko run backend:up backend:migrate-then-zero jobs',
  'backend:up': 'bun env:dev docker compose up pgdb minio',
  'backend:migrate-then-zero':
    'bun backend:migrate && bun env:dev docker compose up zero',
  'backend:migrate': 'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/migrate.ts',
  frontend: 'tko run-all --flags=last dev:kill-orphans watch-lazy dev:tunnel one:dev',
  'dev:kill-orphans': 'tko dev kill-orphans',
  'watch-lazy': 'sleep 8 && bun watch',
  watch: 'tko run types:watch build:watch apps:watch',
  'types:watch': 'bun check types --watch',
  'build:watch': 'tko run --no-root watch',
  'apps:watch': 'tko apps build -- --watch',
  'dev:tunnel': 'tko dev tunnel --setup',
  'one:dev': 'bun clear-ports --only web && bun run:dev one dev --port 8081',
  'agent-gateway': 'tko dev agent-gateway',
  jobs: 'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/jobs.ts',
  lite: 'bun run:dev tko run-all --pty --flags=last watch-lazy lite:backend one:dev agent-gateway',
  'lite:backend': 'bun run:dev orez --data-dir=.orez',
}

describe('flattenScripts', () => {
  it('passes through leaf commands that are not tko run', () => {
    const result = flattenScripts(['jobs'], scripts)
    expect(result).toEqual([
      {
        name: 'jobs',
        command: 'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/jobs.ts',
        isRaw: false,
      },
    ])
  })

  it('parses compound and inlines bun script references', () => {
    // backend:delayed = "sleep 5 && bun backend"
    // backend = "bun tko run backend:up backend:migrate-then-zero jobs" (tko run)
    // since "bun backend" is last segment and resolves to tko run, it becomes deferredScripts
    const result = flattenScripts(['backend:delayed'], scripts)
    expect(result).toEqual([
      {
        name: 'backend:delayed',
        command: 'sleep 5',
        isRaw: false,
        deferredScripts: [
          {
            name: 'backend:up',
            command: 'bun env:dev docker compose up pgdb minio',
            isRaw: false,
          },
          {
            name: 'backend:migrate-then-zero',
            command:
              'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/migrate.ts && bun env:dev docker compose up zero',
            isRaw: false,
          },
          {
            name: 'jobs',
            command: 'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/jobs.ts',
            isRaw: false,
          },
        ],
      },
    ])
  })

  it('resolves bun tko run into child scripts, inlines compounds', () => {
    const result = flattenScripts(['backend'], scripts)
    expect(result).toEqual([
      {
        name: 'backend:up',
        command: 'bun env:dev docker compose up pgdb minio',
        isRaw: false,
      },
      {
        name: 'backend:migrate-then-zero',
        // "bun backend:migrate" inlined to its command, "bun env:dev docker compose up zero" not a known script
        command:
          'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/migrate.ts && bun env:dev docker compose up zero',
        isRaw: false,
      },
      {
        name: 'jobs',
        command: 'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/jobs.ts',
        isRaw: false,
      },
    ])
  })

  it('resolves tko run-all and parses compounds within children', () => {
    const result = flattenScripts(['frontend'], scripts)
    expect(result).toEqual([
      { name: 'dev:kill-orphans', command: 'tko dev kill-orphans', isRaw: false },
      {
        name: 'watch-lazy',
        command: 'sleep 8',
        isRaw: false,
        deferredScripts: [
          { name: 'types:watch', command: 'bun check types --watch', isRaw: false },
          // build:watch → tko run --no-root watch → treated as leaf (no root expansion)
          { name: 'build:watch', command: 'tko run --no-root watch', isRaw: false },
          { name: 'apps:watch', command: 'tko apps build -- --watch', isRaw: false },
        ],
      },
      { name: 'dev:tunnel', command: 'tko dev tunnel --setup', isRaw: false },
      {
        name: 'one:dev',
        command: 'bun clear-ports --only web && bun run:dev one dev --port 8081',
        isRaw: false,
      },
    ])
  })

  it('resolves nested tko run chains', () => {
    // watch -> tko run types:watch build:watch apps:watch
    // build:watch -> tko run --no-root watch -> treated as leaf (no root expansion)
    const result = flattenScripts(['watch'], scripts)
    expect(result).toEqual([
      { name: 'types:watch', command: 'bun check types --watch', isRaw: false },
      { name: 'build:watch', command: 'tko run --no-root watch', isRaw: false },
      { name: 'apps:watch', command: 'tko apps build -- --watch', isRaw: false },
    ])
  })

  it('handles multiple input commands', () => {
    const result = flattenScripts(['jobs', 'agent-gateway'], scripts)
    expect(result).toEqual([
      {
        name: 'jobs',
        command: 'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/jobs.ts',
        isRaw: false,
      },
      { name: 'agent-gateway', command: 'tko dev agent-gateway', isRaw: false },
    ])
  })

  it('handles scripts not found in package.json as raw commands', () => {
    const result = flattenScripts(['nonexistent'], scripts)
    expect(result).toEqual([{ name: 'nonexistent', command: 'nonexistent', isRaw: true }])
  })

  it('detects cycles and stops recursion', () => {
    const cyclicScripts: Record<string, string> = {
      a: 'tko run b',
      b: 'tko run a',
    }
    const result = flattenScripts(['a'], cyclicScripts)
    // a -> b -> a (cycle). when 'a' is encountered again, it's emitted as a leaf
    expect(result).toEqual([{ name: 'a', command: 'tko run b', isRaw: false }])
  })

  it('strips --flags=last and --pty from tko commands when extracting children', () => {
    // verify flags like --flags=last don't appear as script names
    const simpleScripts: Record<string, string> = {
      parent: 'bun tko run-all --flags=last --pty child1 child2',
      child1: 'echo one',
      child2: 'echo two',
    }
    const result = flattenScripts(['parent'], simpleScripts)
    expect(result).toEqual([
      { name: 'child1', command: 'echo one', isRaw: false },
      { name: 'child2', command: 'echo two', isRaw: false },
    ])
  })

  it('treats --no-root tko run as a leaf command (no root expansion)', () => {
    const simpleScripts: Record<string, string> = {
      parent: 'bun tko run-all --no-root --flags=last child1 child2',
      child1: 'echo one',
      child2: 'echo two',
    }
    const result = flattenScripts(['parent'], simpleScripts)
    // --no-root means this runs in workspace packages only, don't expand against root
    expect(result).toEqual([
      {
        name: 'parent',
        command: 'bun tko run-all --no-root --flags=last child1 child2',
        isRaw: false,
      },
    ])
  })

  it('filters out scripts listed in BUN_RUN_SCRIPTS', () => {
    const result = flattenScripts(['backend'], scripts, {
      runningScripts: ['backend:up'],
    })
    expect(result).toEqual([
      {
        name: 'backend:migrate-then-zero',
        command:
          'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/migrate.ts && bun env:dev docker compose up zero',
        isRaw: false,
      },
      {
        name: 'jobs',
        command: 'ALLOW_MISSING_ENV=1 bun run:dev scripts/dev/jobs.ts',
        isRaw: false,
      },
    ])
  })

  it('handles tko run-all with --pty flag (lite script)', () => {
    // lite = bun run:dev tko run-all --pty --flags=last watch-lazy lite:backend one:dev agent-gateway
    // the "bun run:dev" prefix before tko means this is NOT a tko command at the top level
    // it contains && or is a raw command - actually "bun run:dev tko run-all ..." IS a tko pattern
    // but wrapped in "bun run:dev" so it should be treated as a leaf
    const result = flattenScripts(['lite'], scripts)
    expect(result).toEqual([
      {
        name: 'lite',
        command:
          'bun run:dev tko run-all --pty --flags=last watch-lazy lite:backend one:dev agent-gateway',
        isRaw: false,
      },
    ])
  })

  it('deduplicates scripts that appear multiple times', () => {
    const dupeScripts: Record<string, string> = {
      a: 'tko run shared c',
      b: 'tko run shared d',
      shared: 'echo shared',
      c: 'echo c',
      d: 'echo d',
    }
    const result = flattenScripts(['a', 'b'], dupeScripts)
    const names = result.map((r) => r.name)
    expect(names).toEqual(['shared', 'c', 'shared', 'd'])
  })

  it('inlines simple bun script in compound middle segment', () => {
    const s: Record<string, string> = {
      setup: 'bun migrate && bun serve',
      migrate: 'drizzle-kit push',
      serve: 'bun run:dev server.ts',
    }
    const result = flattenScripts(['setup'], s)
    expect(result).toEqual([
      {
        name: 'setup',
        command: 'drizzle-kit push && bun run:dev server.ts',
        isRaw: false,
      },
    ])
  })

  it('leaves non-bun compound segments untouched', () => {
    const s: Record<string, string> = {
      task: 'sleep 5 && echo done',
    }
    const result = flattenScripts(['task'], s)
    expect(result).toEqual([
      { name: 'task', command: 'sleep 5 && echo done', isRaw: false },
    ])
  })

  it('handles semicolons as compound operators', () => {
    const s: Record<string, string> = {
      task: 'echo start; bun build; echo end',
      build: 'tsc --noEmit',
    }
    const result = flattenScripts(['task'], s)
    expect(result).toEqual([
      { name: 'task', command: 'echo start ; tsc --noEmit ; echo end', isRaw: false },
    ])
  })

  it('passes extra args through when inlining bun references', () => {
    const s: Record<string, string> = {
      task: 'bun build --watch && echo done',
      build: 'tsc',
    }
    const result = flattenScripts(['task'], s)
    expect(result).toEqual([
      { name: 'task', command: 'tsc --watch && echo done', isRaw: false },
    ])
  })
})

describe('splitCompound', () => {
  it('returns null for simple commands', () => {
    expect(splitCompound('echo hello')).toBeNull()
    expect(splitCompound('bun run dev')).toBeNull()
  })

  it('splits on &&', () => {
    expect(splitCompound('sleep 5 && echo done')).toEqual({
      segments: ['sleep 5', 'echo done'],
      operators: ['&&'],
    })
  })

  it('splits on ||', () => {
    expect(splitCompound('test -f file || echo missing')).toEqual({
      segments: ['test -f file', 'echo missing'],
      operators: ['||'],
    })
  })

  it('splits on ;', () => {
    expect(splitCompound('echo a; echo b')).toEqual({
      segments: ['echo a', 'echo b'],
      operators: [';'],
    })
  })

  it('handles mixed operators', () => {
    expect(splitCompound('a && b || c; d')).toEqual({
      segments: ['a', 'b', 'c', 'd'],
      operators: ['&&', '||', ';'],
    })
  })

  it('respects double quotes', () => {
    expect(splitCompound('echo "a && b" && echo c')).toEqual({
      segments: ['echo "a && b"', 'echo c'],
      operators: ['&&'],
    })
  })

  it('respects single quotes', () => {
    expect(splitCompound("echo 'a && b' && echo c")).toEqual({
      segments: ["echo 'a && b'", 'echo c'],
      operators: ['&&'],
    })
  })

  it('handles escaped characters', () => {
    expect(splitCompound('echo a\\&\\& && echo b')).toEqual({
      segments: ['echo a\\&\\&', 'echo b'],
      operators: ['&&'],
    })
  })
})
