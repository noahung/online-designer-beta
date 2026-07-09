import React, { useState } from 'react'
import { Star, Upload } from 'lucide-react'
import { SinglePageFieldType } from './FieldTypes'

export interface RenderedField {
  id: string
  field_type: SinglePageFieldType
  label: string
  description?: string
  placeholder?: string
  is_required: boolean
  field_order: number
  options: Array<{ id: string; label: string; description?: string; image_url?: string }>
  allow_multiple?: boolean
  scale_min?: number
  scale_max?: number
  scale_min_label?: string
  scale_max_label?: string
  number_min?: number
  number_max?: number
  max_file_size?: number
  allowed_file_types?: string[]
  images_per_row?: number
}

export type FieldAnswer =
  | { type: 'text'; value: string }
  | { type: 'options'; values: string[] }   // option labels or ids
  | { type: 'number'; value: number | null }
  | { type: 'date'; value: string }
  | { type: 'file'; file: File | null; file_url?: string }
  | { type: 'boolean'; value: boolean | null }
  | { type: 'scale'; value: number | null }
  | { type: 'address'; street: string; city: string; postcode: string; country: string }

interface FieldRendererProps {
  field: RenderedField
  answer: FieldAnswer | undefined
  onChange: (answer: FieldAnswer) => void
  primaryColor?: string
  error?: string
}

export default function FieldRenderer({
  field,
  answer,
  onChange,
  primaryColor = '#3B82F6',
  error,
}: FieldRendererProps) {
  const inputCls = `w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent`

  const textVal = (answer as any)?.value ?? ''
  const optVals: string[] = (answer as any)?.values ?? []
  const scaleVal: number | null = (answer as any)?.value ?? null

  // ── helpers ──────────────────────────────────────────────────────────────
  const toggleOption = (label: string) => {
    if (field.allow_multiple) {
      const next = optVals.includes(label)
        ? optVals.filter(v => v !== label)
        : [...optVals, label]
      onChange({ type: 'options', values: next })
    } else {
      onChange({ type: 'options', values: optVals[0] === label ? [] : [label] })
    }
  }

  const isSelected = (label: string) => optVals.includes(label)

  const selectedStyle = {
    borderColor: primaryColor,
    boxShadow: `0 0 0 2px ${primaryColor}33`,
    backgroundColor: `${primaryColor}0d`,
  }

  // ── field types ───────────────────────────────────────────────────────────
  const renderInput = () => {
    switch (field.field_type) {

      // ── Text ──────────────────────────────────────────────────────────────
      case 'sp_short_text':
      case 'sp_website':
        return (
          <input
            type={field.field_type === 'sp_website' ? 'url' : 'text'}
            value={textVal}
            onChange={e => onChange({ type: 'text', value: e.target.value })}
            placeholder={field.placeholder || (field.field_type === 'sp_website' ? 'https://…' : '')}
            className={inputCls}
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
          />
        )

      case 'sp_long_text':
        return (
          <textarea
            value={textVal}
            onChange={e => onChange({ type: 'text', value: e.target.value })}
            placeholder={field.placeholder || ''}
            rows={4}
            className={`${inputCls} resize-none`}
          />
        )

      case 'sp_email':
        return (
          <input
            type="email"
            value={textVal}
            onChange={e => onChange({ type: 'text', value: e.target.value })}
            placeholder={field.placeholder || 'you@example.com'}
            className={inputCls}
          />
        )

      case 'sp_phone':
        return (
          <input
            type="tel"
            value={textVal}
            onChange={e => onChange({ type: 'text', value: e.target.value })}
            placeholder={field.placeholder || '+1 (000) 000-0000'}
            className={inputCls}
          />
        )

      // ── Address ───────────────────────────────────────────────────────────
      case 'sp_address': {
        const addr = (answer as any) ?? { type: 'address', street: '', city: '', postcode: '', country: '' }
        const update = (key: string, val: string) =>
          onChange({ ...addr, type: 'address', [key]: val } as FieldAnswer)
        return (
          <div className="space-y-3">
            <input className={inputCls} placeholder="Street address" value={addr.street || ''} onChange={e => update('street', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="City" value={addr.city || ''} onChange={e => update('city', e.target.value)} />
              <input className={inputCls} placeholder="Postcode" value={addr.postcode || ''} onChange={e => update('postcode', e.target.value)} />
            </div>
            <input className={inputCls} placeholder="Country" value={addr.country || ''} onChange={e => update('country', e.target.value)} />
          </div>
        )
      }

      // ── Number ───────────────────────────────────────────────────────────
      case 'sp_number':
        return (
          <input
            type="number"
            value={(answer as any)?.value ?? ''}
            min={field.number_min}
            max={field.number_max}
            onChange={e => onChange({ type: 'number', value: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder={field.placeholder || '0'}
            className={inputCls}
          />
        )

      // ── Date ─────────────────────────────────────────────────────────────
      case 'sp_date':
        return (
          <input
            type="date"
            value={textVal}
            onChange={e => onChange({ type: 'date', value: e.target.value })}
            className={inputCls}
          />
        )

      // ── Multiple Choice ───────────────────────────────────────────────────
      case 'sp_multiple_choice':
        return (
          <div className="space-y-2">
            {field.options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleOption(opt.label)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200"
                style={isSelected(opt.label) ? selectedStyle : { borderColor: '#E5E7EB' }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-all duration-200"
                  style={isSelected(opt.label)
                    ? { borderColor: primaryColor, backgroundColor: primaryColor }
                    : { borderColor: '#D1D5DB' }}
                >
                  {isSelected(opt.label) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-800 font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        )

      // ── Dropdown ──────────────────────────────────────────────────────────
      case 'sp_dropdown':
        return (
          <select
            value={optVals[0] || ''}
            onChange={e => onChange({ type: 'options', values: e.target.value ? [e.target.value] : [] })}
            className={inputCls}
          >
            <option value="">Select an option…</option>
            {field.options.map(opt => (
              <option key={opt.id} value={opt.label}>{opt.label}</option>
            ))}
          </select>
        )

      // ── Picture Choice ────────────────────────────────────────────────────
      case 'sp_picture_choice': {
        const cols = field.images_per_row || 2
        return (
          <div className={`grid gap-3 ${cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {field.options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleOption(opt.label)}
                className="flex flex-col rounded-xl border-2 overflow-hidden text-left transition-all duration-200"
                style={isSelected(opt.label) ? selectedStyle : { borderColor: '#E5E7EB' }}
              >
                {opt.image_url && (
                  <img src={opt.image_url} alt={opt.label} className="w-full aspect-square object-cover" />
                )}
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                  {opt.description && <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )
      }

      // ── Yes / No ──────────────────────────────────────────────────────────
      case 'sp_yes_no': {
        const boolVal: boolean | null = (answer as any)?.value ?? null
        return (
          <div className="flex gap-3">
            {['Yes', 'No'].map(label => {
              const isYes = label === 'Yes'
              const active = boolVal === isYes
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange({ type: 'boolean', value: isYes })}
                  className="flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all duration-200"
                  style={active ? selectedStyle : { borderColor: '#E5E7EB', color: '#374151' }}
                >
                  {isYes ? '👍 Yes' : '👎 No'}
                </button>
              )
            })}
          </div>
        )
      }

      // ── Checkbox ──────────────────────────────────────────────────────────
      case 'sp_checkbox':
      case 'sp_legal': {
        const checked: boolean = (answer as any)?.value ?? false
        const labelText = field.field_type === 'sp_legal'
          ? (field.description || 'I agree to the terms and conditions')
          : (field.description || field.label)
        return (
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div
              className="w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200 cursor-pointer"
              style={checked
                ? { borderColor: primaryColor, backgroundColor: primaryColor }
                : { borderColor: '#D1D5DB' }}
              onClick={() => onChange({ type: 'boolean', value: !checked })}
            >
              {checked && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-gray-700 leading-relaxed">{labelText}</span>
          </label>
        )
      }

      // ── Star Rating ───────────────────────────────────────────────────────
      case 'sp_rating': {
        const max = field.scale_max ?? 5
        return (
          <StarRating value={scaleVal} max={max} primaryColor={primaryColor} onChange={v => onChange({ type: 'scale', value: v })} />
        )
      }

      // ── Opinion Scale ─────────────────────────────────────────────────────
      case 'sp_opinion_scale':
      case 'sp_nps': {
        const min = field.field_type === 'sp_nps' ? 0 : (field.scale_min ?? 1)
        const max = field.field_type === 'sp_nps' ? 10 : (field.scale_max ?? 10)
        const nums = Array.from({ length: max - min + 1 }, (_, i) => i + min)
        return (
          <div>
            <div className="flex gap-1 flex-wrap">
              {nums.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ type: 'scale', value: n })}
                  className="w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:scale-110"
                  style={scaleVal === n
                    ? { borderColor: primaryColor, backgroundColor: primaryColor, color: '#fff' }
                    : { borderColor: '#E5E7EB', color: '#374151' }}
                >
                  {n}
                </button>
              ))}
            </div>
            {(field.scale_min_label || field.scale_max_label) && (
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">{field.scale_min_label}</span>
                <span className="text-xs text-gray-400">{field.scale_max_label}</span>
              </div>
            )}
          </div>
        )
      }

      // ── File Upload ───────────────────────────────────────────────────────
      case 'sp_file_upload': {
        const fileAns = answer as any
        const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0] || null
          onChange({ type: 'file', file })
        }
        return (
          <label className="flex flex-col items-center justify-center gap-2 w-full py-8 px-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200 text-center">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              {fileAns?.file ? fileAns.file.name : 'Click to upload or drag & drop'}
            </p>
            {!fileAns?.file && (
              <p className="text-xs text-gray-400">
                {field.max_file_size ? `Max ${field.max_file_size}MB` : 'Any file type'}
              </p>
            )}
            <input type="file" className="sr-only" onChange={handleFile} />
          </label>
        )
      }

      // ── Statement ─────────────────────────────────────────────────────────
      case 'sp_statement':
        return (
          <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600 leading-relaxed">
            {field.description || field.label}
          </div>
        )

      default:
        return (
          <input className={inputCls} placeholder="Not yet supported" disabled />
        )
    }
  }

  return (
    <div className="space-y-2">
      {/* Label row */}
      {field.field_type !== 'sp_statement' && (
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            {field.label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.field_type !== 'sp_checkbox' && field.field_type !== 'sp_legal' && field.description && (
            <p className="text-xs text-gray-500 mt-0.5">{field.description}</p>
          )}
        </div>
      )}

      {renderInput()}

      {/* Inline validation error */}
      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

// ── Sub-component: Star Rating ────────────────────────────────────────────────

function StarRating({
  value,
  max,
  primaryColor,
  onChange,
}: {
  value: number | null
  max: number
  primaryColor: string
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value

  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          className="transition-all duration-100 hover:scale-125"
        >
          <Star
            className="h-8 w-8"
            fill={display !== null && n <= display ? primaryColor : 'none'}
            stroke={display !== null && n <= display ? primaryColor : '#D1D5DB'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}
