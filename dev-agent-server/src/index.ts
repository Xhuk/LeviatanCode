import 'dotenv/config'
import express from 'express'
import { readFile as fsReadFile, writeFile, mkdir, rename } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import OpenAI from 'openai'

const app = express()
app.use(express.json({ limit: '2mb' }))

const PORT = Number(process.env.PORT || 8787)
const ROOT = path.resolve(process.env.AGENT_ROOT ?? process.cwd())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // e.g. Ollama http://localhost:11434/v1
})

type Msg = { id: string; role: 'user'|'assistant'|'system'; content: string }
const projectChats = new Map<string, Msg[]>()
const chatById = new Map<string, Msg[]>()
const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

function safe(p: string) {
  const full = path.resolve(ROOT, p)
  if (!full.startsWith(ROOT)) throw new Error('Path outside sandbox')
  return full
}

async function complete(messages: {role:'user'|'assistant'|'system', content:string}[], model?: string) {
  const m = model || process.env.MODEL || 'gpt-4o-mini'
  const r = await openai.chat.completions.create({ model: m, messages })
  return r.choices[0].message.content || ''
}

async function* streamChunks(messages: any[], model?: string) {
  const m = model || process.env.MODEL || 'gpt-4o-mini'
  const stream = await openai.chat.completions.create({ model: m, messages, stream: true })
  for await (const part of stream) {
    const delta = part.choices?.[0]?.delta?.content
    if (delta) yield delta
  }
}

/* -------- Chat API expected by the UI -------- */
app.get('/api/projects/:projectId/ai-chats', (req, res) => {
  const key = req.params.projectId
  const history = projectChats.get(key) ?? []
  res.json(history.map(({id, role, content}) => ({ id, role, content })))
})

app.post('/api/projects/:projectId/ai-chats', async (req, res) => {
  const key = req.params.projectId
  const { message, model } = req.body as { message: string, model?: string }
  if (!message) return res.status(400).json({ error: 'message is required' })

  const history = projectChats.get(key) ?? []
  history.push({ id: uuid(), role: 'user', content: message })
  projectChats.set(key, history)

  try {
    const assistant = await complete(history.map(({role, content}) => ({ role, content })), model)
    history.push({ id: uuid(), role: 'assistant', content: assistant })
    res.json({ ok: true })
  } catch (e:any) {
    res.status(500).json({ error: e.message ?? String(e) })
  }
})

app.post('/api/ai-chats/:chatId/messages', async (req, res) => {
  const cid = req.params.chatId
  const { message, model } = req.body as { message: string, model?: string }
  if (!message) return res.status(400).json({ error: 'message is required' })

  const history = chatById.get(cid) ?? []
  history.push({ id: uuid(), role: 'user', content: message })
  chatById.set(cid, history)

  try {
    const assistant = await complete(history.map(({role, content}) => ({ role, content })), model)
    history.push({ id: uuid(), role: 'assistant', content: assistant })
    res.json({ ok: true })
  } catch (e:any) {
    res.status(500).json({ error: e.message ?? String(e) })
  }
})

app.post('/api/ai-chats/:chatId/stream', async (req, res) => {
  const cid = req.params.chatId
  const { message, model } = req.body as { message: string, model?: string }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const history = chatById.get(cid) ?? []
    history.push({ id: uuid(), role: 'user', content: message })

    let streamed = ''
    for await (const chunk of streamChunks(history.map(({role, content}) => ({ role, content })), model)) {
      streamed += chunk
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
    }
    history.push({ id: uuid(), role: 'assistant', content: streamed })
    chatById.set(cid, history)

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()
  } catch (e:any) {
    res.write(`data: ${JSON.stringify({ error: e.message ?? String(e) })}\n\n`)
    res.end()
  }
})

/* -------- Developer Agent (tool-calling) -------- */
const tools = {
  readFile: async ({ filepath, path: altPath }: { filepath?: string, path?: string }) => {
    const target = filepath || altPath
    if (!target) throw new Error('filepath is required')
    return await fsReadFile(safe(target), 'utf8')
  },
  writeFile: async ({ filepath, content }: { filepath: string, content: string }) => {
    const full = safe(filepath)
    await mkdir(path.dirname(full), { recursive: true })
    await writeFile(full, content, 'utf8')
    return 'ok'
  },
  mkdir: async ({ dirpath }: { dirpath: string }) => {
    await mkdir(safe(dirpath), { recursive: true })
    return 'ok'
  },
  move: async ({ from, to }: { from: string, to: string }) => {
    await rename(safe(from), safe(to)); return 'ok'
  },
  run: async ({ cmd, args = [] }: { cmd: string, args?: string[] }) =>
    new Promise((resolve) => {
      const child = spawn(cmd, args, { cwd: ROOT, shell: true })
      let out = ''; let err = ''
      child.stdout.on('data', d => out += d)
      child.stderr.on('data', d => err += d)
      child.on('close', code => resolve({ code, out, err }))
    }),
}

app.post('/api/agent', async (req, res) => {
  const { messages, model } = req.body as { messages: any[], model?: string }
const toolDefs = [
  {
    type: 'function' as const,
    function: {
      name: 'readFile',
      description: 'Read file contents',
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to file to read' }
        },
        required: ['filepath']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'writeFile',
      description: 'Write content to a file',
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string', description: 'Path to file to write' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['filepath', 'content']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'mkdir',
      description: 'Create a directory',
      parameters: {
        type: 'object',
        properties: {
          dirpath: { type: 'string', description: 'Directory path to create' }
        },
        required: ['dirpath']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'move',
      description: 'Move or rename a file',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Source path' },
          to: { type: 'string', description: 'Destination path' }
        },
        required: ['from', 'to']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'run',
      description: 'Execute a shell command',
      parameters: {
        type: 'object',
        properties: {
          cmd: { type: 'string', description: 'Command to run' },
          args: {
            type: 'array',
            items: { type: 'string' },
            description: 'Command arguments'
          }
        },
        required: ['cmd']
      }
    }
  }
]

  let history = messages
  for (let i = 0; i < 8; i++) {
    const r = await openai.chat.completions.create({
      model: model || process.env.MODEL || 'gpt-4o-mini',
      messages: history,
      tools: toolDefs,
    })
    const msg = r.choices[0].message
    const call = msg.tool_calls?.[0]
    if (!call) { res.json(msg); return }

    let result: any
    try {
      const args = call.function.arguments ? JSON.parse(call.function.arguments) : {}
      // @ts-ignore
      result = await tools[call.function.name](args)
    } catch (e:any) {
      result = { error: e.message ?? String(e) }
    }
    history = [...history, msg, { role: 'tool', name: call.function.name, content: JSON.stringify(result) as any }]
  }
  res.status(400).json({ error: 'too many tool calls' })
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Dev Agent server running on :${PORT}, root: ${ROOT}`)
})