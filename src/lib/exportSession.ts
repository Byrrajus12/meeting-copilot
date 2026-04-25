import { format } from 'date-fns'
import { TranscriptChunk, SuggestionBatch, ChatMessage } from '@/types'

interface ExportData {
  exportedAt: string
  transcript: {
    timestamp: string
    text: string
  }[]
  suggestionBatches: {
    batchId: string
    timestamp: string
    suggestions: {
      type: string
      preview: string
      detail?: string
    }[]
  }[]
  chat: {
    timestamp: string
    role: string
    content: string
  }[]
}

export function exportSession(
  transcript: TranscriptChunk[],
  suggestionBatches: SuggestionBatch[],
  chatMessages: ChatMessage[]
) {
  const data: ExportData = {
    exportedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    transcript: transcript.map((chunk) => ({
      timestamp: format(new Date(chunk.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      text: chunk.text,
    })),
    suggestionBatches: suggestionBatches.map((batch) => ({
      batchId: batch.id,
      timestamp: format(new Date(batch.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      suggestions: batch.suggestions.map((s) => ({
        type: s.type,
        preview: s.preview,
        ...(s.detail ? { detail: s.detail } : {}),
      })),
    })),
    chat: chatMessages.map((msg) => ({
      timestamp: format(new Date(msg.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      role: msg.role,
      content: msg.content,
    })),
  }

  // browser download
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `meeting-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
  a.click()
  URL.revokeObjectURL(url)
}