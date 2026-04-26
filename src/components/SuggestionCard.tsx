'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Suggestion } from '@/types'
import { useSessionStore } from '@/store/useSessionStore'
import { streamChatFromGroq } from '@/lib/groqClient'

interface SuggestionCardProps {
  suggestion: Suggestion
  batchId: string
}

const TYPE_LABELS: Record<Suggestion['type'], string> = {
  question: 'QUESTION',
  answer: 'ANSWER',
  fact_check: 'FACT CHECK',
  talking_point: 'TALKING POINT',
  clarification: 'CLARIFICATION',
}

// Subtle colors for label text - muted but distinguishable
const TYPE_LABEL_COLORS: Record<Suggestion['type'], string> = {
  question: 'text-blue-400/80',
  answer: 'text-emerald-400/80',
  fact_check: 'text-amber-400/80',
  talking_point: 'text-cyan-400/80',
  clarification: 'text-violet-400/80',
}

// Matching left border colors with low opacity
const TYPE_BORDER_COLORS: Record<Suggestion['type'], string> = {
  question: 'border-l-2 border-l-blue-400/40',
  answer: 'border-l-2 border-l-emerald-400/40',
  fact_check: 'border-l-2 border-l-amber-400/40',
  talking_point: 'border-l-2 border-l-cyan-400/40',
  clarification: 'border-l-2 border-l-violet-400/40',
}

export default function SuggestionCard({ suggestion, batchId }: SuggestionCardProps) {
  const { settings, transcript, updateSuggestionDetail } = useSessionStore()
  const [isLoading, setIsLoading] = useState(false)
  async function handleClick() {
    if (suggestion.detail) {
      window.dispatchEvent(
        new CustomEvent('suggestion-clicked', {
          detail: { preview: suggestion.preview, detail: suggestion.detail },
        })
      )
      return
    }

    if (!settings.groqApiKey) {
      alert('Please set your Groq API key in Settings first.')
      return
    }

    setIsLoading(true)
    try {
      const fullTranscript = transcript
        .map((c) => c.text)
        .join('\n')
        .slice(-settings.detailContextWindow)

      const filledPrompt = settings.detailPrompt
        .replace('{transcript}', fullTranscript)
        .replace('{suggestionPreview}', suggestion.preview)

      let detail = ''

      await streamChatFromGroq({
        transcript: fullTranscript,
        messages: [{ role: 'user', content: suggestion.preview }],
        systemPrompt: filledPrompt,
        apiKey: settings.groqApiKey,
        onToken: (token) => {
          detail += token
        },
      })

      updateSuggestionDetail(batchId, suggestion.id, detail)

      window.dispatchEvent(
        new CustomEvent('suggestion-clicked', {
          detail: { preview: suggestion.preview, detail },
        })
      )
    } catch {
      alert('Could not load suggestion detail. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full text-left border border-[#1F1F1F] hover:border-neutral-600 bg-[#111111] p-5 flex flex-col gap-3 transition-all duration-200 disabled:opacity-60 group ${TYPE_BORDER_COLORS[suggestion.type]}`}
    >
      {/* Type badge + loading */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] font-mono tracking-widest uppercase ${TYPE_LABEL_COLORS[suggestion.type]}`}
        >
          {TYPE_LABELS[suggestion.type]}
        </span>
        {isLoading && <Loader2 size={12} className="animate-spin text-neutral-600" />}
      </div>

      {/* Preview text */}
      <p className="text-neutral-300 text-sm leading-relaxed group-hover:text-neutral-200 transition-colors">
        {suggestion.preview}
      </p>

      {/* Click hint */}
      {!isLoading && (
        <p className="text-neutral-700 text-[10px] font-mono tracking-wider">
          {suggestion.detail ? 'VIEW IN CHAT' : 'CLICK FOR DETAIL'}
        </p>
      )}
    </button>
  )
}