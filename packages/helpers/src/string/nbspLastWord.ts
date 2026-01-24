/**
 * replaces the last space in a string with a non-breaking space
 * to prevent orphaned words at the end of text blocks
 */
export const nbspLastWord = (text: string): string => {
  if (!text) return text
  const words = text.split(' ')
  if (words.length <= 1) return text
  return words.slice(0, -1).join(' ') + '\u00A0' + words[words.length - 1]
}
