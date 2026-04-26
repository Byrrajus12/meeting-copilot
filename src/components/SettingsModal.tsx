'use client'

import { useState } from 'react'
import { X, ChevronDown, Key, Sliders, MessageSquare } from 'lucide-react'
import { useSessionStore } from '@/store/useSessionStore'

interface SettingsModalProps {
  onClose: () => void
}

type Tab = 'connection' | 'prompts' | 'advanced'

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings, setGroqApiKey, clearGroqApiKey } = useSessionStore()
  const [form, setForm] = useState({ ...settings })
  const [activeTab, setActiveTab] = useState<Tab>('connection')
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null)

  const trimmedFormKey = form.groqApiKey.trim()
  const trimmedSavedKey = settings.groqApiKey.trim()
  const hasTypedKey = trimmedFormKey.length > 0
  const isSavedKey = hasTypedKey && trimmedFormKey === trimmedSavedKey
  const isUnsavedKey = hasTypedKey && trimmedFormKey !== trimmedSavedKey

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

  function togglePrompt(id: string) {
    setExpandedPrompt(expandedPrompt === id ? null : id)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'connection', label: 'Connection', icon: <Key size={14} /> },
    { id: 'prompts', label: 'Prompts', icon: <MessageSquare size={14} /> },
    { id: 'advanced', label: 'Advanced', icon: <Sliders size={14} /> },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0A0A0A] border border-[#1A1A1A] w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
          <h2 className="text-neutral-300 font-mono text-xs uppercase tracking-[0.2em]">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-600 hover:text-neutral-400 transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1A1A1A]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-xs font-mono uppercase tracking-wider transition-colors relative
                ${
                  activeTab === tab.id
                    ? 'text-neutral-200'
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {activeTab === 'connection' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-neutral-400 text-sm font-mono">API Configuration</h3>
                <p className="text-neutral-600 text-xs">
                  Connect your Groq API key to enable AI features
                </p>
              </div>

              <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-5 space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest">
                    Groq API Key
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={form.groqApiKey}
                      onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
                      placeholder="gsk_..."
                      className="flex-1 bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-600 font-mono transition-colors"
                    />
                    {form.groqApiKey && (
                      <button
                        type="button"
                        onClick={handleClearKey}
                        className="px-4 text-neutral-600 hover:text-neutral-400 text-xs font-mono uppercase tracking-wider border border-[#1F1F1F] hover:border-neutral-600 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="text-neutral-700 text-[10px] font-mono mt-1">
                    Stored locally in your browser. Only sent to Groq servers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-[#1A1A1A] bg-[#0D0D0D]">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSavedKey
                      ? 'bg-emerald-500/80'
                      : isUnsavedKey
                        ? 'bg-amber-400/80'
                        : 'bg-neutral-700'
                  }`}
                />
                <span className="text-xs font-mono text-neutral-500">
                  {isSavedKey
                    ? 'Configured'
                    : isUnsavedKey
                      ? 'Unsaved changes'
                      : 'Not configured'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div className="space-y-1 mb-6">
                <h3 className="text-neutral-400 text-sm font-mono">System Prompts</h3>
                <p className="text-neutral-600 text-xs">Customize how the AI assistant behaves</p>
              </div>

              {[{
                id: 'suggestion',
                label: 'Live Suggestion Prompt',
                desc: 'Controls real-time suggestions during conversation',
                value: form.suggestionPrompt,
                onChange: (v: string) => setForm({ ...form, suggestionPrompt: v }),
              }, {
                id: 'detail',
                label: 'Detail Answer Prompt',
                desc: 'Used when expanding a suggestion for more detail',
                value: form.detailPrompt,
                onChange: (v: string) => setForm({ ...form, detailPrompt: v }),
              }, {
                id: 'chat',
                label: 'Chat System Prompt',
                desc: 'Defines the chat assistant personality',
                value: form.chatPrompt,
                onChange: (v: string) => setForm({ ...form, chatPrompt: v }),
              }].map((prompt) => (
                <div key={prompt.id} className="border border-[#1A1A1A] bg-[#0D0D0D] overflow-hidden">
                  <button
                    onClick={() => togglePrompt(prompt.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#111111] transition-colors"
                  >
                    <div className="space-y-1">
                      <span className="text-neutral-400 text-xs font-mono uppercase tracking-wider block">
                        {prompt.label}
                      </span>
                      <span className="text-neutral-600 text-[10px]">{prompt.desc}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-neutral-600 transition-transform ${
                        expandedPrompt === prompt.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {expandedPrompt === prompt.id && (
                    <div className="p-4 pt-0">
                      <textarea
                        rows={8}
                        value={prompt.value}
                        onChange={(e) => prompt.onChange(e.target.value)}
                        className="w-full bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-4 py-3 text-xs outline-none focus:border-neutral-600 resize-y font-mono transition-colors leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-neutral-400 text-sm font-mono">Context Windows</h3>
                <p className="text-neutral-600 text-xs">
                  Control how much conversation history is sent to the AI
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-5 space-y-3">
                  <label className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest block">
                    Suggestion Context
                  </label>
                  <input
                    type="number"
                    value={form.suggestionContextWindow}
                    onChange={(e) =>
                      setForm({ ...form, suggestionContextWindow: Number(e.target.value) })
                    }
                    className="w-full bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-600 font-mono transition-colors"
                  />
                  <p className="text-neutral-700 text-[10px] font-mono">
                    Characters of transcript for suggestions
                  </p>
                </div>

                <div className="bg-[#0D0D0D] border border-[#1A1A1A] p-5 space-y-3">
                  <label className="text-neutral-500 text-[10px] font-mono uppercase tracking-widest block">
                    Detail Context
                  </label>
                  <input
                    type="number"
                    value={form.detailContextWindow}
                    onChange={(e) =>
                      setForm({ ...form, detailContextWindow: Number(e.target.value) })
                    }
                    className="w-full bg-[#111111] border border-[#1F1F1F] text-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-600 font-mono transition-colors"
                  />
                  <p className="text-neutral-700 text-[10px] font-mono">
                    Characters of transcript for details
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1A1A1A]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-neutral-600 hover:text-neutral-400 text-xs font-mono uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="border border-neutral-700 hover:border-neutral-500 bg-[#111111] hover:bg-[#1A1A1A] text-neutral-400 hover:text-neutral-200 px-6 py-2.5 text-xs font-mono uppercase tracking-wider transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}