import { expect, test } from '@playwright/test'

const testServerId = 'chat-api-test-server'
const testChannelId = 'chat-api-test-channel'
const testUserId = 'chat-api-test-user'

// zzz to run last i think this data messes up zero

async function setupTestInfrastructure() {
  if (typeof window === 'undefined') {
    const { getDb } = await import('~/database')
    const { user } = await import('~/database/schema-private')
    const { server, channel, userPublic } = await import('~/database/schema-public')
    const db = getDb()

    // create test user in private schema
    await db
      .insert(user)
      .values({
        id: testUserId,
        username: 'chatapitestuser',
        name: 'Chat API Test User',
        email: 'chatapi@test.com',
      })
      .onConflictDoNothing()

    // create test user in public schema (required for foreign key constraint)
    await db
      .insert(userPublic)
      .values({
        id: testUserId,
        username: 'chatapitestuser',
        name: 'Chat API Test User',
      })
      .onConflictDoNothing()

    // create test server
    await db
      .insert(server)
      .values({
        id: testServerId,
        name: 'Chat API Test Server',
        creatorId: testUserId,
      })
      .onConflictDoNothing()

    // create test channel
    await db
      .insert(channel)
      .values({
        id: testChannelId,
        name: 'Chat API Test Channel',
        serverId: testServerId,
        type: 'text',
      })
      .onConflictDoNothing()
  }
}

async function insertTestData(
  items: Array<{
    key: string
    title?: string
    value: string
    reliability?: number
    category?: string
    type?: string
  }>
) {
  if (typeof window === 'undefined') {
    const { getDb } = await import('~/database')
    const { data } = await import('~/database/schema-public')
    const db = getDb()

    for (const item of items) {
      await db
        .insert(data)
        .values({
          id: item.key,
          key: item.key,
          title: item.title || '',
          value: item.value,
          reliability: item.reliability || 1,
          category: item.category || null,
          type: item.type || 'data',
          serverId: testServerId,
        })
        .onConflictDoUpdate({
          target: data.id,
          set: {
            title: item.title || '',
            value: item.value,
            reliability: item.reliability || 1,
            category: item.category || null,
            type: item.type || 'data',
          },
        })
    }
  }
}

async function cleanupTestData(keys: string[]) {
  if (typeof window === 'undefined') {
    const { getDb } = await import('~/database')
    const { eq, inArray } = await import('drizzle-orm')
    const { user } = await import('~/database/schema-private')
    const { server, channel, data, userPublic } = await import('~/database/schema-public')
    const db = getDb()

    // clean up test data
    await db.delete(data).where(inArray(data.key, keys))

    // clean up test infrastructure
    await db.delete(channel).where(eq(channel.id, testChannelId))
    await db.delete(server).where(eq(server.id, testServerId))
    await db.delete(userPublic).where(eq(userPublic.id, testUserId))
    await db.delete(user).where(eq(user.id, testUserId))
  }
}

async function testSearchLibrary(query: string, options?: any) {
  if (typeof window === 'undefined') {
    const { searchActions } = await import('~/features/search/searchActions')
    return await searchActions.searchLibrary(query, options)
  }
  return []
}

async function testSearch(query: string, options?: any) {
  if (typeof window === 'undefined') {
    const { searchActions } = await import('~/features/search/searchActions')
    return await searchActions.search(query, options)
  }
  return []
}

test.describe('Chat API Integration Tests', () => {
  test.setTimeout(120000)

  const testDataKeys = [
    'chat-api-test-tamagui-v4-config',
    'chat-api-test-tamagui-tooltip-old',
    'chat-api-test-tamagui-button-v3',
    'chat-api-test-react-basics',
    'chat-api-test-tamagui-forms',
  ]

  test.beforeAll(async () => {
    console.info('Setting up test infrastructure and data...')

    await setupTestInfrastructure()

    await insertTestData([
      {
        key: 'chat-api-test-tamagui-v4-config',
        title: 'Tamagui v4 Configuration',
        value: `# Tamagui v4 Configuration Guide

Config v4 uses CSS animations by default on web and react-native animations on mobile.

## Shorthands

The v4 config includes these helpful shorthands for styling:

\`\`\`js
{
  // text
  text: 'textAlign',
  
  // view
  b: 'bottom',
  bg: 'backgroundColor',
  content: 'alignContent',
  grow: 'flexGrow',
  items: 'alignItems',
  justify: 'justifyContent',
  l: 'left',
  m: 'margin',
  maxH: 'maxHeight',
  maxW: 'maxWidth',
  mb: 'marginBottom',
  minH: 'minHeight',
  minW: 'minWidth',
  ml: 'marginLeft',
  mr: 'marginRight',
  mt: 'marginTop',
  mx: 'marginHorizontal',
  my: 'marginVertical',
  p: 'padding',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  pr: 'paddingRight',
  pt: 'paddingTop',
  px: 'paddingHorizontal',
  py: 'paddingVertical',
  r: 'right',
  rounded: 'borderRadius',
  select: 'userSelect',
  self: 'alignSelf',
  shrink: 'flexShrink',
  t: 'top',
  z: 'zIndex',
}
\`\`\`

These shorthands make your code more concise and readable.`,
        reliability: 5,
        category: 'config',
        type: 'documentation',
      },
      {
        key: 'chat-api-test-tamagui-tooltip-old',
        title: 'Tooltip Component (Deprecated v3)',
        value: `# OLD Tooltip Component - v3 DEPRECATED

This is the old tooltip API from Tamagui v3. Do not use this.

\`\`\`jsx
import { Tooltip } from '@tamagui/tooltip-v3'

// OLD API - DO NOT USE
<Tooltip text="Hello">
  <Button>Hover me</Button>
</Tooltip>
\`\`\`

Note: This API is deprecated. Use the new v4 Tooltip instead.`,
        reliability: 2,
        category: 'components',
        type: 'documentation',
      },
      {
        key: 'chat-api-test-tamagui-button-v3',
        title: 'Button Styling in v3',
        value: `# Button Component Styling Guide

In Tamagui v3, buttons used different prop names:

\`\`\`jsx
// v3 style (old)
<Button 
  margin={10}
  padding={20}
  borderRadius={5}
>
  Click me
</Button>
\`\`\`

Note: v3 used full prop names. In v4, use shorthands like m, p, rounded.`,
        reliability: 2,
        category: 'components',
        type: 'documentation',
      },
      {
        key: 'chat-api-test-react-basics',
        title: 'React Basics',
        value: `# React Fundamentals

React is a JavaScript library for building user interfaces.

## Components

Components are the building blocks of React applications:

\`\`\`jsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
\`\`\`

This is general React documentation not specific to Tamagui.`,
        reliability: 3,
        category: 'react',
        type: 'documentation',
      },
      {
        key: 'chat-api-test-tamagui-forms',
        title: 'Form Components',
        value: `# Tamagui Form Components

Tamagui provides form components with v4 config shorthands:

\`\`\`jsx
import { Form, Input, Label } from 'tamagui'

<Form>
  <Label htmlFor="name">Name</Label>
  <Input 
    id="name"
    px="$4"
    py="$2"
    rounded="$2"
    bg="$background"
  />
</Form>
\`\`\`

Notice the use of v4 shorthands like px, py, rounded, and bg.`,
        reliability: 4,
        category: 'components',
        type: 'documentation',
      },
    ])

    console.info('Test data inserted successfully')

    // wait for search indexing to complete
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.info('Waited for search indexing')
  })

  test.afterAll(async () => {
    console.info('Cleaning up test data...')
    await cleanupTestData(testDataKeys)
    console.info('Test data cleaned up')
  })

  test('search library finds relevant documents for different queries', async () => {
    // Test 1: Search for "marginHorizontal" - should find v4 config document
    const marginResults = await testSearchLibrary('marginHorizontal', {
      limit: 3,
    })

    expect(marginResults.length).toBeGreaterThan(0)
    const marginDoc = marginResults[0]
    console.info('marginHorizontal search:', {
      title: marginDoc?.title,
      hasMarginHorizontal: marginDoc?.content?.includes('marginHorizontal'),
    })
    expect(marginDoc?.content).toContain('marginHorizontal')

    // Test 2: Search for "form input label" - should find form components
    const formResults = await testSearchLibrary('form input label', {
      limit: 3,
    })

    expect(formResults.length).toBeGreaterThan(0)
    const formDoc = formResults[0]
    console.info('form search:', {
      title: formDoc?.title,
      hasFormContent:
        formDoc?.content?.includes('Form') || formDoc?.content?.includes('Input'),
    })
    expect(formDoc?.content).toMatch(/Form|Input|Label/i)

    // Test 3: Search for "react basics" - should find react documentation
    const reactResults = await testSearchLibrary('react basics', {
      limit: 3,
    })

    expect(reactResults.length).toBeGreaterThan(0)
    const reactDoc = reactResults[0]
    console.info('react search:', {
      title: reactDoc?.title,
      hasReactContent: reactDoc?.content?.includes('React'),
    })
    expect(reactDoc?.content).toContain('React')
  })

  test('search prioritizes reliability for library searches', async () => {
    const results = await testSearchLibrary('tamagui', {
      limit: 10,
    })

    const reliabilities = results.map((r) => r.reliability || 1)

    const avgFirstHalf = reliabilities.slice(0, 5).reduce((a, b) => a + b, 0) / 5
    const avgSecondHalf =
      reliabilities.slice(5).reduce((a, b) => a + b, 0) /
      Math.max(1, reliabilities.length - 5)

    console.info('Reliability distribution:', {
      firstHalf: avgFirstHalf,
      secondHalf: avgSecondHalf,
      all: reliabilities,
    })

    expect(avgFirstHalf).toBeGreaterThanOrEqual(avgSecondHalf)
  })

  test('vector search handles semantic similarity', async () => {
    const results1 = await testSearch('margin padding spacing', {
      limit: 5,
    })

    const results2 = await testSearch('mx my px py', {
      limit: 5,
    })

    console.info('Semantic search results:', {
      query1: results1.map((r) => r.title || r.content?.substring(0, 50)),
      query2: results2.map((r) => r.title || r.content?.substring(0, 50)),
    })

    const hasV4Config1 = results1.some(
      (r) =>
        r.content?.includes('marginHorizontal') ||
        r.content?.includes('paddingHorizontal')
    )

    const hasV4Config2 = results2.some(
      (r) =>
        r.content?.includes('marginHorizontal') ||
        r.content?.includes('paddingHorizontal')
    )

    expect(hasV4Config1 || hasV4Config2).toBe(true)
  })

  test('search filters work correctly', async () => {
    const allResults = await testSearch('tamagui', {
      limit: 20,
    })

    const libraryResults = await testSearchLibrary('tamagui', {
      limit: 20,
    })

    console.info('Search filter comparison:', {
      allCount: allResults.length,
      libraryCount: libraryResults.length,
      libraryReliabilities: libraryResults.map((r) => r.reliability),
    })

    const libraryMinReliability = Math.min(
      ...libraryResults.map((r) => r.reliability || 1)
    )
    expect(libraryMinReliability).toBeGreaterThanOrEqual(3)

    const libraryChatMessages = libraryResults.filter((r) => r.type === 'chat')
    expect(libraryChatMessages.length).toBe(0)
  })

  test('hybrid search balances text and vector scores', async () => {
    const exactMatch = await testSearch('marginHorizontal', {
      limit: 5,
    })

    const semanticMatch = await testSearch('spacing between elements horizontally', {
      limit: 5,
    })

    console.info('Hybrid search comparison:', {
      exact: exactMatch.map((r) => ({
        title: r.title,
        score: r._rankingScore,
      })),
      semantic: semanticMatch.map((r) => ({
        title: r.title,
        score: r._rankingScore,
      })),
    })

    const v4ConfigInExact = exactMatch.findIndex((r) =>
      r.content?.includes('marginHorizontal')
    )

    const v4ConfigInSemantic = semanticMatch.findIndex(
      (r) => r.content?.includes('marginHorizontal') || r.content?.includes('mx:')
    )

    expect(v4ConfigInExact).toBeGreaterThanOrEqual(0)
    expect(v4ConfigInExact).toBeLessThanOrEqual(2)

    if (v4ConfigInSemantic >= 0) {
      expect(v4ConfigInSemantic).toBeLessThanOrEqual(4)
    }
  })
})
