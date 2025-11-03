export function dedent(strings: TemplateStringsArray | string, ...values: any[]): string {
  // If called as a normal function with a string
  if (typeof strings === 'string') {
    return dedentString(strings)
  }

  // If called as a template tag
  const result = strings.reduce((acc, str, i) => {
    return acc + str + (values[i] !== undefined ? values[i] : '')
  }, '')

  return dedentString(result)
}

function dedentString(text: string): string {
  let lines = text.replace(/^\n/, '').split('\n')

  // Find common indentation from non-empty lines
  const indentLengths = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0)

  const minIndent = indentLengths.length > 0 ? Math.min(...indentLengths) : 0

  if (minIndent > 0) {
    lines = lines.map((line) => line.slice(minIndent))
  }

  return lines.join('\n').trimEnd()
}
