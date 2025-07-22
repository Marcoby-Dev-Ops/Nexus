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
      activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          company_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          occurred_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_ab_test_results: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          test_id: string
          timestamp: string | null
          user_id: string | null
          variant: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          test_id: string
          timestamp?: string | null
          user_id?: string | null
          variant: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          test_id?: string
          timestamp?: string | null
          user_id?: string | null
          variant?: string
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
      ai_action_logs: {
        Row: {
          action_data: Json | null
          action_type: string
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          error: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          result: Json | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          result?: Json | null
          started_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          result?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_business_profiles: {
        Row: {
          company_id: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          profile_data: Json | null
          profile_type: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          profile_data?: Json | null
          profile_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          profile_data?: Json | null
          profile_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_business_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_client_intelligence_alerts: {
        Row: {
          alert_data: Json | null
          alert_type: string
          company_id: string | null
          created_at: string | null
          id: string
          is_resolved: boolean | null
          severity: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_data?: Json | null
          alert_type: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          severity?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_data?: Json | null
          alert_type?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          severity?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_client_intelligence_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_client_interactions: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          interaction_data: Json | null
          interaction_type: string
          sentiment_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          sentiment_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          sentiment_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_client_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_companies: {
        Row: {
          analysis_data: Json | null
          analysis_type: string
          company_id: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          analysis_data?: Json | null
          analysis_type: string
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          analysis_data?: Json | null
          analysis_type?: string
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          profile_type: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          profile_data?: Json | null
          profile_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          profile_data?: Json | null
          profile_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      ai_inbox_items: {
        Row: {
          ai_insights: string[] | null
          body_content: string | null
          body_preview: string | null
          categories: string[] | null
          company_id: string | null
          compliance_flags: string[] | null
          created_at: string | null
          external_id: string | null
          has_attachments: boolean | null
          id: string
          importance: string | null
          integration_id: string | null
          is_archived: boolean | null
          is_deleted: boolean | null
          is_important: boolean | null
          is_read: boolean | null
          item_timestamp: string | null
          metadata: Json | null
          preview: string | null
          provider: string
          risk_score: number | null
          sender_email: string | null
          sender_name: string | null
          sentiment_score: number | null
          source_type: string
          subject: string | null
          thread_id: string | null
          title: string | null
          updated_at: string | null
          urgency_score: number | null
          user_id: string | null
        }
        Insert: {
          ai_insights?: string[] | null
          body_content?: string | null
          body_preview?: string | null
          categories?: string[] | null
          company_id?: string | null
          compliance_flags?: string[] | null
          created_at?: string | null
          external_id?: string | null
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          integration_id?: string | null
          is_archived?: boolean | null
          is_deleted?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          item_timestamp?: string | null
          metadata?: Json | null
          preview?: string | null
          provider?: string
          risk_score?: number | null
          sender_email?: string | null
          sender_name?: string | null
          sentiment_score?: number | null
          source_type?: string
          subject?: string | null
          thread_id?: string | null
          title?: string | null
          updated_at?: string | null
          urgency_score?: number | null
          user_id?: string | null
        }
        Update: {
          ai_insights?: string[] | null
          body_content?: string | null
          body_preview?: string | null
          categories?: string[] | null
          company_id?: string | null
          compliance_flags?: string[] | null
          created_at?: string | null
          external_id?: string | null
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          integration_id?: string | null
          is_archived?: boolean | null
          is_deleted?: boolean | null
          is_important?: boolean | null
          is_read?: boolean | null
          item_timestamp?: string | null
          metadata?: Json | null
          preview?: string | null
          provider?: string
          risk_score?: number | null
          sender_email?: string | null
          sender_name?: string | null
          sentiment_score?: number | null
          source_type?: string
          subject?: string | null
          thread_id?: string | null
          title?: string | null
          updated_at?: string | null
          urgency_score?: number | null
          user_id?: string | null
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
      ai_kpi_snapshots: {
        Row: {
          captured_at: string | null
          created_at: string | null
          department_id: string | null
          id: string
          kpi_id: string | null
          org_id: string
          source: string | null
          value: number | null
        }
        Insert: {
          captured_at?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          kpi_id?: string | null
          org_id: string
          source?: string | null
          value?: number | null
        }
        Update: {
          captured_at?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          kpi_id?: string | null
          org_id?: string
          source?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_kpi_snapshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
      analytics_events: {
        Row: {
          company_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          occurred_at: string | null
          page_url: string | null
          session_id: string | null
          timestamp: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          occurred_at?: string | null
          page_url?: string | null
          session_id?: string | null
          timestamp?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          occurred_at?: string | null
          page_url?: string | null
          session_id?: string | null
          timestamp?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          action_type: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          options: Json | null
          question_text: string
          question_type: string
          target_field: string | null
          updated_at: string | null
        }
        Insert: {
          action_type?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json | null
          question_text: string
          question_type: string
          target_field?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json | null
          question_text?: string
          question_type?: string
          target_field?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_log_events: {
        Row: {
          action: string
          company_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_events_company_id_fkey"
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
      chat_usage_tracking: {
        Row: {
          company_id: string | null
          conversation_id: string | null
          cost_usd: number | null
          created_at: string | null
          id: string
          message_count: number | null
          model_used: string | null
          session_duration_seconds: number | null
          token_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          model_used?: string | null
          session_duration_seconds?: number | null
          token_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          model_used?: string | null
          session_duration_seconds?: number | null
          token_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_usage_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_events: {
        Row: {
          channel: string | null
          company_id: string | null
          content: string | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          recipient: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          recipient?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          recipient?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
      company_status: {
        Row: {
          company_id: string
          created_at: string | null
          customer_satisfaction: number | null
          employee_engagement: number | null
          financial_health: number | null
          id: string
          last_updated: string | null
          market_position: number | null
          operational_efficiency: number | null
          overall_score: number | null
          recommendations: string[] | null
          risk_assessment: Json | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          customer_satisfaction?: number | null
          employee_engagement?: number | null
          financial_health?: number | null
          id?: string
          last_updated?: string | null
          market_position?: number | null
          operational_efficiency?: number | null
          overall_score?: number | null
          recommendations?: string[] | null
          risk_assessment?: Json | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          customer_satisfaction?: number | null
          employee_engagement?: number | null
          financial_health?: number | null
          id?: string
          last_updated?: string | null
          market_position?: number | null
          operational_efficiency?: number | null
          overall_score?: number | null
          recommendations?: string[] | null
          risk_assessment?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_status_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      component_usages: {
        Row: {
          company_id: string | null
          component_name: string
          created_at: string | null
          id: string
          last_used: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          component_name: string
          created_at?: string | null
          id?: string
          last_used?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          component_name?: string
          created_at?: string | null
          id?: string
          last_used?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "component_usages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          position: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          probability: number | null
          stage: string
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          probability?: number | null
          stage: string
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          probability?: number | null
          stage?: string
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_logs: {
        Row: {
          company_id: string | null
          context: Json | null
          created_at: string | null
          id: string
          log_level: string
          message: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          log_level: string
          message: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          log_level?: string
          message?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debug_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          category: string | null
          company_id: string
          created_at: string | null
          currency: string | null
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          currency?: string | null
          description: string
          expense_date: string
          id?: string
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_data: {
        Row: {
          created_at: string | null
          data_content: Json
          data_type: string
          id: string
          sync_timestamp: string | null
          updated_at: string | null
          user_integration_id: string
        }
        Insert: {
          created_at?: string | null
          data_content: Json
          data_type: string
          id?: string
          sync_timestamp?: string | null
          updated_at?: string | null
          user_integration_id: string
        }
        Update: {
          created_at?: string | null
          data_content?: Json
          data_type?: string
          id?: string
          sync_timestamp?: string | null
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
      invoices: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_date?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      model_usage: {
        Row: {
          company_id: string | null
          cost_usd: number | null
          created_at: string | null
          id: string
          model_name: string
          request_count: number | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_name: string
          request_count?: number | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_name?: string
          request_count?: number | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      ops_action_queue: {
        Row: {
          action_slug: string
          created_at: string | null
          id: string
          kpi_key: string | null
          org_id: string
          output: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          action_slug: string
          created_at?: string | null
          id?: string
          kpi_key?: string | null
          org_id: string
          output?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          action_slug?: string
          created_at?: string | null
          id?: string
          kpi_key?: string | null
          org_id?: string
          output?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_action_queue_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_thoughts: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          importance: number | null
          is_archived: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          importance?: number | null
          is_archived?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          importance?: number | null
          is_archived?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pins: {
        Row: {
          created_at: string | null
          id: string
          item_data: Json | null
          item_id: string | null
          item_type: string
          position: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_data?: Json | null
          item_id?: string | null
          item_type: string
          position?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_data?: Json | null
          item_id?: string | null
          item_type?: string
          position?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      realtime_sync_events: {
        Row: {
          company_id: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          status: string
          sync_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          status: string
          sync_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          status?: string
          sync_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "realtime_sync_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recents: {
        Row: {
          created_at: string | null
          id: string
          item_data: Json | null
          item_id: string | null
          item_type: string
          last_accessed: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_data?: Json | null
          item_id?: string | null
          item_type: string
          last_accessed?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_data?: Json | null
          item_id?: string | null
          item_type?: string
          last_accessed?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_health: {
        Row: {
          created_at: string | null
          error_count: number | null
          id: string
          last_check: string | null
          response_time_ms: number | null
          service_name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_check?: string | null
          response_time_ms?: number | null
          service_name: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_check?: string | null
          response_time_ms?: number | null
          service_name?: string
          status?: string
          updated_at?: string | null
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
      tasks: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          metadata: Json | null
          usage_count: number | null
          usage_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          metadata?: Json | null
          usage_count?: number | null
          usage_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          metadata?: Json | null
          usage_count?: number | null
          usage_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          company_id: string | null
          created_at: string | null
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          context_data: Json | null
          context_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context_data?: Json | null
          context_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context_data?: Json | null
          context_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      user_interaction_analysis: {
        Row: {
          analysis_data: Json | null
          company_id: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          interaction_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          interaction_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interaction_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_patterns: {
        Row: {
          created_at: string | null
          id: string
          pattern_data: Json | null
          pattern_type: string
          strength_score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pattern_data?: Json | null
          pattern_type: string
          strength_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pattern_data?: Json | null
          pattern_type?: string
          strength_score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_licenses: {
        Row: {
          company_id: string | null
          created_at: string | null
          expires_at: string | null
          features: Json | null
          id: string
          license_type: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          features?: Json | null
          id?: string
          license_type: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          features?: Json | null
          id?: string
          license_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_licenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          company: string | null
          company_id: string | null
          created_at: string | null
          department: string | null
          display_name: string | null
          email: string | null
          emergency_contact: Json | null
          executive_assistant_introduced: boolean | null
          first_name: string | null
          full_name: string | null
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
          settings: Json | null
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
          company?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: Json | null
          executive_assistant_introduced?: boolean | null
          first_name?: string | null
          full_name?: string | null
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
          settings?: Json | null
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
          company?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          email?: string | null
          emergency_contact?: Json | null
          executive_assistant_introduced?: boolean | null
          first_name?: string | null
          full_name?: string | null
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
          settings?: Json | null
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
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
