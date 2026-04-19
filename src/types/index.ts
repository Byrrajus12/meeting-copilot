export interface TranscriptChunk {
  id: string
  text: string
  timestamp: Date
}

export interface Suggestion {
  id: string
  type: 'question' | 'answer' | 'fact_check' | 'talking_point' | 'clarification'
  preview: string
  detail?: string
  timestamp: Date
}

export interface SuggestionBatch {
  id: string
  suggestions: Suggestion[]
  timestamp: Date
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface SessionSettings {
  groqApiKey: string
  suggestionPrompt: string
  detailPrompt: string
  chatPrompt: string
  suggestionContextWindow: number
  detailContextWindow: number
}