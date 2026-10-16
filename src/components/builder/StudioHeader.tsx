import React from 'react'
import {
  ArrowLeft,
  Eye,
  Save,
  Palette,
  Monitor,
  Tablet,
  Smartphone,
  Undo,
  Redo,
  Share2,
  Settings,
  ChevronDown,
  Check
} from 'lucide-react'

export type StudioTab = 'content' | 'workflow' | 'connect' | 'share' | 'results'
export type DeviceView = 'desktop' | 'tablet' | 'mobile'

interface StudioHeaderProps {
  formName: string
  onFormNameChange: (name: string) => void
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
  deviceView: DeviceView
  onDeviceViewChange: (view: DeviceView) => void
  onSave: () => void
  onPreview: () => void
  onOpenDesign: () => void
  onOpenShare: () => void
  onBack: () => void
  isSaving: boolean
  hasUnsavedChanges?: boolean
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
}

export default function StudioHeader({
  formName,
  onFormNameChange,
  activeTab,
  onTabChange,
  deviceView,
  onDeviceViewChange,
  onSave,
  onPreview,
  onOpenDesign,
  onOpenShare,
  onBack,
  isSaving,
  hasUnsavedChanges,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: StudioHeaderProps) {
  const tabs: { id: StudioTab; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'connect', label: 'Connect' },
    { id: 'share', label: 'Share' },
    { id: 'results', label: 'Results' }
  ]

  return (
    <header className="w-full bg-white dark:bg-[#0d0d0d] border-b border-zinc-200 dark:border-zinc-800/80 px-5 py-2 flex items-center justify-between gap-4 select-none z-30 sticky top-0 font-sans">
      {/* Left: Back Arrow + Form Name + Saved Indicator */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Back to Forms"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={formName}
            onChange={(e) => onFormNameChange(e.target.value)}
            placeholder="Untitled Form"
            className="font-bold text-sm text-zinc-900 dark:text-zinc-100 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60 focus:bg-white dark:focus:bg-[#18181b] px-2 py-1 rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 outline-none transition-all truncate max-w-[220px] md:max-w-[320px]"
          />

          {hasUnsavedChanges ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: OpenAI-Style Underline Navigation Tabs */}
      <div className="hidden md:flex items-center gap-6 h-full text-xs font-medium">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`py-2 relative transition-colors ${
                isActive
                  ? 'text-zinc-950 dark:text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-950 dark:after:bg-white'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Right Area: Undo/Redo, Theme, Device Switcher, Preview, Save */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Device Switcher (in Content tab) */}
        {activeTab === 'content' && (
          <div className="hidden lg:flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => onDeviceViewChange('desktop')}
              className={`p-1 rounded-md transition-colors ${
                deviceView === 'desktop'
                  ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDeviceViewChange('tablet')}
              className={`p-1 rounded-md transition-colors ${
                deviceView === 'tablet'
                  ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDeviceViewChange('mobile')}
              className={`p-1 rounded-md transition-colors ${
                deviceView === 'mobile'
                  ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Design / Theme Modal Trigger */}
        <button
          type="button"
          onClick={onOpenDesign}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Customize Theme & Styling"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>

        {/* Primary Save / Publish Button (OpenAI white pill) */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Form'}</span>
        </button>
      </div>
    </header>
  )
}
