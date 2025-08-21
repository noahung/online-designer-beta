import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Option = { id: string; label: string; description?: string; image_url?: string; jump_to_step?: number }
type Step = { id: string; title: string; question_type: string; is_required: boolean; step_order: number; options: Option[] }

export default function FormEmbed() {
  const { id } = useParams()
  const [steps, setSteps] = useState<Step[]>([])
  const [formName, setFormName] = useState('')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [responses, setResponses] = useState<Record<number, { option_id?: string; answer_text?: string }>>({})

  useEffect(() => { if (id) loadForm(id) }, [id])

  const loadForm = async (formId: string) => {
    const { data: form } = await supabase.from('forms').select('id,name,description').eq('id', formId).maybeSingle()
    if (!form) return
    setFormName(form.name)

    const { data: s } = await supabase.from('form_steps').select('*, form_options(*)').eq('form_id', formId).order('step_order', { ascending: true })
    if (!s) return

    // Map steps and options, handling both public URLs and object paths
    const mapped: Step[] = s.map((row: any) => {
      const opts = (row.form_options || []).map((o: any) => {
        let image_url = o.image_url
        // If image_url doesn't start with http, it might be an object path that needs a signed URL
        // But since we're using public buckets now, this should mostly be public URLs already
        return { 
          id: o.id, 
          label: o.label, 
          description: o.description, 
          image_url, 
          jump_to_step: o.jump_to_step 
        }
      })
      return { 
        id: row.id, 
        title: row.title, 
        question_type: row.question_type, 
        is_required: row.is_required, 
        step_order: row.step_order, 
        options: opts 
      }
    })
    setSteps(mapped)
  }

  const selectOption = (option: Option) => {
    setResponses(r => ({ ...r, [currentStepIndex]: { ...(r[currentStepIndex] || {}), option_id: option.id } }))
    // branching: jump to step if defined (1-based step indexes stored in DB)
    if (option.jump_to_step) {
      // find index for jump_to_step
      const idx = steps.findIndex(s => s.step_order === option.jump_to_step)
      if (idx >= 0) setCurrentStepIndex(idx)
      return
    }
  }

  const goNext = async () => {
    const step = steps[currentStepIndex]
    if (!step) return

    // require answer if needed
    const resp = responses[currentStepIndex]
    if (step.is_required && (!resp || (!resp.option_id && !resp.answer_text))) {
      alert('Please answer this step before continuing')
      return
    }

    if (currentStepIndex === steps.length - 1) {
      // submit: create responses row and response_answers
      const { data: inserted, error: resErr } = await supabase.from('responses').insert([{ form_id: id }]).select().single()
      if (resErr || !inserted) {
        console.error('Error creating response', resErr)
        alert('Submission failed')
        return
      }

      const responseId = inserted.id
      // build answers
      const answers = [] as any[]
      for (const [stepIndexStr, ans] of Object.entries(responses)) {
        const si = Number(stepIndexStr)
        const stepObj = steps[si]
        if (!stepObj) continue
        answers.push({ response_id: responseId, step_id: stepObj.id, answer_text: ans.answer_text ?? null, selected_option_id: ans.option_id ?? null })
      }

      if (answers.length > 0) {
        const { error: ansErr } = await supabase.from('response_answers').insert(answers)
        if (ansErr) console.error('Error inserting answers', ansErr)
      }

      setCurrentStepIndex(currentStepIndex + 1)
      return
    }

    setCurrentStepIndex(currentStepIndex + 1)
  }

  const goPrev = () => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))

  if (!steps || steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded shadow max-w-2xl w-full text-center">
          <h2 className="text-xl font-semibold">Form not available</h2>
          <p className="text-slate-600">This form isn't published or contains no steps.</p>
        </div>
      </div>
    )
  }

  if (currentStepIndex >= steps.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded shadow max-w-2xl w-full text-center">
          <h2 className="text-xl font-semibold">Thank you</h2>
          <p className="text-slate-600">Your submission has been received.</p>
        </div>
      </div>
    )
  }

  const step = steps[currentStepIndex]
  const percent = Math.round(((currentStepIndex) / steps.length) * 100)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-bold">{formName}</h1>
        <p className="text-slate-600">{step.title}</p>

        <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-sm text-slate-500 text-right mt-1">{percent}%</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {step.options.map(opt => (
            <button key={opt.id} onClick={() => selectOption(opt)} className={`border rounded p-4 text-left hover:shadow ${responses[currentStepIndex]?.option_id === opt.id ? 'ring-2 ring-blue-300' : ''}`}>
              {opt.image_url && <img src={opt.image_url} alt={opt.label} className="h-28 w-full object-cover mb-2 rounded" />}
              <div className="font-medium">{opt.label}</div>
              {opt.description && <div className="text-sm text-slate-500">{opt.description}</div>}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center gap-2 mt-6">
          <button onClick={goPrev} disabled={currentStepIndex === 0} className="px-4 py-2 bg-slate-200 rounded">Previous</button>
          <div className="flex items-center gap-2">
            <button onClick={goNext} className="px-4 py-2 bg-blue-600 text-white rounded">{currentStepIndex === steps.length -1 ? 'Submit' : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
