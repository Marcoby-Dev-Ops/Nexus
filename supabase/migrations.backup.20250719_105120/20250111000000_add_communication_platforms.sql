-- ====================================================================
-- COMMUNICATION PLATFORMS MIGRATION
-- Add support for Slack and Microsoft Teams integrations
-- ====================================================================

-- Insert Slack integration into integrations table
INSERT INTO public.integrations (
    name,
    slug,
    category,
    auth_type,
    description,
    icon_url,
    documentation_url,
    support_url,
    config_schema,
    default_config,
    is_active,
    is_beta,
    is_enterprise,
    estimated_setup_time,
    difficulty,
    rate_limit_requests_per_minute,
    rate_limit_requests_per_hour,
    features,
    prerequisites
) VALUES (
    'Slack',
    'slack',
    'communication',
    'oauth',
    'Connect your Slack workspace to analyze communication patterns, channel activity, and team collaboration insights.',
    '/integrations/slack-icon.svg',
    'https://api.slack.com/docs',
    'https://slack.com/help',
    '{
        "type": "object",
        "properties": {
            "workspace_url": {
                "type": "string",
                "title": "Workspace URL",
                "description": "Your Slack workspace URL (e.g., yourcompany.slack.com)"
            },
            "bot_token": {
                "type": "string",
                "title": "Bot User OAuth Token",
                "description": "OAuth token for your Slack bot",
                "format": "password"
            },
            "user_token": {
                "type": "string", 
                "title": "User OAuth Token",
                "description": "OAuth token for user permissions",
                "format": "password"
            },
            "channels_to_monitor": {
                "type": "array",
                "title": "Channels to Monitor",
                "description": "List of channel IDs to include in analytics",
                "items": {
                    "type": "string"
                }
            },
            "sync_frequency": {
                "type": "string",
                "title": "Sync Frequency",
                "enum": ["realtime", "hourly", "daily"],
                "default": "hourly"
            },
            "include_private_channels": {
                "type": "boolean",
                "title": "Include Private Channels",
                "description": "Whether to include private channels the bot has access to",
                "default": false
            }
        },
        "required": ["workspace_url", "bot_token"]
    }',
    '{
        "sync_frequency": "hourly",
        "include_private_channels": false,
        "channels_to_monitor": []
    }',
    true,
    false,
    false,
    '15 min',
    'medium',
    30,
    1000,
    '[
        "Message Analytics",
        "Channel Activity Tracking", 
        "User Engagement Metrics",
        "Response Time Analysis",
        "Peak Activity Identification",
        "Cross-Channel Insights",
        "Emoji and Reaction Analytics",
        "File Sharing Analytics",
        "Thread Conversation Analysis",
        "Custom Status Tracking"
    ]',
    '[
        "Slack workspace admin access",
        "Ability to create Slack apps",
        "Bot permissions in target channels"
    ]'
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    config_schema = EXCLUDED.config_schema,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Insert Microsoft Teams integration into integrations table
INSERT INTO public.integrations (
    name,
    slug,
    category,
    auth_type,
    description,
    icon_url,
    documentation_url,
    support_url,
    config_schema,
    default_config,
    is_active,
    is_beta,
    is_enterprise,
    estimated_setup_time,
    difficulty,
    rate_limit_requests_per_minute,
    rate_limit_requests_per_hour,
    features,
    prerequisites
) VALUES (
    'Microsoft Teams',
    'microsoft-teams',
    'communication',
    'oauth',
    'Connect Microsoft Teams to analyze meeting patterns, chat activity, and collaboration insights across your organization.',
    '/integrations/teams-icon.svg',
    'https://docs.microsoft.com/en-us/graph/api/overview',
    'https://docs.microsoft.com/en-us/microsoftteams/',
    '{
        "type": "object",
        "properties": {
            "tenant_id": {
                "type": "string",
                "title": "Tenant ID",
                "description": "Your Microsoft 365 tenant ID"
            },
            "client_id": {
                "type": "string",
                "title": "Application (client) ID",
                "description": "Azure AD application client ID"
            },
            "client_secret": {
                "type": "string",
                "title": "Client Secret",
                "description": "Azure AD application client secret",
                "format": "password"
            },
            "teams_to_monitor": {
                "type": "array",
                "title": "Teams to Monitor",
                "description": "List of team IDs to include in analytics",
                "items": {
                    "type": "string"
                }
            },
            "sync_frequency": {
                "type": "string",
                "title": "Sync Frequency",
                "enum": ["hourly", "daily", "weekly"],
                "default": "daily"
            },
            "include_meetings": {
                "type": "boolean",
                "title": "Include Meeting Analytics",
                "description": "Whether to analyze meeting data",
                "default": true
            },
            "include_chat_messages": {
                "type": "boolean",
                "title": "Include Chat Messages",
                "description": "Whether to analyze chat messages",
                "default": true
            }
        },
        "required": ["tenant_id", "client_id", "client_secret"]
    }',
    '{
        "sync_frequency": "daily",
        "include_meetings": true,
        "include_chat_messages": true,
        "teams_to_monitor": []
    }',
    true,
    false,
    true,
    '20 min',
    'advanced',
    20,
    500,
    '[
        "Meeting Analytics",
        "Chat Message Analysis",
        "Team Collaboration Metrics",
        "Channel Activity Tracking",
        "User Engagement Analysis",
        "Meeting Attendance Patterns",
        "Response Time Metrics",
        "Cross-Team Communication",
        "File Sharing Analytics",
        "Call and Video Analytics"
    ]',
    '[
        "Microsoft 365 admin access",
        "Azure AD application registration",
        "Microsoft Graph API permissions",
        "Teams admin center access"
    ]'
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    config_schema = EXCLUDED.config_schema,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Create communication_analytics table for storing unified insights
CREATE TABLE IF NOT EXISTS public.communication_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Time period for the analytics
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('hour', 'day', 'week', 'month')),
    
    -- Platform-specific metrics
    slack_metrics JSONB DEFAULT '{}',
    teams_metrics JSONB DEFAULT '{}',
    
    -- Unified insights
    unified_insights JSONB DEFAULT '{}',
    health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
    
    -- Communication patterns
    peak_hours JSONB DEFAULT '[]',
    response_patterns JSONB DEFAULT '{}',
    collaboration_patterns JSONB DEFAULT '{}',
    
    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    optimization_suggestions JSONB DEFAULT '[]',
    
    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    data_sources JSONB DEFAULT '[]', -- Which platforms contributed to this analysis
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, company_id, period_start, period_end, period_type)
);

-- Create communication_events table for tracking real-time events
CREATE TABLE IF NOT EXISTS public.communication_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_integration_id UUID NOT NULL REFERENCES public.user_integrations(id) ON DELETE CASCADE,
    
    -- Event details
    event_type TEXT NOT NULL, -- 'message', 'meeting', 'reaction', 'file_share', etc.
    platform TEXT NOT NULL CHECK (platform IN ('slack', 'teams')),
    
    -- Event data
    external_id TEXT, -- ID from external platform
    channel_id TEXT,
    user_id_external TEXT, -- User ID from external platform
    timestamp TIMESTAMPTZ NOT NULL,
    
    -- Event content (anonymized/aggregated for privacy)
    content_type TEXT, -- 'text', 'file', 'call', etc.
    content_length INTEGER,
    has_mentions BOOLEAN DEFAULT false,
    has_attachments BOOLEAN DEFAULT false,
    reaction_count INTEGER DEFAULT 0,
    
    -- Metadata
    raw_data JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for efficient querying
    INDEX(user_integration_id, platform, timestamp),
    INDEX(timestamp, event_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_analytics_user_period 
ON public.communication_analytics(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_communication_analytics_company_period 
ON public.communication_analytics(company_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_communication_analytics_health_score 
ON public.communication_analytics(health_score DESC);

CREATE INDEX IF NOT EXISTS idx_communication_events_platform_timestamp 
ON public.communication_events(platform, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_communication_events_user_timestamp 
ON public.communication_events(user_integration_id, timestamp DESC);

-- Create trigger for updating updated_at
CREATE TRIGGER update_communication_analytics_updated_at
    BEFORE UPDATE ON public.communication_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- FUNCTIONS FOR COMMUNICATION ANALYTICS
-- ====================================================================

-- Function to get communication health score for a user
CREATE OR REPLACE FUNCTION get_communication_health_score(
    user_uuid UUID,
    company_uuid UUID DEFAULT NULL,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    overall_score INTEGER,
    response_time_score INTEGER,
    collaboration_score INTEGER,
    platform_utilization_score INTEGER,
    meeting_efficiency_score INTEGER,
    last_calculated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.health_score as overall_score,
        COALESCE((ca.unified_insights->'breakdown'->>'responseTime')::INTEGER, 0) as response_time_score,
        COALESCE((ca.unified_insights->'breakdown'->>'crossTeamCollaboration')::INTEGER, 0) as collaboration_score,
        COALESCE((ca.unified_insights->'breakdown'->>'platformUtilization')::INTEGER, 0) as platform_utilization_score,
        COALESCE((ca.unified_insights->'breakdown'->>'meetingEfficiency')::INTEGER, 0) as meeting_efficiency_score,
        ca.calculated_at as last_calculated
    FROM public.communication_analytics ca
    WHERE ca.user_id = user_uuid
        AND (company_uuid IS NULL OR ca.company_id = company_uuid)
        AND ca.period_start >= NOW() - INTERVAL '1 day' * days_back
        AND ca.period_type = 'day'
    ORDER BY ca.calculated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get platform comparison data
CREATE OR REPLACE FUNCTION get_platform_comparison(
    user_uuid UUID,
    company_uuid UUID DEFAULT NULL,
    days_back INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    slack_data JSONB;
    teams_data JSONB;
BEGIN
    -- Get aggregated Slack metrics
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'date', period_start,
                'messages', COALESCE(slack_metrics->'messageCount', '0')::INTEGER,
                'response_time', COALESCE(slack_metrics->'averageResponseTime', '0')::INTEGER,
                'active_users', COALESCE(slack_metrics->'activeUsers', '0')::INTEGER
            )
        ), 
        '[]'::jsonb
    ) INTO slack_data
    FROM public.communication_analytics
    WHERE user_id = user_uuid
        AND (company_uuid IS NULL OR company_id = company_uuid)
        AND period_start >= NOW() - INTERVAL '1 day' * days_back
        AND slack_metrics IS NOT NULL;

    -- Get aggregated Teams metrics
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'date', period_start,
                'messages', COALESCE(teams_metrics->'messageCount', '0')::INTEGER,
                'meetings', COALESCE(teams_metrics->'meetingCount', '0')::INTEGER,
                'response_time', COALESCE(teams_metrics->'averageResponseTime', '0')::INTEGER,
                'active_users', COALESCE(teams_metrics->'activeUsers', '0')::INTEGER
            )
        ),
        '[]'::jsonb
    ) INTO teams_data
    FROM public.communication_analytics
    WHERE user_id = user_uuid
        AND (company_uuid IS NULL OR company_id = company_uuid)
        AND period_start >= NOW() - INTERVAL '1 day' * days_back
        AND teams_metrics IS NOT NULL;

    -- Build result
    result := jsonb_build_object(
        'slack', slack_data,
        'teams', teams_data,
        'generated_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record communication event (for real-time tracking)
CREATE OR REPLACE FUNCTION record_communication_event(
    integration_uuid UUID,
    event_type_param TEXT,
    platform_param TEXT,
    external_id_param TEXT DEFAULT NULL,
    channel_id_param TEXT DEFAULT NULL,
    user_id_external_param TEXT DEFAULT NULL,
    timestamp_param TIMESTAMPTZ DEFAULT NOW(),
    content_type_param TEXT DEFAULT 'text',
    content_length_param INTEGER DEFAULT 0,
    has_mentions_param BOOLEAN DEFAULT false,
    has_attachments_param BOOLEAN DEFAULT false,
    reaction_count_param INTEGER DEFAULT 0,
    raw_data_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.communication_events (
        user_integration_id,
        event_type,
        platform,
        external_id,
        channel_id,
        user_id_external,
        timestamp,
        content_type,
        content_length,
        has_mentions,
        has_attachments,
        reaction_count,
        raw_data
    ) VALUES (
        integration_uuid,
        event_type_param,
        platform_param,
        external_id_param,
        channel_id_param,
        user_id_external_param,
        timestamp_param,
        content_type_param,
        content_length_param,
        has_mentions_param,
        has_attachments_param,
        reaction_count_param,
        raw_data_param
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON public.communication_analytics TO authenticated;
GRANT SELECT, INSERT ON public.communication_events TO authenticated;
GRANT EXECUTE ON FUNCTION get_communication_health_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_comparison TO authenticated;
GRANT EXECUTE ON FUNCTION record_communication_event TO authenticated; 