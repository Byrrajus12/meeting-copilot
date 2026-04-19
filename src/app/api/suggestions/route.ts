import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const { transcript, previousSuggestions, prompt, apiKey } = await req.json()

  if (!transcript || !apiKey) {
    return NextResponse.json(
      { error: 'Missing transcript or apiKey' },
      { status: 400 }
    )
  }

  const filledPrompt = prompt
    .replace('{transcript}', transcript)
    .replace('{previousSuggestions}', previousSuggestions ?? '')

  try {
    const groq = getGroqClient(apiKey)
    const completion = await groq.chat.completions.create({
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
    })

    const raw = completion.choices[0].message.content ?? '[]'
    const parsed = JSON.parse(raw)

    // Handle both shapes:
    // [{}, {}]  or  {suggestions: [{}, {}]}
    const suggestions = Array.isArray(parsed)
      ? parsed
      : parsed.suggestions ?? []

    return NextResponse.json({ suggestions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Suggestions failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}