#!/usr/bin/env bun
import { unfurlUrl } from '~/features/unfurl/unfurl'

const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://twitter.com/elonmusk',
  'https://github.com/facebook/react',
  'https://www.nytimes.com',
  'https://en.wikipedia.org/wiki/JavaScript',
  'https://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster-than-processing-an-unsorted-array',
  'https://www.reddit.com/r/programming/',
  'https://vimeo.com/709498327',
  'https://medium.com/@angularminds/react-vs-angular-a-comprehensive-comparison-2024-f7e31e07303d',
  'https://dev.to/ben/welcome-thread-v0-1hg',
  'https://www.amazon.com/dp/B08N5WRWNW',
  'https://www.imdb.com/title/tt0111161/',
  'https://codepen.io/chriscoyier/pen/JpLzjd',
]

async function testUnfurl() {
  const url = process.argv[2]

  if (url) {
    console.info(`\nUnfurling: ${url}`)
    console.info('─'.repeat(50))
    const result = await unfurlUrl(url)
    console.info(JSON.stringify(result, null, 2))
    return
  }

  console.info('Testing unfurl with common URLs...\n')

  for (const testUrl of testUrls) {
    console.info(`\nUnfurling: ${testUrl}`)
    console.info('─'.repeat(50))

    try {
      const result = await unfurlUrl(testUrl)
      console.info(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('Error:', error)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

testUnfurl().catch(console.error)
