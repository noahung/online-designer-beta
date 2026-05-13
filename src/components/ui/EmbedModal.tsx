import { useState, useMemo, useCallback } from 'react'
import { X, Copy, Check, Monitor, Layers, Maximize2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'

// ─── Types ──────────────────────────────────────────────────────────────────

type EmbedMode = 'inline' | 'popup' | 'fullpage'
type PopupTrigger = 'click' | 'exit' | 'delay'
type DimensionMode = 'responsive' | 'fixed'

interface EmbedConfig {
  mode: EmbedMode
  // Dimensions
  dimensionMode: DimensionMode
  fixedWidth: string
  fixedHeight: string
  maxWidth: string
  // Appearance
  transparent: boolean
  hideLogo: boolean
  hideTitle: boolean
  hideDescription: boolean
  // Popup options
  popupTrigger: PopupTrigger
  popupDelay: number
  buttonText: string
  buttonColor: string
  buttonTextColor: string
  buttonRadius: string
  popupWidth: string
  // Lazy loading
  lazy: boolean
  // Accessibility
  iframeTitle: string
  // Thank-you redirect
  redirectUrl: string
}

interface EmbedModalProps {
  formId: string
  formName: string
  isOpen: boolean
  onClose: () => void
}

// ─── Default config ──────────────────────────────────────────────────────────

const defaultConfig: EmbedConfig = {
  mode: 'inline',
  dimensionMode: 'responsive',
  fixedWidth: '680',
  fixedHeight: '500',
  maxWidth: '100%',
  transparent: false,
  hideLogo: false,
  hideTitle: false,
  hideDescription: false,
  popupTrigger: 'click',
  popupDelay: 5,
  buttonText: 'Get a Quote',
  buttonColor: '#3B82F6',
  buttonTextColor: '#ffffff',
  buttonRadius: '8px',
  popupWidth: '680px',
  lazy: true,
  iframeTitle: 'Contact Form',
  redirectUrl: '',
}

// ─── Code generator ──────────────────────────────────────────────────────────

function generateCode(formId: string, config: EmbedConfig, baseUrl: string): string {
  const scriptTag = `<script src="${baseUrl}/embed.js" async></script>`

  const attrs: string[] = [`data-designer-form="${formId}"`, `data-mode="${config.mode}"`]

  if (config.iframeTitle && config.iframeTitle !== 'Contact Form') {
    attrs.push(`data-title="${config.iframeTitle}"`)
  }
  if (config.transparent) attrs.push(`data-transparent="true"`)
  if (config.hideLogo) attrs.push(`data-hide-logo="true"`)
  if (config.hideTitle) attrs.push(`data-hide-title="true"`)
  if (config.hideDescription) attrs.push(`data-hide-description="true"`)
  if (!config.lazy) attrs.push(`data-lazy="false"`)

  if (config.mode === 'inline') {
    if (config.dimensionMode === 'fixed') {
      attrs.push(`data-min-height="${config.fixedHeight}"`)
      attrs.push(`data-width="${config.fixedWidth}px"`)
    }
    if (config.maxWidth && config.maxWidth !== '100%') {
      attrs.push(`data-max-width="${config.maxWidth}"`)
    }
    if (config.redirectUrl) {
      attrs.push(`data-redirect="${config.redirectUrl}"`)
    }
    const attrsStr = attrs.join('\n  ')
    return `<div\n  ${attrsStr}\n></div>\n${scriptTag}`
  }

  if (config.mode === 'popup') {
    attrs.push(`data-trigger="${config.popupTrigger}"`)
    attrs.push(`data-popup-width="${config.popupWidth}"`)
    if (config.popupTrigger === 'click') {
      attrs.push(`data-button-text="${config.buttonText}"`)
      attrs.push(`data-button-color="${config.buttonColor}"`)
      attrs.push(`data-button-text-color="${config.buttonTextColor}"`)
      attrs.push(`data-button-radius="${config.buttonRadius}"`)
    }
    if (config.popupTrigger === 'delay') {
      attrs.push(`data-delay="${config.popupDelay}"`)
    }
    if (config.redirectUrl) {
      attrs.push(`data-redirect="${config.redirectUrl}"`)
    }
    const attrsStr = attrs.join('\n  ')
    return `<div\n  ${attrsStr}\n></div>\n${scriptTag}`
  }

  if (config.mode === 'fullpage') {
    const attrsStr = attrs.join('\n  ')
    return `<div\n  ${attrsStr}\n></div>\n${scriptTag}`
  }

  return ''
}

// ─── Syntax highlighting (minimal) ───────────────────────────────────────────

function tokenize(code: string) {
  const tokens: Array<{ type: string; value: string }> = []
  const re =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(<\/?[a-zA-Z][a-zA-Z0-9-]*>?|>|<\/?>)|(\b[a-zA-Z-]+(?==))|(\s*=\s*)|(\/\/.*$)/gm
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(code)) !== null) {
    if (match.index > last) tokens.push({ type: 'plain', value: code.slice(last, match.index) })
    if (match[1]) tokens.push({ type: 'string', value: match[1] })
    else if (match[2]) tokens.push({ type: 'tag', value: match[2] })
    else if (match[3]) tokens.push({ type: 'attr', value: match[3] })
    else if (match[4]) tokens.push({ type: 'eq', value: match[4] })
    else if (match[5]) tokens.push({ type: 'comment', value: match[5] })
    last = match.index + match[0].length
  }
  if (last < code.length) tokens.push({ type: 'plain', value: code.slice(last) })
  return tokens
}

const tokenColors: Record<string, string> = {
  tag: '#7dd3fc',     // sky-300
  attr: '#86efac',    // green-300
  string: '#fca5a5',  // red-300
  eq: '#e2e8f0',
  comment: '#64748b',
  plain: '#e2e8f0',
}

function CodeBlock({ code }: { code: string }) {
  const tokens = useMemo(() => tokenize(code), [code])
  return (
    <pre
      style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 13, lineHeight: '1.6', fontFamily: '"Fira Code","JetBrains Mono","Cascadia Code",monospace' }}
      aria-label="Generated embed code"
    >
      {tokens.map((t, i) => (
        <span key={i} style={{ color: tokenColors[t.type] || '#e2e8f0' }}>{t.value}</span>
      ))}
    </pre>
  )
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

// Static form mock — no iframes, avoids Supabase auth state cross-contamination
function FormMock({ transparent }: { transparent: boolean }) {
  const bg = transparent ? 'transparent' : '#fff'
  const border = transparent ? '1px dashed rgba(255,255,255,0.2)' : 'none'
  return (
    <div style={{ background: bg, border, borderRadius: 8, padding: '14px 16px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
        </div>
        <div style={{ height: 10, width: 90, background: '#1a1a2e', borderRadius: 3, opacity: 0.7 }} />
        <div style={{ height: 7, width: 130, background: '#e5e7eb', borderRadius: 3 }} />
      </div>
      {/* Question */}
      <div style={{ height: 9, width: '75%', background: '#1f2937', borderRadius: 3, opacity: 0.8 }} />
      {/* Image grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, flex: 1 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ borderRadius: 6, background: i === 1 ? 'none' : '#f3f4f6', border: i === 1 ? '2px solid #3B82F6' : '1px solid #e5e7eb', aspectRatio: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, background: i === 1 ? '#dbeafe' : '#e9eef5' }} />
            <div style={{ height: 14, padding: '0 4px', display: 'flex', alignItems: 'center' }}>
              <div style={{ height: 5, width: '70%', background: '#9ca3af', borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
      {/* Progress + buttons */}
      <div>
        <div style={{ height: 3, borderRadius: 2, background: '#e5e7eb', marginBottom: 8, overflow: 'hidden' }}>
          <div style={{ width: '0%', height: '100%', background: '#3B82F6', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ height: 24, width: 60, background: '#e5e7eb', borderRadius: 5 }} />
          <div style={{ height: 24, width: 60, background: '#3B82F6', borderRadius: 5 }} />
        </div>
      </div>
    </div>
  )
}

function LivePreview({ config }: { config: EmbedConfig }) {
  const mockNavBar = (
    <div style={{ background: '#1a1a2e', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 18, marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>yourwebsite.com</span>
      </div>
    </div>
  )

  const mockContent = (
    <div style={{ padding: '12px 16px 0' }}>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 6, width: '70%' }} />
      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginBottom: 4, width: '90%' }} />
      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 4, marginBottom: 12, width: '60%' }} />
    </div>
  )

  if (config.mode === 'fullpage') {
    return (
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {mockNavBar}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <FormMock transparent={config.transparent} />
        </div>
      </div>
    )
  }

  if (config.mode === 'popup') {
    return (
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {mockNavBar}
        {mockContent}
        <div style={{ padding: '4px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {config.popupTrigger === 'click' ? (
            <button
              style={{
                background: config.buttonColor,
                color: config.buttonTextColor,
                border: 'none',
                borderRadius: config.buttonRadius,
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'default',
                fontFamily: '-apple-system,sans-serif',
                pointerEvents: 'none'
              }}
            >
              {config.buttonText}
            </button>
          ) : config.popupTrigger === 'exit' ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>🖱️</div>
              Popup triggers on exit intent
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>⏱️</div>
              Popup triggers after {config.popupDelay}s
            </div>
          )}
        </div>
        {/* Popup overlay preview */}
        <div style={{ margin: '0 12px 12px', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', position: 'relative' }}>
          <div style={{ background: 'rgba(0,0,0,0.5)', position: 'absolute', inset: 0, zIndex: 1, borderRadius: 8 }} />
          <div style={{ position: 'relative', zIndex: 2, background: '#fff', borderRadius: 6, overflow: 'hidden', margin: 8 }}>
            <FormMock transparent={false} />
          </div>
        </div>
      </div>
    )
  }

  // Inline
  const width = config.dimensionMode === 'fixed' ? `${config.fixedWidth}px` : '100%'
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {mockNavBar}
      {mockContent}
      <div style={{ padding: '0 16px 16px', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width,
          maxWidth: config.maxWidth || '100%',
          margin: '0 auto',
          borderRadius: 8,
          overflow: 'hidden',
          border: config.transparent ? '1px dashed rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
          background: config.transparent ? 'transparent' : '#fff',
          height: config.dimensionMode === 'fixed' ? `${Math.min(parseInt(config.fixedHeight), 200)}px` : 150
        }}>
          <FormMock transparent={config.transparent} />
        </div>
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white/80 bg-white/5 hover:bg-white/10 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-white/[0.02]">{children}</div>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/60 mb-1">
        {label}
        {hint && (
          <span className="ml-1 text-white/30" title={hint}>
            <Info className="w-3 h-3 inline-block" />
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/60 transition-colors'

const toggleClass = (active: boolean) =>
  `relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${active ? 'bg-blue-500' : 'bg-white/10'}`

// ─── Main EmbedModal component ────────────────────────────────────────────────

export default function EmbedModal({ formId, formName, isOpen, onClose }: EmbedModalProps) {
  const { push } = useToast()
  const [config, setConfig] = useState<EmbedConfig>(defaultConfig)
  const [copied, setCopied] = useState(false)

  const baseUrl = useMemo(() => {
    const isCustomDomain = window.location.hostname !== 'noahung.github.io'
    const basename = import.meta.env.PROD && !isCustomDomain ? '/online-designer-beta' : ''
    return window.location.origin + basename
  }, [])

  const generatedCode = useMemo(
    () => generateCode(formId, config, baseUrl),
    [formId, config, baseUrl]
  )

  const update = useCallback(<K extends keyof EmbedConfig>(key: K, value: EmbedConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      push({ type: 'success', message: 'Embed code copied!' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      push({ type: 'error', message: 'Failed to copy code' })
    }
  }, [generatedCode, push])

  if (!isOpen) return null

  const modes: { id: EmbedMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'inline',
      label: 'Standard',
      icon: <Monitor className="w-4 h-4" />,
      desc: 'Sits inline within the page flow'
    },
    {
      id: 'popup',
      label: 'Popup',
      icon: <Layers className="w-4 h-4" />,
      desc: 'Opens in an overlay on trigger'
    },
    {
      id: 'fullpage',
      label: 'Full Page',
      icon: <Maximize2 className="w-4 h-4" />,
      desc: 'Takes over the entire viewport'
    }
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="embed-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 id="embed-modal-title" className="text-lg font-semibold text-white">Embed Form</h2>
            <p className="text-sm text-white/40 mt-0.5">"{formName}"</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — 3-column layout */}
        <div className="flex flex-col lg:flex-row overflow-hidden flex-1 min-h-0">

          {/* Left: Config */}
          <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 overflow-y-auto">
            <div className="p-4 space-y-4">

              {/* Mode tabs */}
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Embed Mode</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {modes.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => update('mode', m.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition-all duration-150 border ${
                        config.mode === m.id
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-white/[0.03] border-white/10 text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                      }`}
                      title={m.desc}
                    >
                      {m.icon}
                      <span className="text-xs font-medium leading-none">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* General */}
              <Section title="General">
                <Field label="iframe title" hint="Improves accessibility for screen readers">
                  <input
                    type="text"
                    className={inputClass}
                    value={config.iframeTitle}
                    onChange={e => update('iframeTitle', e.target.value)}
                    placeholder="Contact Form"
                  />
                </Field>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/60">Lazy Load</p>
                    <p className="text-xs text-white/30">Defer until visible</p>
                  </div>
                  <button
                    type="button"
                    className={toggleClass(config.lazy)}
                    onClick={() => update('lazy', !config.lazy)}
                    role="switch"
                    aria-checked={config.lazy}
                    aria-label="Lazy load"
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${config.lazy ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/60">Transparent BG</p>
                    <p className="text-xs text-white/30">Blends with host site</p>
                  </div>
                  <button
                    type="button"
                    className={toggleClass(config.transparent)}
                    onClick={() => update('transparent', !config.transparent)}
                    role="switch"
                    aria-checked={config.transparent}
                    aria-label="Transparent background"
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${config.transparent ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </button>
                </div>
              </Section>

              {/* Header Content */}
              <Section title="Header Content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/60">Show Logo</p>
                    <p className="text-xs text-white/30">Client logo / icon</p>
                  </div>
                  <button
                    type="button"
                    className={toggleClass(!config.hideLogo)}
                    onClick={() => update('hideLogo', !config.hideLogo)}
                    role="switch"
                    aria-checked={!config.hideLogo}
                    aria-label="Show logo"
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${!config.hideLogo ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/60">Show Title</p>
                    <p className="text-xs text-white/30">Form &amp; client name</p>
                  </div>
                  <button
                    type="button"
                    className={toggleClass(!config.hideTitle)}
                    onClick={() => update('hideTitle', !config.hideTitle)}
                    role="switch"
                    aria-checked={!config.hideTitle}
                    aria-label="Show title"
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${!config.hideTitle ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/60">Show Description</p>
                    <p className="text-xs text-white/30">Subtitle under client name</p>
                  </div>
                  <button
                    type="button"
                    className={toggleClass(!config.hideDescription)}
                    onClick={() => update('hideDescription', !config.hideDescription)}
                    role="switch"
                    aria-checked={!config.hideDescription}
                    aria-label="Show description"
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${!config.hideDescription ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </button>
                </div>
              </Section>

              {/* Dimensions (inline only) */}
              {config.mode === 'inline' && (
                <Section title="Dimensions">
                  <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
                    {(['responsive', 'fixed'] as DimensionMode[]).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => update('dimensionMode', d)}
                        className={`flex-1 py-1.5 font-medium transition-colors ${
                          config.dimensionMode === d ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                  {config.dimensionMode === 'fixed' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Width (px)">
                        <input type="number" className={inputClass} value={config.fixedWidth} onChange={e => update('fixedWidth', e.target.value)} min={200} />
                      </Field>
                      <Field label="Min height (px)">
                        <input type="number" className={inputClass} value={config.fixedHeight} onChange={e => update('fixedHeight', e.target.value)} min={100} />
                      </Field>
                    </div>
                  )}
                  <Field label="Max width">
                    <input type="text" className={inputClass} value={config.maxWidth} onChange={e => update('maxWidth', e.target.value)} placeholder="100%" />
                  </Field>
                </Section>
              )}

              {/* Popup options */}
              {config.mode === 'popup' && (
                <Section title="Popup Options">
                  <Field label="Trigger">
                    <select
                      className={inputClass}
                      value={config.popupTrigger}
                      onChange={e => update('popupTrigger', e.target.value as PopupTrigger)}
                    >
                      <option value="click">On Click</option>
                      <option value="exit">Exit Intent</option>
                      <option value="delay">Timed Delay</option>
                    </select>
                  </Field>
                  {config.popupTrigger === 'delay' && (
                    <Field label="Delay (seconds)">
                      <input type="number" className={inputClass} value={config.popupDelay} onChange={e => update('popupDelay', parseInt(e.target.value) || 5)} min={1} max={120} />
                    </Field>
                  )}
                  <Field label="Popup width">
                    <input type="text" className={inputClass} value={config.popupWidth} onChange={e => update('popupWidth', e.target.value)} placeholder="680px" />
                  </Field>
                  {config.popupTrigger === 'click' && (
                    <>
                      <Field label="Button text">
                        <input type="text" className={inputClass} value={config.buttonText} onChange={e => update('buttonText', e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Button color">
                          <div className="flex items-center gap-2">
                            <input type="color" value={config.buttonColor} onChange={e => update('buttonColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                            <input type="text" className={inputClass} value={config.buttonColor} onChange={e => update('buttonColor', e.target.value)} />
                          </div>
                        </Field>
                        <Field label="Text color">
                          <div className="flex items-center gap-2">
                            <input type="color" value={config.buttonTextColor} onChange={e => update('buttonTextColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                            <input type="text" className={inputClass} value={config.buttonTextColor} onChange={e => update('buttonTextColor', e.target.value)} />
                          </div>
                        </Field>
                      </div>
                      <Field label="Border radius">
                        <input type="text" className={inputClass} value={config.buttonRadius} onChange={e => update('buttonRadius', e.target.value)} placeholder="8px" />
                      </Field>
                    </>
                  )}
                </Section>
              )}

              {/* Advanced */}
              <Section title="Advanced" defaultOpen={false}>
                <Field label="Redirect URL after submission" hint="Parent page redirect on form submit (leave blank to disable)">
                  <input
                    type="url"
                    className={inputClass}
                    value={config.redirectUrl}
                    onChange={e => update('redirectUrl', e.target.value)}
                    placeholder="https://yoursite.com/thank-you"
                  />
                </Field>
              </Section>
            </div>
          </div>

          {/* Center: Preview */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex-shrink-0">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Live Preview</p>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <div style={{ height: 340 }}>
                <LivePreview config={config} />
              </div>
              <p className="text-xs text-white/20 text-center mt-2">
                Preview shown at reduced scale. Actual embed uses full dimensions.
              </p>
            </div>
          </div>
        </div>

        {/* Code footer */}
        <div className="border-t border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Generated Code</p>
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                copied
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div
            className="px-5 py-4 overflow-x-auto max-h-36 overflow-y-auto bg-black/30"
          >
            <CodeBlock code={generatedCode} />
          </div>
          <div className="px-5 py-3 flex items-start gap-2 text-xs text-white/30 border-t border-white/5">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Paste this snippet anywhere in your HTML. The <code className="text-white/50">&lt;script&gt;</code> tag only needs to appear once per page even if you have multiple forms.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
