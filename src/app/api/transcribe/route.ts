import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const audio = formData.get('audio') as File
  const apiKey = formData.get('apiKey') as string

  if (!audio || !apiKey) {
    return NextResponse.json(
      { error: 'Missing audio or apiKey' },
      { status: 400 }
    )
  }

  try {
    const groq = getGroqClient(apiKey)
    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: 'whisper-large-v3',
    })
    return NextResponse.json({ text: transcription.text })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}