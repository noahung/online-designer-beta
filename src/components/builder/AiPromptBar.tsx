import React, { useState } from 'react'
import { Sparkles, Send, Mic, Bot } from 'lucide-react'

interface AiPromptBarProps {
  onGenerate?: (prompt: string) => void
  placeholder?: string
}

export default function AiPromptBar({
  onGenerate,
  placeholder = 'Chat to create or modify form...'
}: AiPromptBarProps) {
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isProcessing) return

    setIsProcessing(true)
    onGenerate?.(prompt.trim())
    setPrompt('')
    setTimeout(() => setIsProcessing(false), 800)
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 pointer-events-auto">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200/80 dark:border-purple-900/50 rounded-full shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all p-1.5"
      >
        <div className="pl-3 pr-2 text-purple-600 dark:text-purple-400 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none px-1"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!prompt.trim() || isProcessing}
            className={`p-2 rounded-full transition-all ${
              prompt.trim()
                ? 'bg-purple-600 text-white shadow-sm hover:bg-purple-700 hover:scale-105'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  )
}
