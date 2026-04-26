'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useSessionStore } from '@/store/useSessionStore'
import { ChatMessage } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChatFromGroq } from '@/lib/groqClient'

export default function ChatPanel() {
  const {
    chatMessages,
    settings,
    transcript,
    isLoadingChat,
    setIsLoadingChat,
    addChatMessage,
  } = useSessionStore()

  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamingMessageRef = useRef<string>('')
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamingContent])

  async function sendMessage(userContent: string) {
    if (!userContent.trim() || isLoadingChat) return
    if (!settings.groqApiKey) {
      alert('Please set your Groq API key in Settings first.')
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userContent.trim(),
      timestamp: new Date(),
    }
    addChatMessage(userMessage)
    setInput('')
    setIsLoadingChat(true)
    setIsStreaming(true)
    streamingMessageRef.current = ''
    setStreamingContent('')

    try {
      const fullTranscript = transcript
        .map((c) => c.text)
        .join('\n')
        .slice(-settings.detailContextWindow)

      const history = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      await streamChatFromGroq({
        transcript: fullTranscript,
        messages: [...history, { role: 'user', content: userContent.trim() }],
        systemPrompt: settings.chatPrompt,
        apiKey: settings.groqApiKey,
        onToken: (token) => {
          streamingMessageRef.current += token
          setStreamingContent(streamingMessageRef.current)
        },
      })

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: streamingMessageRef.current,
        timestamp: new Date(),
      }
      addChatMessage(assistantMessage)
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }
      addChatMessage(errorMessage)
    } finally {
      setIsLoadingChat(false)
      setIsStreaming(false)
      setStreamingContent('')
      streamingMessageRef.current = ''
    }
  }

  useEffect(() => {
    function handleSuggestionMessage(e: CustomEvent) {
      const { preview, detail } = e.detail
      const combined = detail
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: preview,
        timestamp: new Date(),
      }
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: combined,
        timestamp: new Date(),
      }
      addChatMessage(userMsg)
      addChatMessage(assistantMessage)
    }

    window.addEventListener('suggestion-clicked', handleSuggestionMessage as EventListener)
    return () =>
      window.removeEventListener('suggestion-clicked', handleSuggestionMessage as EventListener)
  }, [addChatMessage])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
          Chat
        </h2>
        {isLoadingChat && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-neutral-600">
            <Loader2 size={10} className="animate-spin" />
            PROCESSING
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-3 mb-4 scrollbar-thin">
        {chatMessages.length === 0 && !isStreaming ? (
          <p className="text-neutral-700 text-xs font-mono text-center mt-8">
            Click a suggestion or type a question to start.
          </p>
        ) : (
          <>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'max-w-[90%] bg-[#1F1F1F] text-neutral-200 border border-neutral-700 whitespace-pre-wrap'
                      : 'max-w-prose border-l border-neutral-800 pl-4 text-neutral-200'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-prose prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-headings:leading-tight prose-pre:my-2 prose-code:text-neutral-300 prose-strong:text-neutral-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                <span className="text-neutral-700 text-[10px] font-mono tracking-wider">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}

            {isStreaming && (
              <div className="flex flex-col gap-1 items-start">
                <div className="px-4 py-3 text-sm leading-relaxed max-w-prose border-l border-neutral-800 pl-4 text-neutral-200">
                  {streamingContent ? (
                    <div className="prose prose-sm prose-invert max-w-prose prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-headings:leading-tight prose-pre:my-2 prose-code:text-neutral-300 prose-strong:text-neutral-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <Loader2 size={12} className="animate-spin text-neutral-600" />
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about the conversation..."
          className="flex-1 bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-600 resize-none placeholder-neutral-700 font-mono transition-colors"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoadingChat}
          className="border border-[#1F1F1F] hover:border-neutral-600 disabled:opacity-40 text-neutral-500 hover:text-neutral-300 p-2.5 transition-all"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}