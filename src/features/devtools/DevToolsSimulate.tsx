import { useEffect, useRef, useState } from 'react'
import { Input, SizableText, XStack, YStack } from 'tamagui'
import { useCurrentChannelId } from '~/context/CurrentChannelContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { authClient } from '~/auth/client/authClient'
import { createMention } from '~/features/mention/createMention'
import { createMessageOrder } from '~/features/message/createMessageOrder'
import { insertMessage } from '~/features/message/insertMessage'
import { getRandomItem } from '@vxrn/helpers'
import { ensure } from '@vxrn/helpers'
import { randomId } from '@vxrn/helpers'
import { slugify } from '@vxrn/helpers'
import type { Timer } from '@vxrn/helpers'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { LabeledGroup } from '~/interface/forms/LabeledGroup'
import { Select } from '~/interface/select/Select'
import { showToast } from '~/interface/toast/Toast'
import { useQuery, zero } from '~/zero/client'
import { getPrivateChatId } from '../user/getPrivateChatId'
import { getUser } from '../user/getUser'
import { impersonate } from './utils'

// Test user configuration
const TEST_USER_PREFIX = 'test_bot_'

const testUserNames = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Iris',
  'Jack',
  'Kate',
  'Liam',
  'Maya',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Rose',
  'Sam',
  'Tara',
]

// Message content templates
const messageTemplates = [
  'Hey everyone! 👋',
  'What do you think about this?',
  'I agree with that point.',
  'Has anyone tried this approach?',
  'This is really interesting!',
  'I have a question about this.',
  'Great work on this!',
  'Could you elaborate on that?',
  'Thanks for sharing!',
  'I think we should consider...',
]

const codeTemplates = [
  '```javascript\nconst result = await fetchData();\nconsole.log(result);\n```',
  '```python\ndef process_data(items):\n    return [item * 2 for item in items]\n```',
  '```typescript\ninterface User {\n  id: string;\n  name: string;\n  email: string;\n}\n```',
]

const markdownTemplates = [
  '# Important Update\n\nWe have some **exciting news** to share!',
  '## Quick Tips\n\n- First tip\n- Second tip\n- Third tip',
  "### Summary\n\nHere's what we've accomplished:\n\n1. Item one\n2. Item two",
]

type SimulatorState = {
  isRunning: boolean
  actionCount: number
  lastAction: string
  isInitialized: boolean
  isInitializing: boolean
}

type ActionType =
  | 'createMessage'
  | 'replyToMessage'
  | 'startThread'
  | 'replyInThread'
  | 'addReaction'
  | 'mentionMe'
  | 'mentionMeOtherChannel'
  | 'requestFriendship'
  | 'dmMe'

export const DevToolsSimulate = () => {
  const serverId = useCurrentServerId()
  const currentChannelId = useCurrentChannelId()
  const intervalRef = useRef<Timer | null>(null)

  const [state, setState] = useState<SimulatorState>({
    isRunning: false,
    actionCount: 0,
    lastAction: '',
    isInitialized: false,
    isInitializing: false,
  })

  // Query all test users - we'll ensure they're in the server when creating
  // Note: usernames are slugified, so test_bot_Alice becomes test-bot-alice
  const slugifiedPrefix = slugify(TEST_USER_PREFIX)
  const [testUsers] = useQuery(
    zero.query.userPublic
      .where('username', 'LIKE', `${slugifiedPrefix}%`)
      .orderBy('username', 'asc'),
    {
      enabled: !!serverId,
    }
  )

  const [config, setConfig] = useState({
    intervalSeconds: 2,
    activeUserCount: 2,
  })

  const [selectedUserId, setSelectedUserId] = useState<string>('')

  // Create test users
  const createTestUsers = async (number = 10) => {
    if (!serverId) {
      showToast('No server selected!')
      return
    }

    setState((prev) => ({ ...prev, isInitializing: true }))
    showToast(`Creating ${number} test users...`)

    const users: Array<{ id: string; name: string }> = []

    try {
      // Check for existing test users by their slugified usernames
      const existingUsers = await zero.query.userPublic
        .where('username', 'LIKE', `${slugifiedPrefix}%`)
        .run({ type: 'complete' })

      // Create missing test users
      const offset = testUsers.length
      for (let i = offset; i < offset + number; i++) {
        const testUserName = `${TEST_USER_PREFIX}${testUserNames[i]}`
        const expectedUsername = slugify(testUserName)
        const existing = existingUsers.find((u) => u.username === expectedUsername)

        if (existing) {
          // Check if user is already a member of the server
          const isMember = await zero.query.serverMember
            .where('serverId', serverId)
            .where('userId', existing.id)
            .one()
            .run({ type: 'complete' })

          if (!isMember) {
            // Add existing user to server
            await zero.mutate.serverMember.insert({
              serverId,
              userId: existing.id,
              joinedAt: Date.now(),
              hasClosedWelcome: false,
            }).client
          }

          users.push({ id: existing.id, name: existing.username })
          continue
        }

        const userResult = await authClient.admin.createUser({
          name: testUserName,
          email: `${expectedUsername.toLowerCase()}@test.local`,
          password: 'test123456',
          role: 'user',
        })

        const userId = userResult?.data?.user?.id
        if (!userId) continue

        await zero.mutate.userPublic.completeSignup(userId).server

        await zero.mutate.serverMember.insert({
          serverId,
          userId,
          joinedAt: Date.now(),
          hasClosedWelcome: false,
        }).client

        users.push({ id: userId, name: expectedUsername })
      }

      showToast(`Test users ready! Found/created ${users.length} users.`)
      setState((prev) => ({ ...prev, isInitialized: true, isInitializing: false }))
    } catch (error) {
      console.error('Error creating test users:', error)
      showToast('Error creating test users')
      setState((prev) => ({ ...prev, isInitializing: false }))
    }
  }

  // Get random channels from current server
  const getRandomChannel = async () => {
    if (!serverId) return null

    const channels = await zero.query.channel
      .where('serverId', serverId)
      .where('deleted', '!=', true)
      .run({ type: 'complete' })

    return getRandomItem(channels)
  }

  // Get random message from a channel
  const getRandomMessage = async (channelId: string) => {
    const messages = await zero.query.message
      .where('channelId', channelId)
      .where('type', '!=', 'draft')
      .where('deleted', false)
      .limit(50)
      .orderBy('order', 'desc')
      .run({ type: 'complete' })

    return getRandomItem(messages)
  }

  // Get message content for specific action types
  const getMessageContentForAction = (
    testUser: { id: string; name: string },
    action: ActionType
  ): string => {
    const currentUser = getUser()

    switch (action) {
      case 'mentionMe':
        return currentUser
          ? `${createMention({ type: 'user', user: currentUser })} Hey, I wanted to get your thoughts on this!`
          : ''
      case 'requestFriendship':
        return currentUser
          ? `${createMention({ type: 'user', user: currentUser })} Would you like to connect? I think we have similar interests!`
          : ''
      default:
        return getMessageContent(testUser)
    }
  }

  // Get message content with variations
  const getMessageContent = (testUser: { id: string; name: string }): string => {
    const contentType = Math.random()
    const currentUser = getUser()

    if (contentType < 0.2) {
      ensure(currentUser)
      // Mention current user
      return `${createMention({ type: 'user', user: currentUser })} ${getRandomItem(messageTemplates) || 'Hello!'}`
    } else if (contentType < 0.3) {
      // Mention another test user
      const otherUser = getRandomItem(
        testUsers?.filter((u) => u.id !== testUser.id) || []
      )
      if (otherUser) {
        return `${createMention({ type: 'user', user: otherUser })} ${getRandomItem(messageTemplates) || 'Hello!'}`
      }
    } else if (contentType < 0.4) {
      // Code block
      return getRandomItem(codeTemplates) || '```\n// code here\n```'
    } else if (contentType < 0.5) {
      // Markdown
      return getRandomItem(markdownTemplates) || '# Hello World'
    } else if (contentType < 0.6) {
      // @here mention
      return `${createMention({ type: 'here' })} ${getRandomItem(messageTemplates) || 'Hello!'}`
    }

    return getRandomItem(messageTemplates) || 'Hello from test user!'
  }

  // Execute a specific action
  const executeSpecificAction = async (
    actionType: ActionType,
    testUser?: { id: string; name: string }
  ) => {
    if (!serverId || !testUsers || testUsers.length === 0) {
      showToast('No test users available!')
      return
    }

    const user = testUser || getRandomItem(testUsers)
    if (!user) return

    const channel = await getRandomChannel()
    if (!channel) {
      showToast('No channels available!')
      return
    }

    try {
      switch (actionType) {
        case 'createMessage':
        case 'mentionMe':
        case 'requestFriendship': {
          const lastMessage = await zero.query.message
            .where('channelId', channel.id)
            .where('type', '!=', 'draft')
            .orderBy('order', 'desc')
            .one()
            .run({ type: 'complete' })

          const messageData = {
            channelId: channel.id,
            content: getMessageContentForAction(user, actionType),
            creatorId: user.id,
            serverId: channel.serverId,
          }

          await insertMessage(lastMessage || null, messageData)
          showToast(`${(user as any).username || user.name}: ${actionType}`)
          break
        }

        case 'mentionMeOtherChannel': {
          // get all channels except the current one
          const allChannels = await zero.query.channel
            .where('serverId', serverId)
            .where('deleted', '!=', true)
            .run({ type: 'complete' })

          const otherChannels = allChannels.filter((ch) => ch.id !== currentChannelId)

          if (otherChannels.length === 0) {
            showToast('No other channels available!')
            return
          }

          const targetChannel = getRandomItem(otherChannels)
          if (!targetChannel) return

          const lastMessage = await zero.query.message
            .where('channelId', targetChannel.id)
            .where('type', '!=', 'draft')
            .orderBy('order', 'desc')
            .one()
            .run({ type: 'complete' })

          const currentUser = getUser()
          const content = currentUser
            ? `${createMention({ type: 'user', user: currentUser })} Hey! This is a mention from another channel (#${targetChannel.name})`
            : 'Test message from another channel'

          await insertMessage(lastMessage || null, {
            channelId: targetChannel.id,
            content,
            creatorId: user.id,
            serverId: targetChannel.serverId,
          })

          showToast(
            `${(user as any).username || user.name}: mentioned you in #${targetChannel.name}`
          )
          break
        }

        case 'replyToMessage': {
          const targetMessage = await getRandomMessage(channel.id)
          if (targetMessage) {
            const lastMessage = await zero.query.message
              .where('channelId', channel.id)
              .where('type', '!=', 'draft')
              .orderBy('order', 'desc')
              .one()
              .run({ type: 'complete' })

            await insertMessage(lastMessage || null, {
              channelId: channel.id,
              content: getMessageContent(user),
              creatorId: user.id,
              serverId: channel.serverId,
              replyingToId: targetMessage.id,
              isThreadReply: !!targetMessage.threadId,
            })

            showToast(`${(user as any).username || user.name}: replied to message`)
          }
          break
        }

        case 'startThread': {
          const targetMessage = await getRandomMessage(channel.id)
          if (targetMessage && !targetMessage.threadId) {
            const threadId = randomId()

            await zero.mutate.thread.insert({
              id: threadId,
              nextDraftId: randomId(),
              messageId: targetMessage.id,
              channelId: channel.id,
              creatorId: user.id,
              title: ``,
              serverId: channel.serverId || '',
              createdAt: Date.now(),
              replyCount: 0,
              deleted: false,
            }).client

            await zero.mutate.message.update({
              id: targetMessage.id,
              threadId,
            })

            // Get last message in thread (should be empty for new thread, so null is correct)
            const lastThreadMessage = await zero.query.message
              .where('threadId', threadId)
              .orderBy('order', 'desc')
              .one()
              .run({ type: 'complete' })

            await zero.mutate.message.insert({
              id: randomId(),
              channelId: channel.id,
              threadId: threadId || '',
              content: getMessageContent(user),
              creatorId: user.id,
              serverId: channel.serverId || '',
              createdAt: Date.now(),
              deleted: false,
              isThreadReply: true,
              order: createMessageOrder(lastThreadMessage),
              summary: null,
              type: 'person',
              replyingToId: null,
              updatedAt: null,
            })

            showToast(`${(user as any).username || user.name}: started thread`)
          }
          break
        }

        case 'replyInThread': {
          const messagesWithThreads = await zero.query.message
            .where('channelId', channel.id)
            .where('threadId', 'IS NOT', null)
            .limit(10)
            .run({ type: 'complete' })

          const messageWithThread = getRandomItem(messagesWithThreads)
          if (messageWithThread?.threadId) {
            const lastThreadMessage = await zero.query.message
              .where('threadId', messageWithThread.threadId)
              .orderBy('order', 'desc')
              .one()
              .run({ type: 'complete' })

            await zero.mutate.message.insert({
              id: randomId(),
              channelId: channel.id,
              threadId: messageWithThread.threadId || '',
              content: getMessageContent(user),
              creatorId: user.id,
              serverId: channel.serverId || '',
              createdAt: Date.now(),
              deleted: false,
              isThreadReply: true,
              order: createMessageOrder(lastThreadMessage),
              summary: null,
              type: 'person',
              replyingToId: null,
              updatedAt: null,
            })

            showToast(`${(user as any).username || user.name}: replied in thread`)
          }
          break
        }

        case 'addReaction': {
          const targetMessage = await getRandomMessage(channel.id)
          if (targetMessage) {
            const availableReactions = await zero.query.reaction
              .limit(20)
              .run({ type: 'complete' })

            if (availableReactions.length > 0) {
              const reactionRecord = getRandomItem(availableReactions)

              if (reactionRecord) {
                const existingReaction = await zero.query.messageReaction
                  .where('messageId', targetMessage.id)
                  .where('creatorId', user.id)
                  .where('reactionId', reactionRecord.id)
                  .one()
                  .run({ type: 'complete' })

                if (!existingReaction) {
                  await zero.mutate.messageReaction.insert({
                    messageId: targetMessage.id,
                    creatorId: user.id,
                    reactionId: reactionRecord.id,
                    channelId: channel.id,
                    createdAt: Date.now(),
                  }).client

                  showToast(`${(user as any).username || user.name}: added reaction`)
                }
              }
            }
          }
          break
        }

        case 'dmMe': {
          const currentUser = getUser()
          if (!currentUser) {
            showToast('Not logged in!')
            return
          }

          const privateChatId = getPrivateChatId({
            requestingId: user.id,
            acceptingId: currentUser.id,
          })

          const existingServer = await zero.query.server
            .where('id', privateChatId)
            .one()
            .run({ type: 'complete' })

          if (!existingServer) {
            const friendships1 = await zero.query.friendship
              .where('requestingId', user.id)
              .where('acceptingId', currentUser.id)
              .run({ type: 'complete' })

            const friendships2 = await zero.query.friendship
              .where('requestingId', currentUser.id)
              .where('acceptingId', user.id)
              .run({ type: 'complete' })

            const friendships = [...friendships1, ...friendships2]
            let friendship = friendships[0]

            if (!friendship) {
              await zero.mutate.friendship.insert({
                requestingId: user.id,
                acceptingId: currentUser.id,
                createdAt: Date.now(),
                accepted: true,
              })
            } else if (!friendship.accepted) {
              await zero.mutate.friendship.update({
                ...friendship,
                accepted: true,
              }).client
            }
          }

          const privateChannel = await zero.query.channel
            .where('id', privateChatId)
            .one()
            .run({ type: 'complete' })

          if (privateChannel) {
            const lastMessage = await zero.query.message
              .where('channelId', privateChannel.id)
              .where('type', '!=', 'draft')
              .orderBy('order', 'desc')
              .one()
              .run({ type: 'complete' })

            await insertMessage(lastMessage || null, {
              channelId: privateChannel.id,
              content: `Hey ${currentUser.name || 'there'}! ${getRandomItem(messageTemplates) || 'How are you?'}`,
              creatorId: user.id,
              serverId: privateChannel.serverId,
            })

            showToast(`${(user as any).username || user.name}: sent you a DM`)
          }
          break
        }
      }
    } catch (error) {
      console.error(`Error executing ${actionType}:`, error)
      showToast(`Error: ${actionType} failed`)
    }
  }

  // Execute a random action
  const executeRandomAction = async () => {
    if (!serverId || !testUsers || testUsers.length === 0) {
      return
    }

    // This check is removed - the interval will be cleared when simulation stops

    try {
      // Select random users
      const activeUsers: Array<{ id: string; name: string }> = []
      for (let i = 0; i < config.activeUserCount; i++) {
        const user = getRandomItem(testUsers)
        if (user && !activeUsers.includes(user)) {
          activeUsers.push(user)
        }
      }

      if (activeUsers.length === 0) {
        return
      }

      const actions: ActionType[] = [
        'createMessage',
        'replyToMessage',
        'startThread',
        'replyInThread',
        'addReaction',
        'mentionMe',
        'requestFriendship',
        'dmMe',
      ]

      const summaryParts: string[] = []

      for (const testUser of activeUsers) {
        const action = getRandomItem(actions)
        const channel = await getRandomChannel()

        if (!channel) {
          continue
        }

        try {
          switch (action) {
            case 'createMessage':
            case 'mentionMe':
            case 'requestFriendship': {
              const lastMessage = await zero.query.message
                .where('channelId', channel.id)
                .where('type', '!=', 'draft')
                .orderBy('order', 'desc')
                .one()
                .run({ type: 'complete' })

              const hasAttachment = Math.random() < 0.2

              const messageData = {
                channelId: channel.id,
                content: getMessageContentForAction(testUser, action),
                creatorId: testUser.id,
                serverId: channel.serverId,
                attachments:
                  hasAttachment && action === 'createMessage'
                    ? [
                        {
                          id: randomId(),
                          url: 'https://storage.start.chat/onechatimages/uploads/8oz9w1kuzs7-large-icon.png',
                          type: 'image',
                          name: 'placeholder.png',
                          size: 1024,
                        },
                      ]
                    : undefined,
              }

              await insertMessage(lastMessage || null, messageData)

              summaryParts.push(
                action === 'mentionMe'
                  ? 'mention'
                  : action === 'requestFriendship'
                    ? 'friendship'
                    : 'message'
              )
              break
            }

            case 'replyToMessage': {
              const targetMessage = await getRandomMessage(channel.id)
              if (targetMessage) {
                const lastMessage = await zero.query.message
                  .where('channelId', channel.id)
                  .where('type', '!=', 'draft')
                  .orderBy('order', 'desc')
                  .one()
                  .run({ type: 'complete' })

                await insertMessage(lastMessage || null, {
                  channelId: channel.id,
                  content: getMessageContent(testUser),
                  creatorId: testUser.id,
                  serverId: channel.serverId,
                  replyingToId: targetMessage.id,
                })

                summaryParts.push('reply')
              }
              break
            }

            case 'startThread': {
              const targetMessage = await getRandomMessage(channel.id)
              if (targetMessage && !targetMessage.threadId) {
                const threadId = randomId()

                // First create the thread record - await the client mutation
                await zero.mutate.thread.insert({
                  id: threadId,
                  nextDraftId: randomId(),
                  messageId: targetMessage.id,
                  channelId: channel.id,
                  creatorId: testUser.id,
                  title: ``,
                  serverId: channel.serverId || '',
                  createdAt: Date.now(),
                  replyCount: 0,
                  deleted: false,
                }).client

                // Then update original message to have thread
                await zero.mutate.message.update({
                  id: targetMessage.id,
                  threadId,
                })

                summaryParts.push('thread')
              }
              break
            }

            case 'replyInThread': {
              // Find a message with a thread
              const messagesWithThreads = await zero.query.message
                .where('channelId', channel.id)
                .where('threadId', 'IS NOT', null)
                .limit(10)
                .run({ type: 'complete' })

              const messageWithThread = getRandomItem(messagesWithThreads)
              if (messageWithThread?.threadId) {
                const lastThreadMessage = await zero.query.message
                  .where('threadId', messageWithThread.threadId)
                  .orderBy('order', 'desc')
                  .one()
                  .run({ type: 'complete' })

                await zero.mutate.message.insert({
                  id: randomId(),
                  channelId: channel.id,
                  threadId: messageWithThread.threadId || '',
                  content: getMessageContent(testUser),
                  creatorId: testUser.id,
                  serverId: channel.serverId || '',
                  createdAt: Date.now(),
                  deleted: false,
                  isThreadReply: true,
                  order: createMessageOrder(lastThreadMessage),
                  summary: null,
                  type: 'person',
                  replyingToId: null,
                  updatedAt: null,
                })

                summaryParts.push('thread reply')
              }
              break
            }

            case 'addReaction': {
              const targetMessage = await getRandomMessage(channel.id)
              if (targetMessage) {
                // Get available reactions from database
                const availableReactions = await zero.query.reaction
                  .limit(20)
                  .run({ type: 'complete' })

                if (availableReactions.length > 0) {
                  const reactionRecord = getRandomItem(availableReactions)

                  if (reactionRecord) {
                    // Check if user already reacted with this emoji
                    const existingReaction = await zero.query.messageReaction
                      .where('messageId', targetMessage.id)
                      .where('creatorId', testUser.id)
                      .where('reactionId', reactionRecord.id)
                      .one()
                      .run({ type: 'complete' })

                    if (!existingReaction) {
                      await zero.mutate.messageReaction.insert({
                        messageId: targetMessage.id,
                        creatorId: testUser.id,
                        reactionId: reactionRecord.id,
                        channelId: channel.id,
                        createdAt: Date.now(),
                      }).client

                      summaryParts.push('reaction')
                    }
                  }
                }
              }
              break
            }

            case 'dmMe': {
              const currentUser = getUser()
              if (!currentUser) {
                break
              }

              const privateChatId = getPrivateChatId({
                requestingId: testUser.id,
                acceptingId: currentUser.id,
              })

              const existingServer = await zero.query.server
                .where('id', privateChatId)
                .one()
                .run({ type: 'complete' })

              if (!existingServer) {
                const friendships1 = await zero.query.friendship
                  .where('requestingId', testUser.id)
                  .where('acceptingId', currentUser.id)
                  .run({ type: 'complete' })

                const friendships2 = await zero.query.friendship
                  .where('requestingId', currentUser.id)
                  .where('acceptingId', testUser.id)
                  .run({ type: 'complete' })

                const friendships = [...friendships1, ...friendships2]
                let friendship = friendships[0]

                if (!friendship) {
                  await zero.mutate.friendship.insert({
                    requestingId: testUser.id,
                    acceptingId: currentUser.id,
                    createdAt: Date.now(),
                    accepted: true,
                  })
                } else if (!friendship.accepted) {
                  await zero.mutate.friendship.update({
                    ...friendship,
                    accepted: true,
                  })
                }
              }

              const privateChannel = await zero.query.channel
                .where('id', privateChatId)
                .one()
                .run({ type: 'complete' })

              if (privateChannel) {
                const lastMessage = await zero.query.message
                  .where('channelId', privateChannel.id)
                  .where('type', '!=', 'draft')
                  .orderBy('order', 'desc')
                  .one()
                  .run({ type: 'complete' })

                await insertMessage(lastMessage || null, {
                  channelId: privateChannel.id,
                  content: `Hey ${currentUser.name || 'there'}! ${getRandomItem(messageTemplates) || 'How are you?'}`,
                  creatorId: testUser.id,
                  serverId: privateChannel.serverId,
                })

                summaryParts.push('dm')
              }
              break
            }
          }
        } catch (actionError) {
          console.error(
            `Error executing ${action} for user ${(testUser as any).username || testUser.name}:`,
            actionError
          )
          // Add to summary so we know something failed
          summaryParts.push(`failed-${action}`)
        }
      }

      // Update state and show summary
      const summary = summaryParts.reduce(
        (acc, part) => {
          acc[part] = (acc[part] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      const summaryText = Object.entries(summary)
        .map(([action, count]) => `${count} ${action}${count > 1 ? 's' : ''}`)
        .join(', ')

      setState((prev) => ({
        ...prev,
        actionCount: prev.actionCount + summaryParts.length,
        lastAction: summaryText,
      }))

      if (summaryParts.length > 0) {
        showToast(`${activeUsers.length} users: ${summaryText}`)
      } else {
        showToast('No actions executed - check console for errors')
      }
    } catch (error) {
      console.error('Error executing action:', error)
      showToast('Error executing actions - check console')
    }
  }

  // Start simulation
  const startSimulation = async () => {
    // Stop any existing simulation first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setState((prev) => ({ ...prev, isRunning: true, actionCount: 0 }))

    // Execute first action immediately
    await executeRandomAction()

    // Set up interval
    intervalRef.current = setInterval(() => {
      executeRandomAction()
    }, config.intervalSeconds * 1000)
  }

  // Stop simulation
  const stopSimulation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setState((prev) => ({ ...prev, isRunning: false }))
    showToast('Simulation stopped')
  }

  // Cleanup on unmount and when isRunning changes
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  // Also cleanup if component re-renders while running
  useEffect(() => {
    // If state says not running but interval exists, clear it
    if (!state.isRunning && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [state.isRunning])

  // Check initialization on mount and when testUsers change
  useEffect(() => {
    if (testUsers && testUsers.length > 0 && !state.isInitialized) {
      setState((prev) => ({ ...prev, isInitialized: true }))
    }
  }, [testUsers, state.isInitialized])

  return (
    <YStack gap="$4" p="$4">
      <XStack gap="$2">
        <ButtonSimple
          theme="blue"
          active
          onPress={() => createTestUsers(3)}
          disabled={!serverId || state.isInitializing}
        >
          {state.isInitializing ? 'Initializing...' : 'Create 3 Test Users'}
        </ButtonSimple>
        <ButtonSimple
          theme="blue"
          active
          onPress={() => createTestUsers(1)}
          disabled={!serverId || state.isInitializing}
        >
          {state.isInitializing ? 'Initializing...' : 'Create 1 Test User'}
        </ButtonSimple>
      </XStack>

      {/* Status */}
      {state.isInitialized && Boolean(testUsers && testUsers.length > 0) && (
        <YStack gap="$2" bg="$background" p="$3" rounded="$3">
          <SizableText data-testid="has-test-users" size="$3">
            Test Users: {testUsers.length}
          </SizableText>
          <SizableText size="$3">Actions Executed: {state.actionCount}</SizableText>
          {Boolean(state.lastAction) && (
            <SizableText size="$3" color="$color10">
              Last: {state.lastAction}
            </SizableText>
          )}
        </YStack>
      )}

      {/* Impersonation */}
      {state.isInitialized && Boolean(testUsers && testUsers.length > 0) && (
        <LabeledGroup variant="vertical" label="Impersonate Test User">
          <Select
            size="$3"
            value={selectedUserId}
            onValueChange={(userId: string) => {
              if (userId) {
                setSelectedUserId(userId)
                impersonate(userId).then(() => {
                  const user = testUsers.find((u) => u.id === userId)
                  showToast(`Now impersonating ${user?.username || 'test user'}`)
                })
              }
            }}
            items={[
              { id: '', name: 'None (current user)' },
              ...testUsers.map((user) => ({
                id: user.id,
                name: user.username || user.name || 'Unknown',
              })),
            ]}
          />
        </LabeledGroup>
      )}

      {/* Configuration */}
      {state.isInitialized && (
        <YStack gap="$3">
          <LabeledGroup variant="vertical" label="Action Frequency">
            <XStack gap="$3">
              <SizableText size="$3">Every</SizableText>
              <Input
                size="$3"
                width={60}
                value={String(config.intervalSeconds)}
                onChangeText={(text) => {
                  const num = parseInt(text) || 5
                  setConfig((prev) => ({ ...prev, intervalSeconds: Math.max(1, num) }))
                }}
                keyboardType="numeric"
              />
              <SizableText size="$3">seconds</SizableText>
            </XStack>
          </LabeledGroup>

          <LabeledGroup variant="vertical" label="Active Users">
            <Select
              size="$3"
              value={String(config.activeUserCount)}
              onValueChange={(val: string) =>
                setConfig((prev) => ({ ...prev, activeUserCount: parseInt(val) || 2 }))
              }
              items={[
                { id: '1', name: '1 user' },
                { id: '2', name: '2 users' },
                { id: '3', name: '3 users' },
                { id: '5', name: '5 users' },
              ]}
            />
          </LabeledGroup>
        </YStack>
      )}

      {/* Controls */}
      {state.isInitialized && (
        <XStack gap="$3">
          <ButtonSimple
            theme={state.isRunning ? 'red' : 'green'}
            active
            onPress={state.isRunning ? stopSimulation : startSimulation}
            disabled={!serverId}
          >
            {state.isRunning ? 'Stop Simulation' : 'Start Simulation'}
          </ButtonSimple>

          {!state.isRunning && (
            <ButtonSimple
              onPress={executeRandomAction}
              disabled={!serverId || !testUsers || testUsers.length === 0}
            >
              Run Single Action
            </ButtonSimple>
          )}
        </XStack>
      )}

      {/* Quick Action Buttons */}
      {state.isInitialized &&
        !state.isRunning &&
        Boolean(testUsers && testUsers.length > 0) && (
          <YStack gap="$3">
            <SizableText size="$3" color="$color10">
              Quick Actions:
            </SizableText>
            <XStack gap="$2" flexWrap="wrap">
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('createMessage')}
                disabled={!serverId}
              >
                Send Message
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('mentionMe')}
                disabled={!serverId}
              >
                Mention Me
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('mentionMeOtherChannel')}
                disabled={!serverId}
              >
                Mention Me (Other Channel)
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('requestFriendship')}
                disabled={!serverId}
              >
                Request Friendship
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('replyToMessage')}
                disabled={!serverId}
              >
                Reply to Message
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('startThread')}
                disabled={!serverId}
              >
                Start Thread
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('replyInThread')}
                disabled={!serverId}
              >
                Reply in Thread
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('addReaction')}
                disabled={!serverId}
              >
                Add Reaction
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={() => executeSpecificAction('dmMe')}
                disabled={!serverId}
              >
                DM Me
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={async () => {
                  // add reaction to last message in current channel
                  if (!currentChannelId) {
                    showToast('No channel selected!')
                    return
                  }
                  const lastMessage = await zero.query.message
                    .where('channelId', currentChannelId)
                    .where('type', '!=', 'draft')
                    .where('deleted', false)
                    .orderBy('order', 'desc')
                    .one()
                    .run({ type: 'complete' })

                  if (!lastMessage) {
                    showToast('No messages in channel')
                    return
                  }

                  const randomUser = getRandomItem(testUsers)
                  if (!randomUser) return

                  const availableReactions = await zero.query.reaction
                    .limit(20)
                    .run({ type: 'complete' })

                  if (availableReactions.length === 0) {
                    showToast('No reactions available')
                    return
                  }

                  const reactionRecord = getRandomItem(availableReactions)
                  if (!reactionRecord) return

                  const existingReaction = await zero.query.messageReaction
                    .where('messageId', lastMessage.id)
                    .where('creatorId', randomUser.id)
                    .where('reactionId', reactionRecord.id)
                    .one()
                    .run({ type: 'complete' })

                  if (!existingReaction) {
                    await zero.mutate.messageReaction.insert({
                      messageId: lastMessage.id,
                      creatorId: randomUser.id,
                      reactionId: reactionRecord.id,
                      channelId: currentChannelId,
                      createdAt: Date.now(),
                    }).client

                    showToast(
                      `${randomUser.username}: added ${reactionRecord.value} reaction`
                    )
                  } else {
                    showToast('User already reacted with this emoji')
                  }
                }}
                disabled={!serverId || !currentChannelId}
              >
                React to Last Message
              </ButtonSimple>
              <ButtonSimple
                size="small"
                onPress={async () => {
                  // reply to current thread
                  if (!currentChannelId) {
                    showToast('No channel selected!')
                    return
                  }

                  // get the most recent message with a thread
                  const messagesWithThreads = await zero.query.message
                    .where('channelId', currentChannelId)
                    .where('threadId', 'IS NOT', null)
                    .orderBy('createdAt', 'desc')
                    .limit(1)
                    .run({ type: 'complete' })

                  const messageWithThread = messagesWithThreads[0]
                  if (!messageWithThread?.threadId) {
                    showToast('No active thread in current channel')
                    return
                  }

                  const randomUser = getRandomItem(testUsers)
                  if (!randomUser) return

                  const lastThreadMessage = await zero.query.message
                    .where('threadId', messageWithThread.threadId)
                    .orderBy('order', 'desc')
                    .one()
                    .run({ type: 'complete' })

                  await zero.mutate.message.insert({
                    id: randomId(),
                    channelId: currentChannelId,
                    threadId: messageWithThread.threadId,
                    content: getMessageContent(randomUser),
                    creatorId: randomUser.id,
                    serverId: serverId || '',
                    createdAt: Date.now(),
                    deleted: false,
                    isThreadReply: true,
                    order: createMessageOrder(lastThreadMessage),
                    summary: null,
                    type: 'person',
                    replyingToId: null,
                    updatedAt: null,
                  })

                  showToast(`${randomUser.username}: replied in current thread`)
                }}
                disabled={!serverId || !currentChannelId}
              >
                Reply to Current Thread
              </ButtonSimple>
            </XStack>
          </YStack>
        )}

      {!serverId && (
        <SizableText size="$3" color="$red10">
          Select a server to begin
        </SizableText>
      )}
    </YStack>
  )
}
