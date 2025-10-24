import { ExternalLink } from '@tamagui/lucide-icons'
import { getRandomItem, randomId, sleep } from '@vxrn/helpers'
import { ensureLoggedIn } from 'over-zero'
import { useState } from 'react'
import { H5, XStack, YStack } from 'tamagui'
import { useCurrentChannelId } from '~/context/CurrentChannelContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import type { Message } from '~/data/types'
import { createMessageOrder } from '~/features/message/createMessageOrder'
import { insertMessage } from '~/features/message/insertMessage'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import { clearAllDataAndStorages } from '~/helpers/clearAllDataAndStorages'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ensureConfirmed } from '~/interface/dialogs/actions'
import { ensureSignedUp } from '~/interface/dialogs/isSignedUpEmitter'
import { Input } from '~/interface/forms/Input'
import { showNotification } from '~/interface/notification/Notification'
import { showToast } from '~/interface/toast/Toast'
import { zero } from '~/zero/client'
import { mutateInsertServer } from '../server/actions/mutateInsertServer'
import { getUser } from '../user/getUser'
import { adminCreateUser } from './adminCreateUser'
import { TestTauriNotification } from './TestTauriNotification'
import { impersonate } from './utils'

export const DevToolsActions = () => {
  const serverId = useCurrentServerId()
  const channelId = useCurrentChannelId()
  const { channel, server } = useCurrentServer()
  const [privateBetaEmail, setPrivateBetaEmail] = useState('')

  const createMessageInChannel = async (
    message: Partial<Message>,
    lastMessage?: Message
  ) => {
    if (!channel) {
      showToast('No channel!')
      return
    }

    const currentUser = getUser()!
    const user = await zero.query.userPublic
      .where('id', '!=', currentUser.id)
      .one()
      .run({ type: 'complete' })

    const channelId = message.channelId ?? channel.id
    const last = lastMessage || (await getLastMessageInChannel(channelId)) || null

    await insertMessage(last, {
      ...message,
      channelId,
      content: new Array(Math.round(Math.random() * 10))
        .fill(`Lorem ipsum dolo`)
        .join(', '),
      creatorId: user!.id,
    })
  }

  const getLastMessageInChannel = async (channelId: string) => {
    return await zero.query.message
      .where('channelId', channelId)
      .orderBy('order', 'desc')
      .where('type', '!=', 'draft')
      .one()
      .run({ type: 'complete' })
  }

  const getOtherChannel = async (channelId: string) => {
    return await zero.query.channel
      .where('serverId', serverId || '')
      .where('id', '!=', channelId)
      .where('deleted', '!=', true)
      .one()
      .run({ type: 'complete' })
  }

  return (
    <YStack data-tauri-drag-region gap="$3">
      <H5 fontFamily="$mono" size="$5">
        Global
      </H5>
      <XStack flexWrap="wrap" gap="$2">
        <a href="/admin/jobs" target="_blank" rel="noopener noreferrer">
          <ButtonSimple size="small" icon={ExternalLink}>
            Jobs
          </ButtonSimple>
        </a>

        <ButtonSimple
          size="small"
          onPress={() => {
            location.href = location.href + '?debug=3'
          }}
        >
          Reload with debug logging
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            await ensureConfirmed()
            clearAllDataAndStorages()
          }}
        >
          Clear all storages
        </ButtonSimple>
      </XStack>

      <H5 fontFamily="$mono" size="$5">
        Private Beta
      </H5>

      <XStack flexWrap="wrap" gap="$2">
        <Input
          size="$3"
          placeholder="Email..."
          keyboardType="email-address"
          autoComplete="email"
          value={privateBetaEmail}
          onChangeText={setPrivateBetaEmail}
        />

        <ButtonSimple
          theme="blue"
          size="small"
          onPress={async () => {
            if (!privateBetaEmail) {
              showToast('Please enter an email')
              return
            }

            try {
              await zero.mutate.admin.inviteToPrivateBeta({
                id: randomId(),
                email: privateBetaEmail,
                accepted: false,
                createdAt: Date.now(),
              }).server
              showToast(`Invited ${privateBetaEmail} to private beta!`)
              setPrivateBetaEmail('')
            } catch (error) {
              console.error('Error inviting to private beta:', error)
              showToast('Error sending invite')
            }
          }}
        >
          Invite
        </ButtonSimple>
      </XStack>

      <H5 fontFamily="$mono" size="$5">
        UI
      </H5>
      <XStack flexWrap="wrap" gap="$2">
        <ButtonSimple
          size="small"
          onPress={() => {
            showToast(`Testing`)
          }}
        >
          Show toast
        </ButtonSimple>

        <TestTauriNotification />

        <ButtonSimple
          size="small"
          onPress={() => {
            showNotification(`Testing`, {
              display: 'error',
              description: `Description lorem ipsum dolor sit amet`,
            })
          }}
        >
          Show error notification
        </ButtonSimple>
      </XStack>

      <H5 fontFamily="$mono" size="$5">
        Users
      </H5>

      <XStack flexWrap="wrap" gap="$2">
        <ButtonSimple
          size="small"
          onPress={async () => {
            const currentUser = ensureLoggedIn()
            await zero.mutate.userPublic.update({
              id: currentUser.id,
              hasOnboarded: false,
            }).client
            showToast('Onboarding reset - refresh to see onboarding')
          }}
        >
          Reset onboarding
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            await zero.mutate.userPublic.createUserServer().server
            showToast('Done')
          }}
        >
          Create User Server
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            try {
              const user = await adminCreateUser({
                name: `Test User ${randomId()}`,
                email: `test${randomId()}@example.com`,
                password: 'password123',
                role: 'user',
              })
              console.warn(`created`, user.id)
              showToast(`created ${user.id}`)
            } catch (error) {
              console.error('Error creating user:', error)
              showToast('Error creating user')
            }
          }}
        >
          Create random user
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            try {
              const user = await adminCreateUser({
                name: `Test User ${randomId()}`,
                email: `test${randomId()}@example.com`,
                password: 'password123',
                role: 'user',
              })
              showToast(`created ${user.id}`)
              console.warn(`created`, user.id)
              impersonate(user.id)
            } catch (error) {
              console.error('Error creating user:', error)
              showToast('Error creating user')
            }
          }}
        >
          Create random user and impersonate
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            const value = prompt(`User ID`)
            if (value) {
              impersonate(value)
            }
          }}
        >
          Impersonate
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            const currentUser = getUser()
            if (!currentUser) {
              showToast('No user signed in')
              return
            }
            await zero.mutate.userPublic.update({
              id: currentUser.id,
              lastActive: Date.now(),
            })
            showToast('Updated lastActiveAt to now')
          }}
        >
          Update lastActiveAt to now
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            if (!serverId) {
              showToast('No server selected!')
              return
            }

            showToast('Creating 20 users and adding to server...')

            try {
              for (let i = 1; i <= 20; i++) {
                const user = await adminCreateUser({
                  name: `Test User ${randomId()}`,
                  email: `test${randomId()}@example.com`,
                  password: 'password123',
                  role: 'user',
                })

                await zero.mutate.serverMember.insert({
                  serverId,
                  userId: user.id,
                  joinedAt: Date.now(),
                  hasClosedWelcome: false,
                }).server

                if (i % 10 === 0) {
                  showToast(`Created ${i}/20 users`)
                }
              }

              showToast('Successfully created 20 users and added them to server!')
            } catch (error) {
              console.error('Error creating users:', error)
              showToast('Error creating users')
            }
          }}
        >
          Create 20 users and join server
        </ButtonSimple>
      </XStack>

      <H5 fontFamily="$mono" size="$5">
        Email
      </H5>
      <XStack flexWrap="wrap" gap="$2">
        {/* TODO bring back */}
        {/* <ButtonSimple
          size="small"
          onPress={async () => {
            const currentUser = await ensureSignedUp()
            zero.mutate.admin.email({
              name: 'sendNewMessageEmail',
              options: {
                channelName: 'Channel name',
                link: 'https://start.chat',
              },
            })
          }}
        >
          sendNewMessageEmail myself
        </ButtonSimple> */}
      </XStack>

      <H5 fontFamily="$mono" size="$5">
        Friendships
      </H5>

      <XStack flexWrap="wrap" gap="$2">
        <ButtonSimple
          size="small"
          onPress={async () => {
            const friendships = await zero.query.friendship.run({ type: 'complete' })
            for (const friendship of friendships) {
              zero.mutate.friendship.update({
                ...friendship,
                accepted: true,
              })
            }
            showToast('done')
          }}
        >
          All Friendships: Accept
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            await ensureConfirmed()
            const friendships = await zero.query.friendship.run({ type: 'complete' })
            for (const friendship of friendships) {
              zero.mutate.friendship.delete(friendship)
            }
            showToast('done')
          }}
        >
          All Friendships: Delete
        </ButtonSimple>
      </XStack>

      <H5 fontFamily="$mono" size="$5">
        Server
      </H5>

      <XStack flexWrap="wrap" gap="$2">
        <ButtonSimple
          theme="blue"
          size="small"
          onPress={async () => {
            const currentUser = await ensureSignedUp()

            showToast(`Ensuring apps set up...`)

            await zero.mutate.app.migrate().server

            // zero seems to not think there's apps if this runs fast
            await sleep(500)

            const dirScannerApp = await zero.query.app
              .where('id', 'dir-scan')
              .one()
              .run({ type: 'complete' })

            const githubApp = await zero.query.app
              .where('id', 'github')
              .one()
              .run({ type: 'complete' })

            const testApp = await zero.query.app
              .where('id', 'test')
              .one()
              .run({ type: 'complete' })

            if (!dirScannerApp || !githubApp || !testApp) {
              showToast(`No apps installed, error!`)
              return
            }

            const server = await mutateInsertServer({
              name: `Tamagui`,
              description: `Performant cross-platform style and UI for React and React Native.`,
              id: 'tamagui',
              icon: `https://storage.start.chat/onechatimages/uploads/zx6urtz7ljg-/Users/n8/Desktop/5dvhtbozp9w-avatar.png`,
            })

            showToast(`Setting up...`)

            if (!server) {
              alert(`no server?`)
              return
            }

            const serverId = server.id

            const chatChannelId = randomId()
            const feedbackChannelId = randomId()
            const proRoleId = randomId()
            const botRoleId = randomId()

            console.warn(`Inserting roles...`)

            await zero.mutate.role.insert({
              createdAt: Date.now(),
              color: '#888',
              creatorId: currentUser.id,
              id: botRoleId,
              name: `Hud`,
              serverId,
              canAdmin: false,
              canEditChannel: false,
              canEditServer: false,
              canEditApp: false,
            }).client

            await zero.mutate.role.insert({
              createdAt: Date.now(),
              color: '#ECD20A',
              creatorId: currentUser.id,
              id: proRoleId,
              name: `Pro`,
              serverId,
              canAdmin: false,
              canEditChannel: false,
              canEditServer: false,
              canEditApp: false,
            }).client

            await zero.mutate.channel.insert({
              createdAt: Date.now(),
              id: chatChannelId,
              description: `Chat with Tamagui AI`,
              creatorId: currentUser.id,
              name: `AI`,
              private: true,
              serverId,
              type: 'bot',
              deleted: false,
              isPrivateChat: false,
              readonly: false,
            }).server

            showToast(`Inserting channels...`)

            await zero.mutate.channel.insert({
              createdAt: Date.now(),
              creatorId: currentUser.id,
              id: feedbackChannelId,
              description: ``,
              name: `Feedback`,
              private: true,
              serverId,
              deleted: false,
              isPrivateChat: false,
              readonly: false,
            }).server

            await zero.mutate.channelPermission.insert({
              channelId: chatChannelId,
              granterId: currentUser.id,
              roleId: proRoleId,
              id: randomId(),
              serverId,
              createdAt: Date.now(),
            }).client

            console.warn(`Inserting etc...`)

            await zero.mutate.channelPermission.insert({
              channelId: feedbackChannelId,
              granterId: currentUser.id,
              roleId: proRoleId,
              id: randomId(),
              serverId,
              createdAt: Date.now(),
            }).client

            await zero.mutate.server.update({
              id: server.id,
              channelSort: [
                ...(server?.channelSort || []),
                chatChannelId,
                feedbackChannelId,
              ],
            }).client

            if (githubApp) {
              await zero.mutate.appInstall.insert({
                id: randomId(),
                settings: {
                  options: {},
                },
                appId: githubApp.id,
                createdAt: Date.now(),
                creatorId: currentUser.id,
                channelId: serverId,
                serverId,
              }).client
            }

            if (testApp) {
              await zero.mutate.appInstall.insert({
                id: randomId(),
                settings: {
                  options: {},
                },
                appId: testApp.id,
                createdAt: Date.now(),
                creatorId: currentUser.id,
                channelId: serverId,
                serverId,
              }).client
            }

            showToast(`Inserting test messages...`)

            // create clock app thread
            const generalChannelId = 'tamagui'
            const messageId = randomId()

            // first create the message without threadId
            const threadMessage = await insertMessage(null, {
              id: messageId,
              channelId: generalChannelId,
              serverId,
              content: 'Clock App',
              creatorId: currentUser.id,
            })

            if (threadMessage) {
              // now create the thread record pointing to the message
              const threadId = randomId()
              await zero.mutate.thread.insert({
                id: threadId,
                nextDraftId: randomId(),
                messageId: threadMessage.id,
                channelId: generalChannelId,
                creatorId: currentUser.id,
                title: 'Clock App',
                serverId,
                createdAt: Date.now(),
                replyCount: 0,
                deleted: false,
              }).server

              // update the message to point to the thread
              await zero.mutate.message.update({
                id: threadMessage.id,
                threadId: threadId,
              }).client

              const appContent = `\`\`\`tsx app
${clockAppSource}
\`\`\``

              const complicationContent = `\`\`\`tsx complication
${clockAppSource}
\`\`\``

              await insertMessage(threadMessage, {
                channelId: generalChannelId,
                serverId,
                threadId: threadId, // use the threadId, not message.id
                content: `${appContent}\n\n${complicationContent}`,
                creatorId: currentUser.id,
                isThreadReply: true,
              })

              showToast(`Done!`)
            }
          }}
        >
          Create Tamagui Server
        </ButtonSimple>

        <ButtonSimple
          size="small"
          theme="red"
          onPress={() => {
            zero.mutate.server.delete({
              id: 'tamagui',
            })
          }}
        >
          Delete Tamagui Server
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            if (!server) {
              showToast(`not in server?`)
              return
            }

            zero.mutate.server.update({
              id: server.id,
              state: {
                ...server.state,
                botDefaultModel: 'ollama',
                ollamaModel: 'qwen3:30b-a3b',
              },
            })

            console.warn(
              `server is now`,
              await zero.query.server.where('id', server.id).run({ type: 'complete' })
            )
          }}
        >
          Use model Ollama qwen3:30b-a3b
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            const currentUser = await ensureSignedUp()

            const appId = randomId()

            await zero.mutate.app.insert({
              createdAt: Date.now(),
              creatorId: currentUser.id,
              description: '',
              id: appId,
              image: '',
              installCount: 0,
              name: 'Our App',
              version: '0.0.0',
              source: `
  import { View, Text, useAppMeta } from 'start'

  export default () => {
    useAppMeta({
      count: 10,
      countLabel: 'message',
      status: 'green',
      direction: 'up',
    })

    return <View><Text>hello world</Text></View>
  }
  `,
            })

            await zero.mutate.appInstall.insert({
              id: randomId(),
              settings: {},
              appId,
              createdAt: Date.now(),
              creatorId: currentUser.id,
              serverId,
              threadId: null,
              channelId,
            })
          }}
        >
          Current Channel: Insert Test App
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            await ensureConfirmed()
            await zero.mutate.message.deleteAll(channelId).server
            showToast(`Done deleting messages!`)
          }}
        >
          Clear current channel messages
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            const server = await mutateInsertServer({
              name: `One`,
              description: `Welcome to the One start.chat server`,
              id: 'one',
              icon: `https://storage.start.chat/onechatimages/uploads/8oz9w1kuzs7-large-icon.png`,
            })

            if (!server) return

            const id = randomId()
            await zero.mutate.channel.insert({
              createdAt: Date.now(),
              id,
              description: `Talk to One AI`,
              name: `Start`,
              private: false,
              serverId: server.id,
              creatorId: getUser()!.id,
              type: 'bot',
              deleted: false,
              isPrivateChat: false,
              readonly: false,
            })

            await zero.mutate.server.update({
              id: server.id,
              channelSort: [...(server?.channelSort || []), id],
            })
          }}
        >
          Create One Server
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            const otherChannelId = (await getOtherChannel(channelId))?.id
            if (!otherChannelId) {
              console.error('no other channel')
              return
            }
            createMessageInChannel({
              channelId: otherChannelId,
            })
          }}
        >
          Other Channel: insert message
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            const otherChannelId = (await getOtherChannel(channelId))?.id
            if (!otherChannelId) {
              console.error('no other channel')
              return
            }
            const message = await getLastMessageInChannel(otherChannelId)
            createMessageInChannel({
              channelId: otherChannelId,
              replyingToId: message?.id,
            })
          }}
        >
          Other Channel: insert reply to last message
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            createMessageInChannel({})
          }}
        >
          Current Channel: insert message
        </ButtonSimple>

        <ButtonSimple
          size="small"
          onPress={async () => {
            const message = await getLastMessageInChannel(channelId)
            if (message) {
              createMessageInChannel({
                replyingToId: message.id,
              })
            }
          }}
        >
          Current Channel: insert reply
        </ButtonSimple>

        {(() => {
          const count = 100

          return (
            <ButtonSimple
              size="small"
              onPress={async () => {
                if (!channel) {
                  showToast('No channel!')
                  return
                }

                const users = await zero.query.userPublic
                  .limit(10)
                  .run({ type: 'complete' })
                const lastMessage = await zero.query.message
                  .where('channelId', channel.id)
                  .where('isThreadReply', false)
                  .where('type', '!=', 'draft')
                  .orderBy('order', 'desc')
                  .one()
                  .run({ type: 'complete' })

                let messages: Message[] = [lastMessage!]

                console.info(`inserting ${count}`)

                for (let index = 1; index <= count; index++) {
                  const order = createMessageOrder(messages[index - 1] || null)
                  messages.push({
                    channelId: channel.id,
                    content: `message number ${index}: ${new Array(
                      Math.round(Math.random() * 10)
                    )
                      .fill(`Lorem ipsum dolo`)
                      .join(', ')}`,
                    createdAt: Date.now() - index * 60 * 1000,
                    deleted: false,
                    order,
                    summary: '',
                    id: randomId(),
                    creatorId: getRandomItem(users)!.id,
                    serverId: channel.serverId,
                    isThreadReply: false,
                    threadId: null,
                    replyingToId: null,
                    updatedAt: null,
                    type: 'person',
                  })
                }

                // remove our lastMessage to avoid re-insert
                messages = messages.slice(1)

                // dont batch so it goes through custom mutators
                await zero.mutate.message.insertBulk(messages).server

                console.info(`Inserted`, messages)
              }}
            >
              Insert {count} messages in channel
            </ButtonSimple>
          )
        })()}
      </XStack>

      <H5 fontFamily="$mono" size="$5">
        Data
      </H5>

      <XStack flexWrap="wrap" gap="$2">
        <ButtonSimple
          size="small"
          onPress={async () => {
            await ensureConfirmed()
            await zero.mutate.data.deleteAll(serverId).server
            showToast(`Deleted all`)
          }}
        >
          Delete ALL current server data
        </ButtonSimple>
      </XStack>

      <H5 fontFamily="$mono" size="$5">
        Apps
      </H5>

      <XStack flexWrap="wrap" gap="$2">
        <ButtonSimple
          size="small"
          onPress={async () => {
            await zero.mutate.app.migrate().server
            showToast(`Updated`)
          }}
        >
          Ensure Default Apps
        </ButtonSimple>
      </XStack>
    </YStack>
  )
}

const clockAppSource = `import { XStack, YStack, SizableText } from 'start/ui'
import { useState, useEffect } from 'react'

export default () => {
  const [time, setTime] = useState(new Date())
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return (
    <YStack p="$4" alignItems="center" justify="center" height="100vh" bg="$background">
      <YStack alignItems="center" space="$4">
        <SizableText size="$12" fontWeight="100" color="$color" text="center">
          {formatTime(time)}
        </SizableText>
        
        <SizableText size="$6" color="$color11" text="center">
          {formatDate(time)}
        </SizableText>
        
        <XStack space="$2" marginTop="$6">
          <YStack alignItems="center" p="$3" bg="$color2" rounded="$4">
            <SizableText size="$2" color="$color11">TIMEZONE</SizableText>
            <SizableText size="$4" fontWeight="600">{Intl.DateTimeFormat().resolvedOptions().timeZone}</SizableText>
          </YStack>
          
          <YStack alignItems="center" p="$3" bg="$color2" rounded="$4">
            <SizableText size="$2" color="$color11">UTC</SizableText>
            <SizableText size="$4" fontWeight="600">{time.toUTCString().split(' ')[4]}</SizableText>
          </YStack>
        </XStack>
      </YStack>
    </YStack>
  )
}`

const complicationSource = `
export const complication = () => {
  const time = new Date()
  const timeString = time.toLocaleTimeString('en-US', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit'
  })
  return {
    text: timeString
  }
}
`
