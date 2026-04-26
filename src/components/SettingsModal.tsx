'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useSessionStore } from '@/store/useSessionStore'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings, setGroqApiKey, clearGroqApiKey } = useSessionStore()
  const [form, setForm] = useState({ ...settings })

  function handleSave() {
    const { groqApiKey, ...rest } = form
    updateSettings(rest)
    setGroqApiKey(groqApiKey.trim())
    onClose()
  }

  function handleClearKey() {
    clearGroqApiKey()
    setForm((prev) => ({ ...prev, groqApiKey: '' }))
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0B0B0B] border border-[#1F1F1F] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-neutral-300 font-mono text-sm uppercase tracking-widest">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* API Key */}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-600 text-xs font-mono uppercase tracking-wider">
            Groq API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={form.groqApiKey}
              onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
              placeholder="gsk_..."
              className="bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-600 font-mono transition-colors flex-1"
            />
            <button
              type="button"
              onClick={handleClearKey}
              className="border border-neutral-700 hover:border-neutral-500 text-neutral-500 hover:text-neutral-300 px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-all"
            >
              Clear Key
            </button>
          </div>
          <p className="text-neutral-700 text-[11px] font-mono tracking-wide">
            Stored locally in your browser (not sent anywhere except Groq)
          </p>
        </div>

        {/* Suggestion Prompt */}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-600 text-xs font-mono uppercase tracking-wider">
            Live Suggestion Prompt
          </label>
          <textarea
            rows={6}
            value={form.suggestionPrompt}
            onChange={(e) => setForm({ ...form, suggestionPrompt: e.target.value })}
            className="bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-600 resize-y font-mono transition-colors"
          />
        </div>

        {/* Detail Prompt */}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-600 text-xs font-mono uppercase tracking-wider">
            Detail Answer Prompt (on click)
          </label>
          <textarea
            rows={5}
            value={form.detailPrompt}
            onChange={(e) => setForm({ ...form, detailPrompt: e.target.value })}
            className="bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-600 resize-y font-mono transition-colors"
          />
        </div>

        {/* Chat Prompt */}
        <div className="flex flex-col gap-2">
          <label className="text-neutral-600 text-xs font-mono uppercase tracking-wider">
            Chat System Prompt
          </label>
          <textarea
            rows={4}
            value={form.chatPrompt}
            onChange={(e) => setForm({ ...form, chatPrompt: e.target.value })}
            className="bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-600 resize-y font-mono transition-colors"
          />
        </div>

        {/* Context Windows */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-neutral-600 text-xs font-mono uppercase tracking-wider">
              Suggestion Context
              <span className="text-neutral-700 ml-1">(chars)</span>
            </label>
            <input
              type="number"
              value={form.suggestionContextWindow}
              onChange={(e) =>
                setForm({ ...form, suggestionContextWindow: Number(e.target.value) })
              }
              className="bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-600 font-mono transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-neutral-600 text-xs font-mono uppercase tracking-wider">
              Detail Context
              <span className="text-neutral-700 ml-1">(chars)</span>
            </label>
            <input
              type="number"
              value={form.detailContextWindow}
              onChange={(e) =>
                setForm({ ...form, detailContextWindow: Number(e.target.value) })
              }
              className="bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-600 font-mono transition-colors"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200 px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-all"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}