import { memo, useState } from 'react'
import { Button, Input, ScrollView, Text, XStack, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { authFetch } from '~/auth/client/authFetch'
import { Select } from '~/interface/select/Select'
import { showToast } from '~/interface/toast/Toast'

type SearchResult = {
  id: string
  title: string
  content: string
  type: string
  category?: string
  server?: string
  reliability?: number
  score?: number
}

type SearchResponse = {
  results: SearchResult[]
  totalCount: number
  searchType: string
  query: string
  error?: string
}

export const DevToolsSearch = ({ open }: { open: boolean }) => {
  const { state } = useAuth()
  return state === 'logged-in' && open ? <Content /> : null
}

const Content = memo(() => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('hybrid')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [serverId, setServerId] = useState('')

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('Please enter a search query', { type: 'error' })
      return
    }

    setSearching(true)
    setSearchResults(null)

    try {
      const { data, error } = await authFetch<SearchResponse>('/api/search-dev', {
        method: 'POST',
        body: {
          query: searchQuery,
          searchType,
          serverId: serverId || undefined,
        },
      })

      if (error) {
        showToast(`Search error: ${error.message || 'Search failed'}`, { type: 'error' })
      } else if (data?.error) {
        showToast(`Search error: ${data.error}`, { type: 'error' })
      } else if (data) {
        setSearchResults(data)
        showToast(`Found ${data.totalCount} results`, { type: 'info' })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      showToast(`Search failed: ${errorMessage}`, { type: 'error' })
    }

    setSearching(false)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
  }

  const testQueries = [
    'postgresql',
    'vector search',
    'database',
    'pgvector',
    'hello world',
    'test',
  ]

  const handleTestData = async () => {
    try {
      const { data, error } = await authFetch('/api/search/test-data', {
        method: 'POST',
      })

      if (error) {
        showToast(`Error creating test data: ${error.message}`, { type: 'error' })
      } else if (data) {
        showToast('Test data created successfully', { type: 'info' })
      }
    } catch (err) {
      showToast(`Failed to create test data: ${err}`, { type: 'error' })
    }
  }

  return (
    <YStack flex={1} p="$4" gap="$4">
      {/* header */}
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600">
          PostgreSQL Search Test
        </Text>
        <Text fontSize="$2" color="$color11">
          Test the new PostgreSQL-based search with pgvector and full-text search
        </Text>
      </YStack>

      {/* search controls */}
      <YStack gap="$3" borderWidth={1} borderColor="$borderColor" rounded="$4" p="$3">
        <Text fontSize="$3" fontWeight="600">
          Search Test
        </Text>

        <XStack gap="$2" items="center">
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Enter search query..."
            size="$3"
            flex={1}
            onSubmitEditing={handleSearch}
          />
          <Button onPress={clearSearch} size="$3" variant="outlined">
            Clear
          </Button>
        </XStack>

        <XStack gap="$2" items="center">
          <Text fontSize="$2" minW={80}>
            Server ID:
          </Text>
          <Input
            value={serverId}
            onChangeText={setServerId}
            placeholder="Optional server ID filter..."
            size="$3"
            flex={1}
          />
        </XStack>

        <XStack gap="$2" items="center">
          <Text fontSize="$2" minW={80}>
            Search Type:
          </Text>
          <Select
            items={[
              { id: 'hybrid', name: 'Hybrid (Vector + Text)' },
              { id: 'fulltext', name: 'Full-Text Search' },
              { id: 'fuzzy', name: 'Fuzzy (Typo Tolerant)' },
              { id: 'vector', name: 'Vector (Semantic)' },
              { id: 'exact', name: 'Exact Match' },
            ]}
            value={searchType}
            onValueChange={setSearchType}
            size="$3"
            width="50%"
          />
        </XStack>

        <XStack gap="$2" justify="space-between">
          <Button
            onPress={handleSearch}
            disabled={searching || !searchQuery.trim()}
            size="$3"
            theme="blue"
            flex={1}
          >
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </XStack>

        {/* test queries */}
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Quick test queries:
          </Text>
          <XStack gap="$2" flexWrap="wrap">
            {testQueries.map((query) => (
              <Button
                key={query}
                size="$2"
                variant="outlined"
                onPress={() => {
                  setSearchQuery(query)
                  handleSearch()
                }}
              >
                {query}
              </Button>
            ))}
          </XStack>
        </YStack>
      </YStack>

      {/* utilities */}
      <YStack gap="$3" borderWidth={1} borderColor="$borderColor" rounded="$4" p="$3">
        <Text fontSize="$3" fontWeight="600">
          Utilities
        </Text>
        <XStack gap="$2">
          <Button onPress={handleTestData} size="$3" theme="green">
            Create Test Data
          </Button>
        </XStack>
      </YStack>

      {/* results */}
      {searchResults && (
        <YStack
          gap="$3"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$4"
          p="$3"
          flex={1}
        >
          <XStack justify="space-between" items="center">
            <Text fontSize="$3" fontWeight="600">
              Results ({searchResults.totalCount})
            </Text>
            <Text fontSize="$2" color="$color11">
              Type: {searchResults.searchType} | Query: "{searchResults.query}"
            </Text>
          </XStack>

          <ScrollView flex={1} showsVerticalScrollIndicator>
            <YStack gap="$2">
              {searchResults.results.length === 0 ? (
                <Text color="$color11" text="center" p="$4">
                  No results found
                </Text>
              ) : (
                searchResults.results.map((result, index) => (
                  <YStack
                    key={result.id}
                    p="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                    rounded="$2"
                    gap="$2"
                    bg={index % 2 === 0 ? '$background' : '$backgroundHover'}
                  >
                    <XStack justify="space-between" items="center">
                      <Text fontSize="$2" fontWeight="600" flex={1} numberOfLines={1}>
                        {result.title || 'Untitled'}
                      </Text>
                      {result.score !== undefined && (
                        <Text fontSize="$1" color="$color11">
                          Score: {result.score.toFixed(4)}
                        </Text>
                      )}
                    </XStack>

                    <Text fontSize="$2" numberOfLines={3} color="$color11">
                      {result.content}
                    </Text>

                    <XStack gap="$2" flexWrap="wrap">
                      <Text fontSize="$1" color="$color10">
                        Type: {result.type}
                      </Text>
                      {result.category && (
                        <Text fontSize="$1" color="$color10">
                          Category: {result.category}
                        </Text>
                      )}
                      {result.server && (
                        <Text fontSize="$1" color="$color10">
                          Server: {result.server}
                        </Text>
                      )}
                      {result.reliability && (
                        <Text fontSize="$1" color="$color10">
                          Reliability: {result.reliability}
                        </Text>
                      )}
                    </XStack>

                    <Text fontSize="$1" color="$color9" opacity={0.6}>
                      ID: {result.id}
                    </Text>
                  </YStack>
                ))
              )}
            </YStack>
          </ScrollView>
        </YStack>
      )}
    </YStack>
  )
})
