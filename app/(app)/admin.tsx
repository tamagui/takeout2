import { useZero } from '@rocicorp/zero/react'
import { randomId } from '@take-out/helpers'
import { useState } from 'react'
import { ScrollView, SizableText, XStack, YStack } from 'tamagui'

import { ADMIN_EMAIL } from '~/constants/app'
import { postsPaginated } from '~/data/queries/post'
import { useAuth } from '~/features/auth/client/authClient'
import { signInAsAdmin } from '~/features/auth/client/signInAsAdmin'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Input } from '~/interface/forms/Input'
import { showToast } from '~/interface/toast/helpers'
import { useQuery, zero } from '~/zero/client'

export default function AdminTestPage() {
  const auth = useAuth()
  const zeroInstance = useZero()
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [postCaption, setPostCaption] = useState('')
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])

  const [posts, postsStatus] = useQuery(postsPaginated, { pageSize: 10 })

  const addTestResult = (result: string) => {
    setTestResults((prev) => [...prev, `[${new Date().toISOString()}] ${result}`])
  }

  const handleAdminLogin = async () => {
    if (!password) {
      showToast('Please enter a password', { type: 'error' })
      return
    }
    setIsLoggingIn(true)
    addTestResult(`Attempting admin login with email: ${ADMIN_EMAIL}`)
    try {
      const result = await signInAsAdmin(password)
      if (result.success) {
        addTestResult('✅ Admin login successful!')
        showToast('Logged in as admin!', { type: 'success' })
      } else {
        addTestResult(`❌ Admin login failed: ${JSON.stringify(result.error)}`)
        showToast('Login failed', { type: 'error' })
      }
    } catch (error) {
      addTestResult(`❌ Admin login error: ${error}`)
      showToast('Login error', { type: 'error' })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleCreateTestPost = async () => {
    if (!auth.user?.id) {
      showToast('Must be logged in to create post', { type: 'error' })
      return
    }
    setIsCreatingPost(true)
    const postId = randomId()
    addTestResult(`Creating test post with id: ${postId}`)
    try {
      await zero.mutate.post.insert({
        id: postId,
        userId: auth.user.id,
        caption: postCaption || `Test post at ${new Date().toISOString()}`,
        image: '',
        hiddenByAdmin: false,
        createdAt: Date.now(),
      })
      addTestResult('✅ Post mutation completed (client-side)')
      showToast('Post created!', { type: 'success' })
      setPostCaption('')
    } catch (error) {
      addTestResult(`❌ Post creation error: ${error}`)
      showToast('Post creation failed', { type: 'error' })
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    addTestResult(`Deleting post: ${postId}`)
    try {
      await zero.mutate.post.delete({ id: postId })
      addTestResult('✅ Post deleted')
      showToast('Post deleted!', { type: 'success' })
    } catch (error) {
      addTestResult(`❌ Delete error: ${error}`)
      showToast('Delete failed', { type: 'error' })
    }
  }

  return (
    <ScrollView flex={1} bg="$background">
      <YStack p="$4" gap="$6" maxW={800} mx="auto" width="100%">
        <SizableText size="$8" fontWeight="bold">
          Admin Test Page
        </SizableText>

        {/* Auth Status Section */}
        <YStack gap="$3" p="$4" bg="$color2" rounded="$4">
          <SizableText size="$6" fontWeight="600">
            Auth Status
          </SizableText>
          <YStack gap="$2">
            <SizableText>
              State: <SizableText fontWeight="bold">{auth.state}</SizableText>
            </SizableText>
            <SizableText>
              User ID:{' '}
              <SizableText fontWeight="bold">{auth.user?.id || 'none'}</SizableText>
            </SizableText>
            <SizableText>
              Email:{' '}
              <SizableText fontWeight="bold">{auth.user?.email || 'none'}</SizableText>
            </SizableText>
            <SizableText>
              Token:{' '}
              <SizableText fontWeight="bold">
                {auth.token ? `${auth.token.slice(0, 20)}...` : 'none'}
              </SizableText>
            </SizableText>
          </YStack>
        </YStack>

        {/* Zero Status Section */}
        <YStack gap="$3" p="$4" bg="$color2" rounded="$4">
          <SizableText size="$6" fontWeight="600">
            Zero Sync Status
          </SizableText>
          <YStack gap="$2">
            <SizableText>
              Zero Instance:{' '}
              <SizableText fontWeight="bold">
                {zeroInstance ? 'Connected' : 'Not connected'}
              </SizableText>
            </SizableText>
            <SizableText>
              Posts Query Status:{' '}
              <SizableText fontWeight="bold">{postsStatus.type}</SizableText>
            </SizableText>
            <SizableText>
              Posts Count:{' '}
              <SizableText fontWeight="bold">{posts?.length || 0}</SizableText>
            </SizableText>
          </YStack>
        </YStack>

        {/* Admin Login Section */}
        {auth.state !== 'logged-in' && (
          <YStack gap="$3" p="$4" bg="$color2" rounded="$4">
            <SizableText size="$6" fontWeight="600">
              Admin Login
            </SizableText>
            <SizableText size="$3" color="$color10">
              Email: {ADMIN_EMAIL}
            </SizableText>
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <ButtonSimple onPress={handleAdminLogin} disabled={isLoggingIn}>
              {isLoggingIn ? 'Logging in...' : 'Login as Admin'}
            </ButtonSimple>
          </YStack>
        )}

        {/* Create Post Section */}
        {auth.state === 'logged-in' && (
          <YStack gap="$3" p="$4" bg="$color2" rounded="$4">
            <SizableText size="$6" fontWeight="600">
              Test Mutations
            </SizableText>
            <Input
              placeholder="Post caption (optional)"
              value={postCaption}
              onChangeText={setPostCaption}
            />
            <ButtonSimple onPress={handleCreateTestPost} disabled={isCreatingPost}>
              {isCreatingPost ? 'Creating...' : 'Create Test Post'}
            </ButtonSimple>
          </YStack>
        )}

        {/* Posts List Section */}
        <YStack gap="$3" p="$4" bg="$color2" rounded="$4">
          <SizableText size="$6" fontWeight="600">
            Posts ({posts?.length || 0})
          </SizableText>
          {postsStatus.type === 'unknown' && <SizableText>Loading posts...</SizableText>}
          {posts?.map((post) => (
            <YStack key={post.id} p="$3" bg="$color3" rounded="$3" gap="$2">
              <SizableText size="$2" color="$color10">
                ID: {post.id}
              </SizableText>
              <SizableText>{post.caption || '(no caption)'}</SizableText>
              <SizableText size="$2" color="$color10">
                Created: {new Date(post.createdAt).toLocaleString()}
              </SizableText>
              <XStack gap="$2">
                <ButtonSimple size="small" onPress={() => handleDeletePost(post.id)}>
                  Delete
                </ButtonSimple>
              </XStack>
            </YStack>
          ))}
          {posts?.length === 0 && postsStatus.type === 'complete' && (
            <SizableText color="$color10">No posts yet. Create one above!</SizableText>
          )}
        </YStack>

        {/* Test Results Log */}
        <YStack gap="$3" p="$4" bg="$color2" rounded="$4">
          <XStack justify="space-between" items="center">
            <SizableText size="$6" fontWeight="600">
              Test Log
            </SizableText>
            <ButtonSimple size="small" onPress={() => setTestResults([])}>
              Clear
            </ButtonSimple>
          </XStack>
          <YStack gap="$1" maxH={300} overflow="scroll">
            {testResults.length === 0 && (
              <SizableText color="$color10">No test results yet</SizableText>
            )}
            {testResults.map((result, i) => (
              <SizableText key={i} size="$2" fontFamily="$mono">
                {result}
              </SizableText>
            ))}
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
