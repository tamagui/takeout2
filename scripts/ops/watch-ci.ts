#!/usr/bin/env bun

type WorkflowRun = {
  conclusion: string
  status: string
  url: string
  workflowName: string
}

const shaIndex = process.argv.indexOf('--sha')
const sha = shaIndex === -1 ? undefined : process.argv[shaIndex + 1]

if (!sha) {
  console.error('usage: bun scripts/ops/watch-ci.ts --sha <sha>')
  process.exit(2)
}

const expectedWorkflows = ['CI', 'iOS CD', 'Release']
let previousStatus = ''

while (true) {
  const result = Bun.spawnSync(
    [
      'gh',
      'run',
      'list',
      '--commit',
      sha,
      '--limit',
      '50',
      '--json',
      'conclusion,status,url,workflowName',
    ],
    { stderr: 'pipe', stdout: 'pipe' },
  )

  if (result.exitCode !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.exitCode)
  }

  const runs = JSON.parse(result.stdout.toString()) as WorkflowRun[]
  const selected = expectedWorkflows.map((workflowName) =>
    runs.find((run) => run.workflowName === workflowName),
  )
  const status = selected
    .map((run, index) => `${expectedWorkflows[index]}=${run?.status ?? 'missing'}`)
    .join(' ')

  if (status !== previousStatus) {
    console.info(status)
    previousStatus = status
  }

  if (selected.every((run) => run?.status === 'completed')) {
    for (const run of selected) {
      console.info(`${run!.workflowName}: ${run!.conclusion} ${run!.url}`)
    }
    const failed = selected.some(
      (run) => run!.conclusion !== 'success' && run!.conclusion !== 'skipped',
    )
    process.exit(failed ? 1 : 0)
  }

  await Bun.sleep(20_000)
}
