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
      Account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
          userProfileId: string | null
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
          userProfileId?: string | null
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
          userProfileId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Account_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "action_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      activities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          occurred_at: string | null
          source: string
          source_id: string | null
          status: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          source: string
          source_id?: string | null
          status?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          source?: string
          source_id?: string | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_ab_test_results: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          test_id: string
          timestamp: string
          user_id: string
          variant: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          test_id: string
          timestamp?: string
          user_id: string
          variant: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          test_id?: string
          timestamp?: string
          user_id?: string
          variant?: string
        }
        Relationships: []
      }
      ai_action_card_events: {
        Row: {
          action_card_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_card_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_card_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_card_events_action_card_id_fkey"
            columns: ["action_card_id"]
            isOneToOne: false
            referencedRelation: "ai_action_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_action_card_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          slug: string
          template_data: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          slug: string
          template_data?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          slug?: string
          template_data?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_action_cards: {
        Row: {
          actions: Json | null
          conversation_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          conversation_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          conversation_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_cards_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          created_at: string | null
          department: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_assessment_questions: {
        Row: {
          assessment_category: string
          created_at: string | null
          id: number
          is_active: boolean | null
          question_text: string
          required_fields: Json | null
          updated_at: string | null
        }
        Insert: {
          assessment_category: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          question_text: string
          required_fields?: Json | null
          updated_at?: string | null
        }
        Update: {
          assessment_category?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          question_text?: string
          required_fields?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_assessments: {
        Row: {
          answers: Json
          company_id: string
          conversation_context: string
          created_at: string
          id: string
          processed_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers: Json
          company_id: string
          conversation_context: string
          created_at?: string
          id?: string
          processed_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          company_id?: string
          conversation_context?: string
          created_at?: string
          id?: string
          processed_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: number
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: number
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: number
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_billing_records: {
        Row: {
          additional_fees: Json
          base_amount: number
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          id: string
          organization_id: string | null
          overage_charges: number
          payment_due: string
          plan_id: string
          status: string
          token_usage: Json
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_fees?: Json
          base_amount?: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          overage_charges?: number
          payment_due: string
          plan_id: string
          status?: string
          token_usage?: Json
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_fees?: Json
          base_amount?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          overage_charges?: number
          payment_due?: string
          plan_id?: string
          status?: string
          token_usage?: Json
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_billing_records_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_budget_tracking: {
        Row: {
          created_at: string | null
          current_spend: number
          id: string
          month_year: string
          request_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_spend?: number
          id?: string
          month_year: string
          request_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_spend?: number
          id?: string
          month_year?: string
          request_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_business_profiles: {
        Row: {
          active_clients: number | null
          average_deal_size: number | null
          business_model: string | null
          company_name: string
          created_at: string | null
          current_challenges: string[] | null
          id: string
          ideal_customer_profile: string | null
          industry: string | null
          monthly_revenue: number | null
          org_id: string | null
          primary_services: string[] | null
          short_term_goals: string[] | null
          target_markets: string[] | null
          total_clients: number | null
          updated_at: string | null
          user_id: string | null
          value_proposition: string | null
        }
        Insert: {
          active_clients?: number | null
          average_deal_size?: number | null
          business_model?: string | null
          company_name: string
          created_at?: string | null
          current_challenges?: string[] | null
          id?: string
          ideal_customer_profile?: string | null
          industry?: string | null
          monthly_revenue?: number | null
          org_id?: string | null
          primary_services?: string[] | null
          short_term_goals?: string[] | null
          target_markets?: string[] | null
          total_clients?: number | null
          updated_at?: string | null
          user_id?: string | null
          value_proposition?: string | null
        }
        Update: {
          active_clients?: number | null
          average_deal_size?: number | null
          business_model?: string | null
          company_name?: string
          created_at?: string | null
          current_challenges?: string[] | null
          id?: string
          ideal_customer_profile?: string | null
          industry?: string | null
          monthly_revenue?: number | null
          org_id?: string | null
          primary_services?: string[] | null
          short_term_goals?: string[] | null
          target_markets?: string[] | null
          total_clients?: number | null
          updated_at?: string | null
          user_id?: string | null
          value_proposition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_business_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_client_intelligence_alerts: {
        Row: {
          alert_type: string | null
          assigned_to: string | null
          client_profile_id: string | null
          confidence_score: number | null
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          potential_value: number | null
          priority: string | null
          recommended_actions: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          title: string
          urgency_score: number | null
          user_id: string | null
        }
        Insert: {
          alert_type?: string | null
          assigned_to?: string | null
          client_profile_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          potential_value?: number | null
          priority?: string | null
          recommended_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
          urgency_score?: number | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string | null
          assigned_to?: string | null
          client_profile_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          potential_value?: number | null
          priority?: string | null
          recommended_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          urgency_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_client_intelligence_alerts_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_unified_client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_client_interactions: {
        Row: {
          ai_insights: Json | null
          business_value: number | null
          client_profile_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          external_id: string | null
          id: string
          importance_score: number | null
          initiated_by: string | null
          interaction_data: Json | null
          interaction_source: string
          interaction_timestamp: string
          interaction_type: string
          next_action: string | null
          outcome: string | null
          participants: Json | null
          sentiment_score: number | null
          title: string | null
        }
        Insert: {
          ai_insights?: Json | null
          business_value?: number | null
          client_profile_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_id?: string | null
          id?: string
          importance_score?: number | null
          initiated_by?: string | null
          interaction_data?: Json | null
          interaction_source: string
          interaction_timestamp: string
          interaction_type: string
          next_action?: string | null
          outcome?: string | null
          participants?: Json | null
          sentiment_score?: number | null
          title?: string | null
        }
        Update: {
          ai_insights?: Json | null
          business_value?: number | null
          client_profile_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_id?: string | null
          id?: string
          importance_score?: number | null
          initiated_by?: string | null
          interaction_data?: Json | null
          interaction_source?: string
          interaction_timestamp?: string
          interaction_type?: string
          next_action?: string | null
          outcome?: string | null
          participants?: Json | null
          sentiment_score?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_client_interactions_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_unified_client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_company_profiles: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          profile_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          profile_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          profile_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          summary_chunks: Json[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          summary_chunks?: Json[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          summary_chunks?: Json[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_cost_allocations: {
        Row: {
          agent_id: string
          billing_category: string
          cost: number
          cost_center: string | null
          created_at: string | null
          department_id: string | null
          id: string
          model: string
          organization_id: string | null
          project_id: string | null
          provider: string
          timestamp: string
          tokens_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          billing_category: string
          cost?: number
          cost_center?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          model: string
          organization_id?: string | null
          project_id?: string | null
          provider: string
          timestamp?: string
          tokens_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          billing_category?: string
          cost?: number
          cost_center?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          model?: string
          organization_id?: string | null
          project_id?: string | null
          provider?: string
          timestamp?: string
          tokens_used?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_document_processing_queue: {
        Row: {
          company_id: string | null
          created_at: string | null
          document_id: string
          document_name: string
          document_type: string | null
          document_url: string | null
          error_details: Json | null
          file_size: number | null
          id: string
          max_retries: number | null
          priority: number | null
          processing_completed_at: string | null
          processing_results: Json | null
          processing_started_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          status: string | null
          updated_at: string | null
          upload_context: Json | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          document_id: string
          document_name: string
          document_type?: string | null
          document_url?: string | null
          error_details?: Json | null
          file_size?: number | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          processing_completed_at?: string | null
          processing_results?: Json | null
          processing_started_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          upload_context?: Json | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          document_id?: string
          document_name?: string
          document_type?: string | null
          document_url?: string | null
          error_details?: Json | null
          file_size?: number | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          processing_completed_at?: string | null
          processing_results?: Json | null
          processing_started_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          upload_context?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_document_processing_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_document_processing_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_document_processing_queue_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_email_accounts: {
        Row: {
          account_data: Json | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_data?: Json | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_data?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_embedding_cache: {
        Row: {
          checksum: string
          content: string | null
          created_at: string | null
          embedding: string
          id: number
        }
        Insert: {
          checksum: string
          content?: string | null
          created_at?: string | null
          embedding: string
          id?: number
        }
        Update: {
          checksum?: string
          content?: string | null
          created_at?: string | null
          embedding?: string
          id?: number
        }
        Relationships: []
      }
      ai_improvement_recommendations: {
        Row: {
          based_on_data: string[]
          confidence: number
          created_at: string
          description: string
          estimated_effort: string
          expected_impact: Json
          id: string
          implementation_steps: string[]
          potential_savings: number | null
          priority: string
          risk_level: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          based_on_data: string[]
          confidence: number
          created_at?: string
          description: string
          estimated_effort: string
          expected_impact: Json
          id?: string
          implementation_steps: string[]
          potential_savings?: number | null
          priority: string
          risk_level: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          based_on_data?: string[]
          confidence?: number
          created_at?: string
          description?: string
          estimated_effort?: string
          expected_impact?: Json
          id?: string
          implementation_steps?: string[]
          potential_savings?: number | null
          priority?: string
          risk_level?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_inbox_folders: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          item_count: number | null
          name: string
          parent_folder_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          item_count?: number | null
          name: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          item_count?: number | null
          name?: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_inbox_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ai_inbox_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "ai_inbox_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_inbox_item_folders: {
        Row: {
          added_at: string | null
          folder_id: string
          inbox_item_id: string
        }
        Insert: {
          added_at?: string | null
          folder_id: string
          inbox_item_id: string
        }
        Update: {
          added_at?: string | null
          folder_id?: string
          inbox_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_inbox_item_folders_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "ai_inbox_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_item_folders_inbox_item_id_fkey"
            columns: ["inbox_item_id"]
            isOneToOne: false
            referencedRelation: "ai_inbox_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_item_folders_inbox_item_id_fkey"
            columns: ["inbox_item_id"]
            isOneToOne: false
            referencedRelation: "ai_inbox_items_detailed"
            referencedColumns: ["id"]
          },
        ]
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
          recipient_email: string
          sender: string | null
          sender_email: string
          sender_name: string | null
          snooze_until: string | null
          source_type: string | null
          status: string | null
          subject: string
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
          recipient_email: string
          sender?: string | null
          sender_email: string
          sender_name?: string | null
          snooze_until?: string | null
          source_type?: string | null
          status?: string | null
          subject: string
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
          recipient_email?: string
          sender?: string | null
          sender_email?: string
          sender_name?: string | null
          snooze_until?: string | null
          source_type?: string | null
          status?: string | null
          subject?: string
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
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ai_inbox_items_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
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
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          insight_type: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          insight_type: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          insight_type?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_integrations: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          org_id: string
          provider: string
          refresh_token: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          org_id: string
          provider: string
          refresh_token?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          org_id?: string
          provider?: string
          refresh_token?: string | null
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
      ai_interactions: {
        Row: {
          ai_response: string | null
          company_id: string | null
          context_data: Json | null
          created_at: string | null
          id: string
          interaction_type: string | null
          prompt_text: string | null
          thought_id: string | null
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          company_id?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          prompt_text?: string | null
          thought_id?: string | null
          user_id: string
        }
        Update: {
          ai_response?: string | null
          company_id?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          prompt_text?: string | null
          thought_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ai_interactions_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "workspace_action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_analytics: {
        Row: {
          department: string | null
          event_type: string | null
          id: string
          knowledge_card_id: string | null
          metadata: Json | null
          query_text: string | null
          recorded_at: string | null
          relevance_score: number | null
          session_id: string | null
          time_to_resolution: number | null
          user_id: string | null
          user_satisfaction: number | null
        }
        Insert: {
          department?: string | null
          event_type?: string | null
          id?: string
          knowledge_card_id?: string | null
          metadata?: Json | null
          query_text?: string | null
          recorded_at?: string | null
          relevance_score?: number | null
          session_id?: string | null
          time_to_resolution?: number | null
          user_id?: string | null
          user_satisfaction?: number | null
        }
        Update: {
          department?: string | null
          event_type?: string | null
          id?: string
          knowledge_card_id?: string | null
          metadata?: Json | null
          query_text?: string | null
          recorded_at?: string | null
          relevance_score?: number | null
          session_id?: string | null
          time_to_resolution?: number | null
          user_id?: string | null
          user_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_analytics_knowledge_card_id_fkey"
            columns: ["knowledge_card_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_cards: {
        Row: {
          access_count: number | null
          action_items: Json | null
          company_id: string | null
          confidence: number | null
          created_at: string | null
          department: string | null
          document_id: string
          document_type: string | null
          id: string
          insights: Json | null
          is_verified: boolean | null
          last_accessed: string | null
          metadata: Json | null
          priority: string | null
          summary: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
          verification_source: string | null
        }
        Insert: {
          access_count?: number | null
          action_items?: Json | null
          company_id?: string | null
          confidence?: number | null
          created_at?: string | null
          department?: string | null
          document_id: string
          document_type?: string | null
          id?: string
          insights?: Json | null
          is_verified?: boolean | null
          last_accessed?: string | null
          metadata?: Json | null
          priority?: string | null
          summary: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          verification_source?: string | null
        }
        Update: {
          access_count?: number | null
          action_items?: Json | null
          company_id?: string | null
          confidence?: number | null
          created_at?: string | null
          department?: string | null
          document_id?: string
          document_type?: string | null
          id?: string
          insights?: Json | null
          is_verified?: boolean | null
          last_accessed?: string | null
          metadata?: Json | null
          priority?: string | null
          summary?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          verification_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_cards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_knowledge_gaps: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          department: string | null
          gap_description: string
          id: string
          identified_by: string | null
          last_queried: string | null
          priority_score: number | null
          query_frequency: number | null
          query_pattern: string
          resolution_notes: string | null
          resolved_at: string | null
          source_queries: Json | null
          status: string | null
          topic_area: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          department?: string | null
          gap_description: string
          id?: string
          identified_by?: string | null
          last_queried?: string | null
          priority_score?: number | null
          query_frequency?: number | null
          query_pattern: string
          resolution_notes?: string | null
          resolved_at?: string | null
          source_queries?: Json | null
          status?: string | null
          topic_area?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          department?: string | null
          gap_description?: string
          id?: string
          identified_by?: string | null
          last_queried?: string | null
          priority_score?: number | null
          query_frequency?: number | null
          query_pattern?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          source_queries?: Json | null
          status?: string | null
          topic_area?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_knowledge_relationships: {
        Row: {
          confidence: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_auto_generated: boolean | null
          relationship_type: string | null
          source_card_id: string | null
          strength: number | null
          target_card_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_auto_generated?: boolean | null
          relationship_type?: string | null
          source_card_id?: string | null
          strength?: number | null
          target_card_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_auto_generated?: boolean | null
          relationship_type?: string | null
          source_card_id?: string | null
          strength?: number | null
          target_card_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_relationships_source_card_id_fkey"
            columns: ["source_card_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_relationships_target_card_id_fkey"
            columns: ["target_card_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_kpi_snapshots: {
        Row: {
          captured_at: string
          company_id: string | null
          department_id: string
          id: string
          kpi_id: string | null
          kpi_key: string | null
          metadata: Json | null
          org_id: string
          source: string | null
          user_id: string | null
          value: Json
        }
        Insert: {
          captured_at?: string
          company_id?: string | null
          department_id: string
          id?: string
          kpi_id?: string | null
          kpi_key?: string | null
          metadata?: Json | null
          org_id: string
          source?: string | null
          user_id?: string | null
          value: Json
        }
        Update: {
          captured_at?: string
          company_id?: string | null
          department_id?: string
          id?: string
          kpi_id?: string | null
          kpi_key?: string | null
          metadata?: Json | null
          org_id?: string
          source?: string | null
          user_id?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fk_ai_kpi_snapshots_kpi"
            columns: ["org_id", "kpi_key"]
            isOneToOne: false
            referencedRelation: "ai_ops_kpis"
            referencedColumns: ["org_id", "key"]
          },
        ]
      }
      ai_learning_events: {
        Row: {
          context: Json | null
          created_at: string | null
          data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_llm_registry: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          metadata: Json | null
          model_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          metadata?: Json | null
          model_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          metadata?: Json | null
          model_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_llm_registry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_llm_registry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_llm_registry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_message_feedback: {
        Row: {
          agent_id: string | null
          comment: string | null
          conversation_id: string | null
          created_at: string | null
          feedback_category: string | null
          follow_up_needed: boolean | null
          id: string
          improvement_suggestion: string | null
          message_id: string
          rating: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          comment?: string | null
          conversation_id?: string | null
          created_at?: string | null
          feedback_category?: string | null
          follow_up_needed?: boolean | null
          id?: string
          improvement_suggestion?: string | null
          message_id: string
          rating: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          comment?: string | null
          conversation_id?: string | null
          created_at?: string | null
          feedback_category?: string | null
          follow_up_needed?: boolean | null
          id?: string
          improvement_suggestion?: string | null
          message_id?: string
          rating?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_message_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
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
      ai_metrics_daily: {
        Row: {
          actions: number
          chat_messages: number
          created_at: string
          date: string
          user_id: string
        }
        Insert: {
          actions?: number
          chat_messages?: number
          created_at?: string
          date: string
          user_id: string
        }
        Update: {
          actions?: number
          chat_messages?: number
          created_at?: string
          date?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_model_performance: {
        Row: {
          average_cost: number
          average_latency: number
          created_at: string
          error_count: number
          id: string
          last_used: string | null
          model: string
          provider: string
          success_rate: number
          total_usage: number
          trend: string | null
          updated_at: string
        }
        Insert: {
          average_cost?: number
          average_latency?: number
          created_at?: string
          error_count?: number
          id?: string
          last_used?: string | null
          model: string
          provider: string
          success_rate?: number
          total_usage?: number
          trend?: string | null
          updated_at?: string
        }
        Update: {
          average_cost?: number
          average_latency?: number
          created_at?: string
          error_count?: number
          id?: string
          last_used?: string | null
          model?: string
          provider?: string
          success_rate?: number
          total_usage?: number
          trend?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_model_usage: {
        Row: {
          cost: number
          created_at: string | null
          id: string
          model: string
          provider: string
          timestamp: string
          tokens_used: number
          user_id: string | null
        }
        Insert: {
          cost?: number
          created_at?: string | null
          id?: string
          model: string
          provider: string
          timestamp?: string
          tokens_used?: number
          user_id?: string | null
        }
        Update: {
          cost?: number
          created_at?: string | null
          id?: string
          model?: string
          provider?: string
          timestamp?: string
          tokens_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          model_name: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          model_name: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          model_name?: string
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_operations_docs: {
        Row: {
          chunk: string
          embedding: string
          id: string
          org_id: string | null
          source: string
        }
        Insert: {
          chunk: string
          embedding: string
          id?: string
          org_id?: string | null
          source: string
        }
        Update: {
          chunk?: string
          embedding?: string
          id?: string
          org_id?: string | null
          source?: string
        }
        Relationships: []
      }
      ai_ops_kpis: {
        Row: {
          created_at: string | null
          key: string
          label: string
          org_id: string
          target_operator: string
          target_value: number | null
          units: string
          updated_at: string | null
          weight: number
        }
        Insert: {
          created_at?: string | null
          key: string
          label: string
          org_id: string
          target_operator?: string
          target_value?: number | null
          units: string
          updated_at?: string | null
          weight: number
        }
        Update: {
          created_at?: string | null
          key?: string
          label?: string
          org_id?: string
          target_operator?: string
          target_value?: number | null
          units?: string
          updated_at?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_ops_kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_ops_kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_ops_kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_optimization_suggestions: {
        Row: {
          applied_at: string | null
          created_at: string
          description: string
          id: string
          implementation_effort: string | null
          is_active: boolean
          potential_savings: number | null
          priority: string
          recommendation: string
          suggestion_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          description: string
          id?: string
          implementation_effort?: string | null
          is_active?: boolean
          potential_savings?: number | null
          priority: string
          recommendation: string
          suggestion_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          description?: string
          id?: string
          implementation_effort?: string | null
          is_active?: boolean
          potential_savings?: number | null
          priority?: string
          recommendation?: string
          suggestion_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_passkey_challenges: {
        Row: {
          challenge: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_passkeys: {
        Row: {
          counter: number | null
          created_at: string | null
          credential_id: string
          device_type: string | null
          friendly_name: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number | null
          created_at?: string | null
          credential_id: string
          device_type?: string | null
          friendly_name?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          device_type?: string | null
          friendly_name?: string | null
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_performance_metrics: {
        Row: {
          agent_id: string | null
          change_percent: number
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          model: string | null
          previous_value: number | null
          provider: string | null
          timeframe: string
          timestamp: string
          trend: string
        }
        Insert: {
          agent_id?: string | null
          change_percent?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          model?: string | null
          previous_value?: number | null
          provider?: string | null
          timeframe: string
          timestamp?: string
          trend: string
        }
        Update: {
          agent_id?: string | null
          change_percent?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          model?: string | null
          previous_value?: number | null
          provider?: string | null
          timeframe?: string
          timestamp?: string
          trend?: string
        }
        Relationships: []
      }
      ai_personal_thought_vectors: {
        Row: {
          content: string
          content_embedding: string
          created_at: string | null
          id: string
          metadata: Json | null
          thought_id: string
        }
        Insert: {
          content: string
          content_embedding: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          thought_id: string
        }
        Update: {
          content?: string
          content_embedding?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          thought_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_personal_thought_vectors_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "personal_memory_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_personal_thought_vectors_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "personal_thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_quality_assessments: {
        Row: {
          accuracy_score: number
          agent_id: string
          assessment_type: string
          clarity_score: number
          completeness_score: number
          conversation_id: string
          created_at: string
          flags: string[] | null
          helpfulness_score: number
          id: string
          improvements: string[] | null
          message_id: string
          model_used: string
          overall_score: number
          relevance_score: number
          timestamp: string
        }
        Insert: {
          accuracy_score: number
          agent_id: string
          assessment_type: string
          clarity_score: number
          completeness_score: number
          conversation_id: string
          created_at?: string
          flags?: string[] | null
          helpfulness_score: number
          id?: string
          improvements?: string[] | null
          message_id: string
          model_used: string
          overall_score: number
          relevance_score: number
          timestamp?: string
        }
        Update: {
          accuracy_score?: number
          agent_id?: string
          assessment_type?: string
          clarity_score?: number
          completeness_score?: number
          conversation_id?: string
          created_at?: string
          flags?: string[] | null
          helpfulness_score?: number
          id?: string
          improvements?: string[] | null
          message_id?: string
          model_used?: string
          overall_score?: number
          relevance_score?: number
          timestamp?: string
        }
        Relationships: []
      }
      ai_revenue_metrics: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          source: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_sales_metrics: {
        Row: {
          created_at: string | null
          deal_value: number | null
          id: string
          source: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deal_value?: number | null
          id?: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deal_value?: number | null
          id?: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_subscription_metrics: {
        Row: {
          created_at: string | null
          id: string
          monthly_value: number | null
          plan_name: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_value?: number | null
          plan_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_value?: number | null
          plan_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_success_outcomes: {
        Row: {
          completion_date: string | null
          conversation_id: string | null
          created_at: string | null
          follow_up_date: string | null
          id: string
          outcome_description: string | null
          outcome_type: string
          recommendation_id: string | null
          revenue_impact_cents: number | null
          satisfaction_score: number | null
          success_status: string
          time_saved_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_date?: string | null
          conversation_id?: string | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          outcome_description?: string | null
          outcome_type: string
          recommendation_id?: string | null
          revenue_impact_cents?: number | null
          satisfaction_score?: number | null
          success_status: string
          time_saved_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_date?: string | null
          conversation_id?: string | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          outcome_description?: string | null
          outcome_type?: string
          recommendation_id?: string | null
          revenue_impact_cents?: number | null
          satisfaction_score?: number | null
          success_status?: string
          time_saved_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_success_outcomes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_unified_client_profiles: {
        Row: {
          accuracy_confidence: number | null
          client_id: string
          company_id: string | null
          company_size_estimate: string | null
          completeness_score: number | null
          created_at: string | null
          deal_stage: string | null
          engagement_score: number | null
          enrichment_metadata: Json | null
          estimated_value: number | null
          id: string
          industry_classification: string | null
          last_enrichment_at: string | null
          primary_source: string | null
          profile_data: Json
          relationship_strength: string | null
          search_vector: unknown | null
          source_integrations: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accuracy_confidence?: number | null
          client_id: string
          company_id?: string | null
          company_size_estimate?: string | null
          completeness_score?: number | null
          created_at?: string | null
          deal_stage?: string | null
          engagement_score?: number | null
          enrichment_metadata?: Json | null
          estimated_value?: number | null
          id?: string
          industry_classification?: string | null
          last_enrichment_at?: string | null
          primary_source?: string | null
          profile_data?: Json
          relationship_strength?: string | null
          search_vector?: unknown | null
          source_integrations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accuracy_confidence?: number | null
          client_id?: string
          company_id?: string | null
          company_size_estimate?: string | null
          completeness_score?: number | null
          created_at?: string | null
          deal_stage?: string | null
          engagement_score?: number | null
          enrichment_metadata?: Json | null
          estimated_value?: number | null
          id?: string
          industry_classification?: string | null
          last_enrichment_at?: string | null
          primary_source?: string | null
          profile_data?: Json
          relationship_strength?: string | null
          search_vector?: unknown | null
          source_integrations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_unified_client_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_unified_client_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_unified_client_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_user_activity: {
        Row: {
          activity_type: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          pinned: boolean | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pinned?: boolean | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pinned?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_user_feedback: {
        Row: {
          agent_id: string
          comment: string | null
          conversation_id: string
          created_at: string
          feedback_type: string
          id: string
          message_id: string
          model_used: string
          provider: string
          rating: number
          timestamp: string
          user_id: string
        }
        Insert: {
          agent_id: string
          comment?: string | null
          conversation_id: string
          created_at?: string
          feedback_type: string
          id?: string
          message_id: string
          model_used: string
          provider: string
          rating: number
          timestamp?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          comment?: string | null
          conversation_id?: string
          created_at?: string
          feedback_type?: string
          id?: string
          message_id?: string
          model_used?: string
          provider?: string
          rating?: number
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_vector_documents: {
        Row: {
          content: string
          content_embedding: string
          created_at: string | null
          document_id: string
          id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          content_embedding: string
          created_at?: string | null
          document_id: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_embedding?: string
          created_at?: string | null
          document_id?: string
          id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      AIModel: {
        Row: {
          description: string | null
          input_cost: number | null
          name: string
          output_cost: number | null
          provider: string | null
        }
        Insert: {
          description?: string | null
          input_cost?: number | null
          name: string
          output_cost?: number | null
          provider?: string | null
        }
        Update: {
          description?: string | null
          input_cost?: number | null
          name?: string
          output_cost?: number | null
          provider?: string | null
        }
        Relationships: []
      }
      analytics: {
        Row: {
          created_at: string | null
          goal_id: string | null
          id: string
          metric_name: string
          metric_value: number
          period_end: string | null
          period_start: string | null
          time_period: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id?: string | null
          id?: string
          metric_name: string
          metric_value: number
          period_end?: string | null
          period_start?: string | null
          time_period: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          period_end?: string | null
          period_start?: string | null
          time_period?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "business_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "manual_goal_progress_view"
            referencedColumns: ["goal_id"]
          },
        ]
      }
      assessment_action_items: {
        Row: {
          action_type: string
          assessment_id: string
          assigned_to: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          priority: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          assessment_id: string
          assigned_to?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          priority: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          assessment_id?: string
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          priority?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_action_items_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "goal_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      AssessmentCategory: {
        Row: {
          goal: string
          id: string
          name: string
          weight: number
        }
        Insert: {
          goal: string
          id: string
          name: string
          weight: number
        }
        Update: {
          goal?: string
          id?: string
          name?: string
          weight?: number
        }
        Relationships: []
      }
      AssessmentCategoryScore: {
        Row: {
          calculated_at: string
          category_id: string
          company_id: string
          id: string
          score: number
        }
        Insert: {
          calculated_at: string
          category_id: string
          company_id: string
          id: string
          score: number
        }
        Update: {
          calculated_at?: string
          category_id?: string
          company_id?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "AssessmentCategoryScore_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "AssessmentCategory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AssessmentCategoryScore_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
        ]
      }
      AssessmentQuestion: {
        Row: {
          action_type: string
          category_id: string
          explainer_text: string | null
          id: string
          integration_check: string
          marcovy_angle: string
          offer_slug: string | null
          options: Json | null
          prompt: string
          question_type: string
          target_field: string | null
          thresholds: Json | null
        }
        Insert: {
          action_type?: string
          category_id: string
          explainer_text?: string | null
          id: string
          integration_check: string
          marcovy_angle: string
          offer_slug?: string | null
          options?: Json | null
          prompt: string
          question_type: string
          target_field?: string | null
          thresholds?: Json | null
        }
        Update: {
          action_type?: string
          category_id?: string
          explainer_text?: string | null
          id?: string
          integration_check?: string
          marcovy_angle?: string
          offer_slug?: string | null
          options?: Json | null
          prompt?: string
          question_type?: string
          target_field?: string | null
          thresholds?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "AssessmentQuestion_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "AssessmentCategory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AssessmentQuestion_offer_slug_fkey"
            columns: ["offer_slug"]
            isOneToOne: false
            referencedRelation: "Offer"
            referencedColumns: ["slug"]
          },
        ]
      }
      AssessmentResponse: {
        Row: {
          company_id: string
          created_at: string
          id: string
          question_id: string
          score: number
          updated_at: string
          user_id: string
          userProfileId: string | null
          value: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id: string
          question_id: string
          score: number
          updated_at: string
          user_id: string
          userProfileId?: string | null
          value: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          question_id?: string
          score?: number
          updated_at?: string
          user_id?: string
          userProfileId?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "AssessmentResponse_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AssessmentResponse_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "AssessmentQuestion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AssessmentResponse_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "AssessmentResponse_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      AssessmentSummary: {
        Row: {
          company_id: string
          generated_at: string
          id: string
          overall_score: number
          report: Json
        }
        Insert: {
          company_id: string
          generated_at: string
          id: string
          overall_score: number
          report: Json
        }
        Update: {
          company_id?: string
          generated_at?: string
          id?: string
          overall_score?: number
          report?: Json
        }
        Relationships: [
          {
            foreignKeyName: "AssessmentSummary_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_execution_logs: {
        Row: {
          action_results: Json[] | null
          created_at: string | null
          executed_at: string | null
          id: string
          trigger_data: Json | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          action_results?: Json[] | null
          created_at?: string | null
          executed_at?: string | null
          id?: string
          trigger_data?: Json | null
          user_id: string
          workflow_id: string
        }
        Update: {
          action_results?: Json[] | null
          created_at?: string | null
          executed_at?: string | null
          id?: string
          trigger_data?: Json | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_execution_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          actions: Json[]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions: Json[]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json[]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json
          trigger_type?: string
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
      Briefing: {
        Row: {
          created_at: string
          id: string
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      business_goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string | null
          target_metric: string
          target_value: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
          target_metric: string
          target_value: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
          target_metric?: string
          target_value?: number
          title?: string
          updated_at?: string | null
          user_id?: string
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
      capability_gap_analysis: {
        Row: {
          capability_name: string
          category: string
          created_at: string | null
          current_status: string
          estimated_effort: string | null
          id: string
          impact_areas: string[]
          implementation_complexity: string
          importance_score: number
          potential_solutions: Json | null
          updated_at: string | null
        }
        Insert: {
          capability_name: string
          category: string
          created_at?: string | null
          current_status: string
          estimated_effort?: string | null
          id?: string
          impact_areas: string[]
          implementation_complexity: string
          importance_score: number
          potential_solutions?: Json | null
          updated_at?: string | null
        }
        Update: {
          capability_name?: string
          category?: string
          created_at?: string | null
          current_status?: string
          estimated_effort?: string | null
          id?: string
          impact_areas?: string[]
          implementation_complexity?: string
          importance_score?: number
          potential_solutions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      capability_roadmap: {
        Row: {
          created_at: string | null
          dependencies: string[] | null
          gap_id: string
          id: string
          phase: string
          priority: string
          status: string | null
          success_criteria: string[] | null
          target_completion_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dependencies?: string[] | null
          gap_id: string
          id?: string
          phase: string
          priority: string
          status?: string | null
          success_criteria?: string[] | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dependencies?: string[] | null
          gap_id?: string
          id?: string
          phase?: string
          priority?: string
          status?: string | null
          success_criteria?: string[] | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capability_roadmap_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "capability_gap_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          primary_department: string | null
          satisfaction_score: number | null
          session_id: string
          session_outcome: string | null
          total_agents_used: number | null
          total_messages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          primary_department?: string | null
          satisfaction_score?: number | null
          session_id: string
          session_outcome?: string | null
          total_agents_used?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          primary_department?: string | null
          satisfaction_score?: number | null
          session_id?: string
          session_outcome?: string | null
          total_agents_used?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_usage_tracking: {
        Row: {
          ai_requests_made: number | null
          created_at: string | null
          date: string
          estimated_cost_usd: number | null
          files_uploaded: number | null
          id: string
          message_count: number | null
          org_id: string | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_requests_made?: number | null
          created_at?: string | null
          date?: string
          estimated_cost_usd?: number | null
          files_uploaded?: number | null
          id?: string
          message_count?: number | null
          org_id?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_requests_made?: number | null
          created_at?: string | null
          date?: string
          estimated_cost_usd?: number | null
          files_uploaded?: number | null
          id?: string
          message_count?: number | null
          org_id?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      communication_analytics: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: Json
          period_end: string
          period_start: string
          platform: string
          time_period: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: Json
          period_end: string
          period_start: string
          platform: string
          time_period: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: Json
          period_end?: string
          period_start?: string
          platform?: string
          time_period?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      communication_events: {
        Row: {
          channel_id: string | null
          company_id: string | null
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          message_id: string | null
          platform: string
          processed: boolean | null
          timestamp: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          company_id?: string | null
          created_at?: string | null
          event_data?: Json
          event_type: string
          id?: string
          message_id?: string | null
          platform: string
          processed?: boolean | null
          timestamp: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          company_id?: string | null
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          message_id?: string | null
          platform?: string
          processed?: boolean | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
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
      Company: {
        Row: {
          business_licenses: Json | null
          business_phone: string | null
          client_base_description: string | null
          created_at: string
          description: string | null
          domain: string
          duns_number: string | null
          employee_count: number | null
          followers_count: number | null
          founded: string | null
          headquarters: string | null
          hubspotId: string | null
          id: string
          industry: string
          inventory_management_system: string | null
          logo: string | null
          microsoft_365: Json | null
          name: string
          size: string | null
          social_profiles: string[] | null
          specialties: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          business_licenses?: Json | null
          business_phone?: string | null
          client_base_description?: string | null
          created_at?: string
          description?: string | null
          domain: string
          duns_number?: string | null
          employee_count?: number | null
          followers_count?: number | null
          founded?: string | null
          headquarters?: string | null
          hubspotId?: string | null
          id: string
          industry: string
          inventory_management_system?: string | null
          logo?: string | null
          microsoft_365?: Json | null
          name: string
          size?: string | null
          social_profiles?: string[] | null
          specialties?: string[] | null
          updated_at: string
          website?: string | null
        }
        Update: {
          business_licenses?: Json | null
          business_phone?: string | null
          client_base_description?: string | null
          created_at?: string
          description?: string | null
          domain?: string
          duns_number?: string | null
          employee_count?: number | null
          followers_count?: number | null
          founded?: string | null
          headquarters?: string | null
          hubspotId?: string | null
          id?: string
          industry?: string
          inventory_management_system?: string | null
          logo?: string | null
          microsoft_365?: Json | null
          name?: string
          size?: string | null
          social_profiles?: string[] | null
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_document_templates: {
        Row: {
          company_id: string
          content: string | null
          content_html: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_document_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_document_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_document_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_status_snapshots: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          customer_metrics: Json | null
          financial_metrics: Json | null
          growth_metrics: Json | null
          health_score: number | null
          id: string
          operational_metrics: Json | null
          snapshot_date: string
          status_summary: string | null
          team_metrics: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          customer_metrics?: Json | null
          financial_metrics?: Json | null
          growth_metrics?: Json | null
          health_score?: number | null
          id?: string
          operational_metrics?: Json | null
          snapshot_date?: string
          status_summary?: string | null
          team_metrics?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          customer_metrics?: Json | null
          financial_metrics?: Json | null
          growth_metrics?: Json | null
          health_score?: number | null
          id?: string
          operational_metrics?: Json | null
          snapshot_date?: string
          status_summary?: string | null
          team_metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_status_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_status_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_status_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      component_usages: {
        Row: {
          company_id: string | null
          component_name: string
          created_at: string | null
          id: string
          location: string
          performance_metrics: Json | null
          timestamp: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          component_name: string
          created_at?: string | null
          id?: string
          location: string
          performance_metrics?: Json | null
          timestamp?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          component_name?: string
          created_at?: string | null
          id?: string
          location?: string
          performance_metrics?: Json | null
          timestamp?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_usages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_usages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_usages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      Contact: {
        Row: {
          company_id: string
          created_at: string
          department: string | null
          email: string | null
          hubspotId: string | null
          id: string
          name: string
          phone: string | null
          title: string | null
          updated_at: string
          user_id: string
          userProfileId: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          department?: string | null
          email?: string | null
          hubspotId?: string | null
          id: string
          name: string
          phone?: string | null
          title?: string | null
          updated_at: string
          user_id: string
          userProfileId?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          department?: string | null
          email?: string | null
          hubspotId?: string | null
          id?: string
          name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          userProfileId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Contact_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Contact_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Contact_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          companyId: string | null
          email: string | null
          firstName: string | null
          hubspotid: string | null
          id: string
          isPotentialVAR: boolean | null
          lastName: string | null
          lastSyncedAt: string | null
          phone: string | null
          properties: Json | null
          userId: string | null
        }
        Insert: {
          companyId?: string | null
          email?: string | null
          firstName?: string | null
          hubspotid?: string | null
          id?: string
          isPotentialVAR?: boolean | null
          lastName?: string | null
          lastSyncedAt?: string | null
          phone?: string | null
          properties?: Json | null
          userId?: string | null
        }
        Update: {
          companyId?: string | null
          email?: string | null
          firstName?: string | null
          hubspotid?: string | null
          id?: string
          isPotentialVAR?: boolean | null
          lastName?: string | null
          lastSyncedAt?: string | null
          phone?: string | null
          properties?: Json | null
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credential_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          details: Json | null
          id: number
          integration_name: string
          ip_address: unknown | null
          organization_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          details?: Json | null
          id?: number
          integration_name: string
          ip_address?: unknown | null
          organization_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          details?: Json | null
          id?: number
          integration_name?: string
          ip_address?: unknown | null
          organization_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deal: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_company_fk"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_company_fk"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_company_fk"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      Deal: {
        Row: {
          company_id: string
          created_at: string
          expected_close_date: string | null
          hubspotId: string | null
          id: string
          name: string
          probability: number | null
          stage: string
          updated_at: string
          user_id: string
          userProfileId: string | null
          value: number
        }
        Insert: {
          company_id: string
          created_at?: string
          expected_close_date?: string | null
          hubspotId?: string | null
          id: string
          name: string
          probability?: number | null
          stage: string
          updated_at: string
          user_id: string
          userProfileId?: string | null
          value: number
        }
        Update: {
          company_id?: string
          created_at?: string
          expected_close_date?: string | null
          hubspotId?: string | null
          id?: string
          name?: string
          probability?: number | null
          stage?: string
          updated_at?: string
          user_id?: string
          userProfileId?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "Deal_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Deal_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Deal_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          closeDate: string | null
          hubspotid: string | null
          id: string
          lastSyncedAt: string | null
          name: string | null
          pipeline: string | null
          properties: Json | null
          stage: string | null
        }
        Insert: {
          amount?: number | null
          closeDate?: string | null
          hubspotid?: string | null
          id?: string
          lastSyncedAt?: string | null
          name?: string | null
          pipeline?: string | null
          properties?: Json | null
          stage?: string | null
        }
        Update: {
          amount?: number | null
          closeDate?: string | null
          hubspotid?: string | null
          id?: string
          lastSyncedAt?: string | null
          name?: string | null
          pipeline?: string | null
          properties?: Json | null
          stage?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
        }
        Relationships: []
      }
      Email: {
        Row: {
          body: string
          id: string
          sent_at: string | null
          subject: string
          to_address: string
          user_id: string
        }
        Insert: {
          body: string
          id?: string
          sent_at?: string | null
          subject: string
          to_address: string
          user_id: string
        }
        Update: {
          body?: string
          id?: string
          sent_at?: string | null
          subject?: string
          to_address?: string
          user_id?: string
        }
        Relationships: []
      }
      encrypted_credentials: {
        Row: {
          auth_tag: string
          created_at: string | null
          encrypted_token: string
          id: string
          integration_name: string
          iv: string
          organization_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_tag: string
          created_at?: string | null
          encrypted_token: string
          id?: string
          integration_name: string
          iv: string
          organization_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_tag?: string
          created_at?: string | null
          encrypted_token?: string
          id?: string
          integration_name?: string
          iv?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_data: {
        Row: {
          amount: number | null
          category: string | null
          company_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          metadata: Json | null
          month: number
          type: string
          updated_at: string | null
          year: number
        }
        Insert: {
          amount?: number | null
          category?: string | null
          company_id: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          metadata?: Json | null
          month: number
          type: string
          updated_at?: string | null
          year: number
        }
        Update: {
          amount?: number | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          month?: number
          type?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      financial_metrics: {
        Row: {
          burn_rate: number | null
          cac: number | null
          cash_balance: number | null
          company_id: string
          created_at: string | null
          date: string
          gross_margin: number | null
          id: string
          ltv: number | null
          projected_cash_flow: number | null
          revenue_forecast: number | null
          updated_at: string | null
        }
        Insert: {
          burn_rate?: number | null
          cac?: number | null
          cash_balance?: number | null
          company_id: string
          created_at?: string | null
          date: string
          gross_margin?: number | null
          id?: string
          ltv?: number | null
          projected_cash_flow?: number | null
          revenue_forecast?: number | null
          updated_at?: string | null
        }
        Update: {
          burn_rate?: number | null
          cac?: number | null
          cash_balance?: number | null
          company_id?: string
          created_at?: string | null
          date?: string
          gross_margin?: number | null
          id?: string
          ltv?: number | null
          projected_cash_flow?: number | null
          revenue_forecast?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      goal_activity_mapping: {
        Row: {
          activity_id: string
          attribution_type: string | null
          contribution_weight: number | null
          created_at: string | null
          goal_id: string
          id: string
        }
        Insert: {
          activity_id: string
          attribution_type?: string | null
          contribution_weight?: number | null
          created_at?: string | null
          goal_id: string
          id?: string
        }
        Update: {
          activity_id?: string
          attribution_type?: string | null
          contribution_weight?: number | null
          created_at?: string | null
          goal_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_activity_mapping_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_activity_mapping_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "business_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_activity_mapping_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "manual_goal_progress_view"
            referencedColumns: ["goal_id"]
          },
        ]
      }
      goal_assessments: {
        Row: {
          ai_recommendations: string | null
          assessment_date: string | null
          created_at: string | null
          feasibility_score: number | null
          goal_id: string
          id: string
          next_steps: string | null
          opportunity_factors: Json[] | null
          resource_gap_analysis: Json | null
          risk_factors: Json[] | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_recommendations?: string | null
          assessment_date?: string | null
          created_at?: string | null
          feasibility_score?: number | null
          goal_id: string
          id?: string
          next_steps?: string | null
          opportunity_factors?: Json[] | null
          resource_gap_analysis?: Json | null
          risk_factors?: Json[] | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_recommendations?: string | null
          assessment_date?: string | null
          created_at?: string | null
          feasibility_score?: number | null
          goal_id?: string
          id?: string
          next_steps?: string | null
          opportunity_factors?: Json[] | null
          resource_gap_analysis?: Json | null
          risk_factors?: Json[] | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_assessments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "business_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_assessments_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "manual_goal_progress_view"
            referencedColumns: ["goal_id"]
          },
        ]
      }
      goal_insights: {
        Row: {
          created_at: string | null
          goal_id: string
          id: string
          insights: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          id?: string
          insights: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          id?: string
          insights?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_insights_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "business_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_insights_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "manual_goal_progress_view"
            referencedColumns: ["goal_id"]
          },
        ]
      }
      goal_resource_mapping: {
        Row: {
          allocation_amount: number | null
          allocation_unit: string | null
          created_at: string | null
          goal_id: string
          id: string
          notes: string | null
          relevance_score: number | null
          resource_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          allocation_amount?: number | null
          allocation_unit?: string | null
          created_at?: string | null
          goal_id: string
          id?: string
          notes?: string | null
          relevance_score?: number | null
          resource_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          allocation_amount?: number | null
          allocation_unit?: string | null
          created_at?: string | null
          goal_id?: string
          id?: string
          notes?: string | null
          relevance_score?: number | null
          resource_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_resource_mapping_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "business_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_resource_mapping_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "manual_goal_progress_view"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "goal_resource_mapping_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resource_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_user_alignment: {
        Row: {
          alignment_score: number | null
          challenge_factors: Json[] | null
          created_at: string | null
          goal_id: string
          id: string
          personalized_recommendations: string | null
          strength_factors: Json[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alignment_score?: number | null
          challenge_factors?: Json[] | null
          created_at?: string | null
          goal_id: string
          id?: string
          personalized_recommendations?: string | null
          strength_factors?: Json[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alignment_score?: number | null
          challenge_factors?: Json[] | null
          created_at?: string | null
          goal_id?: string
          id?: string
          personalized_recommendations?: string | null
          strength_factors?: Json[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_user_alignment_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "business_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_user_alignment_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "manual_goal_progress_view"
            referencedColumns: ["goal_id"]
          },
        ]
      }
      insight_business_connections: {
        Row: {
          business_context: Json | null
          business_metric_id: string | null
          connection_type: string
          created_at: string | null
          id: string
          impact_description: string | null
          impact_score: number | null
          personal_thought_id: string | null
        }
        Insert: {
          business_context?: Json | null
          business_metric_id?: string | null
          connection_type: string
          created_at?: string | null
          id?: string
          impact_description?: string | null
          impact_score?: number | null
          personal_thought_id?: string | null
        }
        Update: {
          business_context?: Json | null
          business_metric_id?: string | null
          connection_type?: string
          created_at?: string | null
          id?: string
          impact_description?: string | null
          impact_score?: number | null
          personal_thought_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_business_connections_personal_thought_id_fkey"
            columns: ["personal_thought_id"]
            isOneToOne: false
            referencedRelation: "personal_memory_timeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_business_connections_personal_thought_id_fkey"
            columns: ["personal_thought_id"]
            isOneToOne: false
            referencedRelation: "personal_thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      Integration: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          id: string
          last_synced: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          userProfileId: string | null
        }
        Insert: {
          company_id: string
          config: Json
          created_at?: string
          id: string
          last_synced?: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
          userProfileId?: string | null
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          id?: string
          last_synced?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          userProfileId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Integration_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Integration_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Integration_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_data: {
        Row: {
          created_at: string | null
          data_timestamp: string | null
          data_type: string
          external_id: string | null
          id: string
          processed_data: Json | null
          raw_data: Json
          sync_batch_id: string | null
          updated_at: string | null
          user_integration_id: string
        }
        Insert: {
          created_at?: string | null
          data_timestamp?: string | null
          data_type: string
          external_id?: string | null
          id?: string
          processed_data?: Json | null
          raw_data: Json
          sync_batch_id?: string | null
          updated_at?: string | null
          user_integration_id: string
        }
        Update: {
          created_at?: string | null
          data_timestamp?: string | null
          data_type?: string
          external_id?: string | null
          id?: string
          processed_data?: Json | null
          raw_data?: Json
          sync_batch_id?: string | null
          updated_at?: string | null
          user_integration_id?: string
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
      integration_data_mappings: {
        Row: {
          created_at: string | null
          data_field: string
          id: number
          integration_id: string | null
          nexus_column: string
          nexus_table: string
          transformation: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_field: string
          id?: number
          integration_id?: string | null
          nexus_column?: string
          nexus_table: string
          transformation?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_field?: string
          id?: number
          integration_id?: string | null
          nexus_column?: string
          nexus_table?: string
          transformation?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_data_mappings_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
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
          id?: never
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
          id?: never
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
          error_count: number | null
          id: string
          integration_slug: string
          last_error: string | null
          last_sync: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          integration_slug: string
          last_error?: string | null
          last_sync?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          integration_slug?: string
          last_error?: string | null
          last_sync?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          batch_id: string | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          failed_records: number | null
          id: string
          processed_records: number | null
          started_at: string | null
          status: string
          sync_type: string
          total_records: number | null
          triggered_by: string | null
          user_integration_id: string
        }
        Insert: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          failed_records?: number | null
          id?: string
          processed_records?: number | null
          started_at?: string | null
          status: string
          sync_type: string
          total_records?: number | null
          triggered_by?: string | null
          user_integration_id: string
        }
        Update: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          failed_records?: number | null
          id?: string
          processed_records?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          total_records?: number | null
          triggered_by?: string | null
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
      integration_sync_status: {
        Row: {
          created_at: string | null
          data_points_synced: number | null
          error: string | null
          id: number
          integration_id: string | null
          last_synced_at: string | null
          next_sync_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_points_synced?: number | null
          error?: string | null
          id?: number
          integration_id?: string | null
          last_synced_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_points_synced?: number | null
          error?: string | null
          id?: number
          integration_id?: string | null
          last_synced_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_status_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_webhooks: {
        Row: {
          created_at: string | null
          events: Json | null
          failed_triggers: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          secret_key: string | null
          successful_triggers: number | null
          total_triggers: number | null
          updated_at: string | null
          user_integration_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          events?: Json | null
          failed_triggers?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret_key?: string | null
          successful_triggers?: number | null
          total_triggers?: number | null
          updated_at?: string | null
          user_integration_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          events?: Json | null
          failed_triggers?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret_key?: string | null
          successful_triggers?: number | null
          total_triggers?: number | null
          updated_at?: string | null
          user_integration_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_webhooks_user_integration_id_fkey"
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
          category: string
          config_schema: Json | null
          created_at: string | null
          default_config: Json | null
          description: string | null
          difficulty: string | null
          documentation_url: string | null
          estimated_setup_time: string | null
          features: Json | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_beta: boolean | null
          is_enterprise: boolean | null
          metadata: Json
          name: string
          prerequisites: Json | null
          rate_limit_requests_per_hour: number | null
          rate_limit_requests_per_minute: number | null
          slug: string
          support_url: string | null
          updated_at: string | null
        }
        Insert: {
          auth_type?: string | null
          category: string
          config_schema?: Json | null
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          difficulty?: string | null
          documentation_url?: string | null
          estimated_setup_time?: string | null
          features?: Json | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_beta?: boolean | null
          is_enterprise?: boolean | null
          metadata?: Json
          name: string
          prerequisites?: Json | null
          rate_limit_requests_per_hour?: number | null
          rate_limit_requests_per_minute?: number | null
          slug: string
          support_url?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_type?: string | null
          category?: string
          config_schema?: Json | null
          created_at?: string | null
          default_config?: Json | null
          description?: string | null
          difficulty?: string | null
          documentation_url?: string | null
          estimated_setup_time?: string | null
          features?: Json | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_beta?: boolean | null
          is_enterprise?: boolean | null
          metadata?: Json
          name?: string
          prerequisites?: Json | null
          rate_limit_requests_per_hour?: number | null
          rate_limit_requests_per_minute?: number | null
          slug?: string
          support_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      KPI: {
        Row: {
          created_at: string
          id: string
          metric: string
          period: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric: string
          period: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          period?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      manual_calendar_events: {
        Row: {
          attendees: Json[] | null
          color: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          is_all_day: boolean | null
          location: string | null
          metadata: Json | null
          recurrence_rule: string | null
          reminder_minutes: number[] | null
          start_time: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          attendees?: Json[] | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          metadata?: Json | null
          recurrence_rule?: string | null
          reminder_minutes?: number[] | null
          start_time: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          attendees?: Json[] | null
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          metadata?: Json | null
          recurrence_rule?: string | null
          reminder_minutes?: number[] | null
          start_time?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      manual_contacts: {
        Row: {
          address: Json | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: Json | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: Json | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      manual_documents: {
        Row: {
          company_id: string | null
          content: string | null
          content_html: string | null
          created_at: string | null
          document_type: string | null
          folder: string | null
          id: string
          metadata: Json | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          document_type?: string | null
          folder?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          document_type?: string | null
          folder?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      manual_emails: {
        Row: {
          bcc_emails: string[] | null
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          company_id: string | null
          created_at: string | null
          folder: string | null
          id: string
          is_archived: boolean | null
          is_flagged: boolean | null
          is_read: boolean | null
          metadata: Json | null
          priority: string | null
          received_at: string | null
          recipient_email: string
          recipient_name: string | null
          sender_email: string
          sender_name: string | null
          subject: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          company_id?: string | null
          created_at?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          priority?: string | null
          received_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          sender_email: string
          sender_name?: string | null
          subject: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          company_id?: string | null
          created_at?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          is_flagged?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          priority?: string | null
          received_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sender_email?: string
          sender_name?: string | null
          subject?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_emails_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      manual_tasks: {
        Row: {
          assignee_id: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          parent_task_id: string | null
          priority: string | null
          progress: number | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignee_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          parent_task_id?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignee_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          parent_task_id?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
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
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "manual_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "manual_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          campaign_name: string
          clicks: number | null
          company_id: string
          conversions: number | null
          created_at: string | null
          end_date: string | null
          id: string
          impressions: number | null
          spent: number | null
          start_date: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          campaign_name: string
          clicks?: number | null
          company_id: string
          conversions?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          campaign_name?: string
          clicks?: number | null
          company_id?: string
          conversions?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          spent?: number | null
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          campaign_id: string | null
          company_id: string
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          qualified: boolean | null
          score: number | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          qualified?: boolean | null
          score?: number | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          qualified?: boolean | null
          score?: number | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migration_checks: {
        Row: {
          check_type: string
          checked_at: string | null
          id: string
          migration_name: string
          notes: string | null
          status: string
          target_name: string
        }
        Insert: {
          check_type: string
          checked_at?: string | null
          id?: string
          migration_name: string
          notes?: string | null
          status: string
          target_name: string
        }
        Update: {
          check_type?: string
          checked_at?: string | null
          id?: string
          migration_name?: string
          notes?: string | null
          status?: string
          target_name?: string
        }
        Relationships: []
      }
      model_usage: {
        Row: {
          company_id: string | null
          cost: number | null
          created_at: string | null
          id: string
          latency: number | null
          model_name: string | null
          success: boolean | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          latency?: number | null
          model_name?: string | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          latency?: number | null
          model_name?: string | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ModelPerformance: {
        Row: {
          averageCost: number
          averageLatency: number
          errorCount: number
          lastUsed: string
          model_name: string
          month: string
          successRate: number
        }
        Insert: {
          averageCost: number
          averageLatency: number
          errorCount: number
          lastUsed: string
          model_name: string
          month: string
          successRate: number
        }
        Update: {
          averageCost?: number
          averageLatency?: number
          errorCount?: number
          lastUsed?: string
          model_name?: string
          month?: string
          successRate?: number
        }
        Relationships: [
          {
            foreignKeyName: "ModelPerformance_model_name_fkey"
            columns: ["model_name"]
            isOneToOne: false
            referencedRelation: "AIModel"
            referencedColumns: ["name"]
          },
        ]
      }
      ModelUsage: {
        Row: {
          company_id: string
          cost: number
          created_at: string
          id: string
          latency: number
          model_name: string
          success: boolean
          tokens_used: number
          user_id: string
          userProfileId: string | null
        }
        Insert: {
          company_id: string
          cost: number
          created_at?: string
          id: string
          latency: number
          model_name: string
          success: boolean
          tokens_used: number
          user_id: string
          userProfileId?: string | null
        }
        Update: {
          company_id?: string
          cost?: number
          created_at?: string
          id?: string
          latency?: number
          model_name?: string
          success?: boolean
          tokens_used?: number
          user_id?: string
          userProfileId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ModelUsage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ModelUsage_model_name_fkey"
            columns: ["model_name"]
            isOneToOne: false
            referencedRelation: "AIModel"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "ModelUsage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ModelUsage_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_configurations: {
        Row: {
          api_key: string
          base_url: string
          created_at: string | null
          id: string
          instance_name: string | null
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          base_url: string
          created_at?: string | null
          id?: string
          instance_name?: string | null
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          base_url?: string
          created_at?: string | null
          id?: string
          instance_name?: string | null
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      n8n_workflow_configs: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          webhook_url: string
          workflow_id: string
          workflow_name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          webhook_url: string
          workflow_id: string
          workflow_name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          webhook_url?: string
          workflow_id?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_workflow_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_workflow_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "n8n_workflow_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      Note: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          type?: string
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
      Offer: {
        Row: {
          description: string
          name: string
          slug: string
          url: string
        }
        Insert: {
          description: string
          name: string
          slug: string
          url: string
        }
        Update: {
          description?: string
          name?: string
          slug?: string
          url?: string
        }
        Relationships: []
      }
      onboarding_conversations: {
        Row: {
          collected_data: Json | null
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          last_interaction_at: string | null
          session_id: string
          started_at: string | null
          status: string
          total_steps: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collected_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          last_interaction_at?: string | null
          session_id: string
          started_at?: string | null
          status?: string
          total_steps?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collected_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          last_interaction_at?: string | null
          session_id?: string
          started_at?: string | null
          status?: string
          total_steps?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          role: string
          step_id: string | null
          step_number: number | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role: string
          step_id?: string | null
          step_number?: number | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role?: string
          step_id?: string | null
          step_number?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "onboarding_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_action_queue: {
        Row: {
          action_slug: string
          created_at: string | null
          id: string
          kpi_key: string
          org_id: string
          output: Json | null
          requested_by: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_slug: string
          created_at?: string | null
          id?: string
          kpi_key: string
          org_id: string
          output?: Json | null
          requested_by: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_slug?: string
          created_at?: string | null
          id?: string
          kpi_key?: string
          org_id?: string
          output?: Json | null
          requested_by?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      personal_thoughts: {
        Row: {
          business_context: Json | null
          category: string
          connections: string[] | null
          content: string
          created_at: string | null
          id: string
          search_vector: unknown | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          business_context?: Json | null
          category: string
          connections?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          search_vector?: unknown | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          business_context?: Json | null
          category?: string
          connections?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          search_vector?: unknown | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      Pin: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          pinned_at: string
          user_id: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          pinned_at?: string
          user_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          pinned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_team: Json | null
          budget: number | null
          company_id: string
          completion_date: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          health: string | null
          id: string
          name: string
          progress_percentage: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_team?: Json | null
          budget?: number | null
          company_id: string
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          health?: string | null
          id?: string
          name: string
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_team?: Json | null
          budget?: number | null
          company_id?: string
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          health?: string | null
          id?: string
          name?: string
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      Recent: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          user_id: string
          visited_at: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
          visited_at?: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      Request: {
        Row: {
          created_at: string
          details: string | null
          id: string
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_inventory: {
        Row: {
          availability: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          quantity: number | null
          resource_type: string
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          quantity?: number | null
          resource_type: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          quantity?: number | null
          resource_type?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      sales_deals: {
        Row: {
          close_date: string | null
          company_id: string
          company_name: string | null
          created_at: string | null
          deal_name: string
          id: string
          rep_name: string | null
          stage: string | null
          status: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          close_date?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string | null
          deal_name: string
          id?: string
          rep_name?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          close_date?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string | null
          deal_name?: string
          id?: string
          rep_name?: string | null
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      sales_performance: {
        Row: {
          achieved: number | null
          company_id: string
          created_at: string | null
          id: string
          metrics: Json | null
          period_end: string | null
          period_start: string | null
          quota: number | null
          rep_name: string | null
          updated_at: string | null
        }
        Insert: {
          achieved?: number | null
          company_id: string
          created_at?: string | null
          id?: string
          metrics?: Json | null
          period_end?: string | null
          period_start?: string | null
          quota?: number | null
          rep_name?: string | null
          updated_at?: string | null
        }
        Update: {
          achieved?: number | null
          company_id?: string
          created_at?: string | null
          id?: string
          metrics?: Json | null
          period_end?: string | null
          period_start?: string | null
          quota?: number | null
          rep_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_pipeline: {
        Row: {
          close_date: string | null
          company_id: string
          company_name: string | null
          created_at: string | null
          deal_name: string
          id: string
          probability: number | null
          stage: string | null
          status: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          close_date?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string | null
          deal_name: string
          id?: string
          probability?: number | null
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          close_date?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string | null
          deal_name?: string
          id?: string
          probability?: number | null
          stage?: string | null
          status?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      secure_integrations: {
        Row: {
          created_at: string | null
          data_retention_days: number | null
          encrypted_credentials: string
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean | null
          last_sync: string | null
          permissions: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_retention_days?: number | null
          encrypted_credentials: string
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean | null
          last_sync?: string | null
          permissions?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_retention_days?: number | null
          encrypted_credentials?: string
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync?: string | null
          permissions?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          event_details: Json
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details: Json
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_config: {
        Row: {
          config_key: string
          config_value: Json
          id: string
          is_encrypted: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          id?: string
          is_encrypted?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          id?: string
          is_encrypted?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      service_health_logs: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          service_name: string
          status: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      Session: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
          userProfileId: string | null
        }
        Insert: {
          expires: string
          id: string
          sessionToken: string
          userId: string
          userProfileId?: string | null
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
          userProfileId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Session_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          processed: boolean | null
          processed_at: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id: string
          processed?: boolean | null
          processed_at?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          type?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          reporter: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          reporter?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          reporter?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      Task: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_capacity: {
        Row: {
          allocated_hours: number | null
          capacity_hours: number | null
          company_id: string
          created_at: string | null
          department: string | null
          id: string
          team_member: string
          updated_at: string | null
          utilization: number | null
          week_start: string | null
        }
        Insert: {
          allocated_hours?: number | null
          capacity_hours?: number | null
          company_id: string
          created_at?: string | null
          department?: string | null
          id?: string
          team_member: string
          updated_at?: string | null
          utilization?: number | null
          week_start?: string | null
        }
        Update: {
          allocated_hours?: number | null
          capacity_hours?: number | null
          company_id?: string
          created_at?: string | null
          department?: string | null
          id?: string
          team_member?: string
          updated_at?: string | null
          utilization?: number | null
          week_start?: string | null
        }
        Relationships: []
      }
      thought_relationships: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string
          source_thought_id: string
          target_thought_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type: string
          source_thought_id: string
          target_thought_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string
          source_thought_id?: string
          target_thought_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thought_relationships_source_thought_id_fkey"
            columns: ["source_thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_relationships_source_thought_id_fkey"
            columns: ["source_thought_id"]
            isOneToOne: false
            referencedRelation: "workspace_action_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_relationships_target_thought_id_fkey"
            columns: ["target_thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thought_relationships_target_thought_id_fkey"
            columns: ["target_thought_id"]
            isOneToOne: false
            referencedRelation: "workspace_action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          ai_clarification_data: Json | null
          ai_insights: Json | null
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          creation_date: string | null
          department: string | null
          estimated_effort: string | null
          id: string
          impact: string | null
          initiative: boolean | null
          interaction_method: string | null
          last_updated: string | null
          main_sub_categories: Json | null
          parent_idea_id: string | null
          personal_or_professional: string | null
          priority: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
          workflow_stage: string | null
        }
        Insert: {
          ai_clarification_data?: Json | null
          ai_insights?: Json | null
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          creation_date?: string | null
          department?: string | null
          estimated_effort?: string | null
          id?: string
          impact?: string | null
          initiative?: boolean | null
          interaction_method?: string | null
          last_updated?: string | null
          main_sub_categories?: Json | null
          parent_idea_id?: string | null
          personal_or_professional?: string | null
          priority?: string | null
          status: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
          workflow_stage?: string | null
        }
        Update: {
          ai_clarification_data?: Json | null
          ai_insights?: Json | null
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          creation_date?: string | null
          department?: string | null
          estimated_effort?: string | null
          id?: string
          impact?: string | null
          initiative?: boolean | null
          interaction_method?: string | null
          last_updated?: string | null
          main_sub_categories?: Json | null
          parent_idea_id?: string | null
          personal_or_professional?: string | null
          priority?: string | null
          status?: string
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
          {
            foreignKeyName: "thoughts_parent_idea_id_fkey"
            columns: ["parent_idea_id"]
            isOneToOne: false
            referencedRelation: "workspace_action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      Ticket: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      User: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          page: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page?: string | null
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
      user_context_profiles: {
        Row: {
          collaboration_network: Json | null
          communication_patterns: Json | null
          created_at: string | null
          decision_making_profile: Json | null
          id: string
          interest_areas: string[] | null
          last_updated: string | null
          productivity_patterns: Json | null
          skill_gaps: string[] | null
          skill_strengths: string[] | null
          user_id: string
          work_style_preferences: Json | null
        }
        Insert: {
          collaboration_network?: Json | null
          communication_patterns?: Json | null
          created_at?: string | null
          decision_making_profile?: Json | null
          id?: string
          interest_areas?: string[] | null
          last_updated?: string | null
          productivity_patterns?: Json | null
          skill_gaps?: string[] | null
          skill_strengths?: string[] | null
          user_id: string
          work_style_preferences?: Json | null
        }
        Update: {
          collaboration_network?: Json | null
          communication_patterns?: Json | null
          created_at?: string | null
          decision_making_profile?: Json | null
          id?: string
          interest_areas?: string[] | null
          last_updated?: string | null
          productivity_patterns?: Json | null
          skill_gaps?: string[] | null
          skill_strengths?: string[] | null
          user_id?: string
          work_style_preferences?: Json | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          company_id: string | null
          config: Json | null
          created_at: string | null
          credentials: Json | null
          error_message: string | null
          id: string
          integration_id: string
          last_sync: string | null
          metadata: Json | null
          name: string | null
          next_sync_at: string | null
          status: string | null
          sync_frequency: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          integration_id: string
          last_sync?: string | null
          metadata?: Json | null
          name?: string | null
          next_sync_at?: string | null
          status?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          config?: Json | null
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          integration_id?: string
          last_sync?: string | null
          metadata?: Json | null
          name?: string | null
          next_sync_at?: string | null
          status?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_integrations_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interaction_analysis: {
        Row: {
          analysis_period_end: string | null
          analysis_period_start: string | null
          created_at: string | null
          feature_engagement: Json | null
          id: string
          interaction_patterns: Json | null
          pain_points: string[] | null
          response_effectiveness: Json | null
          success_patterns: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          created_at?: string | null
          feature_engagement?: Json | null
          id?: string
          interaction_patterns?: Json | null
          pain_points?: string[] | null
          response_effectiveness?: Json | null
          success_patterns?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_period_end?: string | null
          analysis_period_start?: string | null
          created_at?: string | null
          feature_engagement?: Json | null
          id?: string
          interaction_patterns?: Json | null
          pain_points?: string[] | null
          response_effectiveness?: Json | null
          success_patterns?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_learning_patterns: {
        Row: {
          created_at: string | null
          id: string
          knowledge_retention_patterns: Json | null
          learning_style: string | null
          optimal_learning_times: Json | null
          preferred_content_types: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          knowledge_retention_patterns?: Json | null
          learning_style?: string | null
          optimal_learning_times?: Json | null
          preferred_content_types?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          knowledge_retention_patterns?: Json | null
          learning_style?: string | null
          optimal_learning_times?: Json | null
          preferred_content_types?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_licenses: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          expires_at: string | null
          id: string
          org_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          expires_at?: string | null
          id?: string
          org_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          expires_at?: string | null
          id?: string
          org_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_progress: {
        Row: {
          business_context: Json | null
          conversation_turns: number | null
          created_at: string | null
          current_step: string | null
          goals_context: Json | null
          id: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_started_at: string | null
          preferred_communication_style: string | null
          role_context: Json | null
          steps_completed: Json | null
          total_onboarding_time_minutes: number | null
          updated_at: string | null
          user_id: string
          working_style: Json | null
        }
        Insert: {
          business_context?: Json | null
          conversation_turns?: number | null
          created_at?: string | null
          current_step?: string | null
          goals_context?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          preferred_communication_style?: string | null
          role_context?: Json | null
          steps_completed?: Json | null
          total_onboarding_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
          working_style?: Json | null
        }
        Update: {
          business_context?: Json | null
          conversation_turns?: number | null
          created_at?: string | null
          current_step?: string | null
          goals_context?: Json | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_started_at?: string | null
          preferred_communication_style?: string | null
          role_context?: Json | null
          steps_completed?: Json | null
          total_onboarding_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          working_style?: Json | null
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          joined_at: string | null
          org_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          org_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          joined_at?: string | null
          org_id?: string
          role?: string | null
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
      user_profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          bio: string | null
          business_email: string | null
          certifications: string[] | null
          company_id: string | null
          created_at: string | null
          department: string | null
          display_name: string | null
          email: string | null
          emergency_contact: Json | null
          executive_assistant_introduced: boolean | null
          first_name: string | null
          github_url: string | null
          id: string
          job_title: string | null
          languages: Json | null
          last_name: string | null
          learning_goals: string[] | null
          linkedin_url: string | null
          location: string | null
          mobile: string | null
          onboarding_chat_completed: boolean | null
          onboarding_completed: boolean | null
          onboarding_context: Json | null
          personal_email: string | null
          personal_interests: string[] | null
          personal_manifest: Json | null
          phone: string | null
          preferences: Json | null
          preferred_ai_personality: string | null
          profile_completion_percentage: number | null
          role: string | null
          skills: string[] | null
          thought_capture_enabled: boolean | null
          timezone: string | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string | null
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
          department?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: Json | null
          executive_assistant_introduced?: boolean | null
          first_name?: string | null
          github_url?: string | null
          id: string
          job_title?: string | null
          languages?: Json | null
          last_name?: string | null
          learning_goals?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          mobile?: string | null
          onboarding_chat_completed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_context?: Json | null
          personal_email?: string | null
          personal_interests?: string[] | null
          personal_manifest?: Json | null
          phone?: string | null
          preferences?: Json | null
          preferred_ai_personality?: string | null
          profile_completion_percentage?: number | null
          role?: string | null
          skills?: string[] | null
          thought_capture_enabled?: boolean | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          department?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: Json | null
          executive_assistant_introduced?: boolean | null
          first_name?: string | null
          github_url?: string | null
          id?: string
          job_title?: string | null
          languages?: Json | null
          last_name?: string | null
          learning_goals?: string[] | null
          linkedin_url?: string | null
          location?: string | null
          mobile?: string | null
          onboarding_chat_completed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_context?: Json | null
          personal_email?: string | null
          personal_interests?: string[] | null
          personal_manifest?: Json | null
          phone?: string | null
          preferences?: Json | null
          preferred_ai_personality?: string | null
          profile_completion_percentage?: number | null
          role?: string | null
          skills?: string[] | null
          thought_capture_enabled?: boolean | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_location?: string | null
          work_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
      UserProfile: {
        Row: {
          company_id: string
          company_size: string | null
          created_at: string
          id: string
          industry: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          company_size?: string | null
          created_at?: string
          id: string
          industry?: string | null
          role?: string | null
          updated_at: string
          user_id: string
        }
        Update: {
          company_id?: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserProfile_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserProfile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      VARLead: {
        Row: {
          company_id: string
          contact_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
          userProfileId: string | null
        }
        Insert: {
          company_id: string
          contact_name: string
          created_at?: string
          email: string
          id: string
          notes?: string | null
          phone?: string | null
          status: string
          updated_at: string
          user_id: string
          userProfileId?: string | null
        }
        Update: {
          company_id?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          userProfileId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "VARLead_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "Company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "VARLead_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "VARLead_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["id"]
          },
        ]
      }
      VerificationToken: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          metadata: Json | null
          position: number
          referral_code: string | null
          referral_count: number
          referred_by_code: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          metadata?: Json | null
          position?: number
          referral_code?: string | null
          referral_count?: number
          referred_by_code?: string | null
          tier?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          metadata?: Json | null
          position?: number
          referral_code?: string | null
          referral_count?: number
          referred_by_code?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      website_analytics: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          company_id: string
          created_at: string | null
          date: string
          id: string
          page_views: number | null
          top_pages: Json | null
          traffic_sources: Json | null
          updated_at: string | null
          visitors: number | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          company_id: string
          created_at?: string | null
          date: string
          id?: string
          page_views?: number | null
          top_pages?: Json | null
          traffic_sources?: Json | null
          updated_at?: string | null
          visitors?: number | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          company_id?: string
          created_at?: string | null
          date?: string
          id?: string
          page_views?: number | null
          top_pages?: Json | null
          traffic_sources?: Json | null
          updated_at?: string | null
          visitors?: number | null
        }
        Relationships: []
      }
      WidgetEvent: {
        Row: {
          created_at: string
          event_payload: Json | null
          event_type: string
          id: string
          user_id: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          event_payload?: Json | null
          event_type: string
          id?: string
          user_id: string
          widget_id: string
        }
        Update: {
          created_at?: string
          event_payload?: Json | null
          event_type?: string
          id?: string
          user_id?: string
          widget_id?: string
        }
        Relationships: []
      }
      workspace_activity: {
        Row: {
          activity_type: string
          content_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          activity_type: string
          content_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          activity_type?: string
          content_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_activity_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "workspace_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_content: {
        Row: {
          content: string | null
          content_html: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          id: string
          last_edited_by: string | null
          metadata: Json | null
          parent_id: string | null
          position: number | null
          title: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          content?: string | null
          content_html?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_edited_by?: string | null
          metadata?: Json | null
          parent_id?: string | null
          position?: number | null
          title: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          content?: string | null
          content_html?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_edited_by?: string | null
          metadata?: Json | null
          parent_id?: string | null
          position?: number | null
          title?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_content_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workspace_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_content_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          is_private: boolean | null
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_private?: boolean | null
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_private?: boolean | null
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
        ]
      }
    }
    Views: {
      ai_companies: {
        Row: {
          avg_deal_cycle_days: number | null
          avg_first_response_mins: number | null
          burn_rate: number | null
          cac: number | null
          created_at: string | null
          csat: number | null
          domain: string | null
          fiscal_year_end: string | null
          gross_margin: number | null
          growth_stage: string | null
          id: string | null
          industry: string | null
          key_metrics: Json | null
          logo_url: string | null
          mrr: number | null
          name: string | null
          on_time_delivery_pct: number | null
          settings: Json | null
          size: string | null
          updated_at: string | null
          website_visitors_month: number | null
        }
        Insert: {
          avg_deal_cycle_days?: number | null
          avg_first_response_mins?: number | null
          burn_rate?: number | null
          cac?: number | null
          created_at?: string | null
          csat?: number | null
          domain?: string | null
          fiscal_year_end?: string | null
          gross_margin?: number | null
          growth_stage?: string | null
          id?: string | null
          industry?: string | null
          key_metrics?: Json | null
          logo_url?: string | null
          mrr?: number | null
          name?: string | null
          on_time_delivery_pct?: number | null
          settings?: Json | null
          size?: string | null
          updated_at?: string | null
          website_visitors_month?: number | null
        }
        Update: {
          avg_deal_cycle_days?: number | null
          avg_first_response_mins?: number | null
          burn_rate?: number | null
          cac?: number | null
          created_at?: string | null
          csat?: number | null
          domain?: string | null
          fiscal_year_end?: string | null
          gross_margin?: number | null
          growth_stage?: string | null
          id?: string | null
          industry?: string | null
          key_metrics?: Json | null
          logo_url?: string | null
          mrr?: number | null
          name?: string | null
          on_time_delivery_pct?: number | null
          settings?: Json | null
          size?: string | null
          updated_at?: string | null
          website_visitors_month?: number | null
        }
        Relationships: []
      }
      ai_feedback_analytics: {
        Row: {
          agent_id: string | null
          feedback_category: string | null
          feedback_count: number | null
          feedback_date: string | null
          helpfulness_rate: number | null
          rating: string | null
        }
        Relationships: []
      }
      ai_inbox_items_detailed: {
        Row: {
          ai_action_items: string[] | null
          ai_category: string | null
          ai_priority_score: number | null
          ai_processed_at: string | null
          ai_sentiment: string | null
          ai_summary: string | null
          attachment_count: number | null
          cc_addresses: string | null
          company_id: string | null
          content: string | null
          created_at: string | null
          date_sent: string | null
          email_references: string[] | null
          external_id: string | null
          from_address: string | null
          has_attachments: boolean | null
          html_content: string | null
          id: string | null
          in_reply_to: string | null
          integration_category: string | null
          integration_id: string | null
          integration_name: string | null
          is_flagged: boolean | null
          is_important: boolean | null
          message_id: string | null
          received_at: string | null
          recipient_email: string | null
          sender_email: string | null
          sender_name: string | null
          snippet: string | null
          snooze_until: string | null
          source_type: string | null
          status: string | null
          subject: string | null
          thread_id: string | null
          to_addresses: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_inbox_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_inbox_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_performance_view"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ai_inbox_items_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_success_analytics: {
        Row: {
          avg_satisfaction: number | null
          avg_time_saved: number | null
          outcome_count: number | null
          outcome_date: string | null
          outcome_type: string | null
          success_status: string | null
          total_revenue_impact: number | null
        }
        Relationships: []
      }
      company_performance_view: {
        Row: {
          achieved_goals: number | null
          active_goals: number | null
          avg_goal_progress: number | null
          behind_goals: number | null
          company_id: string | null
          company_name: string | null
          customer_metrics: Json | null
          financial_metrics: Json | null
          growth_metrics: Json | null
          health_score: number | null
          on_track_goals: number | null
          operational_metrics: Json | null
          snapshot_date: string | null
          team_metrics: Json | null
          total_goals: number | null
        }
        Relationships: []
      }
      department_metrics_view: {
        Row: {
          department: string | null
          state: Json | null
        }
        Relationships: []
      }
      manual_goal_progress_view: {
        Row: {
          completed_tasks_count: number | null
          current_value: number | null
          end_date: string | null
          goal_id: string | null
          goal_title: string | null
          progress_status: string | null
          related_emails_count: number | null
          related_events_count: number | null
          related_tasks_count: number | null
          start_date: string | null
          status: string | null
          target_metric: string | null
          target_value: number | null
          user_id: string | null
        }
        Relationships: []
      }
      mv_latest_department_kpis: {
        Row: {
          captured_at: string | null
          department_id: string | null
          id: string | null
          kpi_id: string | null
          org_id: string | null
          source: string | null
          value: Json | null
        }
        Relationships: []
      }
      mv_paypal_txns: {
        Row: {
          amount: number | null
          captured_at: string | null
          currency: string | null
          org_id: string | null
          txn_id: string | null
        }
        Relationships: []
      }
      personal_memory_timeline: {
        Row: {
          business_connections: Json | null
          business_context: Json | null
          category: string | null
          content: string | null
          created_at: string | null
          id: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      security_policy_summary: {
        Row: {
          all_policies: number | null
          delete_policies: number | null
          insert_policies: number | null
          rls_enabled: boolean | null
          schemaname: unknown | null
          select_policies: number | null
          tablename: unknown | null
          total_policies: number | null
          update_policies: number | null
        }
        Relationships: []
      }
      unified_productivity_view: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string | null
          is_archived: boolean | null
          is_flagged: boolean | null
          is_read: boolean | null
          item_date: string | null
          item_id: string | null
          item_type: string | null
          priority: string | null
          source: string | null
          source_name: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      unified_workspace_view: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string | null
          is_archived: boolean | null
          is_flagged: boolean | null
          is_read: boolean | null
          item_date: string | null
          item_id: string | null
          item_type: string | null
          priority: string | null
          source: string | null
          source_name: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      waitlist_stats: {
        Row: {
          early_bird_signups: number | null
          founder_spots_taken: number | null
          last_signup_at: string | null
          total_signups: number | null
          vip_spots_taken: number | null
        }
        Relationships: []
      }
      workspace_action_plans: {
        Row: {
          category: string | null
          completed_tasks: number | null
          content: string | null
          created_at: string | null
          department: string | null
          estimated_effort: string | null
          id: string | null
          initiative: boolean | null
          priority: string | null
          progress_percentage: number | null
          status: string | null
          task_count: number | null
          updated_at: string | null
          user_id: string | null
          workflow_stage: string | null
        }
        Insert: {
          category?: string | null
          completed_tasks?: never
          content?: string | null
          created_at?: string | null
          department?: string | null
          estimated_effort?: string | null
          id?: string | null
          initiative?: boolean | null
          priority?: string | null
          progress_percentage?: never
          status?: string | null
          task_count?: never
          updated_at?: string | null
          user_id?: string | null
          workflow_stage?: string | null
        }
        Update: {
          category?: string | null
          completed_tasks?: never
          content?: string | null
          created_at?: string | null
          department?: string | null
          estimated_effort?: string | null
          id?: string | null
          initiative?: boolean | null
          priority?: string | null
          progress_percentage?: never
          status?: string | null
          task_count?: never
          updated_at?: string | null
          user_id?: string | null
          workflow_stage?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_ab_test: {
        Args: { test_id_param: string }
        Returns: Json
      }
      apply_inbox_rules: {
        Args: { p_inbox_item_id: string }
        Returns: undefined
      }
      calc_ops_score: {
        Args: { p_org: string }
        Returns: number
      }
      check_migration_status: {
        Args: { migration_name: string }
        Returns: {
          table_exists: boolean
          columns_missing: string[]
          constraints_missing: string[]
          indexes_missing: string[]
        }[]
      }
      check_rls_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: string
        }[]
      }
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_user_onboarding: {
        Args: { user_uuid: string; onboarding_data?: Json }
        Returns: boolean
      }
      conversations_with_messages: {
        Args: { limit_param?: number }
        Returns: {
          id: string
          title: string
          updated_at: string
        }[]
      }
      create_default_inbox_folders: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string; encryption_key: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string; encryption_key: string }
        Returns: string
      }
      generate_billing_analytics: {
        Args: { start_date: string; end_date: string; organization_id?: string }
        Returns: Json
      }
      generate_referral_code: {
        Args: { email_input: string }
        Returns: string
      }
      get_ai_budget_status: {
        Args: { user_uuid: string; target_month?: string }
        Returns: {
          budget_limit: number
          current_spend: number
          remaining_budget: number
          utilization_percent: number
          request_count: number
          is_over_budget: boolean
        }[]
      }
      get_ai_model_analytics: {
        Args: { user_uuid?: string; days_back?: number }
        Returns: {
          model: string
          provider: string
          total_requests: number
          total_cost: number
          average_latency: number
          success_rate: number
          last_used: string
        }[]
      }
      get_business_health: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_business_health_score: {
        Args: Record<PropertyKey, never>
        Returns: {
          score: number
          breakdown: Json
          last_updated: string
          data_sources: string[]
          completeness_percentage: number
        }[]
      }
      get_client_engagement_summary: {
        Args: { company_uuid: string }
        Returns: {
          total_clients: number
          high_engagement_clients: number
          at_risk_clients: number
          avg_engagement_score: number
          total_estimated_value: number
        }[]
      }
      get_communication_health_score: {
        Args: { p_user_id: string; p_days_back?: number }
        Returns: {
          platform: string
          health_score: number
          metrics: Json
        }[]
      }
      get_cost_allocation_breakdown: {
        Args: {
          user_id_param: string
          start_date: string
          end_date: string
          group_by_param: string
        }
        Returns: {
          category: string
          total_cost: number
          total_tokens: number
          request_count: number
          avg_cost_per_request: number
          top_models: Json
          trend: string
        }[]
      }
      get_demo_business_health_score: {
        Args: Record<PropertyKey, never>
        Returns: {
          score: number
          breakdown: Json
          last_updated: string
          data_sources: string[]
          completeness_percentage: number
        }[]
      }
      get_inbox_stats: {
        Args: { p_user_id: string }
        Returns: {
          total_items: number
          unread_count: number
          high_priority_count: number
          flagged_count: number
          today_count: number
        }[]
      }
      get_inbox_summary: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_jwt_claims: {
        Args: { uid: string; email: string }
        Returns: Json
      }
      get_onboarding_progress: {
        Args: { user_uuid: string }
        Returns: {
          needs_onboarding: boolean
          current_step: string
          steps_completed: Json
          progress_percentage: number
        }[]
      }
      get_performance_trends: {
        Args: {
          metric_name: string
          timeframe_type: string
          agent_filter?: string
        }
        Returns: {
          timestamp: string
          value: number
          count: number
          agent_id: string
          model: string
          provider: string
        }[]
      }
      get_personal_context_for_ai: {
        Args: {
          user_uuid?: string
          business_context_filter?: Json
          recent_days?: number
          limit_count?: number
        }
        Returns: {
          thought_content: string
          category: string
          tags: string[]
          business_context: Json
          days_ago: number
          has_business_impact: boolean
        }[]
      }
      get_platform_comparison: {
        Args: { p_user_id: string; p_days_back?: number }
        Returns: {
          comparison_data: Json
        }[]
      }
      get_recent_learning_events: {
        Args: { p_limit?: number }
        Returns: {
          context: Json | null
          created_at: string | null
          data: Json | null
          event_type: string
          id: string
          user_id: string
        }[]
      }
      get_scheduled_syncs: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_integration_id: string
          user_id: string
          company_id: string
          integration_id: string
          sync_frequency: string
        }[]
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
        }[]
      }
      get_top_client_opportunities: {
        Args: { company_uuid: string; limit_count?: number }
        Returns: {
          client_id: string
          client_name: string
          estimated_value: number
          engagement_score: number
          relationship_strength: string
          last_interaction: string
          opportunity_score: number
        }[]
      }
      get_user_billing_status: {
        Args: { p_user_id: string }
        Returns: {
          tier: string
          has_active_subscription: boolean
          subscription_status: string
          current_period_end: string
          stripe_customer_id: string
        }[]
      }
      get_user_integration_analytics: {
        Args: { user_uuid: string }
        Returns: {
          total_integrations: number
          active_integrations: number
          integrations_in_error: number
          total_synced_data: number
        }[]
      }
      get_user_integration_details: {
        Args: { user_integration_id: string }
        Returns: {
          id: string
          name: string
          status: string
          last_sync_at: string
          total_syncs: number
          integration_name: string
          integration_icon: string
        }[]
      }
      get_user_quota_status: {
        Args: { p_user_id: string }
        Returns: {
          tier: string
          messages_today: number
          messages_this_hour: number
          files_uploaded_today: number
          max_messages_per_day: number
          max_messages_per_hour: number
          max_file_uploads_per_day: number
          streaming_enabled: boolean
          advanced_agents_enabled: boolean
        }[]
      }
      get_user_with_company: {
        Args: { user_uuid: string }
        Returns: {
          user_id: string
          email: string
          first_name: string
          last_name: string
          display_name: string
          avatar_url: string
          role: string
          department: string
          company_name: string
          company_id: string
          company_domain: string
        }[]
      }
      increment: {
        Args: { x: number }
        Returns: number
      }
      log_learning_event: {
        Args: { p_event_type: string; p_data?: Json; p_context?: Json }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_event_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: string
      }
      mark_inbox_items_read: {
        Args: { p_user_id: string; p_item_ids: string[] }
        Returns: number
      }
      match_documents: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: number
          content: string
          similarity: number
        }[]
      }
      match_ops_docs: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
          p_org?: string
        }
        Returns: {
          chunk: string
          similarity: number
        }[]
      }
      match_personal_thoughts: {
        Args: {
          query_embedding: string
          user_uuid: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          thought_id: string
          content: string
          category: string
          tags: string[]
          similarity: number
        }[]
      }
      record_business_health_snapshot: {
        Args: {
          p_user_id: string
          p_overall_score: number
          p_connected_sources: number
          p_verified_sources: number
          p_category_scores: Json
          p_data_quality_score: number
          p_completion_percentage: number
        }
        Returns: undefined
      }
      record_communication_event: {
        Args: {
          p_user_id: string
          p_company_id: string
          p_platform: string
          p_event_type: string
          p_event_data: Json
          p_channel_id?: string
          p_message_id?: string
          p_timestamp?: string
        }
        Returns: string
      }
      record_migration_check: {
        Args: {
          migration_name: string
          check_type: string
          target_name: string
          status: string
          notes?: string
        }
        Returns: undefined
      }
      refresh_mv_paypal_txns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rpc_list_paypal_txns: {
        Args: { p_org: string; p_limit?: number }
        Returns: unknown[]
      }
      safe_add_column: {
        Args: {
          table_name: string
          column_name: string
          column_definition: string
        }
        Returns: undefined
      }
      safe_add_constraint: {
        Args: {
          table_name: string
          constraint_name: string
          constraint_definition: string
        }
        Returns: undefined
      }
      safe_create_index: {
        Args: {
          index_name: string
          table_name: string
          index_definition: string
        }
        Returns: undefined
      }
      safe_create_table: {
        Args: { table_name: string; table_definition: string }
        Returns: undefined
      }
      search_personal_thoughts: {
        Args: {
          query_text: string
          user_uuid?: string
          category_filter?: string
          business_context_filter?: Json
          limit_count?: number
        }
        Returns: {
          id: string
          content: string
          category: string
          tags: string[]
          business_context: Json
          relevance_score: number
          created_at: string
        }[]
      }
      track_daily_usage: {
        Args: {
          p_user_id: string
          p_message_count?: number
          p_ai_requests?: number
          p_files_uploaded?: number
          p_tokens_used?: number
          p_estimated_cost?: number
        }
        Returns: undefined
      }
      update_assessment_scores: {
        Args: { target_company_id: string }
        Returns: undefined
      }
      update_folder_item_count: {
        Args: { p_folder_id: string }
        Returns: undefined
      }
      update_thought_with_workspace_data: {
        Args: {
          thought_id: string
          new_department: string
          new_priority: string
          new_estimated_effort: string
          new_ai_data: Json
        }
        Returns: {
          ai_clarification_data: Json | null
          ai_insights: Json | null
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          creation_date: string | null
          department: string | null
          estimated_effort: string | null
          id: string
          impact: string | null
          initiative: boolean | null
          interaction_method: string | null
          last_updated: string | null
          main_sub_categories: Json | null
          parent_idea_id: string | null
          personal_or_professional: string | null
          priority: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
          workflow_stage: string | null
        }
      }
      user_needs_onboarding: {
        Args: { user_uuid: string }
        Returns: boolean
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
