import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://bahloynyhjgmdndqabhu.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhaGxveW55aGpnbWRuZHFhYmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjM0ODAsImV4cCI6MjA3MTMzOTQ4MH0.SYTUzUkXfjHO-odCTKVDHiBH6AqQmJLf2qoiiD8ecZ0'

// Validate URL format
if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
  throw new Error('Invalid Supabase URL format. URL must start with https:// or http://')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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
          question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields'
          is_required: boolean
          step_order: number
          created_at: string
        }
        Insert: {
          id?: string
          form_id: string
          title: string
          question_type: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields'
          is_required?: boolean
          step_order: number
          created_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          title?: string
          question_type?: 'image_selection' | 'multiple_choice' | 'text_input' | 'contact_fields'
          is_required?: boolean
          step_order?: number
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