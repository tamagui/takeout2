export function insertAtIndex(original: string, index: number, toInsert: string): string {
  if (index < 0 || index > original.length) {
    throw new Error('Index out of bounds')
  }

  return original.slice(0, index) + toInsert + original.slice(index)
}
