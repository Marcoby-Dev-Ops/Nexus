-- RAG System Enhancement Workflows Migration
-- Pillar: 1,2 - Customer Success Automation + Business Workflow Intelligence

-- Create knowledge cards table for structured knowledge storage
CREATE TABLE IF NOT EXISTS public.ai_knowledge_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Source document reference
    document_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Knowledge content
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    insights JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    
    -- Classification
    document_type TEXT CHECK (document_type IN ('contract', 'invoice', 'report', 'policy', 'email', 'presentation', 'spreadsheet', 'other')),
    department TEXT CHECK (department IN ('sales', 'marketing', 'finance', 'operations', 'hr', 'engineering', 'general')),
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Status tracking
    is_verified BOOLEAN DEFAULT FALSE,
    verification_source TEXT,
    last_accessed TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create knowledge relationships table for building knowledge graphs
CREATE TABLE IF NOT EXISTS public.ai_knowledge_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relationship definition
    source_card_id UUID REFERENCES public.ai_knowledge_cards(id) ON DELETE CASCADE,
    target_card_id UUID REFERENCES public.ai_knowledge_cards(id) ON DELETE CASCADE,
    relationship_type TEXT CHECK (relationship_type IN ('references', 'contradicts', 'supports', 'prerequisite', 'related', 'supersedes')),
    
    -- Relationship strength and confidence
    strength DECIMAL(3,2) CHECK (strength >= 0 AND strength <= 1) DEFAULT 0.5,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1) DEFAULT 0.5,
    
    -- Auto-generated or manual
    is_auto_generated BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    
    -- Prevent duplicate relationships
    UNIQUE(source_card_id, target_card_id, relationship_type)
);

-- Create knowledge gaps tracking table
CREATE TABLE IF NOT EXISTS public.ai_knowledge_gaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Gap identification
    query_pattern TEXT NOT NULL,
    department TEXT,
    topic_area TEXT,
    gap_description TEXT NOT NULL,
    
    -- Gap metrics
    query_frequency INTEGER DEFAULT 1,
    last_queried TIMESTAMPTZ DEFAULT NOW(),
    priority_score DECIMAL(3,2) DEFAULT 0.5,
    
    -- Resolution tracking
    status TEXT CHECK (status IN ('identified', 'in_progress', 'resolved', 'deferred')) DEFAULT 'identified',
    assigned_to UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Source tracking
    identified_by TEXT DEFAULT 'system',
    source_queries JSONB DEFAULT '[]'::jsonb
);

-- Create document processing queue for async processing
CREATE TABLE IF NOT EXISTS public.ai_document_processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Document info
    document_id TEXT NOT NULL,
    document_url TEXT,
    document_name TEXT NOT NULL,
    document_type TEXT,
    file_size BIGINT,
    
    -- Processing status
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')) DEFAULT 'pending',
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- User and context
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    upload_context JSONB DEFAULT '{}'::jsonb,
    
    -- Processing results
    processing_results JSONB DEFAULT '{}'::jsonb,
    error_details JSONB DEFAULT '{}'::jsonb,
    
    -- Priority and scheduling
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    scheduled_for TIMESTAMPTZ DEFAULT NOW()
);

-- Create knowledge analytics table for tracking usage and effectiveness
CREATE TABLE IF NOT EXISTS public.ai_knowledge_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Event tracking
    event_type TEXT CHECK (event_type IN ('knowledge_accessed', 'knowledge_created', 'knowledge_updated', 'query_resolved', 'gap_identified')),
    knowledge_card_id UUID REFERENCES public.ai_knowledge_cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Context
    query_text TEXT,
    department TEXT,
    session_id TEXT,
    
    -- Metrics
    relevance_score DECIMAL(3,2),
    user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
    time_to_resolution INTEGER, -- seconds
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE public.ai_knowledge_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_document_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_analytics ENABLE ROW LEVEL SECURITY;

-- Knowledge cards policies
CREATE POLICY "Users can view knowledge cards in their company" ON public.ai_knowledge_cards
    FOR SELECT USING (
        company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Users can create knowledge cards" ON public.ai_knowledge_cards
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update their knowledge cards" ON public.ai_knowledge_cards
    FOR UPDATE USING (
        user_id = auth.uid() 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Knowledge relationships policies
CREATE POLICY "Users can view knowledge relationships in their company" ON public.ai_knowledge_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_knowledge_cards kc 
            WHERE kc.id = source_card_id 
            AND kc.company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
        )
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage knowledge relationships" ON public.ai_knowledge_relationships
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Knowledge gaps policies
CREATE POLICY "Users can view knowledge gaps in their company" ON public.ai_knowledge_gaps
    FOR SELECT USING (
        department IN (
            SELECT unnest(string_to_array(
                COALESCE((SELECT role FROM public.user_profiles WHERE id = auth.uid()), ''), 
                ','
            ))
        )
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage knowledge gaps" ON public.ai_knowledge_gaps
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Document processing queue policies
CREATE POLICY "Users can view their document processing queue" ON public.ai_document_processing_queue
    FOR SELECT USING (
        user_id = auth.uid() 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Users can add to document processing queue" ON public.ai_document_processing_queue
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND company_id = (SELECT company_id FROM public.user_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Service role can manage document processing queue" ON public.ai_document_processing_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Knowledge analytics policies
CREATE POLICY "Users can view knowledge analytics for their company" ON public.ai_knowledge_analytics
    FOR SELECT USING (
        user_id = auth.uid() 
        OR auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage knowledge analytics" ON public.ai_knowledge_analytics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_cards_document_id ON public.ai_knowledge_cards(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_cards_user_company ON public.ai_knowledge_cards(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_cards_department ON public.ai_knowledge_cards(department);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_cards_type ON public.ai_knowledge_cards(document_type);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_cards_priority ON public.ai_knowledge_cards(priority);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_cards_tags ON public.ai_knowledge_cards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_cards_insights ON public.ai_knowledge_cards USING GIN(insights);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_relationships_source ON public.ai_knowledge_relationships(source_card_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_relationships_target ON public.ai_knowledge_relationships(target_card_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_relationships_type ON public.ai_knowledge_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_gaps_department ON public.ai_knowledge_gaps(department);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_gaps_status ON public.ai_knowledge_gaps(status);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_gaps_priority ON public.ai_knowledge_gaps(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_gaps_frequency ON public.ai_knowledge_gaps(query_frequency DESC);

CREATE INDEX IF NOT EXISTS idx_ai_document_processing_queue_status ON public.ai_document_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_document_processing_queue_priority ON public.ai_document_processing_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_document_processing_queue_user ON public.ai_document_processing_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_document_processing_queue_scheduled ON public.ai_document_processing_queue(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_analytics_event_type ON public.ai_knowledge_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_analytics_knowledge_card ON public.ai_knowledge_analytics(knowledge_card_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_analytics_user ON public.ai_knowledge_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_analytics_recorded_at ON public.ai_knowledge_analytics(recorded_at DESC);

-- Add triggers for updated_at
CREATE TRIGGER update_ai_knowledge_cards_updated_at
    BEFORE UPDATE ON public.ai_knowledge_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_knowledge_gaps_updated_at
    BEFORE UPDATE ON public.ai_knowledge_gaps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_document_processing_queue_updated_at
    BEFORE UPDATE ON public.ai_document_processing_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add workflow configurations to n8n_workflow_configs table
INSERT INTO public.n8n_workflow_configs (
    workflow_id, 
    workflow_name, 
    description, 
    category, 
    trigger_type, 
    webhook_url, 
    is_active, 
    configuration
) VALUES 
(
    'YnPq8KzJwHFnXbvR',
    'Document Intelligence Processor',
    'Automated document analysis, classification, and knowledge extraction with AI-powered insights generation',
    'Knowledge Management',
    'webhook',
    '/api/n8n/document-intelligence',
    true,
    '{
        "trigger_events": ["document_uploaded", "email_attachment_received"],
        "processing_steps": [
            "document_classification",
            "entity_extraction", 
            "insight_generation",
            "knowledge_card_creation",
            "vector_embedding",
            "context_enrichment"
        ],
        "ai_models": {
            "classification": "gpt-4o-mini",
            "embedding": "text-embedding-3-small",
            "analysis": "gpt-4o-mini"
        },
        "output_tables": [
            "ai_knowledge_cards",
            "ai_vector_documents", 
            "ai_document_processing_queue"
        ],
        "business_impact": {
            "knowledge_automation": "95%",
            "processing_time_reduction": "80%",
            "insight_generation": "automated"
        }
    }'::jsonb
),
(
    'ZmQr9LzKxIGnYcwS',
    'RAG Context Enhancer',
    'Intelligent query analysis and context enrichment for enhanced RAG responses with business intelligence integration',
    'Knowledge Management', 
    'webhook',
    '/api/n8n/rag-context-enhancer',
    true,
    '{
        "trigger_events": ["user_query_received", "chat_message_sent"],
        "processing_steps": [
            "query_intent_analysis",
            "context_retrieval",
            "business_metrics_integration",
            "relationship_mapping",
            "enhanced_prompt_generation"
        ],
        "data_sources": [
            "ai_knowledge_cards",
            "ai_vector_documents",
            "business_health_scores",
            "department_metrics_view",
            "user_profiles"
        ],
        "ai_models": {
            "intent_analysis": "gpt-4o-mini",
            "embedding": "text-embedding-3-small"
        },
        "business_impact": {
            "response_relevance": "90%",
            "context_accuracy": "85%",
            "user_satisfaction": "improved"
        }
    }'::jsonb
),
(
    'AnSt0MzLyJHnZdxT',
    'Knowledge Base Optimizer',
    'Automated knowledge base maintenance, gap identification, and content optimization with predictive analytics',
    'Knowledge Management',
    'schedule',
    '/api/n8n/knowledge-optimizer',
    true,
    '{
        "schedule": "0 2 * * *",
        "processing_steps": [
            "content_freshness_audit",
            "knowledge_gap_detection", 
            "relationship_analysis",
            "usage_analytics_processing",
            "optimization_recommendations",
            "maintenance_task_creation"
        ],
        "optimization_criteria": {
            "content_age_threshold": "90 days",
            "access_frequency_threshold": "5 times/month",
            "relationship_confidence_threshold": 0.7,
            "gap_priority_threshold": 0.6
        },
        "ai_models": {
            "gap_analysis": "gpt-4o-mini",
            "optimization": "gpt-4o-mini"
        },
        "business_impact": {
            "knowledge_accuracy": "95%",
            "gap_detection": "automated",
            "maintenance_efficiency": "80%"
        }
    }'::jsonb
);

-- Add comments for operational context
COMMENT ON TABLE public.ai_knowledge_cards IS 'Structured knowledge storage with AI-generated insights and action items from processed documents';
COMMENT ON TABLE public.ai_knowledge_relationships IS 'Knowledge graph relationships for building semantic connections between information';
COMMENT ON TABLE public.ai_knowledge_gaps IS 'Tracking of identified knowledge gaps based on user queries and system analysis';
COMMENT ON TABLE public.ai_document_processing_queue IS 'Async document processing queue for handling document intelligence workflows';
COMMENT ON TABLE public.ai_knowledge_analytics IS 'Analytics tracking for knowledge usage, effectiveness, and user satisfaction';

COMMENT ON COLUMN public.ai_knowledge_cards.insights IS 'AI-generated business insights extracted from document content';
COMMENT ON COLUMN public.ai_knowledge_cards.action_items IS 'Actionable items identified from document analysis';
COMMENT ON COLUMN public.ai_knowledge_cards.confidence IS 'AI confidence score for document classification and analysis (0.0-1.0)';
COMMENT ON COLUMN public.ai_knowledge_relationships.strength IS 'Relationship strength score indicating how closely related the knowledge cards are';
COMMENT ON COLUMN public.ai_knowledge_gaps.priority_score IS 'System-calculated priority score based on query frequency and business impact';
COMMENT ON COLUMN public.ai_document_processing_queue.processing_results IS 'Detailed results from document processing including extracted data and metadata'; 