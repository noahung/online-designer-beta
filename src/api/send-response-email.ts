// Email notification API endpoint for sending response notifications to clients
// This can be called from your existing webhook system or manually

import { supabase } from '../lib/supabase.ts'

const BREVO_API_KEY = process.env.BREVO_API_KEY || 'your-brevo-api-key'
const BREVO_SENDER_EMAIL = 'designer@advertomedia.co.uk'
const BREVO_SENDER_NAME = 'Online Designer - Advertomedia'

// Email validation function - more permissive for complex email formats
function isValidEmail(email: string): boolean {
  // More comprehensive regex that handles complex email formats
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!emailRegex.test(email)) return false

  // Additional validation checks
  const [localPart, domain] = email.split('@')

  // Local part validations
  if (!localPart || localPart.length > 64) return false
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false
  if (localPart.includes('..')) return false

  // Domain validations
  if (!domain || domain.length > 253) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (domain.includes('..')) return false

  // Check for valid domain structure (must have at least one dot)
  if (!domain.includes('.')) return false

  // Check that domain doesn't start or end with hyphen
  const domainParts = domain.split('.')
  for (const part of domainParts) {
    if (part.startsWith('-') || part.endsWith('-')) return false
    if (part.length > 63) return false
  }

  return true
}

interface ResponseData {
  response_id: string
  form_id: string
  form_name: string
  client_name: string
  client_email: string | null
  additional_emails: string[]
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  contact_postcode?: string
  submitted_at: string
  answers: any[]
  frames_data?: any[]
}

export async function POST(req: Request) {
  try {
    const { response_id } = await req.json()

    if (!response_id) {
      return new Response(
        JSON.stringify({ error: 'response_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fetch the complete response data
    const responseData = await getResponseData(response_id)
    
    if (!responseData) {
      return new Response(
        JSON.stringify({ error: 'Response not found or no client email configured' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Brevo
    const emailSent = await sendBrevoEmail(responseData)
    
    if (emailSent) {
      // Update the notification queue if it exists - update all entries for this response
      await supabase
        .from('email_notifications')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('response_id', response_id)
        .eq('status', 'pending')

      const recipientCount = (responseData.client_email ? 1 : 0) + responseData.additional_emails.length
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Email notification sent successfully to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}`,
          recipients: responseData.client_email ? [responseData.client_email, ...responseData.additional_emails] : responseData.additional_emails
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      // Update the notification queue with error
      const { data: currentNotification } = await supabase
        .from('email_notifications')
        .select('retry_count')
        .eq('response_id', response_id)
        .eq('status', 'pending')
        .single()

      await supabase
        .from('email_notifications')
        .update({ 
          status: 'failed',
          error_message: 'Failed to send via Brevo',
          retry_count: (currentNotification?.retry_count || 0) + 1
        })
        .eq('response_id', response_id)
        .eq('status', 'pending')

      return new Response(
        JSON.stringify({ error: 'Failed to send email notification' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in email notification API:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function getResponseData(response_id: string): Promise<ResponseData | null> {
  try {
    // Fetch the response with form and client information
    const { data: responseData, error: responseError } = await supabase
      .from('responses')
      .select(`
        id,
        form_id,
        contact_name,
        contact_email,
        contact_phone,
        contact_postcode,
        submitted_at,
        forms!inner (
          id,
          name,
          clients!inner (
            id,
            name,
            client_email,
            additional_emails
          )
        )
      `)
      .eq('id', response_id)
      .single()

    if (responseError || !responseData) {
      console.error('Error fetching response:', responseError)
      return null
    }

    // Check if client has email (forms is now a single object, not array)
    const form = responseData.forms as any
    const additionalEmails = Array.isArray(form?.clients?.additional_emails) 
      ? form.clients.additional_emails 
      : []
    
    console.log('Client data from database:', {
      client_email: form?.clients?.client_email,
      additional_emails: form?.clients?.additional_emails,
      processed_additional_emails: additionalEmails
    })
    
    if (!form?.clients?.client_email && additionalEmails.length === 0) {
      console.log('No client email found, skipping notification')
      return null
    }

    // Fetch response answers with question details
    const { data: answers, error: answersError } = await supabase
      .from('response_answers')
      .select(`
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
          step_order,
          form_options (
            id,
            label,
            image_url
          )
        )
      `)
      .eq('response_id', response_id)
      .order('form_steps(step_order)', { ascending: true })

    if (answersError) {
      console.error('Error fetching answers:', answersError)
    }

    // Fetch frames data if it exists
    const { data: framesData, error: framesError } = await supabase
      .from('response_frames')
      .select('*')
      .eq('response_id', response_id)
      .order('frame_number', { ascending: true })

    if (framesError) {
      console.error('Error fetching frames:', framesError)
    }

    return {
      response_id: responseData.id,
      form_id: responseData.form_id,
      form_name: form?.name || 'Unknown Form',
      client_name: form?.clients?.name || 'Unknown Client',
      client_email: form?.clients?.client_email || null,
      additional_emails: additionalEmails,
      contact_name: responseData.contact_name,
      contact_email: responseData.contact_email,
      contact_phone: responseData.contact_phone,
      contact_postcode: responseData.contact_postcode,
      submitted_at: responseData.submitted_at,
      answers: answers || [],
      frames_data: framesData || []
    }

  } catch (error) {
    console.error('Error in getResponseData:', error)
    return null
  }
}

async function sendBrevoEmail(data: ResponseData): Promise<boolean> {
  try {
    const emailHtml = generateEmailTemplate(data)
    const emailText = generateEmailText(data)

    // Build recipient list
    const recipients = []

    if (data.client_email) {
      recipients.push({
        email: data.client_email,
        name: data.client_name
      })
    }

    // Add additional emails with validation
    data.additional_emails.forEach(email => {
      if (email && email.trim() && isValidEmail(email.trim())) {
        recipients.push({
          email: email.trim(),
          name: data.client_name
        })
      } else if (email && email.trim()) {
        console.warn('Skipping invalid email address:', email.trim())
      }
    })

    console.log('Email recipients:', recipients)
    console.log('Additional emails from data:', data.additional_emails)

    if (recipients.length === 0) {
      console.error('No valid recipients found')
      return false
    }    const emailPayload = {
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL
      },
      to: recipients,
      subject: `New Response Received - ${data.form_name}`,
      htmlContent: emailHtml,
      textContent: emailText
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(emailPayload)
    })

    if (response.ok) {
      console.log('Email sent successfully via Brevo to:', recipients.map(r => r.email).join(', '))
      return true
    } else {
      const errorData = await response.text()
      console.error('Brevo API error:', response.status, errorData)
      return false
    }

  } catch (error) {
    console.error('Error sending email via Brevo:', error)
    return false
  }
}

function generateEmailTemplate(data: ResponseData): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAnswer = (answer: any): string => {
    let answerContent = ''
    
    switch (answer.form_steps?.question_type) {
      case 'text_input':
      case 'text_area':
        answerContent = answer.answer_text || 'No response'
        break
      
      case 'multiple_choice':
        const selectedOption = answer.form_steps?.form_options?.find((opt: any) => opt.id === answer.selected_option_id)
        answerContent = selectedOption?.label || answer.answer_text || 'No selection'
        break
      
      case 'image_selection':
        const selectedImage = answer.form_steps?.form_options?.find((opt: any) => opt.id === answer.selected_option_id)
        if (selectedImage) {
          answerContent = `
            <div style="margin: 10px 0;">
              <img src="${selectedImage.image_url}" alt="${selectedImage.label}" style="max-width: 200px; max-height: 150px; border-radius: 8px; border: 2px solid #e5e7eb;">
              <p style="margin: 5px 0; font-weight: 600;">${selectedImage.label}</p>
            </div>
          `
        } else {
          answerContent = 'No image selected'
        }
        break
      
      case 'file_upload':
        if (answer.file_url && answer.file_name) {
          const fileSizeKB = answer.file_size ? Math.round(answer.file_size / 1024) : 'Unknown size'
          answerContent = `
            <div style="display: inline-block; padding: 10px 15px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <a href="${answer.file_url}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
                📎 ${answer.file_name}
              </a>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">${fileSizeKB} KB</p>
            </div>
          `
        } else {
          answerContent = 'No file uploaded'
        }
        break
      
      case 'dimensions':
        const dimensions = []
        if (answer.width) dimensions.push(`Width: ${answer.width}${answer.units || ''}`)
        if (answer.height) dimensions.push(`Height: ${answer.height}${answer.units || ''}`)
        if (answer.depth) dimensions.push(`Depth: ${answer.depth}${answer.units || ''}`)
        answerContent = dimensions.length > 0 ? dimensions.join(' × ') : 'No dimensions provided'
        break
      
      case 'opinion_scale':
        if (answer.scale_rating !== null) {
          const clampedRating = Math.max(0, Math.min(5, answer.scale_rating))
          const stars = '★'.repeat(clampedRating) + '☆'.repeat(5 - clampedRating)
          answerContent = `${stars} (${answer.scale_rating}/5)`
        } else {
          answerContent = 'No rating provided'
        }
        break
      
      case 'frames_plan':
        let frameContent = ''
        if (answer.frames_count) {
          frameContent += `Selected ${answer.frames_count} frame${answer.frames_count === 1 ? '' : 's'}`
        } else {
          frameContent += 'No frame count selected'
        }

        // Add measurements summary if available
        if (data.frames_data && data.frames_data.length > 0) {
          const measurements = data.frames_data
            .filter((frame: any) => frame.measurements_text)
            .map((frame: any) => `Frame ${frame.frame_number}: ${frame.measurements_text}`)
            .join(', ')
          if (measurements) {
            frameContent += `<br><strong>Measurements:</strong> ${measurements}`
          }
        }

        answerContent = frameContent
        break
      
      default:
        answerContent = answer.answer_text || 'No response'
    }
    
    return answerContent
  }

  const answersHtml = data.answers.map((answer, index) => `
    <div style="margin-bottom: 25px; padding: 20px; background-color: #f9fafb; border-radius: 10px; border-left: 4px solid #3b82f6;">
      <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
        ${index + 1}. ${answer.form_steps?.title || 'Question'}
      </h3>
      <div style="color: #374151;">
        ${formatAnswer(answer)}
      </div>
    </div>
  `).join('')

  // Contact information section
  const contactInfo = []
  if (data.contact_name) contactInfo.push(`<strong>Name:</strong> ${data.contact_name}`)
  if (data.contact_email) contactInfo.push(`<strong>Email:</strong> <a href="mailto:${data.contact_email}" style="color: #3b82f6;">${data.contact_email}</a>`)
  if (data.contact_phone) contactInfo.push(`<strong>Phone:</strong> <a href="tel:${data.contact_phone}" style="color: #3b82f6;">${data.contact_phone}</a>`)
  if (data.contact_postcode) contactInfo.push(`<strong>Postcode:</strong> ${data.contact_postcode}`)

  const contactHtml = contactInfo.length > 0 ? `
    <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 10px; border-left: 4px solid #10b981;">
      <h2 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px;">👤 Contact Information</h2>
      <div style="color: #047857; line-height: 1.6;">
        ${contactInfo.join('<br>')}
      </div>
    </div>
  ` : ''

  // Frames data section (if exists)
  const framesHtml = data.frames_data && data.frames_data.length > 0 ? `
    <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
      <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">🖼️ Frame Data</h2>
      ${data.frames_data.map(frame => `
        <div style="margin-bottom: 15px; padding: 15px; background-color: white; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">Frame ${frame.frame_number}</h4>
          ${frame.image_url ? `<img src="${frame.image_url}" alt="Frame ${frame.frame_number}" style="max-width: 200px; max-height: 150px; border-radius: 6px; margin-bottom: 10px;">` : ''}
          ${frame.location_text ? `<p><strong>Location:</strong> ${frame.location_text}</p>` : ''}
          ${frame.measurements_text ? `<p><strong>Measurements:</strong> ${frame.measurements_text}</p>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Form Response - ${data.form_name}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700;">🎉 New Form Response!</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">You've received a new submission</p>
        </div>

        <!-- Form Details -->
        <div style="margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 10px; border-left: 4px solid #6366f1;">
          <h2 style="margin: 0 0 15px 0; color: #4338ca; font-size: 18px;">📋 Form Details</h2>
          <p style="margin: 5px 0; color: #1f2937;"><strong>Form Name:</strong> ${data.form_name}</p>
          <p style="margin: 5px 0; color: #1f2937;"><strong>Client:</strong> ${data.client_name}</p>
          <p style="margin: 5px 0; color: #1f2937;"><strong>Submitted:</strong> ${formatDate(data.submitted_at)}</p>
        </div>

        <!-- Contact Information -->
        ${contactHtml}

        <!-- Responses -->
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            💬 Form Responses
          </h2>
          ${answersHtml}
        </div>

        <!-- Frames Data -->
        ${framesHtml}

        <!-- View All Responses Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://designer.advertomedia.co.uk/responses" 
             style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            🔗 View All Responses
          </a>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding: 20px; background-color: #f3f4f6; border-radius: 10px; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">This email was sent automatically by Online Designer</p>
          <p style="margin: 0;">
            <a href="https://advertomedia.co.uk" style="color: #3b82f6; text-decoration: none;">advertomedia.co.uk</a> | 
            <a href="mailto:info@advertomedia.co.uk" style="color: #3b82f6; text-decoration: none;">info@advertomedia.co.uk</a>
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `
}

function generateEmailText(data: ResponseData): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  let text = `NEW FORM RESPONSE RECEIVED!\n\n`
  text += `Form: ${data.form_name}\n`
  text += `Client: ${data.client_name}\n`
  text += `Submitted: ${formatDate(data.submitted_at)}\n\n`

  if (data.contact_name || data.contact_email || data.contact_phone || data.contact_postcode) {
    text += `CONTACT INFORMATION:\n`
    if (data.contact_name) text += `Name: ${data.contact_name}\n`
    if (data.contact_email) text += `Email: ${data.contact_email}\n`
    if (data.contact_phone) text += `Phone: ${data.contact_phone}\n`
    if (data.contact_postcode) text += `Postcode: ${data.contact_postcode}\n`
    text += `\n`
  }

  text += `RESPONSES:\n`
  data.answers.forEach((answer, index) => {
    text += `${index + 1}. ${answer.form_steps?.title || 'Question'}\n`
    
    let answerText = ''
    switch (answer.form_steps?.question_type) {
      case 'text_input':
      case 'text_area':
        answerText = answer.answer_text || 'No response'
        break
      case 'multiple_choice':
        const selectedOption = answer.form_steps?.form_options?.find((opt: any) => opt.id === answer.selected_option_id)
        answerText = selectedOption?.label || answer.answer_text || 'No selection'
        break
      case 'file_upload':
        if (answer.file_url && answer.file_name) {
          answerText = `File: ${answer.file_name} (${answer.file_url})`
        } else {
          answerText = 'No file uploaded'
        }
        break
      case 'dimensions':
        const dimensions = []
        if (answer.width) dimensions.push(`Width: ${answer.width}${answer.units || ''}`)
        if (answer.height) dimensions.push(`Height: ${answer.height}${answer.units || ''}`)
        if (answer.depth) dimensions.push(`Depth: ${answer.depth}${answer.units || ''}`)
        answerText = dimensions.length > 0 ? dimensions.join(' × ') : 'No dimensions provided'
        break
      case 'opinion_scale':
        answerText = answer.scale_rating !== null ? `Rating: ${answer.scale_rating}/5` : 'No rating provided'
        break
      default:
        answerText = answer.answer_text || 'No response'
    }
    
    text += `   ${answerText}\n\n`
  })

  if (data.frames_data && data.frames_data.length > 0) {
    text += `FRAME DATA:\n`
    data.frames_data.forEach(frame => {
      text += `Frame ${frame.frame_number}:\n`
      if (frame.location_text) text += `  Location: ${frame.location_text}\n`
      if (frame.measurements_text) text += `  Measurements: ${frame.measurements_text}\n`
      if (frame.image_url) text += `  Image: ${frame.image_url}\n`
      text += `\n`
    })
  }

  text += `View all responses: https://designer.advertomedia.co.uk/responses\n\n`
  text += `---\nThis email was sent automatically by Online Designer\n`
  text += `designer.advertomedia.co.uk | designer@advertomedia.co.uk`

  return text
}
