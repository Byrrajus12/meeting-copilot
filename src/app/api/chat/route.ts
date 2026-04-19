import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const { transcript, messages, systemPrompt, apiKey } = await req.json()

  if (!messages || !apiKey) {
    return NextResponse.json(
      { error: 'Missing messages or apiKey' },
      { status: 400 }
    )
  }

  const system = systemPrompt
    ? systemPrompt.replace('{transcript}', transcript ?? '')
    : 'You are a helpful meeting assistant.'

  try {
    const groq = getGroqClient(apiKey)
    const stream = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
      stream: true,
      max_tokens: 1500,
      temperature: 0.5,
    })

    // Stream tokens back to the client as plain text
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(encoder.encode(text))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Chat failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}