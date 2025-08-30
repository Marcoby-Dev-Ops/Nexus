-- Enhanced Memory System Database Schema
-- This creates the tables needed for the conversational chatbot with memory

-- User Memories Table
CREATE TABLE IF NOT EXISTS user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('conversation', 'fact', 'preference', 'goal', 'learning')),
    content TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    importance INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    relationships UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Memories Table
CREATE TABLE IF NOT EXISTS conversation_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Contexts Table (for storing user preferences and context)
CREATE TABLE IF NOT EXISTS user_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    context_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON user_memories(type);
CREATE INDEX IF NOT EXISTS idx_user_memories_importance ON user_memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_user_memories_last_accessed ON user_memories(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_user_memories_tags ON user_memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_memories_context ON user_memories USING GIN(context);

CREATE INDEX IF NOT EXISTS idx_conversation_memories_conversation_id ON conversation_memories(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_user_id ON conversation_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memories_memory_data ON conversation_memories USING GIN(memory_data);

CREATE INDEX IF NOT EXISTS idx_user_contexts_user_id ON user_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contexts_context_data ON user_contexts USING GIN(context_data);

-- Full-text search index for memory content
CREATE INDEX IF NOT EXISTS idx_user_memories_content_fts ON user_memories USING GIN(to_tsvector('english', content));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_memories_updated_at 
    BEFORE UPDATE ON user_memories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_memories_updated_at 
    BEFORE UPDATE ON conversation_memories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_contexts_updated_at 
    BEFORE UPDATE ON user_contexts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update access count and last accessed
CREATE OR REPLACE FUNCTION update_memory_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.access_count = OLD.access_count + 1;
    NEW.last_accessed = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update memory access when accessed
CREATE TRIGGER update_memory_access_trigger
    BEFORE UPDATE ON user_memories
    FOR EACH ROW
    WHEN (OLD.access_count IS DISTINCT FROM NEW.access_count)
    EXECUTE FUNCTION update_memory_access();

-- Function to calculate memory importance based on content
CREATE OR REPLACE FUNCTION calculate_memory_importance(
    p_content TEXT,
    p_type VARCHAR(20),
    p_context JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
    importance INTEGER := 5;
    word_count INTEGER;
    has_important_words BOOLEAN;
    has_urgent_context BOOLEAN;
BEGIN
    -- Base importance by type
    CASE p_type
        WHEN 'goal' THEN importance := 8;
        WHEN 'preference' THEN importance := 7;
        WHEN 'fact' THEN importance := 6;
        WHEN 'learning' THEN importance := 7;
        WHEN 'conversation' THEN importance := 5;
        ELSE importance := 5;
    END CASE;
    
    -- Adjust based on content length
    word_count := array_length(string_to_array(p_content, ' '), 1);
    IF word_count > 20 THEN
        importance := importance + 1;
    END IF;
    
    -- Check for important keywords
    has_important_words := (
        p_content ILIKE '%important%' OR 
        p_content ILIKE '%critical%' OR 
        p_content ILIKE '%key%' OR 
        p_content ILIKE '%essential%'
    );
    
    IF has_important_words THEN
        importance := importance + 2;
    END IF;
    
    -- Check for urgent context
    has_urgent_context := (p_context->>'urgent')::BOOLEAN = true;
    IF has_urgent_context THEN
        importance := importance + 2;
    END IF;
    
    -- Ensure importance is within bounds
    RETURN GREATEST(1, LEAST(10, importance));
END;
$$ LANGUAGE plpgsql;

-- Function to find related memories
CREATE OR REPLACE FUNCTION find_related_memories(
    p_user_id UUID,
    p_content TEXT,
    p_type VARCHAR(20)
) RETURNS UUID[] AS $$
DECLARE
    related_ids UUID[] := '{}';
    keyword TEXT;
    memory_record RECORD;
    common_keywords INTEGER;
BEGIN
    -- Extract keywords (simple implementation)
    FOR keyword IN 
        SELECT unnest(string_to_array(lower(p_content), ' ')) 
        WHERE length(unnest) > 3
    LOOP
        FOR memory_record IN 
            SELECT id, content 
            FROM user_memories 
            WHERE user_id = p_user_id 
            AND type = p_type
        LOOP
            -- Count common keywords
            common_keywords := 0;
            FOR keyword2 IN 
                SELECT unnest(string_to_array(lower(memory_record.content), ' ')) 
                WHERE length(unnest) > 3
            LOOP
                IF keyword = keyword2 THEN
                    common_keywords := common_keywords + 1;
                END IF;
            END LOOP;
            
            -- If enough common keywords, add to related
            IF common_keywords >= 2 THEN
                related_ids := array_append(related_ids, memory_record.id);
            END IF;
        END LOOP;
    END LOOP;
    
    -- Return unique IDs, limited to 5
    RETURN (SELECT array_agg(DISTINCT unnest) FROM unnest(related_ids) LIMIT 5);
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_memories
CREATE POLICY "Users can view their own memories" ON user_memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" ON user_memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON user_memories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON user_memories
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for conversation_memories
CREATE POLICY "Users can view their own conversation memories" ON conversation_memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversation memories" ON conversation_memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation memories" ON conversation_memories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation memories" ON conversation_memories
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_contexts
CREATE POLICY "Users can view their own contexts" ON user_contexts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contexts" ON user_contexts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contexts" ON user_contexts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contexts" ON user_contexts
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_memories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_memories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_contexts TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
