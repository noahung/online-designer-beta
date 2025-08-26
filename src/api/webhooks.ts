// API endpoint for webhook subscription management
import { supabase } from '../lib/supabase';

// This would typically be in a server environment, but for demo purposes
// we'll create the structure here. In production, these would be actual API endpoints.

export async function subscribeWebhook(req: Request) {
  try {
    const { target_url, form_id, api_key } = await req.json();
    
    if (!target_url || !form_id || !api_key) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify API key and get user
    const { data: user, error: userError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', api_key)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify form belongs to user
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id')
      .eq('id', form_id)
      .eq('user_id', user.user_id)
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: 'Form not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store webhook subscription (you'd need a webhooks table)
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .upsert({
        user_id: user.user_id,
        form_id: form_id,
        target_url: target_url,
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (webhookError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create webhook subscription' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        webhook_id: webhook.id,
        message: 'Webhook subscription created successfully' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook subscription error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function unsubscribeWebhook(req: Request) {
  try {
    const { target_url, form_id, api_key } = await req.json();
    
    if (!target_url || !form_id || !api_key) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify API key and get user
    const { data: user, error: userError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', api_key)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete webhook subscription
    const { error: deleteError } = await supabase
      .from('webhooks')
      .delete()
      .eq('user_id', user.user_id)
      .eq('form_id', form_id)
      .eq('target_url', target_url);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to unsubscribe webhook' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook unsubscribed successfully' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook unsubscribe error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function getRecentResponses(formId: string, apiKey: string, limit: number = 3) {
  try {
    // Verify API key and get user
    const { data: user, error: userError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('api_key', apiKey)
      .single();

    if (userError || !user) {
      return {
        error: 'Invalid API key',
        status: 401
      };
    }

    // Get form details
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, name')
      .eq('id', formId)
      .eq('user_id', user.user_id)
      .single();

    if (formError || !form) {
      return {
        error: 'Form not found or access denied',
        status: 404
      };
    }

    // Get recent responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (responsesError) {
      return {
        error: 'Failed to fetch responses',
        status: 500
      };
    }

    // Format responses for Zapier
    const formattedResponses = responses?.map(response => {
      const responseData = response.response_data || {};
      const contact = responseData.contact || {};
      
      return {
        response_id: response.id,
        form_id: form.id,
        form_name: form.name,
        submitted_at: response.created_at,
        contact: contact,
        contact__name: contact.name,
        contact__email: contact.email,
        contact__phone: contact.phone,
        answers: responseData.answers || []
      };
    }) || [];

    return {
      success: true,
      responses: formattedResponses
    };

  } catch (error) {
    console.error('Get recent responses error:', error);
    return {
      error: 'Internal server error',
      status: 500
    };
  }
}
