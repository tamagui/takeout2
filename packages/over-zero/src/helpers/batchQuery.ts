import { sleep } from '@take-out/helpers'

import type { Query, Row } from '@rocicorp/zero'

export async function batchQuery<Q extends Query<any, any, any>, Item extends Row<Q>>(
  q: Q,
  mapper: (items: Item[]) => Promise<void>,
  {
    chunk,
    pause = 0,
    stopAfter = 100_000,
  }: {
    chunk: number
    pause?: number
    stopAfter?: number
  } = { chunk: 20 }
) {
  let hasMore = true
  let last: Item | null = null
  let iterations = 0

  while (hasMore) {
    let query = q.limit(chunk)

    if (last) {
      query = query.start(last)
    }

    const results = await query.run({ type: 'complete' })

    await mapper(results as Item[])

    if (results.length < chunk) {
      hasMore = false
    }

    if (iterations > stopAfter) {
      console.error(`[batchQuery] ‼️ stopping batch, ran ${stopAfter} chunks`)
      break
    }

    if (pause) {
      await sleep(pause)
    }
  }
}
