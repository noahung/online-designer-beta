import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
  // Fail fast with a clear message to help local devs set up env vars
  throw new Error(
    'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment. See .env.example.'
  )
}

// Basic URL sanity check
if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
  throw new Error('Invalid Supabase URL format. URL must start with https:// or http://')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to set client context for RLS policies
export const setClientContext = async (clientId: string | null) => {
  if (clientId) {
    // Set the client_id context for RLS policies
    await supabase.rpc('set_app_config', {
      setting_name: 'app.client_id',
      setting_value: clientId,
      is_local: true
    })
  } else {
    // Clear the client context
    await supabase.rpc('set_app_config', {
      setting_name: 'app.client_id',
      setting_value: '',
      is_local: true
    })
  }
}

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          primary_color: string
          secondary_color: string
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          user_id?: string
        }
      }
      forms: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          user_id?: string
        }
      }
      form_steps: {
        Row: {
          id: string
          form_id: string
          title: string
          description: string | null
          question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields' | 'file_upload' | 'dimensions'
          is_required: boolean
          step_order: number
          dimension_units: string | null
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          title: string
          description?: string | null
          question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields' | 'file_upload' | 'dimensions'
          is_required?: boolean
          step_order: number
          dimension_units?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          title?: string
          description?: string | null
          question_type?: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields' | 'file_upload' | 'dimensions'
          is_required?: boolean
          step_order?: number
          dimension_units?: string | null
          created_at?: string
        }
      }
      form_options: {
        Row: {
          id: string
          step_id: string
          label: string
          image_url: string | null
          jump_to_step: number | null
          option_order: number
          created_at: string
        }
        Insert: {
          id?: string
          step_id: string
          label: string
          image_url?: string | null
          jump_to_step?: number | null
          option_order: number
          created_at?: string
        }
        Update: {
          id?: string
          step_id?: string
          label?: string
          image_url?: string | null
          jump_to_step?: number | null
          option_order?: number
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          form_id: string
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_postcode: string | null
          submitted_at: string
          webhook_sent: boolean
        }
        Insert: {
          id?: string
          form_id: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_postcode?: string | null
          submitted_at?: string
          webhook_sent?: boolean
        }
        Update: {
          id?: string
          form_id?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_postcode?: string | null
          submitted_at?: string
          webhook_sent?: boolean
        }
      }
      response_answers: {
        Row: {
          id: string
          response_id: string
          step_id: string
          answer_text: string | null
          selected_option_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          response_id: string
          step_id: string
          answer_text?: string | null
          selected_option_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          step_id?: string
          answer_text?: string | null
          selected_option_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}