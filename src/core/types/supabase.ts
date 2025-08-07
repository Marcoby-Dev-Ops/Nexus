export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      action_cards: {
        Row: {
          company_id: string | null
          created_at: string | null
          data: Json | null
          description: string | null
          domain: string | null
          id: string
          kind: string | null
          meta: Json | null
          resolved_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          domain?: string | null
          id?: string
          kind?: string | null
          meta?: Json | null
          resolved_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          domain?: string | null
          id?: string
          kind?: string | null
          meta?: Json | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_platforms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_action_card_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          slug: string
          template_data: Json
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          slug: string
          template_data: Json
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          slug?: string
          template_data?: Json
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      ai_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_email_accounts: {
        Row: {
          access_token: string | null
          company_id: string | null
          created_at: string | null
          display_name: string | null
          email_address: string
          error_message: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          settings: Json | null
          sync_enabled: boolean | null
          sync_frequency: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          company_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email_address: string
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          settings?: Json | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          company_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email_address?: string
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          settings?: Json | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_email_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_email_attachments: {
        Row: {
          content_type: string | null
          created_at: string | null
          download_url: string | null
          filename: string
          id: string
          message_id: string
          size_bytes: number | null
          storage_path: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          download_url?: string | null
          filename: string
          id?: string
          message_id: string
          size_bytes?: number | null
          storage_path?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          download_url?: string | null
          filename?: string
          id?: string
          message_id?: string
          size_bytes?: number | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_email_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_email_messages: {
        Row: {
          account_id: string
          ai_action_items: string[] | null
          ai_category: string | null
          ai_priority_score: number | null
          ai_processed_at: string | null
          ai_sentiment: string | null
          ai_summary: string | null
          attachment_count: number | null
          bcc_addresses: string[] | null
          body_html: string | null
          body_plain: string | null
          cc_addresses: string[] | null
          company_id: string | null
          created_at: string | null
          external_id: string | null
          from_address: string
          has_attachments: boolean | null
          id: string
          is_important: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          is_trashed: boolean | null
          labels: string[] | null
          message_id: string
          received_at: string | null
          sent_at: string | null
          size_bytes: number | null
          snippet: string | null
          subject: string | null
          thread_id: string | null
          to_addresses: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          ai_action_items?: string[] | null
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_processed_at?: string | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          attachment_count?: number | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_plain?: string | null
          cc_addresses?: string[] | null
          company_id?: string | null
          created_at?: string | null
          external_id?: string | null
          from_address: string
          has_attachments?: boolean | null
          id?: string
          is_important?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          is_trashed?: boolean | null
          labels?: string[] | null
          message_id: string
          received_at?: string | null
          sent_at?: string | null
          size_bytes?: number | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          ai_action_items?: string[] | null
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_processed_at?: string | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          attachment_count?: number | null
          bcc_addresses?: string[] | null
          body_html?: string | null
          body_plain?: string | null
          cc_addresses?: string[] | null
          company_id?: string | null
          created_at?: string | null
          external_id?: string | null
          from_address?: string
          has_attachments?: boolean | null
          id?: string
          is_important?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          is_trashed?: boolean | null
          labels?: string[] | null
          message_id?: string
          received_at?: string | null
          sent_at?: string | null
          size_bytes?: number | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_email_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_email_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_email_sync_jobs: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string | null
          error_count: number | null
          error_message: string | null
          folder_filter: string[] | null
          id: string
          job_type: string
          processed_messages: number | null
          started_at: string | null
          status: string | null
          sync_from: string | null
          sync_to: string | null
          total_messages: number | null
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          folder_filter?: string[] | null
          id?: string
          job_type: string
          processed_messages?: number | null
          started_at?: string | null
          status?: string | null
          sync_from?: string | null
          sync_to?: string | null
          total_messages?: number | null
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          error_message?: string | null
          folder_filter?: string[] | null
          id?: string
          job_type?: string
          processed_messages?: number | null
          started_at?: string | null
          status?: string | null
          sync_from?: string | null
          sync_to?: string | null
          total_messages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_email_sync_jobs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ai_email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_embedding_cache: {
        Row: {
          checksum: string
          content: string
          created_at: string | null
          embedding: string
          id: string
        }
        Insert: {
          checksum: string
          content: string
          created_at?: string | null
          embedding: string
          id?: string
        }
        Update: {
          checksum?: string
          content?: string
          created_at?: string | null
          embedding?: string
          id?: string
        }
        Relationships: []
      }
      ai_inbox_items: {
        Row: {
          ai_action_items: string[] | null
          ai_action_suggestion: string | null
          ai_category: string | null
          ai_priority_score: number | null
          ai_processed_at: string | null
          ai_sentiment: string | null
          ai_summary: string | null
          company_id: string | null
          content: string | null
          created_at: string | null
          email_references: string[] | null
          external_id: string | null
          html_content: string | null
          id: string
          in_reply_to: string | null
          integration_id: string | null
          is_archived: boolean | null
          is_demo: boolean | null
          is_flagged: boolean | null
          is_important: boolean | null
          is_read: boolean | null
          item_timestamp: string
          item_type: string | null
          message_id: string | null
          preview: string | null
          priority_score: number | null
          received_at: string
          recipient_email: string | null
          sender: string | null
          sender_email: string | null
          sender_name: string | null
          snooze_until: string | null
          source_type: string | null
          status: string | null
          subject: string | null
          thread_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_action_items?: string[] | null
          ai_action_suggestion?: string | null
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_processed_at?: string | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          email_references?: string[] | null
          external_id?: string | null
          html_content?: string | null
          id?: string
          in_reply_to?: string | null
          integration_id?: string | null
          is_archived?: boolean | null
          is_demo?: boolean | null
          is_flagged?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          item_timestamp?: string
          item_type?: string | null
          message_id?: string | null
          preview?: string | null
          priority_score?: number | null
          received_at?: string
          recipient_email?: string | null
          sender?: string | null
          sender_email?: string | null
          sender_name?: string | null
          snooze_until?: string | null
          source_type?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_action_items?: string[] | null
          ai_action_suggestion?: string | null
          ai_category?: string | null
          ai_priority_score?: number | null
          ai_processed_at?: string | null
          ai_sentiment?: string | null
          ai_summary?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          email_references?: string[] | null
          external_id?: string | null
          html_content?: string | null
          id?: string
          in_reply_to?: string | null
          integration_id?: string | null
          is_archived?: boolean | null
          is_demo?: boolean | null
          is_flagged?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          item_timestamp?: string
          item_type?: string | null
          message_id?: string | null
          preview?: string | null
          priority_score?: number | null
          received_at?: string
          recipient_email?: string | null
          sender?: string | null
          sender_email?: string | null
          sender_name?: string | null
          snooze_until?: string | null
          source_type?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_inbox_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_items_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_inbox_rules: {
        Row: {
          actions: Json
          company_id: string | null
          conditions: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          priority: number | null
          times_triggered: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions: Json
          company_id?: string | null
          conditions: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          priority?: number | null
          times_triggered?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json
          company_id?: string | null
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          priority?: number | null
          times_triggered?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_inbox_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          category: string | null
          confidence_score: number | null
          content: string
          created_at: string | null
          id: string
          insight_type: string
          is_active: boolean | null
          metadata: Json | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          confidence_score?: number | null
          content: string
          created_at?: string | null
          id?: string
          insight_type: string
          is_active?: boolean | null
          metadata?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          id?: string
          insight_type?: string
          is_active?: boolean | null
          metadata?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_integrations_oauth: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_category: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      assessment_category_score: {
        Row: {
          category_name: string
          company_id: string
          created_at: string | null
          id: string
          max_score: number | null
          score: number | null
          updated_at: string | null
        }
        Insert: {
          category_name: string
          company_id: string
          created_at?: string | null
          id?: string
          max_score?: number | null
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          category_name?: string
          company_id?: string
          created_at?: string | null
          id?: string
          max_score?: number | null
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_category_score_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_question: {
        Row: {
          action_type: string | null
          category_id: string | null
          created_at: string | null
          id: string
          question_text: string
          question_type: string
          target_field: string | null
          updated_at: string | null
        }
        Insert: {
          action_type?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          question_text: string
          question_type: string
          target_field?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          question_text?: string
          question_type?: string
          target_field?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_response: {
        Row: {
          answer_value: string | null
          company_id: string
          created_at: string | null
          id: string
          question_id: string
          score: number | null
          updated_at: string | null
        }
        Insert: {
          answer_value?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          question_id: string
          score?: number | null
          updated_at?: string | null
        }
        Update: {
          answer_value?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          question_id?: string
          score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_response_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_summary: {
        Row: {
          category_scores: Json | null
          company_id: string
          created_at: string | null
          id: string
          last_updated: string | null
          overall_score: number | null
          updated_at: string | null
        }
        Insert: {
          category_scores?: Json | null
          company_id: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          overall_score?: number | null
          updated_at?: string | null
        }
        Update: {
          category_scores?: Json | null
          company_id?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          overall_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_summary_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          integration: string
          ip_address: unknown | null
          timestamp: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          integration: string
          ip_address?: unknown | null
          timestamp?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          integration?: string
          ip_address?: unknown | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      billing_accounts: {
        Row: {
          billing_address: Json | null
          billing_email: string
          created_at: string | null
          currency: string | null
          id: string
          payment_method_id: string | null
          stripe_customer_id: string | null
          tax_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          billing_email: string
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method_id?: string | null
          stripe_customer_id?: string | null
          tax_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          billing_email?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method_id?: string | null
          stripe_customer_id?: string | null
          tax_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price_monthly: number
          price_yearly: number
          token_limit: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price_monthly?: number
          price_yearly?: number
          token_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          token_limit?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      business_health: {
        Row: {
          category_scores: Json | null
          completion_percentage: number | null
          connected_sources: number | null
          created_at: string | null
          data_quality_score: number | null
          data_sources: string[] | null
          id: string
          last_calculated: string | null
          org_id: string | null
          overall_score: number
          recorded_at: string | null
          updated_at: string | null
          user_id: string
          verified_sources: number | null
        }
        Insert: {
          category_scores?: Json | null
          completion_percentage?: number | null
          connected_sources?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          data_sources?: string[] | null
          id?: string
          last_calculated?: string | null
          org_id?: string | null
          overall_score?: number
          recorded_at?: string | null
          updated_at?: string | null
          user_id: string
          verified_sources?: number | null
        }
        Update: {
          category_scores?: Json | null
          completion_percentage?: number | null
          connected_sources?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          data_sources?: string[] | null
          id?: string
          last_calculated?: string | null
          org_id?: string | null
          overall_score?: number
          recorded_at?: string | null
          updated_at?: string | null
          user_id?: string
          verified_sources?: number | null
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          ai_insights: Json | null
          annual_revenue: string | null
          assessment_completion_percentage: number | null
          assessment_version: string | null
          auto_detected_answers: Json | null
          auto_detection_confidence: number | null
          business_context: Json | null
          business_email: string | null
          business_email_analysis: Json | null
          business_email_domain: string | null
          business_health_history: Json | null
          business_model: string | null
          business_stage: string | null
          company_name: string | null
          company_size: string | null
          competitive_advantages: string[] | null
          competitive_landscape: Json | null
          core_products: string[] | null
          created_at: string | null
          current_clients: string[] | null
          data_sources: string[] | null
          id: string
          industry: string | null
          integration_data: Json | null
          key_metrics: string[] | null
          last_assessment_date: string | null
          legal_structure: string | null
          market_research_data: Json | null
          opportunity_analysis: Json | null
          org_id: string | null
          pain_points: string[] | null
          performance_metrics: Json | null
          primary_channels: string[] | null
          primary_goals: string[] | null
          recommendations: Json | null
          risk_assessment: Json | null
          strategic_roadmap: Json | null
          target_clients: string[] | null
          team_size: string | null
          timeline: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_insights?: Json | null
          annual_revenue?: string | null
          assessment_completion_percentage?: number | null
          assessment_version?: string | null
          auto_detected_answers?: Json | null
          auto_detection_confidence?: number | null
          business_context?: Json | null
          business_email?: string | null
          business_email_analysis?: Json | null
          business_email_domain?: string | null
          business_health_history?: Json | null
          business_model?: string | null
          business_stage?: string | null
          company_name?: string | null
          company_size?: string | null
          competitive_advantages?: string[] | null
          competitive_landscape?: Json | null
          core_products?: string[] | null
          created_at?: string | null
          current_clients?: string[] | null
          data_sources?: string[] | null
          id?: string
          industry?: string | null
          integration_data?: Json | null
          key_metrics?: string[] | null
          last_assessment_date?: string | null
          legal_structure?: string | null
          market_research_data?: Json | null
          opportunity_analysis?: Json | null
          org_id?: string | null
          pain_points?: string[] | null
          performance_metrics?: Json | null
          primary_channels?: string[] | null
          primary_goals?: string[] | null
          recommendations?: Json | null
          risk_assessment?: Json | null
          strategic_roadmap?: Json | null
          target_clients?: string[] | null
          team_size?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_insights?: Json | null
          annual_revenue?: string | null
          assessment_completion_percentage?: number | null
          assessment_version?: string | null
          auto_detected_answers?: Json | null
          auto_detection_confidence?: number | null
          business_context?: Json | null
          business_email?: string | null
          business_email_analysis?: Json | null
          business_email_domain?: string | null
          business_health_history?: Json | null
          business_model?: string | null
          business_stage?: string | null
          company_name?: string | null
          company_size?: string | null
          competitive_advantages?: string[] | null
          competitive_landscape?: Json | null
          core_products?: string[] | null
          created_at?: string | null
          current_clients?: string[] | null
          data_sources?: string[] | null
          id?: string
          industry?: string | null
          integration_data?: Json | null
          key_metrics?: string[] | null
          last_assessment_date?: string | null
          legal_structure?: string | null
          market_research_data?: Json | null
          opportunity_analysis?: Json | null
          org_id?: string | null
          pain_points?: string[] | null
          performance_metrics?: Json | null
          primary_channels?: string[] | null
          primary_goals?: string[] | null
          recommendations?: Json | null
          risk_assessment?: Json | null
          strategic_roadmap?: Json | null
          target_clients?: string[] | null
          team_size?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          attendees: Json | null
          company_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          location: string | null
          metadata: Json | null
          start_time: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          attendees?: Json | null
          company_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          attendees?: Json | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          summary_chunks: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          summary_chunks?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          summary_chunks?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_usage_tracking: {
        Row: {
          date: string
          id: string
          metadata: Json | null
          org_id: string | null
          usage_count: number
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          usage_count?: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: Json | null
          avg_deal_cycle_days: number | null
          avg_first_response_mins: number | null
          burn_rate: number | null
          business_licenses: Json | null
          business_phone: string | null
          cac: number | null
          client_base_description: string | null
          created_at: string | null
          csat: number | null
          description: string | null
          domain: string | null
          duns_number: string | null
          employee_count: number | null
          fiscal_year_end: string | null
          followers_count: number | null
          founded: string | null
          gross_margin: number | null
          growth_stage: string | null
          headquarters: string | null
          hubspotid: string | null
          id: string
          industry: string | null
          inventory_management_system: string | null
          key_metrics: Json | null
          logo_url: string | null
          microsoft_365: Json | null
          mrr: number | null
          name: string
          on_time_delivery_pct: number | null
          owner_id: string | null
          settings: Json | null
          size: string | null
          social_profiles: string[] | null
          specialties: string[] | null
          updated_at: string | null
          website: string | null
          website_visitors_month: number | null
        }
        Insert: {
          address?: Json | null
          avg_deal_cycle_days?: number | null
          avg_first_response_mins?: number | null
          burn_rate?: number | null
          business_licenses?: Json | null
          business_phone?: string | null
          cac?: number | null
          client_base_description?: string | null
          created_at?: string | null
          csat?: number | null
          description?: string | null
          domain?: string | null
          duns_number?: string | null
          employee_count?: number | null
          fiscal_year_end?: string | null
          followers_count?: number | null
          founded?: string | null
          gross_margin?: number | null
          growth_stage?: string | null
          headquarters?: string | null
          hubspotid?: string | null
          id?: string
          industry?: string | null
          inventory_management_system?: string | null
          key_metrics?: Json | null
          logo_url?: string | null
          microsoft_365?: Json | null
          mrr?: number | null
          name: string
          on_time_delivery_pct?: number | null
          owner_id?: string | null
          settings?: Json | null
          size?: string | null
          social_profiles?: string[] | null
          specialties?: string[] | null
          updated_at?: string | null
          website?: string | null
          website_visitors_month?: number | null
        }
        Update: {
          address?: Json | null
          avg_deal_cycle_days?: number | null
          avg_first_response_mins?: number | null
          burn_rate?: number | null
          business_licenses?: Json | null
          business_phone?: string | null
          cac?: number | null
          client_base_description?: string | null
          created_at?: string | null
          csat?: number | null
          description?: string | null
          domain?: string | null
          duns_number?: string | null
          employee_count?: number | null
          fiscal_year_end?: string | null
          followers_count?: number | null
          founded?: string | null
          gross_margin?: number | null
          growth_stage?: string | null
          headquarters?: string | null
          hubspotid?: string | null
          id?: string
          industry?: string | null
          inventory_management_system?: string | null
          key_metrics?: Json | null
          logo_url?: string | null
          microsoft_365?: Json | null
          mrr?: number | null
          name?: string
          on_time_delivery_pct?: number | null
          owner_id?: string | null
          settings?: Json | null
          size?: string | null
          social_profiles?: string[] | null
          specialties?: string[] | null
          updated_at?: string | null
          website?: string | null
          website_visitors_month?: number | null
        }
        Relationships: []
      }
      company_audit_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource: string
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource: string
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_billing: {
        Row: {
          amount: number | null
          company_id: string
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_billing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_export_requests: {
        Row: {
          company_id: string
          created_at: string | null
          file_url: string | null
          id: string
          requested_by: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          requested_by: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          requested_by?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_export_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          created_at: string | null
          department_id: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          created_at?: string | null
          department_id?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          created_at?: string | null
          department_id?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_notifications: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_reports: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          last_generated: string | null
          name: string
          recipients: string[] | null
          schedule: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          last_generated?: string | null
          name: string
          recipients?: string[] | null
          schedule?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          last_generated?: string | null
          name?: string
          recipients?: string[] | null
          schedule?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_roles: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          permissions: string[] | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          permissions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_templates: {
        Row: {
          company_id: string
          content: Json | null
          created_at: string | null
          created_by: string
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content?: Json | null
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: Json | null
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_usage: {
        Row: {
          active_users: number | null
          api_calls: number | null
          company_id: string
          created_at: string | null
          date: string
          id: string
          storage_used: number | null
        }
        Insert: {
          active_users?: number | null
          api_calls?: number | null
          company_id: string
          created_at?: string | null
          date: string
          id?: string
          storage_used?: number | null
        }
        Update: {
          active_users?: number | null
          api_calls?: number | null
          company_id?: string
          created_at?: string | null
          date?: string
          id?: string
          storage_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_workflows: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          steps?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string | null
          department: string | null
          email: string | null
          external_id: string | null
          first_name: string
          hubspotid: string | null
          id: string
          integration_id: string | null
          job_title: string | null
          last_name: string | null
          lead_source: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          external_id?: string | null
          first_name: string
          hubspotid?: string | null
          id?: string
          integration_id?: string | null
          job_title?: string | null
          last_name?: string | null
          lead_source?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          external_id?: string | null
          first_name?: string
          hubspotid?: string | null
          id?: string
          integration_id?: string | null
          job_title?: string | null
          last_name?: string | null
          lead_source?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_point_relationships: {
        Row: {
          consumers: string[] | null
          created_at: string | null
          data_flow: string | null
          datapoint_id: string
          datapoint_name: string
          dependencies: string[] | null
          id: string
          last_validated: string | null
          related_datapoints: string[] | null
          updated_at: string | null
          user_integration_id: string
          validation_status: string | null
        }
        Insert: {
          consumers?: string[] | null
          created_at?: string | null
          data_flow?: string | null
          datapoint_id: string
          datapoint_name: string
          dependencies?: string[] | null
          id?: string
          last_validated?: string | null
          related_datapoints?: string[] | null
          updated_at?: string | null
          user_integration_id: string
          validation_status?: string | null
        }
        Update: {
          consumers?: string[] | null
          created_at?: string | null
          data_flow?: string | null
          datapoint_id?: string
          datapoint_name?: string
          dependencies?: string[] | null
          id?: string
          last_validated?: string | null
          related_datapoints?: string[] | null
          updated_at?: string | null
          user_integration_id?: string
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_point_relationships_user_integration_id_fkey"
            columns: ["user_integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          close_date: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          external_id: string | null
          hubspotid: string | null
          id: string
          integration_id: string | null
          lead_source: string | null
          metadata: Json | null
          notes: string | null
          probability: number | null
          stage: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_id?: string | null
          hubspotid?: string | null
          id?: string
          integration_id?: string | null
          lead_source?: string | null
          metadata?: Json | null
          notes?: string | null
          probability?: number | null
          stage?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_id?: string | null
          hubspotid?: string | null
          id?: string
          integration_id?: string | null
          lead_source?: string | null
          metadata?: Json | null
          notes?: string | null
          probability?: number | null
          stage?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string | null
          created_by: string
          document_id: string
          expires_at: string | null
          id: string
          permission: string
          shared_with_company_id: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          document_id: string
          expires_at?: string | null
          id?: string
          permission: string
          shared_with_company_id?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          permission?: string
          shared_with_company_id?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_shared_with_company_id_fkey"
            columns: ["shared_with_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          content: string | null
          created_at: string | null
          created_by: string
          file_path: string | null
          file_size: number | null
          folder_id: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          mime_type: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content?: string | null
          created_at?: string | null
          created_by: string
          file_path?: string | null
          file_size?: number | null
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string
          file_path?: string | null
          file_size?: number | null
          folder_id?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_mappings: {
        Row: {
          canonical_id: string
          canonical_type: string
          confidence_score: number | null
          created_at: string | null
          entity_type: string
          external_id: string
          external_system: string
          id: string
          integration_id: string | null
          integration_name: string
          is_active: boolean | null
          match_method: string | null
          match_reason: string | null
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canonical_id: string
          canonical_type: string
          confidence_score?: number | null
          created_at?: string | null
          entity_type: string
          external_id: string
          external_system: string
          id?: string
          integration_id?: string | null
          integration_name: string
          is_active?: boolean | null
          match_method?: string | null
          match_reason?: string | null
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canonical_id?: string
          canonical_type?: string
          confidence_score?: number | null
          created_at?: string | null
          entity_type?: string
          external_id?: string
          external_system?: string
          id?: string
          integration_id?: string | null
          integration_name?: string
          is_active?: boolean | null
          match_method?: string | null
          match_reason?: string | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_mappings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_resolution_logs: {
        Row: {
          canonical_id: string | null
          confidence_score: number | null
          created_at: string | null
          entity_type: string
          error_message: string | null
          external_id: string
          external_system: string
          id: string
          integration_id: string | null
          matched_entities: string[] | null
          processing_time_ms: number | null
          resolution_method: string | null
          user_id: string
        }
        Insert: {
          canonical_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          entity_type: string
          error_message?: string | null
          external_id: string
          external_system: string
          id?: string
          integration_id?: string | null
          matched_entities?: string[] | null
          processing_time_ms?: number | null
          resolution_method?: string | null
          user_id: string
        }
        Update: {
          canonical_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          entity_type?: string
          error_message?: string | null
          external_id?: string
          external_system?: string
          id?: string
          integration_id?: string | null
          matched_entities?: string[] | null
          processing_time_ms?: number | null
          resolution_method?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_resolution_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_similarity_scores: {
        Row: {
          address_similarity: number | null
          ai_confidence: number | null
          ai_reasoning: string | null
          created_at: string | null
          domain_similarity: number | null
          email_similarity: number | null
          entity1_external_id: string
          entity1_id: string
          entity1_integration: string
          entity1_type: string
          entity2_external_id: string
          entity2_id: string
          entity2_integration: string
          entity2_type: string
          id: string
          name_similarity: number | null
          overall_score: number
          phone_similarity: number | null
          review_decision: string | null
          review_notes: string | null
          reviewed_by: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_similarity?: number | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          created_at?: string | null
          domain_similarity?: number | null
          email_similarity?: number | null
          entity1_external_id: string
          entity1_id: string
          entity1_integration: string
          entity1_type: string
          entity2_external_id: string
          entity2_id: string
          entity2_integration: string
          entity2_type: string
          id?: string
          name_similarity?: number | null
          overall_score: number
          phone_similarity?: number | null
          review_decision?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_similarity?: number | null
          ai_confidence?: number | null
          ai_reasoning?: string | null
          created_at?: string | null
          domain_similarity?: number | null
          email_similarity?: number | null
          entity1_external_id?: string
          entity1_id?: string
          entity1_integration?: string
          entity1_type?: string
          entity2_external_id?: string
          entity2_id?: string
          entity2_integration?: string
          entity2_type?: string
          id?: string
          name_similarity?: number | null
          overall_score?: number
          phone_similarity?: number | null
          review_decision?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      integration_data: {
        Row: {
          business_value: string | null
          created_at: string | null
          data_category: string | null
          data_content: Json
          data_point_definition_id: string | null
          data_type: string
          id: string
          is_required: boolean | null
          refresh_frequency: string | null
          sample_value: Json | null
          sync_timestamp: string | null
          updated_at: string | null
          user_integration_id: string
          validation_rules: Json | null
        }
        Insert: {
          business_value?: string | null
          created_at?: string | null
          data_category?: string | null
          data_content: Json
          data_point_definition_id?: string | null
          data_type: string
          id?: string
          is_required?: boolean | null
          refresh_frequency?: string | null
          sample_value?: Json | null
          sync_timestamp?: string | null
          updated_at?: string | null
          user_integration_id: string
          validation_rules?: Json | null
        }
        Update: {
          business_value?: string | null
          created_at?: string | null
          data_category?: string | null
          data_content?: Json
          data_point_definition_id?: string | null
          data_type?: string
          id?: string
          is_required?: boolean | null
          refresh_frequency?: string | null
          sample_value?: Json | null
          sync_timestamp?: string | null
          updated_at?: string | null
          user_integration_id?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_data_user_integration_id_fkey"
            columns: ["user_integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_ninjarmm_device_data: {
        Row: {
          cpu_usage: number | null
          created_at: string | null
          device_id: string
          disk_usage_gb: number | null
          id: number
          last_seen: string | null
          memory_usage: number | null
          raw_payload: Json | null
          status: string | null
          user_integration_id: string
        }
        Insert: {
          cpu_usage?: number | null
          created_at?: string | null
          device_id: string
          disk_usage_gb?: number | null
          id?: number
          last_seen?: string | null
          memory_usage?: number | null
          raw_payload?: Json | null
          status?: string | null
          user_integration_id: string
        }
        Update: {
          cpu_usage?: number | null
          created_at?: string | null
          device_id?: string
          disk_usage_gb?: number | null
          id?: number
          last_seen?: string | null
          memory_usage?: number | null
          raw_payload?: Json | null
          status?: string | null
          user_integration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_ninjarmm_device_data_user_integration_id_fkey"
            columns: ["user_integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_status: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          integration_slug: string
          last_sync_at: string | null
          metadata: Json | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_slug: string
          last_sync_at?: string | null
          metadata?: Json | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_slug?: string
          last_sync_at?: string | null
          metadata?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          errors: Json | null
          executed_at: string
          id: string
          integration_id: string
          metadata: Json | null
          records_processed: number
          status: string
          sync_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          errors?: Json | null
          executed_at?: string
          id?: string
          integration_id: string
          metadata?: Json | null
          records_processed?: number
          status?: string
          sync_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          errors?: Json | null
          executed_at?: string
          id?: string
          integration_id?: string
          metadata?: Json | null
          records_processed?: number
          status?: string
          sync_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          category: string
          config_schema: Json | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          category: string
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          category?: string
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      n8n_configurations: {
        Row: {
          api_key: string
          base_url: string
          created_at: string | null
          id: string
          instance_name: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          base_url: string
          created_at?: string | null
          id?: string
          instance_name: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          base_url?: string
          created_at?: string | null
          id?: string
          instance_name?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          type: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          type: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          integration_slug: string
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          integration_slug: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          integration_slug?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      operation_contexts: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          operation: string
          org_id: string | null
          record_id: string | null
          table_name: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          operation: string
          org_id?: string | null
          record_id?: string | null
          table_name?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          operation?: string
          org_id?: string | null
          record_id?: string | null
          table_name?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_contexts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operation_contexts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      org_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          org_group_id: string | null
          settings: Json | null
          slug: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_group_id?: string | null
          settings?: Json | null
          slug: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_group_id?: string | null
          settings?: Json | null
          slug?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_automations: {
        Row: {
          config: Json | null
          created_at: string | null
          createdat: string
          description: string | null
          id: string
          name: string
          updatedat: string | null
          userid: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          createdat?: string
          description?: string | null
          id?: string
          name: string
          updatedat?: string | null
          userid: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          createdat?: string
          description?: string | null
          id?: string
          name?: string
          updatedat?: string | null
          userid?: string
        }
        Relationships: []
      }
      personal_thoughts: {
        Row: {
          company_id: string | null
          content: string
          created_at: string | null
          createdat: string
          id: string
          metadata: Json | null
          tags: string[] | null
          updatedat: string | null
          userid: string
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string | null
          createdat?: string
          id?: string
          metadata?: Json | null
          tags?: string[] | null
          updatedat?: string | null
          userid: string
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string | null
          createdat?: string
          id?: string
          metadata?: Json | null
          tags?: string[] | null
          updatedat?: string | null
          userid?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          joined_at: string | null
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_statuses: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          company_id: string
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          name: string
          owner_id: string
          priority: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          company_id: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          name: string
          owner_id: string
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          owner_id?: string
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recent: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_title: string | null
          item_type: string
          user_id: string
          visited_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_title?: string | null
          item_type: string
          user_id: string
          visited_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_title?: string | null
          item_type?: string
          user_id?: string
          visited_at?: string | null
        }
        Relationships: []
      }
      rls_denials: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_time: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          operation: string
          org_id: string | null
          request_path: string | null
          table_name: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_time?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          operation: string
          org_id?: string | null
          request_path?: string | null
          table_name: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_time?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          operation?: string
          org_id?: string | null
          request_path?: string | null
          table_name?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_health_logs: {
        Row: {
          checked_at: string | null
          error_message: string | null
          id: string
          latency_ms: number | null
          metadata: Json | null
          service_name: string
          status: string
        }
        Insert: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          service_name: string
          status: string
        }
        Update: {
          checked_at?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      shared_records: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          permissions: string[] | null
          record_id: string
          shared_by_tenant_id: string
          shared_with_org_ids: Json | null
          shared_with_tenant_ids: Json | null
          table_name: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permissions?: string[] | null
          record_id: string
          shared_by_tenant_id: string
          shared_with_org_ids?: Json | null
          shared_with_tenant_ids?: Json | null
          table_name: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permissions?: string[] | null
          record_id?: string
          shared_by_tenant_id?: string
          shared_with_org_ids?: Json | null
          shared_with_tenant_ids?: Json | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_records_shared_by_tenant_id_fkey"
            columns: ["shared_by_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      slow_queries: {
        Row: {
          created_at: string | null
          execution_time_ms: number
          id: string
          operation: string | null
          org_id: string | null
          query_text: string
          rows_returned: number | null
          table_name: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          execution_time_ms: number
          id?: string
          operation?: string | null
          org_id?: string | null
          query_text: string
          rows_returned?: number | null
          table_name?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          execution_time_ms?: number
          id?: string
          operation?: string | null
          org_id?: string | null
          query_text?: string
          rows_returned?: number | null
          table_name?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan: string
          seats: number
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan: string
          seats?: number
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan?: string
          seats?: number
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_priorities: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      task_statuses: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          priority: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_entitlements: {
        Row: {
          action: string
          created_at: string | null
          id: string
          limit_value: number | null
          metadata: Json | null
          resource: string
          tenant_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          limit_value?: number | null
          metadata?: Json | null
          resource: string
          tenant_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          limit_value?: number | null
          metadata?: Json | null
          resource?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_entitlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          tenant_id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          tenant_id: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          billing_account_id: string | null
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          settings: Json | null
          slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          billing_account_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_account_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          category: string
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          action: string
          cost: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          quantity: number
          resource: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          action: string
          cost?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          quantity?: number
          resource: string
          tenant_id: string
          user_id: string
        }
        Update: {
          action?: string
          cost?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          quantity?: number
          resource?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string
          permissions: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name: string
          permissions?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_billing_plans: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          plan_id: string
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          plan_id: string
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          plan_id?: string
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_billing_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_company_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          company_id: string
          department_id: string | null
          expires_at: string | null
          id: string
          is_primary: boolean | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          company_id: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          is_primary?: boolean | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          company_id?: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          is_primary?: boolean | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_company_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_company_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          integration_id: string | null
          integration_name: string
          last_sync_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          integration_name: string
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          integration_name?: string
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          role_id: string | null
          status: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role_id?: string | null
          status?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role_id?: string | null
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_licenses: {
        Row: {
          expires_at: string | null
          id: string
          issued_at: string
          license_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          issued_at?: string
          license_type: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          issued_at?: string
          license_type?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          id: string
          is_primary: boolean | null
          joined_at: string | null
          org_id: string
          permissions: string[] | null
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          joined_at?: string | null
          org_id: string
          permissions?: string[] | null
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          joined_at?: string | null
          org_id?: string
          permissions?: string[] | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          dashboard_layout: Json | null
          email_notifications: boolean | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          push_notifications: boolean | null
          sidebar_collapsed: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dashboard_layout?: Json | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          push_notifications?: boolean | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dashboard_layout?: Json | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          push_notifications?: boolean | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_id: string | null
          created_at: string | null
          department: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          onboarding_completed: boolean | null
          phone: string | null
          preferences: Json | null
          role: string | null
          settings: Json | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          session_token: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          session_token: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          session_token?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      business_insights_summary: {
        Row: {
          ai_insights: Json | null
          annual_revenue: string | null
          assessment_completion_percentage: number | null
          auto_detected_answers: Json | null
          auto_detection_confidence: number | null
          business_context: Json | null
          business_email_domain: string | null
          business_health_history: Json | null
          business_model: string | null
          business_stage: string | null
          company_name: string | null
          company_size: string | null
          competitive_landscape: Json | null
          created_at: string | null
          data_sources: string[] | null
          industry: string | null
          integration_data: Json | null
          market_research_data: Json | null
          opportunity_analysis: Json | null
          org_id: string | null
          performance_metrics: Json | null
          recommendations: Json | null
          risk_assessment: Json | null
          strategic_roadmap: Json | null
          team_size: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_insights?: Json | null
          annual_revenue?: string | null
          assessment_completion_percentage?: number | null
          auto_detected_answers?: Json | null
          auto_detection_confidence?: number | null
          business_context?: Json | null
          business_email_domain?: string | null
          business_health_history?: Json | null
          business_model?: string | null
          business_stage?: string | null
          company_name?: string | null
          company_size?: string | null
          competitive_landscape?: Json | null
          created_at?: string | null
          data_sources?: string[] | null
          industry?: string | null
          integration_data?: Json | null
          market_research_data?: Json | null
          opportunity_analysis?: Json | null
          org_id?: string | null
          performance_metrics?: Json | null
          recommendations?: Json | null
          risk_assessment?: Json | null
          strategic_roadmap?: Json | null
          team_size?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_insights?: Json | null
          annual_revenue?: string | null
          assessment_completion_percentage?: number | null
          auto_detected_answers?: Json | null
          auto_detection_confidence?: number | null
          business_context?: Json | null
          business_email_domain?: string | null
          business_health_history?: Json | null
          business_model?: string | null
          business_stage?: string | null
          company_name?: string | null
          company_size?: string | null
          competitive_landscape?: Json | null
          created_at?: string | null
          data_sources?: string[] | null
          industry?: string | null
          integration_data?: Json | null
          market_research_data?: Json | null
          opportunity_analysis?: Json | null
          org_id?: string | null
          performance_metrics?: Json | null
          recommendations?: Json | null
          risk_assessment?: Json | null
          strategic_roadmap?: Json | null
          team_size?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_performance_tracking: {
        Row: {
          annual_revenue: string | null
          assessment_completion_percentage: number | null
          business_health_history: Json | null
          business_stage: string | null
          company_name: string | null
          created_at: string | null
          industry: string | null
          opportunity_analysis: Json | null
          performance_metrics: Json | null
          risk_assessment: Json | null
          team_size: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          annual_revenue?: string | null
          assessment_completion_percentage?: number | null
          business_health_history?: Json | null
          business_stage?: string | null
          company_name?: string | null
          created_at?: string | null
          industry?: string | null
          opportunity_analysis?: Json | null
          performance_metrics?: Json | null
          risk_assessment?: Json | null
          team_size?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          annual_revenue?: string | null
          assessment_completion_percentage?: number | null
          business_health_history?: Json | null
          business_stage?: string | null
          company_name?: string | null
          created_at?: string | null
          industry?: string | null
          opportunity_analysis?: Json | null
          performance_metrics?: Json | null
          risk_assessment?: Json | null
          team_size?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_profile_analytics: {
        Row: {
          ai_insights_count: number | null
          annual_revenue: string | null
          assessment_completion_percentage: number | null
          auto_detection_confidence: number | null
          business_email_domain: string | null
          business_model: string | null
          business_stage: string | null
          business_type: string | null
          company_name: string | null
          company_size: string | null
          competitive_advantages_count: number | null
          created_at: string | null
          current_clients_count: number | null
          financial_health_score: number | null
          growth_potential: number | null
          health_history_entries: number | null
          industry: string | null
          market_opportunity: number | null
          market_position: string | null
          operational_maturity: number | null
          org_id: string | null
          recommendations_count: number | null
          team_size: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_insights_count?: never
          annual_revenue?: string | null
          assessment_completion_percentage?: number | null
          auto_detection_confidence?: number | null
          business_email_domain?: string | null
          business_model?: string | null
          business_stage?: string | null
          business_type?: never
          company_name?: string | null
          company_size?: string | null
          competitive_advantages_count?: never
          created_at?: string | null
          current_clients_count?: never
          financial_health_score?: never
          growth_potential?: never
          health_history_entries?: never
          industry?: string | null
          market_opportunity?: never
          market_position?: never
          operational_maturity?: never
          org_id?: string | null
          recommendations_count?: never
          team_size?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_insights_count?: never
          annual_revenue?: string | null
          assessment_completion_percentage?: number | null
          auto_detection_confidence?: number | null
          business_email_domain?: string | null
          business_model?: string | null
          business_stage?: string | null
          business_type?: never
          company_name?: string | null
          company_size?: string | null
          competitive_advantages_count?: never
          created_at?: string | null
          current_clients_count?: never
          financial_health_score?: never
          growth_potential?: never
          health_history_entries?: never
          industry?: string | null
          market_opportunity?: never
          market_position?: never
          operational_maturity?: never
          org_id?: string | null
          recommendations_count?: never
          team_size?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_business_email_domain: {
        Args: { p_user_id: string }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_business_health_score: {
        Args: {
          p_legal_structure: string
          p_business_stage: string
          p_annual_revenue: string
          p_team_size: string
          p_assessment_completion: number
        }
        Returns: number
      }
      calculate_enhanced_business_health_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      cleanup_monitoring_data: {
        Args: { p_days_to_keep?: number }
        Returns: undefined
      }
      enhanced_org_select_policy: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ensure_user_profile: {
        Args: { user_id?: string }
        Returns: undefined
      }
      generate_business_insights: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_company_owner: {
        Args: { company_uuid: string }
        Returns: string
      }
      get_current_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          tenant_id: string
          org_id: string
          user_id: string
        }[]
      }
      get_entity_representations: {
        Args: {
          p_user_id: string
          p_canonical_id: string
          p_entity_type: string
        }
        Returns: {
          integration_name: string
          external_id: string
          external_system: string
          confidence_score: number
          match_method: string
          last_updated: string
        }[]
      }
      get_personal_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_rls_denial_stats: {
        Args: { p_days?: number }
        Returns: {
          table_name: string
          operation: string
          denial_count: number
          unique_users: number
          most_common_error: string
        }[]
      }
      get_slow_query_stats: {
        Args: { p_days?: number }
        Returns: {
          table_name: string
          operation: string
          avg_execution_time_ms: number
          max_execution_time_ms: number
          query_count: number
        }[]
      }
      get_tenant_seat_usage: {
        Args: { p_tenant_id: string }
        Returns: {
          current_seats: number
          max_seats: number
        }[]
      }
      get_tenant_usage_summary: {
        Args: { p_tenant_id: string; p_days?: number }
        Returns: {
          resource: string
          action: string
          total_quantity: number
          total_cost: number
        }[]
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_tenant_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          org_id: string
          tenant_id: string
          role: string
          is_admin: boolean
          is_owner: boolean
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_permission: {
        Args: { p_resource: string; p_action?: string }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_company_admin: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      is_company_owner: {
        Args: { company_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_tenant_admin: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      is_tenant_owner: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      list_all_policies: {
        Args: Record<PropertyKey, never>
        Returns: {
          operation: string
          table_name: string
          policy_name: string
          definition: string
        }[]
      }
      log_rls_denial: {
        Args: {
          p_table_name: string
          p_operation: string
          p_error_message?: string
        }
        Returns: undefined
      }
      log_slow_query: {
        Args: {
          p_query_text: string
          p_execution_time_ms: number
          p_rows_returned?: number
        }
        Returns: undefined
      }
      log_user_activity: {
        Args: {
          p_metadata?: Json
          p_user_id: string
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
        }
        Returns: undefined
      }
      match_personal_thoughts: {
        Args: {
          query_embedding: string
          match_count?: number
          match_user_id?: string
        }
        Returns: {
          similarity: number
          id: string
          content: string
        }[]
      }
      populate_integration_data_from_existing: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resolve_entity: {
        Args: {
          p_integration_name: string
          p_user_id: string
          p_entity_type: string
          p_integration_id: string
          p_external_id: string
          p_entity_data: Json
        }
        Returns: string
      }
      scheduled_monitoring_cleanup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      test_company_access_control: {
        Args: Record<PropertyKey, never>
        Returns: {
          result: boolean
          test_name: string
        }[]
      }
      track_business_health_history: {
        Args: { p_user_id: string }
        Returns: Json
      }
      transfer_company_ownership: {
        Args: {
          new_owner_uuid: string
          company_uuid: string
          current_user_uuid: string
        }
        Returns: boolean
      }
      update_user_profile_safe: {
        Args: { user_id: string; updates: Json }
        Returns: {
          updated_at: string
          id: string
          email: string
          first_name: string
          last_name: string
          display_name: string
          role: string
        }[]
      }
      user_belongs_to_company: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
