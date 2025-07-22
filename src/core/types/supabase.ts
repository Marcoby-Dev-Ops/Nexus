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
      ai_billing_records: {
        Row: {
          additional_fees: Json
          base_amount: number
          billing_period_end: string
          billing_period_start: string
          created_at: string
          id: string
          organization_id: string | null
          overage_charges: number
          payment_due: string
          plan_id: string
          status: string
          token_usage_included: number
          token_usage_overage: number
          token_usage_total: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_fees?: Json
          base_amount: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          id?: string
          organization_id?: string | null
          overage_charges?: number
          payment_due: string
          plan_id: string
          status?: string
          token_usage_included?: number
          token_usage_overage?: number
          token_usage_total?: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_fees?: Json
          base_amount?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          overage_charges?: number
          payment_due?: string
          plan_id?: string
          status?: string
          token_usage_included?: number
          token_usage_overage?: number
          token_usage_total?: number
          total_amount?: number
          updated_at?: string
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
          budget_limit: number
          created_at: string
          current_spend: number
          id: string
          last_updated: string
          month_year: string
          organization_id: string | null
          request_count: number
          user_id: string | null
        }
        Insert: {
          budget_limit?: number
          created_at?: string
          current_spend?: number
          id?: string
          last_updated?: string
          month_year: string
          organization_id?: string | null
          request_count?: number
          user_id?: string | null
        }
        Update: {
          budget_limit?: number
          created_at?: string
          current_spend?: number
          id?: string
          last_updated?: string
          month_year?: string
          organization_id?: string | null
          request_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      ai_cost_allocations: {
        Row: {
          agent_id: string
          billing_category: string
          cost: number
          cost_center: string | null
          created_at: string
          department_id: string | null
          id: string
          model: string
          organization_id: string | null
          project_id: string | null
          provider: string
          timestamp: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          agent_id: string
          billing_category: string
          cost: number
          cost_center?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          model: string
          organization_id?: string | null
          project_id?: string | null
          provider: string
          timestamp?: string
          tokens_used: number
          user_id: string
        }
        Update: {
          agent_id?: string
          billing_category?: string
          cost?: number
          cost_center?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          model?: string
          organization_id?: string | null
          project_id?: string | null
          provider?: string
          timestamp?: string
          tokens_used?: number
          user_id?: string
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
      ai_insights: {
        Row: {
          company_id: string | null
          confidence_score: number | null
          created_at: string | null
          data: Json | null
          description: string | null
          id: string
          insight_type: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          insight_type: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          id?: string
          insight_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interactions: {
        Row: {
          company_id: string | null
          conversation_id: string | null
          cost_usd: number | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          interaction_type: string
          metadata: Json | null
          output_data: Json | null
          processing_time_ms: number | null
          status: string | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          interaction_type: string
          metadata?: Json | null
          output_data?: Json | null
          processing_time_ms?: number | null
          status?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          interaction_type?: string
          metadata?: Json | null
          output_data?: Json | null
          processing_time_ms?: number | null
          status?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
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
          agent_id: string | null
          cost: number
          created_at: string
          id: string
          latency: number
          model: string
          provider: string
          query_type: string | null
          success: boolean
          timestamp: string
          tokens_used: number
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          latency?: number
          model: string
          provider: string
          query_type?: string | null
          success?: boolean
          timestamp?: string
          tokens_used?: number
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          latency?: number
          model?: string
          provider?: string
          query_type?: string | null
          success?: boolean
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
      billing_plans: {
        Row: {
          ai_model_access: Json
          created_at: string
          features: string[]
          id: string
          included_tokens: number
          is_active: boolean
          limits: Json
          monthly_fee: number
          name: string
          overage_rate_per_token: number
          type: string
          updated_at: string
        }
        Insert: {
          ai_model_access?: Json
          created_at?: string
          features?: string[]
          id: string
          included_tokens?: number
          is_active?: boolean
          limits?: Json
          monthly_fee?: number
          name: string
          overage_rate_per_token?: number
          type: string
          updated_at?: string
        }
        Update: {
          ai_model_access?: Json
          created_at?: string
          features?: string[]
          id?: string
          included_tokens?: number
          is_active?: boolean
          limits?: Json
          monthly_fee?: number
          name?: string
          overage_rate_per_token?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_health: {
        Row: {
          company_id: string | null
          created_at: string | null
          health_score: number | null
          id: string
          last_calculated_at: string | null
          metrics: Json | null
          recommendations: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          health_score?: number | null
          id?: string
          last_calculated_at?: string | null
          metrics?: Json | null
          recommendations?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          health_score?: number | null
          id?: string
          last_calculated_at?: string | null
          metrics?: Json | null
          recommendations?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_health_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          settings: Json | null
          size: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          size?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          size?: string | null
          updated_at?: string | null
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
          auth_type: string
          category: string
          config_schema: Json | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_setup_time: string | null
          features: Json | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          auth_type?: string
          category: string
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_setup_time?: string | null
          features?: Json | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          auth_type?: string
          category?: string
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_setup_time?: string | null
          features?: Json | null
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
          company_id: string
          created_at: string
          id: string
          webhook_url: string
          workflow_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          webhook_url: string
          workflow_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          webhook_url?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token: string
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
          access_token: string
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
          access_token?: string
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
          id: string
          metadata: Json | null
          path: string
          pinned_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          path: string
          pinned_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          path?: string
          pinned_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      realtime_events: {
        Row: {
          company_id: string
          created_at: string | null
          entity: string
          entity_id: string
          event_type: string
          id: string
          payload: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          entity: string
          entity_id: string
          event_type: string
          id?: string
          payload?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          entity?: string
          entity_id?: string
          event_type?: string
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      Recent: {
        Row: {
          id: string
          metadata: Json | null
          path: string
          title: string | null
          user_id: string
          visited_at: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          path: string
          title?: string | null
          user_id: string
          visited_at?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          path?: string
          title?: string | null
          user_id?: string
          visited_at?: string | null
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
      user_billing_plans: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          plan_id: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          plan_id: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          plan_id?: string
          started_at?: string
          updated_at?: string
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
      user_integrations: {
        Row: {
          company_id: string | null
          config: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          integration_id: string
          last_sync: string | null
          name: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_id: string
          last_sync?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string
          last_sync?: string | null
          name?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          department: string | null
          display_name: string | null
          first_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          learning_goals: string[] | null
          onboarding_completed: boolean | null
          personal_interests: string[] | null
          personal_manifest: Json | null
          phone: string | null
          preferences: Json | null
          role: string | null
          thought_capture_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          first_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          learning_goals?: string[] | null
          onboarding_completed?: boolean | null
          personal_interests?: string[] | null
          personal_manifest?: Json | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          thought_capture_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          learning_goals?: string[] | null
          onboarding_completed?: boolean | null
          personal_interests?: string[] | null
          personal_manifest?: Json | null
          phone?: string | null
          preferences?: Json | null
          role?: string | null
          thought_capture_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
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
    }
    Functions: {
      analyze_ab_test: {
        Args: { test_id_param: string }
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_rls_security: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: string
        }[]
      }
      generate_billing_analytics: {
        Args: { start_date: string; end_date: string; organization_id?: string }
        Returns: Json
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
      get_company_id_from_user_id: {
        Args: { user_id: string }
        Returns: string
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
      get_jwt_claims: {
        Args: { uid: string; email: string }
        Returns: Json
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
      get_scheduled_syncs: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_integration_id: string
          integration_name: string
          next_sync_at: string
          sync_frequency: string
        }[]
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
        Returns: unknown
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
