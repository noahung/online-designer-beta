import { supabase } from '../lib/supabase'

export interface ResponseAnswer {
  id: string
  answer_text: string | null
  selected_option_id: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  width: number | null
  height: number | null
  depth: number | null
  units: string | null
  scale_rating: number | null
  frames_count: number | null
  step_id: string
  form_steps?: Array<{
    id: string
    title: string
    question_type: string
    step_order: number
  }> | null
}

export interface FormResponse {
  id: string
  form_id: string
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_postcode: string | null
  preferred_contact: string | null
  project_details: string | null
  submitted_at: string
  response_answers?: ResponseAnswer[]
  forms?: Array<{
    id: string
    name: string
    clients: Array<{
      id: string
      name: string
    }> | null
  }> | null
}

export interface ResponseStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  latest?: FormResponse
}

/**
 * Get all responses for a specific form
 */
export async function getFormResponses(
  formId: string,
  userId: string
): Promise<{ data: FormResponse[] | null; error: any }> {
  try {
    // First verify user owns this form
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('id, user_id')
      .eq('id', formId)
      .eq('user_id', userId)
      .single()

    if (formError || !formData) {
      return { data: null, error: formError || new Error('Form not found or unauthorized') }
    }

    // Fetch responses with answers
    const { data: responsesData, error: responsesError } = await supabase
      .from('responses')
      .select(`
        id,
        form_id,
        contact_name,
        contact_email,
        contact_phone,
        contact_postcode,
        preferred_contact,
        project_details,
        submitted_at,
        response_answers (
          id,
          answer_text,
          selected_option_id,
          file_url,
          file_name,
          file_size,
          width,
          height,
          depth,
          units,
          scale_rating,
          frames_count,
          step_id,
          form_steps!step_id (
            id,
            title,
            question_type,
            step_order
          )
        )
      `)
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false })

    if (responsesError) throw responsesError

    if (!responsesData || responsesData.length === 0) {
      return { data: [], error: null }
    }

    // Get the form data with client info
    const { data: enrichedFormData, error: enrichFormError } = await supabase
      .from('forms')
      .select(`
        id,
        name,
        clients (
          id,
          name
        )
      `)
      .eq('id', formId)
      .single()

    if (enrichFormError) throw enrichFormError

    // Enrich responses with form data
    const enrichedResponses = responsesData.map(response => ({
      ...response,
      forms: enrichedFormData ? [{
        id: enrichedFormData.id,
        name: enrichedFormData.name,
        clients: enrichedFormData.clients
      }] : null
    }))

    console.log('getFormResponses - enriched responses:', {
      count: enrichedResponses.length,
      sample: enrichedResponses[0]
    })

    return { data: enrichedResponses, error: null }
  } catch (error) {
    console.error('Error fetching form responses:', error)
    return { data: null, error }
  }
}

/**
 * Get a single response by ID
 */
export async function getResponseById(
  responseId: string,
  userId: string
): Promise<{ data: FormResponse | null; error: any }> {
  try {
    // First get the response with answers
    const { data: responseData, error: responseError } = await supabase
      .from('responses')
      .select(`
        id,
        form_id,
        contact_name,
        contact_email,
        contact_phone,
        contact_postcode,
        preferred_contact,
        project_details,
        submitted_at,
        response_answers (
          id,
          answer_text,
          selected_option_id,
          file_url,
          file_name,
          file_size,
          width,
          height,
          depth,
          units,
          scale_rating,
          frames_count,
          step_id,
          form_steps!step_id (
            id,
            title,
            question_type,
            step_order
          )
        )
      `)
      .eq('id', responseId)
      .single()

    if (responseError) throw responseError

    // Then get the form with client data and verify ownership
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select(`
        id,
        name,
        user_id,
        clients (
          id,
          name
        )
      `)
      .eq('id', responseData.form_id)
      .single()

    if (formError) throw formError

    // Verify user owns the form
    if (formData.user_id !== userId) {
      return { data: null, error: new Error('Unauthorized') }
    }

    // Enrich response with form data
    const enrichedResponse: FormResponse = {
      ...responseData,
      forms: [{
        id: formData.id,
        name: formData.name,
        clients: formData.clients
      }]
    }

    return { data: enrichedResponse, error: null }
  } catch (error) {
    console.error('Error fetching response:', error)
    return { data: null, error }
  }
}

/**
 * Delete a response (admin only)
 */
export async function deleteResponse(
  responseId: string,
  userId: string
): Promise<{ error: any }> {
  try {
    // First verify user owns the form this response belongs to
    const { data: responseData, error: fetchError } = await supabase
      .from('responses')
      .select(`
        id,
        form_id
      `)
      .eq('id', responseId)
      .single()

    if (fetchError || !responseData) {
      return { error: fetchError || new Error('Response not found') }
    }

    // Verify form ownership
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('user_id')
      .eq('id', responseData.form_id)
      .single()

    if (formError || !formData) {
      return { error: formError || new Error('Form not found') }
    }

    // Check if user owns the form
    if (formData.user_id !== userId) {
      return { error: new Error('Unauthorized') }
    }

    // Delete the response (cascade will handle response_answers)
    const { error } = await supabase
      .from('responses')
      .delete()
      .eq('id', responseId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting response:', error)
    return { error }
  }
}

/**
 * Get response statistics for a form
 */
export async function getResponseStats(
  formId: string,
  userId: string
): Promise<{ data: ResponseStats | null; error: any }> {
  try {
    // Verify user owns this form
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('id, user_id')
      .eq('id', formId)
      .eq('user_id', userId)
      .single()

    if (formError || !formData) {
      return { data: null, error: formError || new Error('Form not found or unauthorized') }
    }

    // Get all responses for the form
    const { data: responses, error } = await supabase
      .from('responses')
      .select('id, submitted_at, contact_name, contact_email')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false })

    if (error) throw error

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const monthStart = new Date(now)
    monthStart.setDate(now.getDate() - 30)

    const stats: ResponseStats = {
      total: responses?.length || 0,
      today: responses?.filter(r => new Date(r.submitted_at) >= todayStart).length || 0,
      thisWeek: responses?.filter(r => new Date(r.submitted_at) >= weekStart).length || 0,
      thisMonth: responses?.filter(r => new Date(r.submitted_at) >= monthStart).length || 0,
      latest: responses?.[0] as FormResponse || undefined
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error fetching response stats:', error)
    return { data: null, error }
  }
}

/**
 * Export responses to CSV format
 */
export function exportResponsesToCSV(responses: FormResponse[], formName: string): void {
  if (!responses || responses.length === 0) {
    throw new Error('No responses to export')
  }

  // Get all unique question titles from all responses
  const allQuestions = new Set<string>()
  responses.forEach(response => {
    response.response_answers?.forEach(answer => {
      const step = answer.form_steps?.[0]
      if (step?.title) {
        allQuestions.add(step.title)
      }
    })
  })

  // Create CSV header
  const headers = [
    'Submitted At',
    'Contact Name',
    'Contact Email',
    'Contact Phone',
    'Contact Postcode',
    'Preferred Contact',
    'Project Details',
    ...Array.from(allQuestions)
  ]
  
  // Create CSV rows
  const rows = responses.map(response => {
    const row = [
      new Date(response.submitted_at).toLocaleString(),
      response.contact_name || '',
      response.contact_email || '',
      response.contact_phone || '',
      response.contact_postcode || '',
      response.preferred_contact || '',
      response.project_details || ''
    ]
    
    // Add answer for each question
    allQuestions.forEach(question => {
      const answer = response.response_answers?.find(a => a.form_steps?.[0]?.title === question)
      if (answer) {
        // Format the answer based on type
        if (answer.answer_text) {
          row.push(answer.answer_text)
        } else if (answer.file_url) {
          row.push(`${answer.file_name || 'File'} (${answer.file_url})`)
        } else if (answer.width || answer.height || answer.depth) {
          row.push(`${answer.width || ''}x${answer.height || ''}x${answer.depth || ''} ${answer.units || ''}`)
        } else if (answer.scale_rating !== null) {
          row.push(String(answer.scale_rating))
        } else if (answer.frames_count !== null) {
          row.push(String(answer.frames_count))
        } else {
          row.push('')
        }
      } else {
        row.push('')
      }
    })
    
    return row
  })

  // Combine headers and rows
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${formName}-responses-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Search responses by query string
 */
export function searchResponses(responses: FormResponse[], query: string): FormResponse[] {
  if (!query.trim()) return responses

  const searchLower = query.toLowerCase()
  
  return responses.filter(response => {
    // Search in contact info
    if (response.contact_name?.toLowerCase().includes(searchLower)) return true
    if (response.contact_email?.toLowerCase().includes(searchLower)) return true
    if (response.contact_phone?.toLowerCase().includes(searchLower)) return true
    if (response.contact_postcode?.toLowerCase().includes(searchLower)) return true
    if (response.project_details?.toLowerCase().includes(searchLower)) return true
    
    // Search in response answers
    return response.response_answers?.some(answer => {
      if (answer.answer_text?.toLowerCase().includes(searchLower)) return true
      if (answer.file_name?.toLowerCase().includes(searchLower)) return true
      if (answer.form_steps?.[0]?.title?.toLowerCase().includes(searchLower)) return true
      return false
    }) || false
  })
}

/**
 * Filter responses by date range
 */
export function filterResponsesByDateRange(
  responses: FormResponse[],
  startDate?: Date,
  endDate?: Date
): FormResponse[] {
  return responses.filter(response => {
    const submittedDate = new Date(response.submitted_at)
    
    if (startDate && submittedDate < startDate) return false
    if (endDate && submittedDate > endDate) return false
    
    return true
  })
}
