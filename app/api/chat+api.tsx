// import { createOllama } from 'ollama-ai-provider'
import { valibotSchema } from '@ai-sdk/valibot'
import { generateText, stepCountIs, streamText, tool } from 'ai'
import { array, number, object, optional, parse, string } from 'valibot'
import { ensureAuth } from '~/auth/server/ensureAuth'
import { matchZeroMutation, matchZeroQuery } from '~/features/ai/helpers'
import { logChunk } from '~/features/ai/logChunk'
import { runApp } from '~/features/apps/runApp'
import { CallHUD } from '~/features/hud/types'
import { searchActions } from '~/features/search/searchActions'
import type { SearchDocument } from '~/features/search/types'
import { models, type ModelName } from '~/start/src'

const FAST_MODEL: ModelName = 'grok-4-fast'
const MAIN_MODEL: ModelName = 'or-claude-sonnet-4'

const EmptySchema = valibotSchema(object({}))

const SearchSchema = valibotSchema(
  object({
    search: string(),
    page: optional(number()),
  })
)

const CodeGenerateSchema = valibotSchema(
  object({
    context: string(),
  })
)

const zeroTablesSchema = process.env.ZERO_TABLES
const zeroRelationshipsSchema = process.env.ZERO_RELATIONSHIPS

const agentTasksDocs = process.env.AGENT_TASKS_DOCS
const agentZeroDocs = process.env.AGENT_ZERO_DOCS
const agentAppsDocs = process.env.AGENT_APPS_DOCS
const chatDocs = process.env.CHAT_DOCS

export default async (req: Request): Promise<Response> => {
  await ensureAuth(req)

  const body = await req.json()

  if (process.env.NODE_ENV === 'development') {
    console.info(`chat+api body`, body)
  }

  const {
    prompt,
    messages = [],
    model = MAIN_MODEL,
    subModel = '',
    channelId,
    channelName,
    isHud,
    serverId,
    serverName,
    userId,
    appActions,
    apps,
    username,
    threadId,
  } = parse(
    CallHUD,
    // there's some sort of bug, if prompt === "---" it doesnt json parse
    typeof body === 'string' ? JSON.parse(body) : body
  )

  const conversation =
    messages
      ?.map(
        (m) => `
  id: ${m.id}
  creatorId: ${m.creatorId}
  username: ${m.username}
  type: ${m.type}
  content: ${m.content}`
      )
      .join('\n\n---') || 'no messages'

  // if you want a faster initial reply from a smaller model
  // step 1: get a quick greeting from groq
  //   console.info(`[chat] getting quick greeting from ${FAST_MODEL}`)

  //   let quickGreeting = ''
  //   try {
  //     const quickPrompt = `in lowercase simple tone, write a very short greeting (<20 characters) or indicate you'll do something based on this conversation
  // between you (hud) and the user:

  // ${conversation}`

  //     const greeting = await aiActions.llm({
  //       prompt: quickPrompt,
  //       maxOutputTokens: 50,
  //     })

  //     quickGreeting = greeting
  //   } catch (err) {
  //     console.error('Failed to get quick greeting:', err)
  //     quickGreeting = 'hello!'
  //   }

  // step 2: use claude for the full response
  // console.info(`[chat] replied ${quickGreeting}`)
  // console.info(`[chat] now using main model ${MAIN_MODEL}`)

  const modelInstance = models[MAIN_MODEL]()

  const isInTasks = threadId?.endsWith('-task')

  // - ;;;create-app;;; Shows a command to create  a new app based off the start.chat codebase, an experimental and fun new way to start an app, if they ask for more you can use tool "startExplain".

  // To get gather information you have tools:

  // - search-chats: find chat messages
  // - search-data: start.chat has "apps" that can export "data", like the Github app exports issues, PR's, etc, search that data

  // prepare the full system prompt
  const systemPrompt = `
You are HUD, a helpful AI assistant in the Start app (a team chat app), and you have many abilities.

${messages?.length > 0 ? `You're in an ongoing conversation with ${username}.` : `You're starting a new conversation with "${username}".`}

---

# Context

- Server: "${serverName}" (ID: ${serverId})
- Channel: "${channelName}" (ID: ${channelId})
- ${threadId ? `Thread ID: ${threadId}` : `Not in a thread`}

---

# Guidelines

- Be work-casual in tone and style, like a smart member of a startup in Slack: concise, helpful, lowercase except proper nouns
- Avoid emojis
- If the user is just chatting, avoid trying to be helpful, just chat back briefly
- Before doing any lookups or tool calls at all, always reply first with a quick message: response to them, greeting, or indication of what you'll do
- For questions with search/library results that are relevant: share the FULL information, like complete code blocks and lists
- Err on being concise if you lack info in your tools, but thorough if you find relevant information
- Always output an indicator before tool calling

---

# Indicators

You should always output self-closing indicators before tool calling, or use newline indicators (open, later close) for thinking.

Indicators are output to the end-user to indicate a background process or some data returned.

## Indicating work

- <generating />
- <thinking />
- <searching />
- <coding />

These output a simple loading indicator.

## Indicating thought

If you need to think about something without showing the user the contents use the XML thinking tag.
Open it on a newline, output your thought, then close it afterwards on another newline:

<thinking>
Here's some text that won't be shown to the user
</thinking>

## Indicating results

Some tools will return indicators for you of their results, you should always output these.

For example, when doing library/lookup the tools may return indicators for "data" or "messages" like so:

<data id="123" />
<message id="123" />

---

# Tools

Use tools liberally so long as the user is not simply being conversational.

## General

- chat-docs: docs on this platform, Start, useful if the user asks about how things work

## Search

- library: find higher quality information
- lookup: fuzzy/vector based search across chats and data in server

${
  isInTasks
    ? `
## In the Tasks channel

You are currently inside the "Tasks" channel - a special channel in Start that lets users manage their tasks.
We'll give more information on Tasks below.

When you're in the tasks channel, you're always inside a thread that is linked to a task. You can find the latest
version of the task (see Run Queries) by querying for a task where threadId matches this one (sorted by the latest createdAt).

    `
    : `
## App Actions

Servers can add apps which expose actions.

Apps in this workspace listed as - name (id):

${apps.length === 0 ? 'No apps' : apps.map((app) => `- ${app.name} (${app.id})\n`)}

Use tools to find app actions and then call them:

- app-actions: get back a list of actions and descriptions for a given app (call using the id)
- app-action-run: run a given app action and get back data if any, pass it:
  - id
  - action: name of the action (from app-actions)
  - message: actions take a string message as an optional argument, action descriptions indicate how to use

Note: the "sync" actions you should generally not call - they are for syncing data into the workspace not for fetching information.

## Generating Apps

You can generate entire apps simply by writing a special type of code block.

If the user asks you to generate an app, or something that sounds like a generated app would help solve their problem,
use the following tools:

- app-docs: always use this tool first to read into context documentation on how you generate apps

Once you read the app-docs, you can genereate an app simply by writing it out.
`
}

## Run Queries/Mutations

You have the power to show and edit chats, threads, channels, and data by running zero queries. Don't mention zero
ever, it's an implementation detail. And remember that for search-like things you can use those tools.

But to find a specific piece of data in the chat app, or even to mutate some data, you can use the zero-run tool.

- you can offer and help users to change their chatroom by editing the database in a careful way
- run queries and mutations for all the things the current user has access to
- mutations only have permissions to do what the current user has permission to do

Always run 'zero-docs' first to look up how to use it, then 'zero-schema' to find schema info on tables you need,
finally 'zero-run' to test your query, and then you can output the final message with the inline query code.

tools:

  - zero-docs: how to do queries and mutations
  - zero-schema: after checking zero-docs, use this to lookup info on specific tables
  - zero-run: run this after zero-schema to test your code before sending it back to user

## Tasks

Tasks allow users to link together app actions. We have a novel way of defining tasks right in messages which you can do.

Tasks can be persisted to the workspace under the "Tasks" tab, where they can be triggered manually, on a schedule, or in
response to an event.

tools:

- tasks-docs: if the user wants to know how to create tasks, or wants you to generate one, start here

## Generating Code

tools:

  - code: helps generate code examples if needed
  - code-example: find specific examples to improve generation
  - code-generate: once you gathered code/examples, pass everything from "code" and "code-example" into here to generate the code.

---

${
  isHud
    ? `
In start.chat, hud can be talked to by either tagging @hud in any channel or thread, *or* by going into the dedicated HUD for hud
(cute, right?). The HUD is a heads up display that appears over your current UI and works much like existing chatbots like ChatGPT
where you can create new chats on a sidebar.

The user is currently in HUD mode. You still have access to the underlying server and channel, but the conversation is *private*
between you and the user.
`
    : `
You are in a server/channel that may have other users being talked to via a mention or in a channel with the "AI" setting turned on.
`
}

---

# Tool Guidelines

Use "library" almost always for finding information, then use "lookup" to augment that if nothing found.
When calling library tool, be very specific with your search terms - use the exact terms the user asked about.

  - if user asks "what are config v4 shorthands?" search for "config v4 shorthands" not "tamagui shorthands configuration"
  - if user asks "how to use buttons?" search for "buttons" or "button component" not "component usage"
  - preserve the user's specific terminology and version numbers
- Important: if library returns good results that answer the user's question, stop and provide the full answer
  - don't use lookup if library already found what was needed
  - only continue searching if library results are incomplete or don't answer the question
  - when library returns documentation with code blocks or lists, share them in full

---

Here's the current conversation:

${conversation}
`

  const tools = {
    'apps-docs': tool({
      description: `how to generate apps`,
      inputSchema: EmptySchema,
      outputSchema: valibotSchema(string()),
      execute: async () => {
        return agentAppsDocs
      },
    }),

    'tasks-docs': tool({
      description: `learn how to generate and run tasks`,
      inputSchema: EmptySchema,
      outputSchema: valibotSchema(string()),
      execute: async () => {
        return agentTasksDocs
      },
    }),

    'zero-docs': tool({
      description: `run this before doing zero-run, it gives you docs on how to use zero and the schema`,
      inputSchema: EmptySchema,
      outputSchema: valibotSchema(string()),
      execute: async () => {
        return agentZeroDocs
      },
    }),

    'zero-schema': tool({
      description: `lookup info on the zero table structure and relationships`,
      outputSchema: valibotSchema(string()),
      inputSchema: valibotSchema(
        object({
          tables: array(string()),
        })
      ),
      execute: async ({ tables }) => {
        if (!zeroTablesSchema || !zeroRelationshipsSchema) {
          return `no schema available`
        }
        return extractTableSchema(tables, zeroTablesSchema, zeroRelationshipsSchema)
      },
    }),

    'zero-run': tool({
      description: `test zero code before sending it back to the user`,
      outputSchema: valibotSchema(string()),
      inputSchema: valibotSchema(
        object({
          code: string(),
        })
      ),
      execute: async ({ code }) => {
        console.info(`[chat] [zero-run] code:`, code)

        const mutation = matchZeroMutation(code)
        if (mutation) {
          console.info(`got mutation`, mutation)
          return '(disabled temporarily)'
        }

        const query = matchZeroQuery(code)
        if (query) {
          console.info(`got query`, query)
          // return serverTransaction(tx => {

          // })
        }

        return '(disabled temporarily)'
      },
    }),

    'app-actions': tool({
      description: `get all actions available from a given app using the id`,
      inputSchema: valibotSchema(
        object({
          id: string(),
        })
      ),
      execute: async ({ id }) => {
        console.info(`[chat] [app] get actions:`, id)
        return appActions.filter((a) => a.id === id)
      },
    }),

    'app-action-run': tool({
      description: `run a given chat action`,
      inputSchema: valibotSchema(
        object({
          id: string(),
          action: string(),
          message: string(),
        })
      ),
      execute: async (props) => {
        const { id, action, message } = props
        console.info(`[chat] [app] run action:`, props)
        const foundAction = appActions.find((a) => a.action === action && a.id === id)
        const foundApp = apps.find((a) => a.id === id)
        if (!foundAction || !foundApp?.id) {
          console.error(`No action found`, id, action)
          return
        }
        try {
          const out = await runApp({
            userId,
            appId: foundApp.id,
            serverId,
            action: {
              channelId,
              message,
              name: foundAction.action,
            },
          })
          return out
        } catch (err) {
          console.error(`[chat] [app] error running action`, err, props)
          return `Error running app action: ${err}`
        }
      },
    }),

    'chat-docs': tool({
      description: `docs on start.chat`,
      outputSchema: valibotSchema(string()),
      inputSchema: EmptySchema,
      execute: async () => {
        if (!chatDocs) {
          return `not available`
        }
        return chatDocs
      },
    }),

    library: tool({
      description: `Look up curated docs, returns most relevant results.`,
      inputSchema: SearchSchema,
      outputSchema: valibotSchema(string()),
      execute: async ({ search, page = 0 }) => {
        console.info(`Library: ${search}`)
        return await safeExecute(async () => {
          const results = await searchActions.searchLibrary(search, {
            limit: 6,
            offset: 6 * page,
          })
          console.info(
            `Library returning`,
            results.length,
            `results`,
            process.env.NODE_ENV === 'development' ? results : ''
          )

          if (results.length === 0) {
            return 'No relevant documentation found.'
          }

          // check if first document is substantial (>1000 chars is a good doc)
          const firstDoc = results[0]
          const firstContent = firstDoc.content || firstDoc.value || ''
          const isSubstantial = firstContent.length > 1000

          // if first doc is substantial, just use it alone; otherwise take top 2
          const docsToProcess = isSubstantial ? [firstDoc] : results.slice(0, 2)

          console.info(
            `Processing ${docsToProcess.length} doc(s), first doc length: ${firstContent.length}`
          )

          const extractedContent = await extractRelevantContent(
            prompt, // user's original query
            search, // search query
            docsToProcess.map((x) => ({
              title: x.title || 'Documentation',
              content: x.content || x.value,
            })),
            'gemini-2.5-flash' // use flash for faster library responses
          )

          if (process.env.NODE_ENV === 'development') {
            console.info('Library extracted content:')
            console.info('------------------------')
            console.info(
              extractedContent.substring(0, 500) +
                (extractedContent.length > 500 ? '...' : '')
            )
            console.info('------------------------')
            console.info(`Total length: ${extractedContent.length} chars`)
          }

          // only add summary if we used just one doc and there are more available
          if (isSubstantial && results.length > 1) {
            const additionalDocs = results.slice(1)
            let output = extractedContent
            output += '\n\n---\n\n'
            output += `*${additionalDocs.length} additional related documents available: `
            output += additionalDocs
              .slice(0, 3)
              .map((x) => x.title || 'Untitled')
              .filter((title) => title !== 'Untitled')
              .join(', ')
            if (additionalDocs.length > 3) {
              output += `, and ${additionalDocs.length - 3} more`
            }
            output += '*'
            return output
          }

          // if we processed 2 docs, add summary for remaining
          if (!isSubstantial && results.length > 2) {
            const additionalDocs = results.slice(2)
            let output = extractedContent
            output += '\n\n---\n\n'
            output += `*${additionalDocs.length} additional related documents found: `
            output += additionalDocs
              .slice(0, 2)
              .map((x) => x.title || 'Untitled')
              .filter((title) => title !== 'Untitled')
              .join(', ')
            if (additionalDocs.length > 2) {
              output += `, and ${additionalDocs.length - 2} more`
            }
            output += '*'
            return output
          }

          return extractedContent
        })
      },
    }),

    code: tool({
      description: `What you can do.`,
      inputSchema: EmptySchema,
      outputSchema: valibotSchema(string()),
      execute: async () => {
        return await safeExecute(async () => {
          return `
You always use "config v4" shorthands, themes, and tokens to generate code (see library config-v4), your general format should be like this:

\`\`\`tsx
import { View, Text } from 'tamagui'

export default () => {
  return (
    <View mx="$4" p="$4" rounded="$3" bg="$color2">
      <Text>
        Hello world!
      </Text>
    </View>
  )
}
\`\`\`

For icons you can import from @tamagui/lucide-icons, stuff like User, Lock and use as React components.

You can use code-example to pull ready-made demos off the shelf, you should put them in a separate code block below the demo itself, they are:

- Accordion
- AlertDialog
- Card
- Checkbox
- Dialog
- Forms - for Form with submit
- Group - For button and inputs being segmented or grouped horizontally nicely
- Headings - H1-H6
- Image
- Inputs
- Label - use alongside Input for forms, htmlFor to reference a form
- LinearGradient - can take tokens like colors={['$color1', '$color6']}
- ListItem
- Popover
- Progress
- RadioGroup
- Select - always use Adapt to adapt to a sheet for mobile/small screens
- Separator - horizontal or vertical
- Sheet
- Slider
- Spinner
- Switch
- TabsAdvanced - nicer tabs example
- Tabs - for vertical sections of content that you can switch between
- Toast - note its not exported by tamagui, but by @tamagui/toast
- Tooltip

If asked what you can do you can say:

I'm a chatbot that is just getting its legs. I can answer questions about Tamagui and One, and have a large library of knowledge about them.

I can also help generate code, though it is in early stages. Just tell me what you want me to create and I'll try.`
        })
      },
    }),

    'code-generate': tool({
      description: `Generate code`,
      inputSchema: CodeGenerateSchema,
      outputSchema: valibotSchema(string()),
      execute: async ({ context }) => {
        console.info(`Generating code: ${context}`)
        return await generateCode(context)
      },
    }),

    lookup: tool({
      description: `Look up in knowledgebase`,
      inputSchema: SearchSchema,
      outputSchema: valibotSchema(string()),
      execute: async ({ search, page = 0 }) => {
        console.info(`Lookup: ${search}`)
        return await safeExecute(async () => {
          const results = await searchActions.search(search, {
            limit: 4,
            offset: 4 * page,
            filter: {
              server: serverId,
            },
          })

          console.info(`found`, results.length)

          const lastMessages = messages
            .slice(-3)
            .map((m) => m.content)
            .join('\n\n')
          const filtered = await llmFilterResults(
            prompt,
            lastMessages,
            search,
            results,
            'gemini-2.5-flash' // use flash for lookup
          )

          console.info(`filtered to`, filtered.length)

          return JSON.stringify(filtered)
        })
      },
    }),
  }

  // call streamText directly instead of using createChatServer
  const { textStream } = streamText({
    model: modelInstance,
    maxOutputTokens: 8192 * 2,
    stopWhen: stepCountIs(100),
    experimental_telemetry: {
      isEnabled: false,
    },
    onAbort(info) {
      // console.info(`aborted`, info)
    },
    onChunk({ chunk }) {
      logChunk(chunk)
    },
    tools,
    prompt: `${systemPrompt} "${prompt}"`,
  })

  // create a combined stream that first sends the quick greeting, then the main response
  // const combinedStream = new ReadableStream({
  //   async start(controller) {
  //     // send the quick greeting first
  //     controller.enqueue(quickGreeting)
  //     controller.enqueue('\n\n')

  //     // then stream the main response
  //     const reader = textStream.pipeThrough(stripThinkingBlocks()).getReader()

  //     try {
  //       while (true) {
  //         const { done, value } = await reader.read()
  //         if (done) break
  //         controller.enqueue(value)
  //       }
  //     } finally {
  //       controller.close()
  //     }
  //   },
  // })

  return new Response(textStream)
}

async function generateCode(context: string) {
  const { text } = await generateText({
    model: models['claude-4-sonnet'](),
    maxOutputTokens: 8192,
    prompt: `
We're generating a Tamagui code snippet. Here's all your relevant context:

${context}

You can spend up to 10 sentences discussing your plan, then return the code snippet in a "tsx" markdown block at the end:`,
  })

  return text
}

async function llmFilterResults(
  userPrompt: string,
  lastUserPrompt: string,
  search: string,
  results: SearchDocument[],
  modelName: 'gemini-2.5-flash' | 'claude-4-sonnet' = 'gemini-2.5-flash'
): Promise<string> {
  if (results.length <= 1) {
    return ``
  }

  const prompt = `
We're filtering search results to decide if they are relevant to a prompt + search

This search index can have misleading docs, like old versions of files, so we need to remove those.
If you see a document in the results that looks like a more recent or matching version, and another that looks
older and not matching, lets be sure to exclude it.

I'd like you to think, and then return your answer at the end with just the ids you choose like this:

<results>id1, id2, id3</results>

Here's the current prompt:

<prompt>
${userPrompt}
</prompt>

Here's their last prompt

<prompt>
${lastUserPrompt}
</prompt>

Here's the current search from our parent LLM:

<search>
${search}
</search>

And here's the docs we found using fuzzy and vector searching:

${results
  .map((result) => {
    return `

<id>${result.id}</id>
<title>${result.title}</title>
<content_preview>${result.content?.substring(0, 200)}</content_preview>

    `
  })
  .join('---')}

---

That's all the docs, please choose your answer:
`.trim()

  const { text } = await generateText({
    model: models[modelName](),
    maxOutputTokens: 8192,
    prompt,
  })

  const ids = text.match(/<ids>(.*?)<\/ids>/)?.[1]
  if (!ids) {
    return results.map((doc) => `id ${doc.id}: ${doc.content}`).join('\n')
  }

  return results
    .filter((x) => ids.includes(x.id || ''))
    .map((doc) => `id ${doc.id}: ${doc.content}`)
    .join('\n')
}

async function extractRelevantContent(
  userQuery: string,
  searchQuery: string,
  documents: Array<{ title?: string; content?: string }>,
  modelName: 'gemini-2.5-flash' | 'claude-4-sonnet' = 'claude-4-sonnet'
): Promise<string> {
  if (documents.length === 0) {
    return ''
  }

  const fullContent = documents
    .map(
      (doc, i) => `
<document index="${i + 1}">
<title>${doc.title || 'Documentation'}</title>
<content>${doc.content || ''}</content>
</document>`
    )
    .join('\n')

  const prompt = `
You are helping extract ONLY the relevant portions from documentation to answer a user's question.

User's question: "${userQuery}"
Search query used: "${searchQuery}"

Your task:
1. Read through the documents below
2. Extract ONLY the sections that directly help answer the user's question
3. Preserve ALL the information - don't remove any data values, properties, or list items
4. You MAY improve formatting for clarity:
   - Convert poorly formatted lists into proper markdown lists
   - Add code block syntax highlighting if missing
   - Fix indentation in code blocks
   - Add headers for better organization
5. Critical: If the user asks about a list, configuration, or shorthands:
   - Include the complete list/object/code block
   - Include all properties, even if there are many
   - If there's a code block with shorthands, include every single shorthand
6. Remove any unrelated sections, even if they're in the same document

Return the extracted content in this format:
- Start each document's relevant content with its title as a header
- Separate multiple documents with "---"
- If nothing is relevant from a document, skip it entirely
- Use proper markdown formatting (code blocks, lists, headers)
- For configuration objects or lists (like shorthands), always include the complete structure with ALL items

Documents to extract from:
${fullContent}

Now extract only the relevant portions (remember: ALL shorthands, ALL properties, better formatting is OK):`

  const { text } = await generateText({
    model: models[modelName](),
    maxOutputTokens: 8192,
    prompt,
  })

  return text
}

function extractTableSchema(
  tableNames: string[],
  tablesContent: string,
  relationshipsContent: string
): string {
  const results: string[] = []

  // Extract table definitions
  for (const tableName of tableNames) {
    // Match: export const tableName = table('tableName')...primaryKey(...)
    const tablePattern = new RegExp(
      `export const ${tableName} = table\\('${tableName}'\\)[\\s\\S]*?\\.primaryKey\\([^)]*\\)`,
      'g'
    )
    const tableMatch = tablesContent.match(tablePattern)
    if (tableMatch) {
      results.push(`// Table: ${tableName}`)
      results.push(tableMatch[0])
      results.push('')
    }
  }

  // Extract relationship definitions
  for (const tableName of tableNames) {
    // Match: export const tableNameRelationships = relationships(tables.tableName, ...)
    const relationshipPattern = new RegExp(
      `export const ${tableName}Relationships = relationships\\(tables\\.${tableName}[\\s\\S]*?\\}\\)\\)`,
      'g'
    )
    const relationshipMatch = relationshipsContent.match(relationshipPattern)
    if (relationshipMatch) {
      results.push(`// Relationships: ${tableName}`)
      results.push(relationshipMatch[0])
      results.push('')
    }
  }

  return results.join('\n')
}

async function safeExecute<T>(fn: () => Promise<T>, ms = 25_000): Promise<T> {
  return new Promise((resolve) => {
    // Set up the timeout
    const timeoutId = setTimeout(() => {
      console.info(`Operation timed out after ${ms}ms`)
      resolve('Timed out calling tool' as unknown as T)
    }, ms)

    // Execute the function
    fn()
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        console.error('Error in timeout function:', error)
        clearTimeout(timeoutId)
        resolve(
          ('Error calling tool: ' +
            (error instanceof Error ? error.message : String(error))) as unknown as T
        )
      })
  })
}
