-- Unified Inbox with Email Integration
-- Pillar: 2 - Minimum Lovable Feature Set
-- Priority: #3 - Ship unified inbox with streamed tokens and quick filters

-- Email Accounts Table
CREATE TABLE IF NOT EXISTS ai_email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES ai_companies(id) ON DELETE CASCADE,
    
    -- Account Details
    email_address TEXT NOT NULL,
    display_name TEXT,
    provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'exchange', 'imap', 'smtp')),
    
    -- OAuth/Connection Details
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- IMAP/SMTP Configuration (for custom providers)
    imap_host TEXT,
    imap_port INTEGER,
    smtp_host TEXT,
    smtp_port INTEGER,
    use_ssl BOOLEAN DEFAULT true,
    
    -- Sync Configuration
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency INTERVAL DEFAULT '5 minutes',
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
    sync_error TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, email_address)
);

-- Email Messages Table
CREATE TABLE IF NOT EXISTS ai_email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES ai_email_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES ai_companies(id) ON DELETE CASCADE,
    
    -- Email Identifiers
    message_id TEXT NOT NULL, -- Provider's message ID
    thread_id TEXT, -- Provider's thread/conversation ID
    
    -- Email Headers
    subject TEXT,
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_emails TEXT[] NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    reply_to TEXT,
    
    -- Email Content
    body_text TEXT,
    body_html TEXT,
    snippet TEXT, -- First 150 chars for previews
    
    -- Email Metadata
    sent_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,
    is_spam BOOLEAN DEFAULT false,
    is_draft BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    
    -- AI-Generated Fields
    ai_summary TEXT,
    ai_priority_score INTEGER CHECK (ai_priority_score BETWEEN 1 AND 10),
    ai_category TEXT,
    ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
    ai_action_required BOOLEAN DEFAULT false,
    ai_processed_at TIMESTAMPTZ,
    
    -- Attachments
    has_attachments BOOLEAN DEFAULT false,
    attachment_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(account_id, message_id)
);

-- Email Attachments Table
CREATE TABLE IF NOT EXISTS ai_email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES ai_email_messages(id) ON DELETE CASCADE,
    
    filename TEXT NOT NULL,
    content_type TEXT,
    size_bytes INTEGER,
    
    -- Storage
    storage_path TEXT, -- Supabase Storage path
    download_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified Inbox Items Table (combines emails, notifications, system messages)
CREATE TABLE IF NOT EXISTS ai_inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES ai_companies(id) ON DELETE CASCADE,
    
    -- Item Type and Source
    item_type TEXT NOT NULL CHECK (item_type IN ('email', 'notification', 'system', 'task', 'calendar')),
    source_id UUID, -- References email_messages, notifications, etc.
    source_type TEXT, -- 'ai_email_messages', 'ai_notifications', etc.
    
    -- Display Content
    title TEXT NOT NULL,
    preview TEXT,
    sender TEXT,
    
    -- Status and Priority
    is_read BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    priority_score INTEGER DEFAULT 5 CHECK (priority_score BETWEEN 1 AND 10),
    
    -- Timestamps
    item_timestamp TIMESTAMPTZ NOT NULL, -- When the original item occurred
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- AI-Generated Insights
    ai_category TEXT,
    ai_action_suggestion TEXT,
    ai_urgency TEXT CHECK (ai_urgency IN ('low', 'medium', 'high', 'urgent'))
);

-- Email Sync Jobs Table (for background processing)
CREATE TABLE IF NOT EXISTS ai_email_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES ai_email_accounts(id) ON DELETE CASCADE,
    
    job_type TEXT NOT NULL CHECK (job_type IN ('full_sync', 'incremental_sync', 'send_email')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    
    -- Job Configuration
    sync_from TIMESTAMPTZ,
    sync_to TIMESTAMPTZ,
    folder_filter TEXT[],
    
    -- Progress Tracking
    total_messages INTEGER DEFAULT 0,
    processed_messages INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Results
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ai_email_accounts_user_id ON ai_email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_accounts_company_id ON ai_email_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_accounts_sync_enabled ON ai_email_accounts(sync_enabled) WHERE sync_enabled = true;

CREATE INDEX IF NOT EXISTS idx_ai_email_messages_account_id ON ai_email_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_user_id ON ai_email_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_sent_at ON ai_email_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_is_read ON ai_email_messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_thread_id ON ai_email_messages(account_id, thread_id);
CREATE INDEX IF NOT EXISTS idx_ai_email_messages_ai_priority ON ai_email_messages(ai_priority_score DESC) WHERE ai_priority_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_user_id ON ai_inbox_items(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_timestamp ON ai_inbox_items(item_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_unread ON ai_inbox_items(user_id, is_read, item_timestamp DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_ai_inbox_items_priority ON ai_inbox_items(user_id, priority_score DESC, item_timestamp DESC);

-- RLS Policies
ALTER TABLE ai_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_email_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Email Accounts Policies
CREATE POLICY "Users can manage their own email accounts" ON ai_email_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Email Messages Policies
CREATE POLICY "Users can access their own email messages" ON ai_email_messages
    FOR ALL USING (auth.uid() = user_id);

-- Email Attachments Policies
CREATE POLICY "Users can access attachments for their messages" ON ai_email_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_email_messages m 
            WHERE m.id = ai_email_attachments.message_id 
            AND m.user_id = auth.uid()
        )
    );

-- Inbox Items Policies
CREATE POLICY "Users can manage their own inbox items" ON ai_inbox_items
    FOR ALL USING (auth.uid() = user_id);

-- Email Sync Jobs Policies
CREATE POLICY "Users can access their own sync jobs" ON ai_email_sync_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_email_accounts a 
            WHERE a.id = ai_email_sync_jobs.account_id 
            AND a.user_id = auth.uid()
        )
    );

-- Functions for Inbox Management

-- Function to update inbox item when email is read
CREATE OR REPLACE FUNCTION update_inbox_item_on_email_read()
RETURNS TRIGGER AS $$
BEGIN
    -- Update corresponding inbox item when email read status changes
    UPDATE ai_inbox_items 
    SET 
        is_read = NEW.is_read,
        updated_at = NOW()
    WHERE 
        source_type = 'ai_email_messages' 
        AND source_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync email read status with inbox
CREATE TRIGGER trigger_update_inbox_on_email_read
    AFTER UPDATE OF is_read ON ai_email_messages
    FOR EACH ROW
    WHEN (OLD.is_read IS DISTINCT FROM NEW.is_read)
    EXECUTE FUNCTION update_inbox_item_on_email_read();

-- Function to create inbox item for new emails
CREATE OR REPLACE FUNCTION create_inbox_item_for_email()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ai_inbox_items (
        user_id,
        company_id,
        item_type,
        source_id,
        source_type,
        title,
        preview,
        sender,
        is_read,
        is_important,
        priority_score,
        item_timestamp,
        ai_category,
        ai_urgency
    ) VALUES (
        NEW.user_id,
        NEW.company_id,
        'email',
        NEW.id,
        'ai_email_messages',
        COALESCE(NEW.subject, '(No Subject)'),
        NEW.snippet,
        COALESCE(NEW.from_name, NEW.from_email),
        NEW.is_read,
        NEW.is_important,
        COALESCE(NEW.ai_priority_score, 5),
        NEW.sent_at,
        NEW.ai_category,
        CASE 
            WHEN NEW.ai_priority_score >= 8 THEN 'urgent'
            WHEN NEW.ai_priority_score >= 6 THEN 'high'
            WHEN NEW.ai_priority_score >= 4 THEN 'medium'
            ELSE 'low'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create inbox items for new emails
CREATE TRIGGER trigger_create_inbox_item_for_email
    AFTER INSERT ON ai_email_messages
    FOR EACH ROW
    EXECUTE FUNCTION create_inbox_item_for_email();

-- Function to get inbox summary
CREATE OR REPLACE FUNCTION get_inbox_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_items', COUNT(*),
        'unread_count', COUNT(*) FILTER (WHERE is_read = false),
        'important_count', COUNT(*) FILTER (WHERE is_important = true),
        'urgent_count', COUNT(*) FILTER (WHERE ai_urgency = 'urgent'),
        'categories', json_agg(DISTINCT ai_category) FILTER (WHERE ai_category IS NOT NULL),
        'last_updated', MAX(updated_at)
    ) INTO result
    FROM ai_inbox_items
    WHERE user_id = p_user_id AND is_archived = false;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 