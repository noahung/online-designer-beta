import React, { useState, useMemo } from 'react'
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Smartphone,
  Monitor,
  Layout,
  Maximize2,
  Sliders,
  Sparkles,
  Layers,
  Globe,
  Play
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

interface ShareEmbedStudioProps {
  formId?: string
  formName: string
  clientName?: string
}

type EmbedMode = 'standard' | 'popup' | 'side_tab' | 'full_page'

export default function ShareEmbedStudio({
  formId,
  formName,
  clientName
}: ShareEmbedStudioProps) {
  const { push } = useToast()

  const [activeEmbedMode, setActiveEmbedMode] = useState<EmbedMode>('standard')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isPreviewActive, setIsPreviewActive] = useState(false)

  // Embed Customization Options
  const [iframeHeight, setIframeHeight] = useState('700px')
  const [transparentBg, setTransparentBg] = useState(true)
  const [hideHeader, setHideHeader] = useState(false)
  const [hideProgress, setHideProgress] = useState(false)
  const [buttonText, setButtonText] = useState('Open Form')
  const [buttonColor, setButtonColor] = useState('#000000')
  const [tabPosition, setTabPosition] = useState<'right' | 'left'>('right')

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://designer.advertomedia.co.uk'
  const shareUrl = formId ? `${origin}/form/${formId}` : `${origin}/form/preview`

  // Build query params
  const embedParams = useMemo(() => {
    const params = new URLSearchParams()
    if (transparentBg) params.set('transparent', 'true')
    if (hideHeader) params.set('hideHeader', 'true')
    if (hideProgress) params.set('hide_progress', '1')
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }, [transparentBg, hideHeader, hideProgress])

  const embedUrl = `${shareUrl}${embedParams}`

  // Generated Code Snippets
  const generatedCode = useMemo(() => {
    switch (activeEmbedMode) {
      case 'standard':
        return `<!-- Responsive Embed Form -->
<div style="width: 100%; height: ${iframeHeight}; min-height: 500px; position: relative;">
  <iframe
    src="${embedUrl}"
    width="100%"
    height="100%"
    frameborder="0"
    style="border: none; border-radius: 12px; width: 100%; height: 100%;"
    allow="camera; microphone; autoplay; encrypted-media;"
  ></iframe>
</div>`

      case 'popup':
        return `<!-- Popup Modal Trigger -->
<button
  onclick="document.getElementById('od-modal-${formId || 'form'}').style.display='flex'"
  style="padding: 10px 20px; border-radius: 9999px; background: ${buttonColor}; color: white; font-weight: 600; font-family: sans-serif; border: none; cursor: pointer;"
>
  ${buttonText}
</button>

<div
  id="od-modal-${formId || 'form'}"
  style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999999; align-items: center; justify-content: center; padding: 20px;"
  onclick="if(event.target === this) this.style.display='none'"
>
  <div style="position: relative; width: 100%; max-width: 800px; height: 90vh; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
    <button
      onclick="document.getElementById('od-modal-${formId || 'form'}').style.display='none'"
      style="position: absolute; top: 16px; right: 16px; z-index: 10; background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; font-weight: bold; cursor: pointer;"
    >✕</button>
    <iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" style="border:none; width: 100%; height: 100%;"></iframe>
  </div>
</div>`

      case 'side_tab':
        return `<!-- Floating Side Drawer Tab -->
<button
  onclick="document.getElementById('od-drawer-${formId || 'form'}').style.transform='translateX(0)'"
  style="position: fixed; ${tabPosition}: 0; top: 50%; transform: translateY(-50%); z-index: 99999; background: ${buttonColor}; color: white; padding: 10px 16px; border-radius: ${tabPosition === 'right' ? '8px 0 0 8px' : '0 8px 8px 0'}; border: none; font-weight: 600; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);"
>
  ${buttonText}
</button>

<div
  id="od-drawer-${formId || 'form'}"
  style="position: fixed; top: 0; bottom: 0; ${tabPosition}: 0; width: 100%; max-width: 500px; background: #ffffff; z-index: 100000; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); transform: translateX(${tabPosition === 'right' ? '100%' : '-100%'}); transition: transform 0.3s ease;"
>
  <button
    onclick="document.getElementById('od-drawer-${formId || 'form'}').style.transform='translateX(${tabPosition === 'right' ? '100%' : '-100%'})'"
    style="position: absolute; top: 16px; ${tabPosition === 'right' ? 'left: 16px' : 'right: 16px'}; z-index: 10; background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer;"
  >✕</button>
  <iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" style="border:none; width: 100%; height: 100%;"></iframe>
</div>`

      case 'full_page':
        return `<!-- Direct Full Screen Redirect -->
<meta http-equiv="refresh" content="0;url=${embedUrl}" />
<script>window.location.href = "${embedUrl}";</script>`
    }
  }, [activeEmbedMode, embedUrl, iframeHeight, buttonText, buttonColor, tabPosition, formId])

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
      push({ type: 'success', message: 'Public link copied to clipboard!' })
    } else {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2500)
      push({ type: 'success', message: 'Embed snippet copied to clipboard!' })
    }
  }

  const embedModes: { id: EmbedMode; label: string }[] = [
    { id: 'standard', label: 'Standard Iframe' },
    { id: 'popup', label: 'Popup Modal' },
    { id: 'side_tab', label: 'Side Drawer Tab' },
    { id: 'full_page', label: 'Full Page Redirect' }
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0d0d0d] text-zinc-900 dark:text-zinc-100 p-8 select-none font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Share &amp; Embed
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Publish directly with a shareable URL or integrate into any web application or website.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Live Form</span>
            </a>
          </div>
        </div>

        {/* Section 1: Direct Share Link */}
        <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Direct Shareable Link
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] text-xs font-mono text-zinc-800 dark:text-zinc-200 select-all focus:outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(shareUrl, 'link')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy link'}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Embed Options & Code Generator */}
        <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Embed Code Snippets
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Choose your embed format and customize dimensions, styles, and triggers.
            </p>
          </div>

          {/* Underline Tabs for Embed Modes (OpenAI style) */}
          <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium overflow-x-auto">
            {embedModes.map((mode) => {
              const isActive = activeEmbedMode === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveEmbedMode(mode.id)}
                  className={`pb-2.5 relative transition-colors ${
                    isActive
                      ? 'text-zinc-950 dark:text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-zinc-950 dark:after:bg-white'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {mode.label}
                </button>
              )
            })}
          </div>

          {/* Customization Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {activeEmbedMode === 'standard' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Iframe Height
                </label>
                <input
                  type="text"
                  value={iframeHeight}
                  onChange={(e) => setIframeHeight(e.target.value)}
                  placeholder="700px"
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500"
                />
              </div>
            )}

            {(activeEmbedMode === 'popup' || activeEmbedMode === 'side_tab') && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Open Form"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Button Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="w-7 h-7 rounded border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </>
            )}

            {activeEmbedMode === 'side_tab' && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Tab Position
                </label>
                <select
                  value={tabPosition}
                  onChange={(e) => setTabPosition(e.target.value as 'right' | 'left')}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#121212] text-xs text-zinc-900 dark:text-zinc-100"
                >
                  <option value="right">Right Side</option>
                  <option value="left">Left Side</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Display Options
              </label>
              <div className="space-y-1.5 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transparentBg}
                    onChange={(e) => setTransparentBg(e.target.checked)}
                    className="w-4 h-4 rounded text-zinc-900 dark:text-white focus:ring-0"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">
                    Transparent Background
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideProgress}
                    onChange={(e) => setHideProgress(e.target.checked)}
                    className="w-4 h-4 rounded text-zinc-900 dark:text-white focus:ring-0"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">
                    Hide Progress Bar
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Generated Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                HTML Snippet
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedCode, 'code')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-white hover:underline"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy code'}</span>
              </button>
            </div>

            <div className="relative rounded-xl bg-zinc-950 text-zinc-100 p-4 font-mono text-xs overflow-x-auto border border-zinc-800 max-h-48">
              <pre className="whitespace-pre">{generatedCode}</pre>
            </div>
          </div>
        </div>

        {/* Section 3: Interactive Embed Test Preview (On Demand) */}
        <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Embed Preview
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Test how your embedded form renders in real-time.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPreviewActive(!isPreviewActive)}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#121212] text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3 h-3" />
              <span>{isPreviewActive ? 'Hide Live Preview' : 'Run Live Preview'}</span>
            </button>
          </div>

          {isPreviewActive ? (
            <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-[#121212] min-h-[480px]">
              <iframe
                src={embedUrl}
                title="Embed Preview"
                className="w-full h-[500px] border-0"
                allow="camera; microphone; autoplay; encrypted-media;"
              />
            </div>
          ) : (
            <div className="w-full rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-12 flex flex-col items-center justify-center text-center space-y-2">
              <Code className="w-6 h-6 text-zinc-400" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Click &quot;Run Live Preview&quot; to test your form embed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
