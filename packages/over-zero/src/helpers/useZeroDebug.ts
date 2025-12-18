import { getCurrentComponentStack } from '@take-out/helpers'
import { useEffect, useId } from 'react'

import { prettyFormatZeroQuery } from './prettyFormatZeroQuery'

import type { Query } from '@rocicorp/zero'

const activeQueries = new Map<string, number>()

// AST change tracking
interface AstHistory {
  asts: string[]
  changeCount: number
}

const astHistoryByComponent = new Map<string, AstHistory>()

// control what is logged here:
const filterLogs = (table: string): boolean => false

const COLLAPSED = true
const AST_CHANGE_THRESHOLD = 4
const MAX_AST_HISTORY = 10

// short name because otherwise it often forces multiple lines in chrome devtools
// due to showing the filename next to log lines
export const useZeroDebug = (query: Query<any, any, any>, options: any, results: any) => {
  const astObject = query['_completeAst']?.() ?? query['ast']
  const table = astObject?.table ?? 'unknown'
  const ast = JSON.stringify(astObject, null, 2)
  const queryDisabled = !options || options?.enabled === false
  const enabled = !queryDisabled && filterLogs(table)
  const stack = new Error().stack
  const isPermissionQuery = stack?.includes(`usePermission.ts`)
  const id = useId()

  // log here not in effect so we can breakpoint and find the query
  const num = activeQueries.get(ast) || 0
  const shouldLog = enabled && num === 0
  if (enabled) {
    activeQueries.set(ast, num + 1)
    if (shouldLog) {
      if (COLLAPSED) {
        console.groupCollapsed(
          `${isPermissionQuery ? `👮‍♂️` : `✨`}${prettyFormatZeroQuery(query, 'minimal')}`
        )
        console.info(id, prettyFormatZeroQuery(query, 'full'))
        console.info('cached result', results)
        console.trace()
        console.groupEnd()
      } else {
        console.info(`✨`, prettyFormatZeroQuery(query, 'full'))
      }
    }
  }

  // track AST changes per component
  useEffect(() => {
    if (!enabled) return
    const history = astHistoryByComponent.get(id) || { asts: [], changeCount: 0 }
    const currentAst = ast
    const lastAst = history.asts[history.asts.length - 1]

    if (currentAst !== lastAst) {
      history.asts.push(currentAst)
      if (history.asts.length > MAX_AST_HISTORY) {
        history.asts.shift()
      }
      history.changeCount++
      astHistoryByComponent.set(id, history)

      if (history.changeCount > AST_CHANGE_THRESHOLD) {
        console.warn(
          `⚠️ AST changed ${history.changeCount} times for component.
        - id: ${id}
        - stack: ${getCurrentComponentStack('short')}
        - table: ${table}`,
          {
            componentId: id,
            table,
            changeCount: history.changeCount,
            recentAsts: history.asts,
          }
        )
      }
    }
  }, [id, ast, table, enabled])

  useEffect(() => {
    if (!enabled) return
    return () => {
      activeQueries.set(ast, activeQueries.get(ast)! - 1)
    }
  }, [ast, enabled])

  // cleanup AST history on unmount
  useEffect(() => {
    return () => {
      astHistoryByComponent.delete(id)
    }
  }, [id])
}
