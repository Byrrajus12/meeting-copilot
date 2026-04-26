'use client'

import { useEffect, useState } from 'react'
import { Settings, Download } from 'lucide-react'
import MicPanel from '@/components/MicPanel'
import SuggestionsPanel from '@/components/SuggestionsPanel'
import ChatPanel from '@/components/ChatPanel'
import SettingsModal from '@/components/SettingsModal'
import TimeDisplay from '@/components/TimeDisplay'
import { useSessionStore } from '@/store/useSessionStore'
import { exportSession } from '@/lib/exportSession'

export default function Home() {
  const [showSettings, setShowSettings] = useState(false)
  const {
    transcript,
    suggestionBatches,
    chatMessages,
    settings,
    hydrateGroqApiKey,
  } = useSessionStore()

  useEffect(() => {
    hydrateGroqApiKey()
  }, [hydrateGroqApiKey])

  function handleExport() {
    if (transcript.length === 0 && suggestionBatches.length === 0 && chatMessages.length === 0) {
      alert('Nothing to export yet.')
      return
    }
    exportSession(transcript, suggestionBatches, chatMessages)
  }

  return (
    <div className="flex flex-col h-screen bg-[#0B0B0B] text-neutral-300">
      {/* Top Center Time Display */}
      <TimeDisplay />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#1F1F1F] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
            TwinMind
          </span>
          <span className="text-[#1F1F1F]">/</span>
          <span className="text-neutral-300 font-mono text-xs uppercase tracking-widest">
            Meeting Copilot
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* No API key warning */}
          {!settings.groqApiKey && (
            <span className="text-[#FF6A00] text-[10px] font-mono uppercase tracking-wider border border-[#FF6A00]/30 px-3 py-1">
              API Key Required
            </span>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      </header>

      {/* 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left - Transcript */}
        <div className="w-[30%] border-r border-[#1F1F1F] p-5 overflow-hidden flex flex-col bg-[#111111]">
          <MicPanel />
        </div>

        {/* Middle - Suggestions */}
        <div className="w-[35%] border-r border-[#1F1F1F] p-5 overflow-hidden flex flex-col bg-[#111111]">
          <SuggestionsPanel />
        </div>

        {/* Right - Chat */}
        <div className="flex-1 p-5 overflow-hidden flex flex-col bg-[#111111]">
          <ChatPanel />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}