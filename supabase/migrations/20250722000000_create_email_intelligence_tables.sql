-- Migration: Create email intelligence tables
-- This migration creates the necessary tables for email intelligence functionality

-- Create ai_inbox_items table (unified inbox for emails, notifications, etc.)
CREATE TABLE IF NOT EXISTS public.ai_inbox_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Email-specific fields
    subject TEXT,
    sender_email TEXT,
    sender_name TEXT,
    recipient_email TEXT,
    content TEXT,
    html_content TEXT,
    message_id TEXT,
    thread_id TEXT,
    in_reply_to TEXT,
    email_references TEXT[],
    
    -- AI analysis fields
    ai_priority_score INTEGER DEFAULT 50 CHECK (ai_priority_score >= 0 AND ai_priority_score <= 100),
    ai_category TEXT,
    ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
    ai_summary TEXT,
    ai_action_items TEXT[],
    ai_processed_at TIMESTAMPTZ,
    ai_action_suggestion TEXT,
    
    -- Status and priority
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived', 'deleted')),
    is_important BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    snooze_until TIMESTAMPTZ,
    priority_score INTEGER DEFAULT 5 CHECK (priority_score >= 1 AND priority_score <= 10),
    
    -- Integration and source tracking
    integration_id UUID REFERENCES public.user_integrations(id) ON DELETE SET NULL,
    source_type TEXT DEFAULT 'email' CHECK (source_type IN ('email', 'notification', 'system', 'task', 'calendar')),
    external_id TEXT,
    
    -- Timestamps
    received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    item_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Display fields
    is_read BOOLEAN DEFAULT false,
    title TEXT,
    preview TEXT,
    sender TEXT,
    item_type TEXT DEFAULT 'email',
    
    -- Demo and archival
    is_demo BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false
);

-- Create ai_email_accounts table for managing email provider connections
CREATE TABLE IF NOT EXISTS public.ai_email_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Account details
    provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'microsoft_365', 'yahoo', 'other')),
    email_address TEXT NOT NULL,
    display_name TEXT,
    
    -- Authentication
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Sync settings
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency TEXT DEFAULT 'realtime' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily')),
    last_sync_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Metadata
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, email_address)
);

-- Create ai_email_messages table for detailed email storage
CREATE TABLE IF NOT EXISTS public.ai_email_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.ai_email_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Message details
    message_id TEXT NOT NULL,
    thread_id TEXT,
    subject TEXT,
    from_address TEXT NOT NULL,
    to_addresses TEXT[],
    cc_addresses TEXT[],
    bcc_addresses TEXT[],
    
    -- Content
    body_plain TEXT,
    body_html TEXT,
    snippet TEXT,
    
    -- Metadata
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    size_bytes INTEGER,
    has_attachments BOOLEAN DEFAULT false,
    attachment_count INTEGER DEFAULT 0,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_trashed BOOLEAN DEFAULT false,
    
    -- AI analysis
    ai_priority_score INTEGER DEFAULT 50 CHECK (ai_priority_score >= 0 AND ai_priority_score <= 100),
    ai_category TEXT,
    ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
    ai_summary TEXT,
    ai_action_items TEXT[],
    ai_processed_at TIMESTAMPTZ,
    
    -- External tracking
    external_id TEXT,
    labels TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(account_id, message_id)
);

-- Create ai_email_attachments table
CREATE TABLE IF NOT EXISTS public.ai_email_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES public.ai_email_messages(id) ON DELETE CASCADE,
    
    filename TEXT NOT NULL,
    content_type TEXT,
    size_bytes INTEGER,
    
    -- Storage
    storage_path TEXT,
    download_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_email_sync_jobs table for background processing
CREATE TABLE IF NOT EXISTS public.ai_email_sync_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.ai_email_accounts(id) ON DELETE CASCADE,
    
    job_type TEXT NOT NULL CHECK (job_type IN ('full_sync', 'incremental_sync', 'send_email')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    
    -- Job configuration
    sync_from TIMESTAMPTZ,
    sync_to TIMESTAMPTZ,
    folder_filter TEXT[],
    
    -- Progress tracking
    total_messages INTEGER DEFAULT 0,
    processed_messages INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Results
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_inbox_rules table for automated email processing
CREATE TABLE IF NOT EXISTS public.ai_inbox_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,
    
    -- Rule conditions and actions
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    
    -- Usage tracking
    times_triggered INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_user_id ON public.ai_inbox_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_timestamp ON public.ai_inbox_items(item_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_source_type ON public.ai_inbox_items(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_is_read ON public.ai_inbox_items(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_ai_priority ON public.ai_inbox_items(ai_priority_score DESC) WHERE ai_priority_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_email_accounts_user_id ON public.ai_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_accounts_sync_enabled ON public.ai_email_accounts(sync_enabled) WHERE sync_enabled = true;

CREATE INDEX IF NOT EXISTS idx_ai_email_messages_account_id ON public.ai_email_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_user_id ON public.ai_email_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_sent_at ON public.ai_email_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_is_read ON public.ai_email_messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_thread_id ON public.ai_email_messages(account_id, thread_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_ai_priority ON public.ai_email_messages(ai_priority_score DESC) WHERE ai_priority_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_email_attachments_message_id ON public.ai_email_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_ai_email_sync_jobs_account_id ON public.ai_email_sync_jobs(account_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_sync_jobs_status ON public.ai_email_sync_jobs(status);

CREATE INDEX IF NOT EXISTS idx_ai_inbox_rules_user_id ON public.ai_inbox_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_rules_active ON public.ai_inbox_rules(is_active) WHERE is_active = true;

-- Add triggers for updated_at columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_ai_inbox_items_updated_at'
    ) THEN
        CREATE TRIGGER update_ai_inbox_items_updated_at BEFORE UPDATE ON public.ai_inbox_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_ai_email_accounts_updated_at'
    ) THEN
        CREATE TRIGGER update_ai_email_accounts_updated_at BEFORE UPDATE ON public.ai_email_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_ai_email_messages_updated_at'
    ) THEN
        CREATE TRIGGER update_ai_email_messages_updated_at BEFORE UPDATE ON public.ai_email_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_ai_inbox_rules_updated_at'
    ) THEN
        CREATE TRIGGER update_ai_inbox_rules_updated_at BEFORE UPDATE ON public.ai_inbox_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.ai_inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_email_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_inbox_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- AI Inbox Items - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can view own inbox items'
    ) THEN
        CREATE POLICY "Users can view own inbox items" ON public.ai_inbox_items FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can insert own inbox items'
    ) THEN
        CREATE POLICY "Users can insert own inbox items" ON public.ai_inbox_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can update own inbox items'
    ) THEN
        CREATE POLICY "Users can update own inbox items" ON public.ai_inbox_items FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_items' 
        AND policyname = 'Users can delete own inbox items'
    ) THEN
        CREATE POLICY "Users can delete own inbox items" ON public.ai_inbox_items FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- AI Email Accounts - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_accounts' 
        AND policyname = 'Users can view own email accounts'
    ) THEN
        CREATE POLICY "Users can view own email accounts" ON public.ai_email_accounts FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_accounts' 
        AND policyname = 'Users can insert own email accounts'
    ) THEN
        CREATE POLICY "Users can insert own email accounts" ON public.ai_email_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_accounts' 
        AND policyname = 'Users can update own email accounts'
    ) THEN
        CREATE POLICY "Users can update own email accounts" ON public.ai_email_accounts FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_accounts' 
        AND policyname = 'Users can delete own email accounts'
    ) THEN
        CREATE POLICY "Users can delete own email accounts" ON public.ai_email_accounts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- AI Email Messages - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_messages' 
        AND policyname = 'Users can view own email messages'
    ) THEN
        CREATE POLICY "Users can view own email messages" ON public.ai_email_messages FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_messages' 
        AND policyname = 'Users can insert own email messages'
    ) THEN
        CREATE POLICY "Users can insert own email messages" ON public.ai_email_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_messages' 
        AND policyname = 'Users can update own email messages'
    ) THEN
        CREATE POLICY "Users can update own email messages" ON public.ai_email_messages FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_messages' 
        AND policyname = 'Users can delete own email messages'
    ) THEN
        CREATE POLICY "Users can delete own email messages" ON public.ai_email_messages FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- AI Email Attachments - users can only see their own (via message relationship)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_attachments' 
        AND policyname = 'Users can view own email attachments'
    ) THEN
        CREATE POLICY "Users can view own email attachments" ON public.ai_email_attachments FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.ai_email_messages 
                WHERE ai_email_messages.id = ai_email_attachments.message_id 
                AND ai_email_messages.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_attachments' 
        AND policyname = 'Users can insert own email attachments'
    ) THEN
        CREATE POLICY "Users can insert own email attachments" ON public.ai_email_attachments FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.ai_email_messages 
                WHERE ai_email_messages.id = ai_email_attachments.message_id 
                AND ai_email_messages.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_attachments' 
        AND policyname = 'Users can update own email attachments'
    ) THEN
        CREATE POLICY "Users can update own email attachments" ON public.ai_email_attachments FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.ai_email_messages 
                WHERE ai_email_messages.id = ai_email_attachments.message_id 
                AND ai_email_messages.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_attachments' 
        AND policyname = 'Users can delete own email attachments'
    ) THEN
        CREATE POLICY "Users can delete own email attachments" ON public.ai_email_attachments FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.ai_email_messages 
                WHERE ai_email_messages.id = ai_email_attachments.message_id 
                AND ai_email_messages.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- AI Email Sync Jobs - users can only see their own (via account relationship)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_sync_jobs' 
        AND policyname = 'Users can view own email sync jobs'
    ) THEN
        CREATE POLICY "Users can view own email sync jobs" ON public.ai_email_sync_jobs FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.ai_email_accounts 
                WHERE ai_email_accounts.id = ai_email_sync_jobs.account_id 
                AND ai_email_accounts.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_sync_jobs' 
        AND policyname = 'Users can insert own email sync jobs'
    ) THEN
        CREATE POLICY "Users can insert own email sync jobs" ON public.ai_email_sync_jobs FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.ai_email_accounts 
                WHERE ai_email_accounts.id = ai_email_sync_jobs.account_id 
                AND ai_email_accounts.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_sync_jobs' 
        AND policyname = 'Users can update own email sync jobs'
    ) THEN
        CREATE POLICY "Users can update own email sync jobs" ON public.ai_email_sync_jobs FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM public.ai_email_accounts 
                WHERE ai_email_accounts.id = ai_email_sync_jobs.account_id 
                AND ai_email_accounts.user_id = auth.uid()
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_email_sync_jobs' 
        AND policyname = 'Users can delete own email sync jobs'
    ) THEN
        CREATE POLICY "Users can delete own email sync jobs" ON public.ai_email_sync_jobs FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM public.ai_email_accounts 
                WHERE ai_email_accounts.id = ai_email_sync_jobs.account_id 
                AND ai_email_accounts.user_id = auth.uid()
            )
        );
    END IF;
END $$;

-- AI Inbox Rules - users can only see their own
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_rules' 
        AND policyname = 'Users can view own inbox rules'
    ) THEN
        CREATE POLICY "Users can view own inbox rules" ON public.ai_inbox_rules FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_rules' 
        AND policyname = 'Users can insert own inbox rules'
    ) THEN
        CREATE POLICY "Users can insert own inbox rules" ON public.ai_inbox_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_rules' 
        AND policyname = 'Users can update own inbox rules'
    ) THEN
        CREATE POLICY "Users can update own inbox rules" ON public.ai_inbox_rules FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_inbox_rules' 
        AND policyname = 'Users can delete own inbox rules'
    ) THEN
        CREATE POLICY "Users can delete own inbox rules" ON public.ai_inbox_rules FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$; 