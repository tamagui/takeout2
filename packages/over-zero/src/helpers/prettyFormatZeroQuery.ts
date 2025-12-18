import { ellipsis } from '@take-out/helpers'

import type { Query } from '@rocicorp/zero'

export const prettyFormatZeroQuery = (
  query: Query<any, any, any>,
  mode: 'full' | 'minimal' = 'full'
): string => {
  const astObject = query['_completeAst']?.()

  if (!astObject) return ''

  if (mode === 'minimal') {
    return prettyFormatMinimal(astObject)
  }
  return prettyFormatFull(astObject)
}

const prettyFormatFull = (astObject: any, indent = 0): string => {
  if (!astObject || !astObject.table) return ''

  const spaces = '  '.repeat(indent)
  let query = astObject.table
  let hasChainedMethods = false

  // Add where conditions
  if (astObject.where) {
    const whereClause = formatWhere(astObject.where)
    if (hasChainedMethods) {
      query += `\n${spaces}  ${whereClause}`
    } else {
      query += whereClause
      hasChainedMethods = true
    }
  }

  // Add limit
  if (astObject.limit) {
    const limitClause = `.limit(${astObject.limit})`
    if (hasChainedMethods) {
      query += `\n${spaces}  ${limitClause}`
    } else {
      query += limitClause
      hasChainedMethods = true
    }
  }

  // Add orderBy
  if (astObject.orderBy && astObject.orderBy.length > 0) {
    const orderClauses = astObject.orderBy
      .map(([field, direction]: [string, string]) => `${field}, ${direction}`)
      .join(', ')
    const orderByClause = `.orderBy(${orderClauses})`
    if (hasChainedMethods) {
      query += `\n${spaces}  ${orderByClause}`
    } else {
      query += orderByClause
      hasChainedMethods = true
    }
  }

  // Add related queries
  if (astObject.related && astObject.related.length > 0) {
    astObject.related.forEach((rel: any) => {
      if (rel.subquery) {
        const alias = rel.subquery.alias || rel.subquery.table
        const subQuery = prettyFormatFull(rel.subquery, indent + 1)
        query += `\n${spaces}  .related(${alias}, q => q.${subQuery}`
      }
    })

    // Add closing parentheses
    const closingParens = ')'.repeat(astObject.related.length)
    query += `\n${spaces}${closingParens}`
  }

  return query
}

const prettyFormatMinimal = (astObject: any): string => {
  if (!astObject || !astObject.table) return ''

  let query = astObject.table

  // Add where conditions only
  if (astObject.where) {
    query += formatWhere(astObject.where).replace('.where(', '(')
  }

  // Add sub-queries info if present
  if (astObject.related && astObject.related.length > 0) {
    const subQueries = collectSubQueryTables(astObject.related)
    const count = subQueries.length
    const tableNames = subQueries.join(', ')
    query += ` (+${count}: ${ellipsis(tableNames, 30)})`
  }

  return query
}

const collectSubQueryTables = (related: any[]): string[] => {
  const tables: string[] = []

  related.forEach((rel: any) => {
    if (rel.subquery) {
      const tableName = rel.subquery.alias || rel.subquery.table
      tables.push(tableName)

      // Recursively collect nested sub-queries
      if (rel.subquery.related && rel.subquery.related.length > 0) {
        tables.push(...collectSubQueryTables(rel.subquery.related))
      }
    }
  })

  return tables
}

const formatWhere = (where: any): string => {
  if (!where) return ''

  if (where.type === 'simple') {
    const column = where.left?.name || where.left
    const value = where.right?.value !== undefined ? where.right.value : where.right
    const op = where.op || '='

    // Special case: if column is "id" and op is "=" and value is a single item, show just the value
    if (
      column === 'id' &&
      op === '=' &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      return `(${value})`
    }

    if (op === '=') {
      return `.where(${column}, ${value})`
    }
    return `.where(${column}, ${op}, ${value})`
  }

  if (where.type === 'and' && where.conditions) {
    let result = ''
    where.conditions.forEach((condition: any, index: number) => {
      if (index === 0) {
        result += formatWhere(condition)
      } else {
        result += `.and(${formatWhere(condition).slice(1)})` // Remove the leading dot
      }
    })
    return result
  }

  if (where.type === 'or' && where.conditions) {
    let result = ''
    where.conditions.forEach((condition: any, index: number) => {
      if (index === 0) {
        result += formatWhere(condition)
      } else {
        result += `.or(${formatWhere(condition).slice(1)})` // Remove the leading dot
      }
    })
    return result
  }

  return ''
}
