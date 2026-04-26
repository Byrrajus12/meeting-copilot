import { Suggestion } from '@/types'

const GROQ_API_BASE = 'https://api.groq.com/openai/v1'

type ChatRole = 'system' | 'user' | 'assistant'

interface ChatMessagePayload {
  role: ChatRole
  content: string
}

interface StreamChatParams {
  transcript: string
  messages: ChatMessagePayload[]
  systemPrompt: string
  apiKey: string
  onToken: (token: string) => void
  maxTokens?: number
  temperature?: number
}

interface SuggestionsParams {
  transcript: string
  previousSuggestions: string
  prompt: string
  apiKey: string
}

function withTranscript(systemPrompt: string, transcript: string) {
  return systemPrompt
    ? systemPrompt.replace('{transcript}', transcript)
    : 'You are a helpful meeting assistant.'
}

export async function transcribeAudioChunk(blob: Blob, apiKey: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', blob, 'chunk.webm')
  formData.append('model', 'whisper-large-v3')

  const response = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Transcription request failed')
  }

  const data = await response.json()
  return typeof data.text === 'string' ? data.text : ''
}

export async function fetchSuggestionsFromGroq({
  transcript,
  previousSuggestions,
  prompt,
  apiKey,
}: SuggestionsParams): Promise<Array<Pick<Suggestion, 'type' | 'preview'>>> {
  const filledPrompt = prompt
    .replace('{transcript}', transcript)
    .replace('{previousSuggestions}', previousSuggestions)

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: 'You are a meeting assistant. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: filledPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    throw new Error('Suggestions request failed')
  }

  const data = await response.json()
  const raw = data?.choices?.[0]?.message?.content ?? '[]'
  const parsed = JSON.parse(raw)

  const suggestions = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.suggestions)
      ? parsed.suggestions
      : []

  return suggestions
}

export async function streamChatFromGroq({
  transcript,
  messages,
  systemPrompt,
  apiKey,
  onToken,
  maxTokens = 1500,
  temperature = 0.5,
}: StreamChatParams): Promise<string> {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'system', content: withTranscript(systemPrompt, transcript) }, ...messages],
      stream: true,
      max_tokens: maxTokens,
      temperature,
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error('Chat request failed')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue

      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue

      try {
        const parsed = JSON.parse(payload)
        const token = parsed?.choices?.[0]?.delta?.content ?? ''
        if (token) {
          fullText += token
          onToken(token)
        }
      } catch {
        // Ignore malformed stream chunks and continue reading.
      }
    }
  }

  return fullText
}
