'use client'

import { useEffect, useCallback, useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useSessionStore } from '@/store/useSessionStore'
import SuggestionCard from './SuggestionCard'
import { SuggestionBatch, Suggestion } from '@/types'
import { fetchSuggestionsFromGroq } from '@/lib/groqClient'

export default function SuggestionsPanel() {
  const {
    transcript,
    suggestionBatches,
    settings,
    isRecording,
    isLoadingSuggestions,
    setIsLoadingSuggestions,
    addSuggestionBatch,
  } = useSessionStore()
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  const fetchSuggestions = useCallback(async () => {
    const state = useSessionStore.getState()
    if (!state.settings.groqApiKey || state.transcript.length === 0) return
    if (state.isLoadingSuggestions) return

    setIsLoadingSuggestions(true)
    try {
      const recentTranscript = state.transcript
        .map((c) => c.text)
        .join('\n')
        .slice(-state.settings.suggestionContextWindow)

      const previousPreviews = state.suggestionBatches
        .flatMap((b) => b.suggestions.map((s) => s.preview))
        .slice(0, 9)
        .join('\n')

      const suggestions = await fetchSuggestionsFromGroq({
        transcript: recentTranscript,
        previousSuggestions: previousPreviews,
        prompt: state.settings.suggestionPrompt,
        apiKey: state.settings.groqApiKey,
      })

      if (!suggestions.length) return

      const batch: SuggestionBatch = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        suggestions: suggestions.map((s: Omit<Suggestion, 'id' | 'timestamp'>) => ({
          id: crypto.randomUUID(),
          type: s.type,
          preview: s.preview,
          timestamp: new Date(),
        })),
      }

      addSuggestionBatch(batch)
    } catch {
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [setIsLoadingSuggestions, addSuggestionBatch])

  const handleManualRefresh = useCallback(async () => {
    if (isLoadingSuggestions || isManualRefreshing) return
    if (!isRecording && transcript.length === 0) return

    setIsManualRefreshing(true)
    try {
      if (isRecording) {
        const requestId = crypto.randomUUID()

        await new Promise<void>((resolve) => {
          let done = false

          const onComplete = (event: Event) => {
            const customEvent = event as CustomEvent<{ requestId: string }>
            if (customEvent.detail?.requestId !== requestId) return

            if (!done) {
              done = true
              window.removeEventListener(
                'manual-transcript-refresh-complete',
                onComplete as EventListener
              )
              resolve()
            }
          }

          window.addEventListener(
            'manual-transcript-refresh-complete',
            onComplete as EventListener
          )

          window.dispatchEvent(
            new CustomEvent('manual-transcript-refresh-request', {
              detail: { requestId },
            })
          )

          setTimeout(() => {
            if (!done) {
              done = true
              window.removeEventListener(
                'manual-transcript-refresh-complete',
                onComplete as EventListener
              )
              resolve()
            }
          }, 15000)
        })
      }

      await fetchSuggestions()
    } finally {
      setIsManualRefreshing(false)
    }
  }, [isLoadingSuggestions, isManualRefreshing, transcript.length, isRecording, fetchSuggestions])

  useEffect(() => {
    if (!isRecording) return
    if (transcript.length === 0) return
    void fetchSuggestions()
  }, [isRecording, transcript.length, fetchSuggestions])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
          Suggestions
        </h2>
        <button
          onClick={handleManualRefresh}
          disabled={isLoadingSuggestions || isManualRefreshing}
          className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-neutral-600 hover:text-neutral-400 disabled:opacity-40 transition-colors uppercase"
        >
          {isLoadingSuggestions || isManualRefreshing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          Refresh
        </button>
      </div>

      {/* Suggestion Batches */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-7 pr-3 scrollbar-thin">
        {suggestionBatches.length === 0 ? (
          <p className="text-neutral-700 text-xs font-mono text-center mt-8">
            {transcript.length === 0
              ? 'Start recording to get suggestions.'
              : 'Click refresh to generate suggestions.'}
          </p>
        ) : (
          suggestionBatches.map((batch) => (
            <div key={batch.id} className="flex flex-col gap-3">
              {/* Batch timestamp */}
              <span className="text-neutral-700 text-[10px] font-mono tracking-wider">
                {new Date(batch.timestamp).toLocaleTimeString()}
              </span>
              {/* Cards */}
              {batch.suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  batchId={batch.id}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}