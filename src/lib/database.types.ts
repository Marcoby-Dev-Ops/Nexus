export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_interactions: {
        Row: {
          ai_response: string | null
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
            foreignKeyName: "ai_interactions_thought_id_fkey"
            columns: ["thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
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
            referencedRelation: "companies"
            referencedColumns: ["id"]
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
          name: string
          prerequisites: Json | null
          rate_limit_requests_per_hour: number | null
          rate_limit_requests_per_minute: number | null
          slug: string
          support_url: string | null
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
          name: string
          prerequisites?: Json | null
          rate_limit_requests_per_hour?: number | null
          rate_limit_requests_per_minute?: number | null
          slug: string
          support_url?: string | null
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
          name?: string
          prerequisites?: Json | null
          rate_limit_requests_per_hour?: number | null
          rate_limit_requests_per_minute?: number | null
          slug?: string
          support_url?: string | null
        }
        Relationships: []
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
            foreignKeyName: "thought_relationships_target_thought_id_fkey"
            columns: ["target_thought_id"]
            isOneToOne: false
            referencedRelation: "thoughts"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          ai_insights: Json | null
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          creation_date: string | null
          id: string
          impact: string | null
          initiative: boolean | null
          interaction_method: string | null
          last_updated: string | null
          main_sub_categories: Json | null
          parent_idea_id: string | null
          personal_or_professional: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
          workflow_stage: string | null
        }
        Insert: {
          ai_insights?: Json | null
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          creation_date?: string | null
          id?: string
          impact?: string | null
          initiative?: boolean | null
          interaction_method?: string | null
          last_updated?: string | null
          main_sub_categories?: Json | null
          parent_idea_id?: string | null
          personal_or_professional?: string | null
          status: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
          workflow_stage?: string | null
        }
        Update: {
          ai_insights?: Json | null
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          creation_date?: string | null
          id?: string
          impact?: string | null
          initiative?: boolean | null
          interaction_method?: string | null
          last_updated?: string | null
          main_sub_categories?: Json | null
          parent_idea_id?: string | null
          personal_or_professional?: string | null
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
      user_profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          company_id: string | null
          created_at: string | null
          department: string | null
          display_name: string | null
          emergency_contact: Json | null
          first_name: string | null
          github_url: string | null
          id: string
          job_title: string | null
          languages: Json | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          mobile: string | null
          onboarding_completed: boolean | null
          personal_email: string | null
          phone: string | null
          preferences: Json | null
          profile_completion_percentage: number | null
          role: string | null
          skills: string[] | null
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
          certifications?: string[] | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          emergency_contact?: Json | null
          first_name?: string | null
          github_url?: string | null
          id: string
          job_title?: string | null
          languages?: Json | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          mobile?: string | null
          onboarding_completed?: boolean | null
          personal_email?: string | null
          phone?: string | null
          preferences?: Json | null
          profile_completion_percentage?: number | null
          role?: string | null
          skills?: string[] | null
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
          certifications?: string[] | null
          company_id?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          emergency_contact?: Json | null
          first_name?: string | null
          github_url?: string | null
          id?: string
          job_title?: string | null
          languages?: Json | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          mobile?: string | null
          onboarding_completed?: boolean | null
          personal_email?: string | null
          phone?: string | null
          preferences?: Json | null
          profile_completion_percentage?: number | null
          role?: string | null
          skills?: string[] | null
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
        ]
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
    }
    Views: {
      user_chat_analytics: {
        Row: {
          avg_messages_per_session: number | null
          avg_satisfaction: number | null
          date: string | null
          most_used_department: string | null
          total_messages: number | null
          total_sessions: number | null
          unique_agents_used: number | null
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
    }
    Functions: {
      generate_referral_code: {
        Args: { email_input: string }
        Returns: string
      }
      get_communication_health_score: {
        Args: { p_user_id: string; p_days_back?: number }
        Returns: {
          platform: string
          health_score: number
          metrics: Json
        }[]
      }
      get_platform_comparison: {
        Args: { p_user_id: string; p_days_back?: number }
        Returns: {
          comparison_data: Json
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
