/**
 * resolves a `$dep:package-name` value to the installed version from dependencies
 */
export function resolveDepVersion(
  value: string | boolean,
  dependencies: Record<string, string> | undefined
): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('$dep:')) return undefined
  const depName = value.slice('$dep:'.length)
  return dependencies?.[depName]?.replace(/^[\^~]/, '')
}
