// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import { Emitter, useEmitterSelector, useEmittersSelector } from './emitter'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const roots: ReturnType<typeof createRoot>[] = []

afterEach(async () => {
  for (const root of roots) {
    await act(async () => root.unmount())
  }
  roots.length = 0
})

describe('emitter selector subscriptions', () => {
  it('updates a captured selector when its args array is mutated in place', async () => {
    const emitter = new Emitter<number>(1)
    const args = [1]
    const container = document.createElement('div')
    const root = createRoot(container)
    roots.push(root)

    function Probe({ multiplier }: { multiplier: number }) {
      const value = useEmitterSelector(
        emitter,
        (current) => current * multiplier,
        { lazy: true },
        args,
      )
      return <span>{value}</span>
    }

    await act(async () => root.render(<Probe multiplier={1} />))
    args[0] = 2
    await act(async () => root.render(<Probe multiplier={2} />))
    await act(async () => emitter.emit(3))

    expect(container.textContent).toBe('6')
  })

  it('subscribes to a replacement emitter when its array is mutated in place', async () => {
    const first = new Emitter<number>(1)
    const second = new Emitter<number>(2)
    const emitters = [first]
    const container = document.createElement('div')
    const root = createRoot(container)
    roots.push(root)

    function Probe({ revision }: { revision: number }) {
      const value = useEmittersSelector(emitters, ([current]) => current)
      return <span data-revision={revision}>{value}</span>
    }

    await act(async () => root.render(<Probe revision={0} />))
    emitters[0] = second
    await act(async () => root.render(<Probe revision={1} />))
    await act(async () => second.emit(4))

    expect(container.textContent).toBe('4')
  })
})
