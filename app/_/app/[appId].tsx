import { useParams } from 'one'
import React, { memo } from 'react'
import { jsx } from 'react/jsx-runtime'
import * as StartApp from 'start/app'
import * as StartUI from 'start/ui'
import { useAsync } from '@vxrn/helpers'
import { ErrorBoundary } from '~/interface/utils/ErrorBoundary'
import { useQuery, zero } from '~/zero/client'

if (typeof globalThis !== 'undefined') {
  // @ts-ignore
  globalThis.jsx = jsx
  // @ts-ignore
  globalThis.jsxDEV = jsx
  globalThis.React = React
  // @ts-ignore
  globalThis.StartUI = StartUI
  // @ts-ignore
  globalThis.StartApp = StartApp
}

export default function AppDetailPage() {
  const params = useParams<{ appId?: string }>()
  const [app] = useQuery(
    zero.query.app
      .one()
      .where('id', params.appId || '')
      .related('install', (q) => q.one())
  )

  const source = app?.source

  const [compiledSource, status] = useAsync(async () => {
    if (!source) {
      return null
    }

    // TODO move this into mutators
    const compiledSource = await fetch(`/api/app/compile`, {
      method: 'POST',
      body: source,
    })
      .then((res) => res.text())
      .catch((err) => {
        console.error(`Error compiling`, err)
      })

    console.warn(`got compiled source`, compiledSource)

    return compiledSource
  }, [source])

  const [evaluated] = useAsync(async () => {
    if (!compiledSource) {
      return null
    }

    const blob = new Blob([compiledSource], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    try {
      const module = await import(url)
      URL.revokeObjectURL(url)
      return module
    } catch (err) {
      console.error(`Error loading app:`, { err, compiledSource })
      URL.revokeObjectURL(url)
      throw err
    }
  }, [compiledSource])

  console.info(`app`, params.appId, {
    compiledSource,
    status,
    evaluated,
  })

  if (status !== 'idle') {
    return null
  }

  if (!evaluated) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="body-transparent-bg" />
      <RenderApp exported={evaluated.default as any} />
    </ErrorBoundary>
  )
}

const RenderApp = memo(({ exported }: { exported: () => React.ReactNode }) => {
  return exported()
})
