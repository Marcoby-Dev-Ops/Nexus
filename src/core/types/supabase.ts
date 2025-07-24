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
          domain: string
          id: string
          kind: string
          meta: Json
          resolved_at: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          domain?: string
          id?: string
          kind?: string
          meta?: Json
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          domain?: string
          id?: string
          kind?: string
          meta?: Json
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
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
      business_profiles: {
        Row: {
          business_model: string | null
          company_name: string
          company_size: string | null
          competitive_advantages: string[] | null
          created_at: string | null
          current_clients: string[] | null
          financial_goals: string[] | null
          id: string
          ideal_client_profile: string[] | null
          industry: string | null
          mission_statement: string | null
          org_id: string
          pricing_strategy: string | null
          primary_services: string[] | null
          revenue_model: string | null
          service_delivery_methods: string[] | null
          strategic_objectives: string[] | null
          target_markets: string[] | null
          unique_value_proposition: string | null
          updated_at: string | null
        }
        Insert: {
          business_model?: string | null
          company_name: string
          company_size?: string | null
          competitive_advantages?: string[] | null
          created_at?: string | null
          current_clients?: string[] | null
          financial_goals?: string[] | null
          id?: string
          ideal_client_profile?: string[] | null
          industry?: string | null
          mission_statement?: string | null
          org_id: string
          pricing_strategy?: string | null
          primary_services?: string[] | null
          revenue_model?: string | null
          service_delivery_methods?: string[] | null
          strategic_objectives?: string[] | null
          target_markets?: string[] | null
          unique_value_proposition?: string | null
          updated_at?: string | null
        }
        Update: {
          business_model?: string | null
          company_name?: string
          company_size?: string | null
          competitive_advantages?: string[] | null
          created_at?: string | null
          current_clients?: string[] | null
          financial_goals?: string[] | null
          id?: string
          ideal_client_profile?: string[] | null
          industry?: string | null
          mission_statement?: string | null
          org_id?: string
          pricing_strategy?: string | null
          primary_services?: string[] | null
          revenue_model?: string | null
          service_delivery_methods?: string[] | null
          strategic_objectives?: string[] | null
          target_markets?: string[] | null
          unique_value_proposition?: string | null
          updated_at?: string | null
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
      company_analytics: {
        Row: {
          active_users: number | null
          avg_session_duration_minutes: number | null
          company_id: string
          compliance_score: number | null
          created_at: string | null
          departments_count: number | null
          inactive_users: number | null
          most_used_features: string[] | null
          security_score: number | null
          total_users: number | null
          updated_at: string | null
          user_engagement_score: number | null
        }
        Insert: {
          active_users?: number | null
          avg_session_duration_minutes?: number | null
          company_id: string
          compliance_score?: number | null
          created_at?: string | null
          departments_count?: number | null
          inactive_users?: number | null
          most_used_features?: string[] | null
          security_score?: number | null
          total_users?: number | null
          updated_at?: string | null
          user_engagement_score?: number | null
        }
        Update: {
          active_users?: number | null
          avg_session_duration_minutes?: number | null
          company_id?: string
          compliance_score?: number | null
          created_at?: string | null
          departments_count?: number | null
          inactive_users?: number | null
          most_used_features?: string[] | null
          security_score?: number | null
          total_users?: number | null
          updated_at?: string | null
          user_engagement_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_audit_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
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
          amount: number
          company_id: string
          created_at: string | null
          currency: string | null
          current_period_end: string
          current_period_start: string
          id: string
          next_billing_date: string | null
          payment_method: string | null
          plan_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          currency?: string | null
          current_period_end: string
          current_period_start: string
          id?: string
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id?: string
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
          completed_at: string | null
          created_at: string | null
          export_type: string
          file_url: string | null
          filters: Json | null
          format: string
          id: string
          requested_by: string
          status: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          export_type: string
          file_url?: string | null
          filters?: Json | null
          format: string
          id?: string
          requested_by: string
          status?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          export_type?: string
          file_url?: string | null
          filters?: Json | null
          format?: string
          id?: string
          requested_by?: string
          status?: string | null
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
      company_health: {
        Row: {
          company_id: string
          compliance_score: number | null
          created_at: string | null
          id: string
          last_assessment: string | null
          next_assessment: string | null
          overall_score: number | null
          recommendations: string[] | null
          security_score: number | null
          system_health_score: number | null
          updated_at: string | null
          user_engagement_score: number | null
        }
        Insert: {
          company_id: string
          compliance_score?: number | null
          created_at?: string | null
          id?: string
          last_assessment?: string | null
          next_assessment?: string | null
          overall_score?: number | null
          recommendations?: string[] | null
          security_score?: number | null
          system_health_score?: number | null
          updated_at?: string | null
          user_engagement_score?: number | null
        }
        Update: {
          company_id?: string
          compliance_score?: number | null
          created_at?: string | null
          id?: string
          last_assessment?: string | null
          next_assessment?: string | null
          overall_score?: number | null
          recommendations?: string[] | null
          security_score?: number | null
          system_health_score?: number | null
          updated_at?: string | null
          user_engagement_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_health_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_integration_data: {
        Row: {
          company_id: string
          created_at: string | null
          data: Json | null
          data_type: string
          id: string
          integration_name: string
          last_sync: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          data?: Json | null
          data_type: string
          id?: string
          integration_name: string
          last_sync?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          data?: Json | null
          data_type?: string
          id?: string
          integration_name?: string
          last_sync?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_integration_data_company_id_fkey"
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
          action_url: string | null
          company_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
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
      company_permissions: {
        Row: {
          action: string
          company_id: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_system_permission: boolean | null
          name: string
          resource: string
        }
        Insert: {
          action: string
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_permission?: boolean | null
          name: string
          resource: string
        }
        Update: {
          action?: string
          company_id?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_permission?: boolean | null
          name?: string
          resource?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_permissions_company_id_fkey"
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
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_generated: string | null
          name: string
          recipients: string[] | null
          schedule: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          name: string
          recipients?: string[] | null
          schedule?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
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
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          company_id: string
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          company_id?: string
          content?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          variables?: string[] | null
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
          company_id: string
          created_at: string | null
          feature: string
          id: string
          limit_count: number | null
          period: string
          period_end: string
          period_start: string
          usage_count: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          feature: string
          id?: string
          limit_count?: number | null
          period: string
          period_end: string
          period_start: string
          usage_count?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          feature?: string
          id?: string
          limit_count?: number | null
          period?: string
          period_end?: string
          period_start?: string
          usage_count?: number | null
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
      company_user_settings: {
        Row: {
          company_id: string
          created_at: string | null
          custom_settings: Json | null
          department_id: string | null
          permissions: string[] | null
          restrictions: string[] | null
          role_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          custom_settings?: Json | null
          department_id?: string | null
          permissions?: string[] | null
          restrictions?: string[] | null
          role_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          custom_settings?: Json | null
          department_id?: string | null
          permissions?: string[] | null
          restrictions?: string[] | null
          role_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_user_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_user_settings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_user_settings_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_workflows: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          steps?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json | null
          type?: string
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
      data_point_definitions: {
        Row: {
          business_value: string
          category: string
          created_at: string | null
          data_point_name: string
          data_point_type: string
          description: string | null
          endpoint_method: string
          endpoint_path: string
          id: string
          is_required: boolean | null
          refresh_frequency: string
          sample_value: Json | null
          updated_at: string | null
          user_integration_id: string
          validation_rules: Json | null
        }
        Insert: {
          business_value: string
          category: string
          created_at?: string | null
          data_point_name: string
          data_point_type: string
          description?: string | null
          endpoint_method: string
          endpoint_path: string
          id: string
          is_required?: boolean | null
          refresh_frequency: string
          sample_value?: Json | null
          updated_at?: string | null
          user_integration_id: string
          validation_rules?: Json | null
        }
        Update: {
          business_value?: string
          category?: string
          created_at?: string | null
          data_point_name?: string
          data_point_type?: string
          description?: string | null
          endpoint_method?: string
          endpoint_path?: string
          id?: string
          is_required?: boolean | null
          refresh_frequency?: string
          sample_value?: Json | null
          updated_at?: string | null
          user_integration_id?: string
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "data_point_definitions_user_integration_id_fkey"
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
          budget: number | null
          company_id: string
          created_at: string | null
          description: string | null
          goals: string[] | null
          headcount: number | null
          id: string
          manager_id: string | null
          name: string
          parent_department_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          company_id: string
          created_at?: string | null
          description?: string | null
          goals?: string[] | null
          headcount?: number | null
          id?: string
          manager_id?: string | null
          name: string
          parent_department_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          goals?: string[] | null
          headcount?: number | null
          id?: string
          manager_id?: string | null
          name?: string
          parent_department_id?: string | null
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
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string | null
          direction: string | null
          email_references: string[] | null
          external_id: string | null
          html_content: string | null
          id: string
          in_reply_to: string | null
          integration_id: string | null
          is_flagged: boolean | null
          is_important: boolean | null
          is_read: boolean | null
          labels: string[] | null
          message_id: string | null
          received_at: string | null
          recipient_email: string | null
          recipient_name: string | null
          sender_email: string | null
          sender_name: string | null
          status: string | null
          subject: string | null
          thread_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          email_references?: string[] | null
          external_id?: string | null
          html_content?: string | null
          id?: string
          in_reply_to?: string | null
          integration_id?: string | null
          is_flagged?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          labels?: string[] | null
          message_id?: string | null
          received_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string | null
          email_references?: string[] | null
          external_id?: string | null
          html_content?: string | null
          id?: string
          in_reply_to?: string | null
          integration_id?: string | null
          is_flagged?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          labels?: string[] | null
          message_id?: string | null
          received_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          sender_email?: string | null
          sender_name?: string | null
          status?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
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
      integration_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          processed_records: number | null
          started_at: string | null
          status: string
          sync_type: string
          user_integration_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_records?: number | null
          started_at?: string | null
          status: string
          sync_type: string
          user_integration_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          processed_records?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          user_integration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_user_integration_id_fkey"
            columns: ["user_integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          auth_type: string | null
          category: string | null
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          auth_type?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          auth_type?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      manual_contacts: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string
          id: string
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
          first_name: string
          id?: string
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
          first_name?: string
          id?: string
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
            foreignKeyName: "manual_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_setups: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          last_used: string | null
          secret: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          secret?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          secret?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          company_id: string | null
          contact_id: string | null
          content: string
          created_at: string | null
          deal_id: string | null
          external_id: string | null
          id: string
          integration_id: string | null
          metadata: Json | null
          tags: string[] | null
          task_id: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          content: string
          created_at?: string | null
          deal_id?: string | null
          external_id?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          tags?: string[] | null
          task_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          content?: string
          created_at?: string | null
          deal_id?: string | null
          external_id?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          tags?: string[] | null
          task_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_deals: {
        Row: {
          amount: number | null
          close_date: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
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
          id?: string
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
          id?: string
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
            foreignKeyName: "sales_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          external_id: string | null
          id: string
          integration_id: string | null
          metadata: Json | null
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          external_id?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          external_id?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          ai_clarification_data: Json | null
          ai_insights: Json | null
          category: string | null
          company_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          creation_date: string | null
          department: string | null
          embedding: string | null
          estimated_effort: string | null
          id: string
          impact: string | null
          initiative: boolean | null
          interaction_method: string | null
          last_updated: string | null
          main_sub_categories: string[] | null
          parent_idea_id: string | null
          personal_or_professional: string | null
          priority: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
          workflow_stage: string | null
        }
        Insert: {
          ai_clarification_data?: Json | null
          ai_insights?: Json | null
          category?: string | null
          company_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          creation_date?: string | null
          department?: string | null
          embedding?: string | null
          estimated_effort?: string | null
          id?: string
          impact?: string | null
          initiative?: boolean | null
          interaction_method?: string | null
          last_updated?: string | null
          main_sub_categories?: string[] | null
          parent_idea_id?: string | null
          personal_or_professional?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
          workflow_stage?: string | null
        }
        Update: {
          ai_clarification_data?: Json | null
          ai_insights?: Json | null
          category?: string | null
          company_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          creation_date?: string | null
          department?: string | null
          embedding?: string | null
          estimated_effort?: string | null
          id?: string
          impact?: string | null
          initiative?: boolean | null
          interaction_method?: string | null
          last_updated?: string | null
          main_sub_categories?: string[] | null
          parent_idea_id?: string | null
          personal_or_professional?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
          workflow_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thoughts_parent_idea_id_fkey"
            columns: ["parent_idea_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          external_id: string | null
          id: string
          integration_id: string | null
          metadata: Json | null
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
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
          ip_address?: string | null
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
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          average_session_duration_minutes: number | null
          created_at: string | null
          engagement_level: string | null
          last_login: string | null
          login_count: number | null
          most_used_features: string[] | null
          productivity_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_session_duration_minutes?: number | null
          created_at?: string | null
          engagement_level?: string | null
          last_login?: string | null
          login_count?: number | null
          most_used_features?: string[] | null
          productivity_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_session_duration_minutes?: number | null
          created_at?: string | null
          engagement_level?: string | null
          last_login?: string | null
          login_count?: number | null
          most_used_features?: string[] | null
          productivity_score?: number | null
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
          created_at: string | null
          credentials: Json | null
          error_message: string | null
          id: string
          integration_id: string
          integration_name: string
          integration_type: string
          last_sync_at: string | null
          metadata: Json | null
          settings: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          integration_id: string
          integration_name: string
          integration_type: string
          last_sync_at?: string | null
          metadata?: Json | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          integration_id?: string
          integration_name?: string
          integration_type?: string
          last_sync_at?: string | null
          metadata?: Json | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_flows: {
        Row: {
          completed_at: string | null
          completed_steps: number | null
          current_step: string | null
          id: string
          started_at: string | null
          total_steps: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: number | null
          current_step?: string | null
          id?: string
          started_at?: string | null
          total_steps?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: number | null
          current_step?: string | null
          id?: string
          started_at?: string | null
          total_steps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_steps: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data: Json | null
          id: string
          status: string | null
          step_name: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          status?: string | null
          step_name: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          status?: string | null
          step_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accessibility: Json | null
          created_at: string | null
          integrations: Json | null
          notifications: Json | null
          privacy: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accessibility?: Json | null
          created_at?: string | null
          integrations?: Json | null
          notifications?: Json | null
          privacy?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accessibility?: Json | null
          created_at?: string | null
          integrations?: Json | null
          notifications?: Json | null
          privacy?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          bio: string | null
          business_email: string | null
          certifications: string[] | null
          company_id: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          direct_reports: string[] | null
          display_name: string | null
          email: string | null
          emergency_contact: Json | null
          employee_id: string | null
          first_name: string | null
          full_name: string | null
          github_url: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          languages: Json | null
          last_login: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          manager_id: string | null
          mobile: string | null
          onboarding_completed: boolean | null
          personal_email: string | null
          phone: string | null
          preferences: Json | null
          profile_completion_percentage: number | null
          role: string | null
          settings: Json | null
          skills: string[] | null
          status: string | null
          timezone: string | null
          twitter_url: string | null
          updated_at: string | null
          work_location: string | null
          work_phone: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          bio?: string | null
          business_email?: string | null
          certifications?: string[] | null
          company_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          direct_reports?: string[] | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_id?: string | null
          first_name?: string | null
          full_name?: string | null
          github_url?: string | null
          hire_date?: string | null
          id: string
          job_title?: string | null
          languages?: Json | null
          last_login?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          manager_id?: string | null
          mobile?: string | null
          onboarding_completed?: boolean | null
          personal_email?: string | null
          phone?: string | null
          preferences?: Json | null
          profile_completion_percentage?: number | null
          role?: string | null
          settings?: Json | null
          skills?: string[] | null
          status?: string | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          work_location?: string | null
          work_phone?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          bio?: string | null
          business_email?: string | null
          certifications?: string[] | null
          company_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          direct_reports?: string[] | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_id?: string | null
          first_name?: string | null
          full_name?: string | null
          github_url?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          languages?: Json | null
          last_login?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          manager_id?: string | null
          mobile?: string | null
          onboarding_completed?: boolean | null
          personal_email?: string | null
          phone?: string | null
          preferences?: Json | null
          profile_completion_percentage?: number | null
          role?: string | null
          settings?: Json | null
          skills?: string[] | null
          status?: string | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          work_location?: string | null
          work_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_security_settings: {
        Row: {
          created_at: string | null
          login_notifications: boolean | null
          max_concurrent_sessions: number | null
          password_policy: Json | null
          require_mfa: boolean | null
          session_timeout_minutes: number | null
          suspicious_activity_alerts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          login_notifications?: boolean | null
          max_concurrent_sessions?: number | null
          password_policy?: Json | null
          require_mfa?: boolean | null
          session_timeout_minutes?: number | null
          suspicious_activity_alerts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          login_notifications?: boolean | null
          max_concurrent_sessions?: number | null
          password_policy?: Json | null
          require_mfa?: boolean | null
          session_timeout_minutes?: number | null
          suspicious_activity_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          location: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          location?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          location?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      var_leads: {
        Row: {
          company_id: string | null
          company_name: string | null
          contact_name: string
          created_at: string | null
          email: string
          external_id: string | null
          id: string
          integration_id: string | null
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
          contact_name: string
          created_at?: string | null
          email: string
          external_id?: string | null
          id?: string
          integration_id?: string | null
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
          contact_name?: string
          created_at?: string | null
          email?: string
          external_id?: string | null
          id?: string
          integration_id?: string | null
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
            foreignKeyName: "var_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "var_leads_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      data_point_mapping: {
        Row: {
          business_value: string | null
          category: string | null
          data_point_definition_id: string | null
          data_point_name: string | null
          data_point_type: string | null
          data_record_count: number | null
          description: string | null
          integration_name: string | null
          integration_status: string | null
          is_required: boolean | null
          last_data_update: string | null
          refresh_frequency: string | null
          sample_value: Json | null
          user_integration_id: string | null
          validation_rules: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "data_point_definitions_user_integration_id_fkey"
            columns: ["user_integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_get_user_profile: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          email: string
          full_name: string
          company_id: string
        }[]
      }
      complete_user_onboarding: {
        Args: { user_uuid: string; onboarding_data?: Json }
        Returns: boolean
      }
      debug_oauth_access: {
        Args: { user_uuid: string }
        Returns: Json
      }
      fix_users_without_companies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_integration_analytics: {
        Args: { user_uuid: string }
        Returns: {
          total_integrations: number
          active_integrations: number
          total_data_points: number
          last_sync: string
          avg_sync_duration: number
        }[]
      }
      match_personal_thoughts: {
        Args: {
          query_embedding: string
          match_count?: number
          match_user_id?: string
        }
        Returns: {
          id: string
          content: string
          similarity: number
        }[]
      }
      remove_oauth_tokens: {
        Args: { user_uuid: string; provider_slug: string }
        Returns: undefined
      }
      test_oauth_access: {
        Args: { user_uuid: string } | { user_uuid: string }
        Returns: Json
      }
      test_user_authentication: {
        Args: { user_uuid: string }
        Returns: {
          user_id: string
          email: string
          has_profile: boolean
          has_integrations: boolean
          can_access_profile: boolean
          can_access_integrations: boolean
        }[]
      }
      user_needs_onboarding: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      validate_user_session: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_authenticated: boolean
          user_id: string
          email: string
          session_valid: boolean
        }[]
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
