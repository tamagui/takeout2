import { Github } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Avatar, Button, SizableText, XStack, YStack } from 'tamagui'
import { APP_DATA_WEBHOOK_KEY } from '~/features/apps/constants'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import { ListItem } from '~/interface/lists/ListItem'
import { ListTitle } from '~/interface/lists/ListTitle'
import { Tabs } from '~/interface/tabs/Tabs'
import { useQuery, zero } from '~/zero/client'

export const DevToolsApps = ({ isActive }: { isActive?: boolean }) => {
  if (!isActive) {
    return null
  }

  return <DevToolsAppsContent />
}

const DevToolsAppsContent = () => {
  const { serverId } = useCurrentServer()
  const [selectedTab, setSelectedTab] = useState('github')

  // Query for GitHub app installations and webhook data
  const [appInstalls, appInstallsStatus] = useQuery(
    zero.query.appInstall
      .where('serverId', serverId)
      .related('app', (app) => app.where('id', 'github'))
  )

  const githubInstall: any = appInstalls?.[0]

  // Query for webhook registrations - get all data and filter client-side
  const [allData, allDataStatus] = useQuery(
    zero.query.data
      .where('appInstallId', githubInstall?.id || 'never-match')
      .where('permissions', 'private')
  )

  // Filter for webhook data and repo webhooks client-side
  const webhookData =
    allData?.filter((item: any) => item.key.startsWith(`${APP_DATA_WEBHOOK_KEY}-`)) || []

  const repoWebhooks =
    allData?.filter((item: any) => item.key.startsWith('github-webhook-')) || []

  const tabs = [{ label: 'GitHub', value: 'github' }]

  return (
    <YStack data-tauri-drag-region flex={1} gap="$2">
      <Tabs tabs={tabs} initialTab={selectedTab} onValueChange={setSelectedTab}>
        <Tabs.Content value="github" flex={1}>
          <GithubWebhooksTab
            githubInstall={githubInstall}
            webhookData={webhookData}
            repoWebhooks={repoWebhooks}
            serverId={serverId}
          />
        </Tabs.Content>
      </Tabs>
    </YStack>
  )
}

function GithubWebhooksTab({ githubInstall, webhookData, repoWebhooks, serverId }: any) {
  const getRepoAvatar = (owner: string, repo: string) => {
    return `https://avatars.githubusercontent.com/${owner}?s=32`
  }

  const [sendingTest, setSendingTest] = useState<string | null>(null)

  const handleSendTestWebhook = async (
    webhookId: string,
    webhookContext: any,
    type: string
  ) => {
    setSendingTest(`${webhookId}-${type}`)
    try {
      // Parse the repository from the context message
      const repoMatch = webhookContext?.message?.match(/([^/]+)\/([^/]+)/)
      if (!repoMatch) {
        console.error('Could not parse repository from webhook context')
        return
      }
      const [, owner, repo] = repoMatch

      // Create test webhook payload based on type
      let payload: any = {
        repository: {
          full_name: `${owner}/${repo}`,
          name: repo,
          owner: { login: owner },
        },
        sender: { login: 'test-bot' },
        headers: {},
      }

      switch (type) {
        case 'push':
          payload.headers['x-github-event'] = 'push'
          payload.ref = 'refs/heads/main'
          payload.commits = [
            {
              message: 'Test commit message from DevTools',
              author: { name: 'Test Bot' },
            },
          ]
          break
        case 'pr':
          payload.headers['x-github-event'] = 'pull_request'
          payload.action = 'opened'
          payload.pull_request = {
            number: 123,
            title: 'Test PR from DevTools',
            html_url: `https://github.com/${owner}/${repo}/pull/123`,
            user: { login: 'test-bot' },
          }
          break
        case 'issue':
          payload.headers['x-github-event'] = 'issues'
          payload.action = 'opened'
          payload.issue = {
            number: 456,
            title: 'Test Issue from DevTools',
            html_url: `https://github.com/${owner}/${repo}/issues/456`,
            user: { login: 'test-bot' },
          }
          break
      }

      // Send test webhook via API
      const response = await fetch(
        `/api/webhook/${serverId}/${githubInstall.id}/${webhookId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-github-event': payload.headers['x-github-event'] || 'test',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to send test webhook: ${response.statusText}`)
      }

      console.info(`Test ${type} webhook sent successfully for ${owner}/${repo}`)
    } catch (error) {
      console.error(`Error sending test webhook:`, error)
    } finally {
      setSendingTest(null)
    }
  }

  if (!githubInstall) {
    return (
      <YStack p="$4" gap="$4">
        <SizableText color="$color11">
          No GitHub app installed for this server.
        </SizableText>
      </YStack>
    )
  }

  const parsedWebhooks =
    webhookData
      ?.map((data: any) => {
        try {
          const context = JSON.parse(data.value)
          const webhookId = data.key.replace(`${APP_DATA_WEBHOOK_KEY}-`, '')
          return {
            id: webhookId,
            key: data.key,
            context,
            createdAt: data.createdAt,
          }
        } catch {
          return null
        }
      })
      .filter(Boolean) || []

  const parsedRepoWebhooks =
    repoWebhooks
      ?.map((data: any) => {
        const repoMatch = data.key.match(/github-webhook-(.+)-(.+)/)
        if (!repoMatch) return null
        return {
          owner: repoMatch[1],
          repo: repoMatch[2],
          webhookId: data.value,
          key: data.key,
        }
      })
      .filter(Boolean) || []

  return (
    <YStack flex={1} gap="$4" p="$4">
      <YStack gap="$2">
        <ListTitle>
          <ListTitle.Text>GitHub App Status</ListTitle.Text>
        </ListTitle>
        <ListItem>
          <ListItem.Icon>
            <Github size={16} opacity={0.5} />
          </ListItem.Icon>
          <YStack gap="$0.5">
            <SizableText size="$2" fontWeight="600">
              Installation ID
            </SizableText>
            <SizableText size="$1" color="$color11">
              {githubInstall.id}
            </SizableText>
          </YStack>
        </ListItem>
        <ListItem>
          <ListItem.Icon>
            <Github size={16} opacity={0.5} />
          </ListItem.Icon>
          <YStack gap="$0.5">
            <SizableText size="$2" fontWeight="600">
              Server ID
            </SizableText>
            <SizableText size="$1" color="$color11">
              {serverId}
            </SizableText>
          </YStack>
        </ListItem>
      </YStack>

      <YStack gap="$2">
        <ListTitle>
          <ListTitle.Text>
            Repository Webhooks ({parsedRepoWebhooks.length})
          </ListTitle.Text>
        </ListTitle>
        {parsedRepoWebhooks.length === 0 ? (
          <SizableText color="$color11" size="$2">
            No repository webhooks configured
          </SizableText>
        ) : (
          parsedRepoWebhooks.map((webhook: any) => (
            <ListItem key={webhook.key}>
              <ListItem.Icon>
                <Avatar size="$2" rounded="$2">
                  <Avatar.Image src={getRepoAvatar(webhook.owner, webhook.repo)} />
                  <Avatar.Fallback>
                    <Github size={16} />
                  </Avatar.Fallback>
                </Avatar>
              </ListItem.Icon>
              <YStack gap="$0.5">
                <SizableText
                  size="$2"
                  fontWeight="600"
                >{`${webhook.owner}/${webhook.repo}`}</SizableText>
                <SizableText
                  size="$1"
                  color="$color11"
                >{`Webhook ID: ${webhook.webhookId}`}</SizableText>
              </YStack>
            </ListItem>
          ))
        )}
      </YStack>

      <YStack gap="$2">
        <ListTitle>
          <ListTitle.Text>Registered Webhooks ({parsedWebhooks.length})</ListTitle.Text>
        </ListTitle>
        {parsedWebhooks.length === 0 ? (
          <SizableText color="$color11" size="$2">
            No webhooks registered
          </SizableText>
        ) : (
          parsedWebhooks.map((webhook: any) => {
            // Use window.location.origin for client-side URL
            const baseUrl =
              typeof window !== 'undefined'
                ? window.location.origin
                : 'http://localhost:8081'
            const webhookUrl = `${baseUrl}/api/webhook/${serverId}/${githubInstall.id}/${webhook.id}`
            const repoMatch = webhook.context?.message?.match(/([^/]+)\/([^/]+)/)
            const owner = repoMatch?.[1] || 'github'
            const repo = repoMatch?.[2] || 'repo'

            return (
              <YStack
                key={webhook.id}
                gap="$2"
                p="$3"
                bg="$background02"
                rounded="$3"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <XStack gap="$3" items="center">
                  <Avatar size="$4" rounded="$2">
                    <Avatar.Image src={getRepoAvatar(owner, repo)} />
                    <Avatar.Fallback bg="$color5">
                      <Github size={20} />
                    </Avatar.Fallback>
                  </Avatar>
                  <YStack flex={1} gap="$1">
                    <SizableText size="$3" fontWeight="600">
                      {`${owner}/${repo}`}
                    </SizableText>
                    <SizableText size="$1" color="$color11" fontFamily="$mono">
                      ID: {webhook.id}
                    </SizableText>
                  </YStack>
                </XStack>
                <YStack gap="$2" mt="$2">
                  <XStack gap="$2" items="center">
                    <SizableText size="$1" color="$color11" minW={80}>
                      Channel:
                    </SizableText>
                    <SizableText size="$1" fontFamily="$mono">
                      #{webhook.context?.channelId || 'N/A'}
                    </SizableText>
                  </XStack>
                  <XStack gap="$2" items="flex-start">
                    <SizableText size="$1" color="$color11" minW={80}>
                      URL:
                    </SizableText>
                    <SizableText
                      size="$1"
                      fontFamily="$mono"
                      flex={1}
                      numberOfLines={2}
                      ellipse
                    >
                      {webhookUrl}
                    </SizableText>
                  </XStack>
                </YStack>
                <XStack
                  gap="$2"
                  mt="$3"
                  pt="$2"
                  borderTopWidth={1}
                  borderTopColor="$borderColor"
                >
                  <Button
                    size="$2"
                    flex={1}
                    theme="blue"
                    disabled={sendingTest === `${webhook.id}-push`}
                    onPress={() =>
                      handleSendTestWebhook(webhook.id, webhook.context, 'push')
                    }
                  >
                    {sendingTest === `${webhook.id}-push` ? 'Sending...' : '🚀 Push'}
                  </Button>
                  <Button
                    size="$2"
                    flex={1}
                    theme="green"
                    disabled={sendingTest === `${webhook.id}-pr`}
                    onPress={() =>
                      handleSendTestWebhook(webhook.id, webhook.context, 'pr')
                    }
                  >
                    {sendingTest === `${webhook.id}-pr` ? 'Sending...' : '🔀 PR'}
                  </Button>
                  <Button
                    size="$2"
                    flex={1}
                    theme="orange"
                    disabled={sendingTest === `${webhook.id}-issue`}
                    onPress={() =>
                      handleSendTestWebhook(webhook.id, webhook.context, 'issue')
                    }
                  >
                    {sendingTest === `${webhook.id}-issue` ? 'Sending...' : '🐛 Issue'}
                  </Button>
                </XStack>
              </YStack>
            )
          })
        )}
      </YStack>
    </YStack>
  )
}
