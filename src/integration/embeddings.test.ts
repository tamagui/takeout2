import { expect, test } from '@playwright/test'

test.describe('Embeddings Tests', () => {
  test('should generate embeddings for text', async () => {
    if (typeof window === 'undefined') {
      const { embedText } = await import('~/features/search/helpers/embed')

      console.info('Testing embedding generation...')

      const testText = 'v4 config shorthands for Tamagui'
      const embedding = await embedText(testText)

      // embeddings should be an array of numbers
      expect(Array.isArray(embedding)).toBe(true)
      expect(embedding.length).toBeGreaterThan(0)

      // all values should be numbers
      embedding.forEach((val) => {
        expect(typeof val).toBe('number')
      })

      // embeddings should be normalized (magnitude ~1)
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
      expect(magnitude).toBeCloseTo(1, 1) // within 0.1 of 1
    }
  })

  test('should generate similar embeddings for similar text', async () => {
    if (typeof window === 'undefined') {
      const { embedText } = await import('~/features/search/helpers/embed')

      const text1 = 'Tamagui v4 configuration shorthands'
      const text2 = 'v4 config shorthands for Tamagui'
      const text3 = 'React Native development tools'

      const [embedding1, embedding2, embedding3] = await Promise.all([
        embedText(text1),
        embedText(text2),
        embedText(text3),
      ])

      // calculate cosine similarity
      const cosineSimilarity = (a: number[], b: number[]) => {
        const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0)
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
        return dotProduct / (magnitudeA * magnitudeB)
      }

      const sim12 = cosineSimilarity(embedding1, embedding2)
      const sim13 = cosineSimilarity(embedding1, embedding3)

      // similar texts should have higher similarity
      expect(sim12).toBeGreaterThan(0.7) // similar texts
      expect(sim13).toBeLessThan(0.5) // different topics
      expect(sim12).toBeGreaterThan(sim13) // text1 and text2 are more similar
    }
  })
})
