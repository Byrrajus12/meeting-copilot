'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useSessionStore } from '@/store/useSessionStore'
import { useAudioRecorder } from '@/lib/useAudioRecorder'
import { TranscriptChunk } from '@/types'
import { transcribeAudioChunk } from '@/lib/groqClient'

export default function MicPanel() {
  const { transcript, settings, isRecording, setIsRecording, addTranscriptChunk } =
    useSessionStore()
  const { startRecording, stopRecording, flushCurrentChunk } = useAudioRecorder()
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      setSessionSeconds((s) => s + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRecording])

  useEffect(() => {
    function handleManualTranscriptRefresh(event: Event) {
      const customEvent = event as CustomEvent<{ requestId: string }>
      const requestId = customEvent.detail?.requestId
      if (!requestId) return

      const complete = () => {
        window.dispatchEvent(
          new CustomEvent('manual-transcript-refresh-complete', {
            detail: { requestId },
          })
        )
      }

      if (!isRecording || !settings.groqApiKey) {
        complete()
        return
      }

      void (async () => {
        await flushCurrentChunk()
        complete()
      })()
    }

    window.addEventListener(
      'manual-transcript-refresh-request',
      handleManualTranscriptRefresh as EventListener
    )

    return () => {
      window.removeEventListener(
        'manual-transcript-refresh-request',
        handleManualTranscriptRefresh as EventListener
      )
    }
  }, [isRecording, settings.groqApiKey, flushCurrentChunk])

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  async function handleChunk(blob: Blob) {
    if (!settings.groqApiKey) return

    setIsTranscribing(true)
    try {
      const text = await transcribeAudioChunk(blob, settings.groqApiKey)

      if (text.trim()) {
        const chunk: TranscriptChunk = {
          id: crypto.randomUUID(),
          text: text.trim(),
          timestamp: new Date(),
        }
        addTranscriptChunk(chunk)
      }
    } catch {
    } finally {
      setIsTranscribing(false)
    }
  }

  async function handleToggleMic() {
    if (isRecording) {
      stopRecording()
      setIsRecording(false)
      setSessionSeconds(0)
    } else {
      if (!settings.groqApiKey) {
        alert('Please set your Groq API key in Settings first.')
        return
      }
      try {
        setSessionSeconds(0)
        await startRecording(handleChunk)
        setIsRecording(true)
      } catch {
        alert('Could not access microphone. Please check your browser permissions.')
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
          Transcript
        </h2>
        <div className="flex items-center gap-3">
          {isTranscribing && (
            <span className="flex items-center gap-1.5 text-xs text-neutral-600 font-mono">
              <Loader2 size={10} className="animate-spin" />
              PROCESSING
            </span>
          )}
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-pulse" />
              <span className="text-[#FF6A00]">REC</span>
            </span>
          )}
          {isRecording && (
            <span className="text-neutral-500 text-xs font-mono">
              {formatDuration(sessionSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Mic Button */}
      <button
        onClick={handleToggleMic}
        className={`flex items-center justify-center gap-2 w-full py-3 border text-xs font-mono uppercase tracking-wider transition-all duration-200 mb-4 ${
          isRecording
            ? 'border-[#FF6A00] text-[#FF6A00] bg-[#FF6A00]/5 hover:bg-[#FF6A00]/10'
            : 'border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
        }`}
      >
        {isRecording ? (
          <>
            <MicOff size={14} />
            Stop Recording
          </>
        ) : (
          <>
            <Mic size={14} />
            Start Recording
          </>
        )}
      </button>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 scrollbar-thin">
        {transcript.length === 0 ? (
          <p className="text-neutral-700 text-xs font-mono text-center mt-8">
            Start recording to see transcript here.
          </p>
        ) : (
          transcript.map((chunk) => (
            <div key={chunk.id} className="flex flex-col gap-1">
              <span className="text-neutral-700 text-[10px] font-mono tracking-wider">
                {new Date(chunk.timestamp).toLocaleTimeString()}
              </span>
              <p className="text-neutral-300 text-sm leading-relaxed font-mono">
                {chunk.text}
                <span className="inline-block w-1.5 h-3.5 bg-neutral-500 ml-1 animate-pulse" />
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}