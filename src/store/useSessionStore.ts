import { create } from 'zustand'
import { TranscriptChunk, SuggestionBatch, ChatMessage, SessionSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/lib/prompts'

interface SessionState {
  transcript: TranscriptChunk[]
  suggestionBatches: SuggestionBatch[]
  chatMessages: ChatMessage[]
  settings: SessionSettings
  isRecording: boolean
  isLoadingSuggestions: boolean
  isLoadingChat: boolean

  addTranscriptChunk: (chunk: TranscriptChunk) => void
  addSuggestionBatch: (batch: SuggestionBatch) => void
  updateSuggestionDetail: (batchId: string, suggestionId: string, detail: string) => void
  addChatMessage: (message: ChatMessage) => void
  setIsRecording: (val: boolean) => void
  setIsLoadingSuggestions: (val: boolean) => void
  setIsLoadingChat: (val: boolean) => void
  updateSettings: (settings: Partial<SessionSettings>) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  transcript: [],
  suggestionBatches: [],
  chatMessages: [],
  settings: DEFAULT_SETTINGS,
  isRecording: false,
  isLoadingSuggestions: false,
  isLoadingChat: false,

  addTranscriptChunk: (chunk) =>
    set((s) => ({ transcript: [...s.transcript, chunk] })),

  addSuggestionBatch: (batch) =>
    set((s) => ({ suggestionBatches: [batch, ...s.suggestionBatches] })),

  updateSuggestionDetail: (batchId, suggestionId, detail) =>
    set((s) => ({
      suggestionBatches: s.suggestionBatches.map((b) =>
        b.id !== batchId ? b : {
          ...b,
          suggestions: b.suggestions.map((sg) =>
            sg.id !== suggestionId ? sg : { ...sg, detail }
          )
        }
      )
    })),

  addChatMessage: (message) =>
    set((s) => ({ chatMessages: [...s.chatMessages, message] })),

  setIsRecording: (val) => set({ isRecording: val }),
  setIsLoadingSuggestions: (val) => set({ isLoadingSuggestions: val }),
  setIsLoadingChat: (val) => set({ isLoadingChat: val }),

  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
}))