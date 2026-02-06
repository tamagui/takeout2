import React from 'react'

export const getCurrentComponentStack = (format?: 'short'): string => {
  if (process.env.NODE_ENV === 'development') {
    const stack = (React as Record<string, any>)[
      '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'
    ].getCurrentStack()

    if (format === 'short') {
      return formatStackToShort(stack)
    }

    return stack
  }

  return `(prod, no stack)`
}

const formatStackToShort = (stack: string): string => {
  if (process.env.NODE_ENV === 'development') {
    const lines = stack
      // huge stack was causing issues
      .slice(0, 6000)
      .split('\n')

    const componentNames: string[] = []

    for (const line of lines) {
      // Extract component names from patterns like "at ComponentName ("
      // Also handle cases like "at Route((chat))" or "Route() ("
      const match = line.match(/\s*at\s+([A-Z][a-zA-Z0-9_]*)\s*\(/)
      if (match) {
        const componentName = match[1]
        // Filter out framework internals and keep user components
        if (
          componentName &&
          componentName !== 'Array' &&
          componentName !== 'Root' &&
          componentName !== 'Route'
        ) {
          componentNames.push(componentName)
          if (componentNames.length > 10) {
            // avoid too many
            break
          }
        }
      }
    }

    return componentNames.join(' < ')
  }

  return stack
}
