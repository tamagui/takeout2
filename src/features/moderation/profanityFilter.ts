// simple profanity filter for text content
// this is a basic blocklist approach - can be enhanced with more sophisticated detection

// offensive terms - focused on clearly harmful slurs only
// avoid short words or words that appear in legitimate contexts
const BLOCKED_WORDS = [
  // slurs (full words only to avoid false positives)
  'nigger',
  'nigga',
  'faggot',
  'kike',
  'chink',
  'tranny',
  // violence/harassment
  'kill yourself',
  'kys',
]

// normalize text for comparison (handle leetspeak, etc)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
}

export type ProfanityResult = {
  clean: boolean
  flaggedWords: string[]
}

/**
 * check text for profanity
 */
export function checkProfanity(text: string): ProfanityResult {
  const normalized = normalizeText(text)
  const flaggedWords: string[] = []

  for (const word of BLOCKED_WORDS) {
    const normalizedWord = normalizeText(word)
    if (normalized.includes(normalizedWord)) {
      flaggedWords.push(word)
    }
  }

  return {
    clean: flaggedWords.length === 0,
    flaggedWords,
  }
}

/**
 * censor profanity in text by replacing with asterisks
 */
export function censorProfanity(text: string): string {
  let result = text
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(word, 'gi')
    result = result.replace(regex, '*'.repeat(word.length))
  }
  return result
}
