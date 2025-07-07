export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          company_id: string
          first_name?: string
          last_name?: string
          role?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          first_name?: string
          last_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          first_name?: string
          last_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          domain?: string
          industry?: string
          size?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain?: string
          industry?: string
          size?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          industry?: string
          size?: string
          created_at?: string
          updated_at?: string
        }
      }
      thoughts: {
        Row: {
          id: string
          user_id: string
          company_id: string
          content: string
          category?: string
          tags?: string[]
          ai_enhanced_content?: string
          business_context?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          content: string
          category?: string
          tags?: string[]
          ai_enhanced_content?: string
          business_context?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          content?: string
          category?: string
          tags?: string[]
          ai_enhanced_content?: string
          business_context?: Json
          created_at?: string
          updated_at?: string
        }
      }
      assessment_categories: {
        Row: {
          id: string
          name: string
          description?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_at?: string
        }
      }
      assessment_questions: {
        Row: {
          id: string
          category_id: string
          question: string
          question_type: string
          options?: Json
          required: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          question: string
          question_type: string
          options?: Json
          required?: boolean
          order_index: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          question?: string
          question_type?: string
          options?: Json
          required?: boolean
          order_index?: number
          created_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          slug: string
          name: string
          provider: string
          description?: string
          icon_url?: string
          auth_type: string
          config: Json
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          provider: string
          description?: string
          icon_url?: string
          auth_type: string
          config: Json
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          provider?: string
          description?: string
          icon_url?: string
          auth_type?: string
          config?: Json
          created_at?: string
        }
      }
      user_integrations: {
        Row: {
          id: string
          user_id: string
          company_id: string
          integration_id: string
          credentials?: Json
          status: string
          last_sync_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          integration_id: string
          credentials?: Json
          status: string
          last_sync_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          integration_id?: string
          credentials?: Json
          status?: string
          last_sync_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      ai_email_accounts: {
        Row: {
          id: string
          user_id: string
          company_id: string
          email_address: string
          display_name?: string
          provider: string
          sync_enabled: boolean
          sync_status: string
          last_sync_at?: string
          sync_error?: string
          sync_frequency?: string
          ai_priority_enabled?: boolean
          ai_summary_enabled?: boolean
          ai_suggestions_enabled?: boolean
          ai_auto_categorize_enabled?: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          email_address: string
          display_name?: string
          provider: string
          sync_enabled?: boolean
          sync_status: string
          last_sync_at?: string
          sync_error?: string
          sync_frequency?: string
          ai_priority_enabled?: boolean
          ai_summary_enabled?: boolean
          ai_suggestions_enabled?: boolean
          ai_auto_categorize_enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          email_address?: string
          display_name?: string
          provider?: string
          sync_enabled?: boolean
          sync_status?: string
          last_sync_at?: string
          sync_error?: string
          sync_frequency?: string
          ai_priority_enabled?: boolean
          ai_summary_enabled?: boolean
          ai_suggestions_enabled?: boolean
          ai_auto_categorize_enabled?: boolean
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific type exports for common use
export type User = Tables<'users'>
export type UserProfile = Tables<'user_profiles'>
export type Company = Tables<'companies'>
export type Thought = Tables<'thoughts'>
export type AssessmentCategory = Tables<'assessment_categories'>
export type AssessmentQuestion = Tables<'assessment_questions'>
export type Integration = Tables<'integrations'>
export type UserIntegration = Tables<'user_integrations'>
export type EmailAccount = Tables<'ai_email_accounts'>
