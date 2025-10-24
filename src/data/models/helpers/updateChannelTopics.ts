import { context } from 'over-zero'
import type { MessageUpdate } from '~/data/types'

export async function updateChannelTopics(message: MessageUpdate) {
  if (message.threadId) {
    // once inside a thread don't categorize, we only use these for channel itself for now
    return
  }

  const { tx, server } = context()

  if (!server || message.type === 'draft' || message.type === 'hidden') {
    return
  }

  if (!message.content || message.content.length < 5) {
    return
  }

  // get existing recent topics for this channel
  const existingTopics = await tx.query.channelTopic
    .where('channelId', message.channelId || '')
    .orderBy('createdAt', 'desc')
    .limit(20)

  // prepare topics for prompt
  const topicsList = existingTopics.map((t) => t.name).join(', ') || 'none yet'

  // use llm to categorize the message
  const prompt = `

We're going to be categorizing a message into a single topic.

- Topics should be single words that broadly categorize messages.
- Prefer unique things like specific names or technical terms.
- Can be lowercase, proper noun case, use punctiation or even emoji if relevant. 
- Don't include markdown formatting or very non-standard characters.
- Can be two words but only if <8 characters.
- Never should be above 12 characters.
- If the message fits well into an existing topic, use that. Otherwise, create a new topic.
- Prefer existing topics when they make sense.
- Only create new topics when the message clearly doesn't fit any existing ones.
- Think through your reasoning, but end your response with a new line followed by just the single word topic.

<existing_topics>
${topicsList}
</existing_topics>

<message>
${message.content}
</message>

  `

  try {
    const response = process.env.IS_TESTING
      ? 'fake-category'
      : await server.actions.ai.llm({
          prompt,
          model: 'or-kimi-k2',
          maxOutputTokens: 256,
        })

    if (!response) {
      console.warn('No response from llm')
      return
    }

    // extract the topic from the response (last line, single word)
    const lines = response.trim().split('\n')
    const lastLine = lines[lines.length - 1]
    if (!lastLine) {
      console.warn(`Empty response from LLM`)
      return
    }
    const topic = lastLine.trim()

    // validate it's a single word
    if (!topic || topic.includes(' ') || topic.length > 50) {
      console.warn(`Invalid topic from LLM: ${topic}`)
      return
    }

    // find or create the topic
    let channelTopic = existingTopics.find((t) => t.name === topic)
    let topicId: string

    if (!channelTopic) {
      console.info('insert topic', topic, message.id)

      topicId = `${message.id}-topic`

      await tx.mutate.channelTopic.insert({
        id: topicId,
        serverId: message.serverId,
        channelId: message.channelId,
        name: topic,
        count: 1,
        createdAt: message.createdAt,
      })
    } else {
      // increment count for existing topic
      topicId = channelTopic.id
      await tx.mutate.channelTopic.update({
        id: channelTopic.id,
        count: channelTopic.count + 1,
        updatedAt: message.createdAt,
      })
    }

    // link message to topic
    await tx.mutate.channelTopicMessage.upsert({
      id: `${message.id}-message`,
      channelId: message.channelId,
      serverId: message.serverId,
      topicId,
      messageId: message.id,
      createdAt: Date.now(),
    })

    console.info(`Categorized message into topic: ${topic}`)
  } catch (error) {
    console.error(`Error categorizing message into topic:`, error)
  }
}
