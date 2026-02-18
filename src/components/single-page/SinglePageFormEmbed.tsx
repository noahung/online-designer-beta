import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import FieldRenderer, { RenderedField, FieldAnswer } from './FieldRenderer'

interface SinglePageFormEmbedProps {
  formId: string
  formName: string
  fields: RenderedField[]
  formData: any
  primaryColor: string
  primaryButtonColor: string
  primaryButtonTextColor: string
  welcomeMessage?: string
}

type ValidationErrors = Record<number, string>

export default function SinglePageFormEmbed({
  formId,
  formName,
  fields,
  formData,
  primaryColor,
  primaryButtonColor,
  primaryButtonTextColor,
  welcomeMessage,
}: SinglePageFormEmbedProps) {
  const [answers, setAnswers] = useState<Record<number, FieldAnswer>>({})
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (fieldIndex: number, answer: FieldAnswer) => {
    setAnswers(prev => ({ ...prev, [fieldIndex]: answer }))
    // Clear error on change
    if (errors[fieldIndex]) {
      setErrors(prev => { const next = { ...prev }; delete next[fieldIndex]; return next })
    }
  }

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {}
    fields.forEach((field, idx) => {
      if (!field.is_required) return
      const ans = answers[idx]
      if (!ans) { newErrors[idx] = 'This field is required.'; return }

      switch (ans.type) {
        case 'text':
          if (!ans.value?.trim()) newErrors[idx] = 'This field is required.'
          break
        case 'options':
          if (!ans.values?.length) newErrors[idx] = 'Please select an option.'
          break
        case 'number':
          if (ans.value === null || ans.value === undefined) newErrors[idx] = 'Please enter a number.'
          break
        case 'date':
          if (!ans.value) newErrors[idx] = 'Please select a date.'
          break
        case 'boolean':
          if (ans.value === null || ans.value === undefined) newErrors[idx] = 'This field is required.'
          break
        case 'scale':
          if (ans.value === null) newErrors[idx] = 'Please select a value.'
          break
        case 'file':
          if (!ans.file && !ans.file_url) newErrors[idx] = 'Please upload a file.'
          break
        case 'address': {
          const a = ans as any
          if (!a.street?.trim() || !a.city?.trim()) newErrors[idx] = 'Please fill in the required address fields.'
          break
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      // Scroll to first error
      const firstErrorIdx = Object.keys(errors)[0]
      const el = document.getElementById(`sp-field-${firstErrorIdx}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      // Extract contact info for top-level response columns
      const emailField = fields.find(f => f.field_type === 'sp_email')
      const emailIdx = emailField ? fields.indexOf(emailField) : -1
      const phoneField = fields.find(f => f.field_type === 'sp_phone')
      const phoneIdx = phoneField ? fields.indexOf(phoneField) : -1
      // Use the first short_text field as contact name
      const nameField = fields.find(f => f.field_type === 'sp_short_text')
      const nameIdx = nameField ? fields.indexOf(nameField) : -1

      // 1. Insert the top-level response row (no form_data column needed)
      const { data: responseRow, error: responseErr } = await supabase
        .from('responses')
        .insert([{
          form_id: formId,
          contact_name: nameIdx >= 0 ? (answers[nameIdx] as any)?.value || null : null,
          contact_email: emailIdx >= 0 ? (answers[emailIdx] as any)?.value || null : null,
          contact_phone: phoneIdx >= 0 ? (answers[phoneIdx] as any)?.value || null : null,
        }])
        .select()
        .single()

      if (responseErr) throw responseErr
      const responseId = responseRow.id

      // 2. Insert each field answer as a response_answers row
      for (let idx = 0; idx < fields.length; idx++) {
        const field = fields[idx]
        const ans = answers[idx]
        if (!ans) continue

        let answerText: string | null = null
        let fileUrl: string | null = null
        let fileName: string | null = null
        let fileSize: number | null = null
        let scaleRating: number | null = null

        // Handle file upload — upload to storage first
        if (ans.type === 'file' && (ans as any).file) {
          const file = (ans as any).file as File
          const path = `responses/${responseId}/${field.field_order}-${file.name}`
          const { error: upErr } = await supabase.storage
            .from('form-assets')
            .upload(path, file)
          if (!upErr) {
            const { data: pub } = supabase.storage
              .from('form-assets')
              .getPublicUrl(path)
            fileUrl = pub?.publicUrl || null
            fileName = file.name
            fileSize = file.size
          }
          answerText = fileUrl
        } else if (ans.type === 'scale') {
          scaleRating = ans.value
          answerText = ans.value !== null ? String(ans.value) : null
        } else {
          answerText = serializeAnswer(ans)
        }

        await supabase.from('response_answers').insert([{
          response_id: responseId,
          step_id: field.id,
          answer_text: answerText,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          scale_rating: scaleRating,
        }])
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Error submitting form:', err)
      alert('There was an error submitting the form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Submitted!</h2>
          <p className="text-gray-500 leading-relaxed">
            {welcomeMessage || 'Thank you for your response. We\'ll be in touch soon.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-4">
        {/* Form header */}
        {formData?.clients && (
          <div className="text-center mb-8">
            {formData.clients.logo_url && (
              <img
                src={formData.clients.logo_url}
                alt={formData.clients.name}
                className="h-10 w-auto object-contain mx-auto mb-4"
              />
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Form title bar */}
          <div
            className="px-8 py-6 border-b border-gray-100"
            style={{ borderTopColor: primaryColor, borderTopWidth: 3 }}
          >
            <h1 className="text-2xl font-bold text-gray-900">{formName}</h1>
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-8 py-6 space-y-8">
              {fields.map((field, idx) => (
                <div key={field.id || idx} id={`sp-field-${idx}`}>
                  <FieldRenderer
                    field={field}
                    answer={answers[idx]}
                    onChange={ans => handleChange(idx, ans)}
                    primaryColor={primaryColor}
                    error={errors[idx]}
                  />
                </div>
              ))}
            </div>

            {/* Submit */}
            <div className="px-8 pb-8">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 hover:opacity-90 hover:scale-[1.01] shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: primaryButtonColor,
                  color: primaryButtonTextColor,
                }}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function serializeAnswer(ans: FieldAnswer | undefined): string {
  if (!ans) return ''
  switch (ans.type) {
    case 'text': return ans.value
    case 'options': return ans.values.join(', ')
    case 'number': return ans.value === null ? '' : String(ans.value)
    case 'date': return ans.value
    case 'boolean': return ans.value === null ? '' : ans.value ? 'Yes' : 'No'
    case 'scale': return ans.value === null ? '' : String(ans.value)
    case 'file': return (ans as any).file_url || (ans as any).file?.name || ''
    case 'address': {
      const a = ans as any
      return [a.street, a.city, a.postcode, a.country].filter(Boolean).join(', ')
    }
    default: return ''
  }
}
