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

console.log('🔍 [EDGE FUNCTION] Process-webhooks function started')

Deno.serve(async (req) => {
  console.log('🔍 [EDGE FUNCTION] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  if (req.method !== 'POST') {
    console.log('❌ [EDGE FUNCTION] Invalid method:', req.method)
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    console.log('🔍 [EDGE FUNCTION] Fetching pending webhook notifications...')

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
      console.error('❌ [EDGE FUNCTION] Error fetching notifications:', fetchError)
      return new Response('Error fetching notifications', { status: 500 })
    }

    console.log('🔍 [EDGE FUNCTION] Fetched notifications:', {
      count: notifications?.length || 0,
      notifications: notifications?.map(n => ({ id: n.id, webhook_url: n.webhook_url })) || []
    })

    if (!notifications || notifications.length === 0) {
      console.log('⚠️ [EDGE FUNCTION] No pending notifications to process')
      return new Response('No pending notifications', { status: 200 })
    }

    console.log('🔍 [EDGE FUNCTION] Processing', notifications.length, 'notifications...')

    // Process each notification
    const results = await Promise.allSettled(
      notifications.map(async (notification: any) => {
        console.log('🔍 [EDGE FUNCTION] Processing notification:', {
          id: notification.id,
          webhook_url: notification.webhook_url,
          attempts: notification.attempts
        })

        const webhookUrl = notification.webhook_url

        if (!webhookUrl) {
          console.error('❌ [EDGE FUNCTION] No webhook URL found for notification:', notification.id)
          return
        }

        console.log('🔍 [EDGE FUNCTION] Sending webhook to:', webhookUrl)

        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Online Designer Webhook/1.0'
            },
            body: JSON.stringify(notification.payload)
          })

          console.log('🔍 [EDGE FUNCTION] Webhook response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          })

          if (response.ok) {
            // Mark as sent
            console.log('✅ [EDGE FUNCTION] Webhook sent successfully, updating database...')
            const { error: updateError } = await supabase
              .from('webhook_notifications')
              .update({
                status: 'sent',
                updated_at: new Date().toISOString()
              })
              .eq('id', notification.id)

            if (updateError) {
              console.error('❌ [EDGE FUNCTION] Error updating notification status:', updateError)
            } else {
              console.log('✅ [EDGE FUNCTION] Notification marked as sent:', notification.id)
            }

            console.log(`✅ [EDGE FUNCTION] Webhook sent successfully to ${webhookUrl}`)
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error) {
          console.error(`❌ [EDGE FUNCTION] Failed to send webhook to ${webhookUrl}:`, error)

          // Update attempts and status
          const newAttempts = (notification.attempts || 0) + 1
          const shouldRetry = newAttempts < 3

          console.log('🔍 [EDGE FUNCTION] Updating notification attempts:', {
            id: notification.id,
            newAttempts,
            shouldRetry,
            status: shouldRetry ? 'pending' : 'failed'
          })

          const { error: updateError } = await supabase
            .from('webhook_notifications')
            .update({
              attempts: newAttempts,
              status: shouldRetry ? 'pending' : 'failed',
              last_attempt_at: new Date().toISOString(),
              error_message: (error as Error).message,
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          if (updateError) {
            console.error('❌ [EDGE FUNCTION] Error updating notification attempts:', updateError)
          }
        }
      })
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failureCount = results.filter(r => r.status === 'rejected').length

    console.log('✅ [EDGE FUNCTION] Processing complete:', {
      processed: notifications.length,
      successful: successCount,
      failed: failureCount
    })

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
    console.error('❌ [EDGE FUNCTION] Unexpected error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
