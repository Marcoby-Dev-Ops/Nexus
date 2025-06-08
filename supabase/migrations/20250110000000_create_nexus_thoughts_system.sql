-- Create Nexus Thoughts System Database Schema
-- Based on Marcoby Nexus: Idea Management diagrams

-- Create thoughts table (main storage for ideas, tasks, reminders, updates)
CREATE TABLE IF NOT EXISTS public.thoughts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Core fields from diagram
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    creation_date TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Content and categorization
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('idea', 'task', 'reminder', 'update')),
    
    -- Status management from diagrams
    status TEXT NOT NULL CHECK (status IN (
        'future_goals', 'concept', 'in_progress', 'completed',
        'pending', 'reviewed', 'implemented',
        'not_started', 'upcoming', 'due', 'overdue'
    )),
    
    -- Classification fields
    personal_or_professional TEXT CHECK (personal_or_professional IN ('personal', 'professional')),
    main_sub_categories JSONB DEFAULT '[]',
    initiative BOOLEAN DEFAULT false,
    impact TEXT,
    
    -- Workflow tracking
    parent_idea_id UUID REFERENCES public.thoughts(id), -- For linking tasks/reminders to ideas
    workflow_stage TEXT CHECK (workflow_stage IN ('create_idea', 'update_idea', 'implement_idea', 'achievement')),
    
    -- AI and interaction metadata
    ai_insights JSONB DEFAULT '{}',
    interaction_method TEXT CHECK (interaction_method IN ('text', 'speech', 'copy_paste', 'upload')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create thought_relationships table for complex connections
CREATE TABLE IF NOT EXISTS public.thought_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_thought_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
    target_thought_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'spawns_task', 'spawns_reminder', 'implements', 'relates_to', 'depends_on', 'blocks'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_thought_id, target_thought_id, relationship_type)
);

-- Create AI interactions table for tracking prompts and responses
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thought_id UUID REFERENCES public.thoughts(id) ON DELETE SET NULL,
    
    -- Interaction data
    prompt_text TEXT,
    ai_response TEXT,
    interaction_type TEXT CHECK (interaction_type IN ('insight', 'suggestion', 'reminder', 'analysis')),
    context_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger for thoughts
CREATE OR REPLACE FUNCTION update_thoughts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_updated = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_thoughts_updated_at
    BEFORE UPDATE ON public.thoughts
    FOR EACH ROW
    EXECUTE FUNCTION update_thoughts_updated_at_column();

-- Add RLS policies
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thought_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- Thoughts policies
CREATE POLICY "Users can view own thoughts" ON public.thoughts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thoughts" ON public.thoughts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thoughts" ON public.thoughts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thoughts" ON public.thoughts
    FOR DELETE USING (auth.uid() = user_id);

-- Thought relationships policies
CREATE POLICY "Users can view own thought relationships" ON public.thought_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.thoughts 
            WHERE id = source_thought_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own thought relationships" ON public.thought_relationships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.thoughts 
            WHERE id = source_thought_id AND user_id = auth.uid()
        )
    );

-- AI interactions policies
CREATE POLICY "Users can view own AI interactions" ON public.ai_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI interactions" ON public.ai_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_thoughts_user_id ON public.thoughts(user_id);
CREATE INDEX idx_thoughts_category ON public.thoughts(category);
CREATE INDEX idx_thoughts_status ON public.thoughts(status);
CREATE INDEX idx_thoughts_workflow_stage ON public.thoughts(workflow_stage);
CREATE INDEX idx_thoughts_created_at ON public.thoughts(created_at);
CREATE INDEX idx_thought_relationships_source ON public.thought_relationships(source_thought_id);
CREATE INDEX idx_thought_relationships_target ON public.thought_relationships(target_thought_id);
CREATE INDEX idx_ai_interactions_user_id ON public.ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_thought_id ON public.ai_interactions(thought_id); 