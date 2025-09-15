import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface WebhookNotification {
  id: string
  webhook_url: string
  payload: any
  attempts: number
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Get pending webhook notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('webhook_notifications')
      .select(`
        id,
        webhook_url,
        payload,
        attempts
      `)
      .eq('status', 'pending')
      .lt('attempts', 3) // Max 3 attempts
      .order('created_at', { ascending: true })
      .limit(10) // Process in batches

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError)
      return new Response('Error fetching notifications', { status: 500 })
    }

    if (!notifications || notifications.length === 0) {
      return new Response('No pending notifications', { status: 200 })
    }

    // Process each notification
    const results = await Promise.allSettled(
      notifications.map(async (notification: any) => {
        const webhookUrl = notification.webhook_url

        if (!webhookUrl) {
          console.error('No webhook URL found for notification:', notification.id)
          return
        }

        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Online Designer Webhook/1.0'
            },
            body: JSON.stringify(notification.payload)
          })

          if (response.ok) {
            // Mark as sent
            await supabase
              .from('webhook_notifications')
              .update({
                status: 'sent',
                updated_at: new Date().toISOString()
              })
              .eq('id', notification.id)

            console.log(`Webhook sent successfully to ${webhookUrl}`)
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error) {
          console.error(`Failed to send webhook to ${webhookUrl}:`, error)

          // Update attempts and status
          const newAttempts = (notification.attempts || 0) + 1
          const shouldRetry = newAttempts < 3

          await supabase
            .from('webhook_notifications')
            .update({
              attempts: newAttempts,
              status: shouldRetry ? 'pending' : 'failed',
              last_attempt_at: new Date().toISOString(),
              error_message: (error as Error).message,
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)
        }
      })
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failureCount = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({
        processed: notifications.length,
        successful: successCount,
        failed: failureCount
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processor error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
