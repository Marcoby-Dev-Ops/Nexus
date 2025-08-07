-- Add missing fields to thoughts table to match Thought interface
-- This migration adds all the fields that the TypeScript Thought interface expects

-- Add created_by and updated_by fields
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add personal_or_professional field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS personal_or_professional TEXT DEFAULT 'personal';

-- Add mainsubcategories field (JSONB array)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS mainsubcategories JSONB DEFAULT '[]'::jsonb;

-- Add initiative field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS initiative BOOLEAN DEFAULT false;

-- Add impact field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS impact TEXT;

-- Add parent_idea_id field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS parent_idea_id UUID REFERENCES thoughts(id);

-- Add workflow_stage field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'concept';

-- Add department field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add priority field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';

-- Add estimated_effort field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS estimated_effort TEXT;

-- Add ai_clarification_data field (JSONB)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS ai_clarification_data JSONB;

-- Add aiinsights field (JSONB)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS aiinsights JSONB;

-- Add interaction_method field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS interaction_method TEXT;

-- Add company_id field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add tags field (JSONB array)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add attachments field (JSONB array)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Add visibility field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';

-- Add collaboration_status field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS collaboration_status TEXT DEFAULT 'individual';

-- Add review_status field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending';

-- Add approval_status field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add implementation_notes field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS implementation_notes TEXT;

-- Add success_metrics field (JSONB)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS success_metrics JSONB;

-- Add risk_assessment field (JSONB)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS risk_assessment JSONB;

-- Add cost_estimate field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(10,2);

-- Add timeline_estimate field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS timeline_estimate TEXT;

-- Add stakeholder_analysis field (JSONB)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS stakeholder_analysis JSONB;

-- Add resource_requirements field (JSONB)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS resource_requirements JSONB;

-- Add dependencies field (JSONB array)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;

-- Add related_thoughts field (JSONB array)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS related_thoughts JSONB DEFAULT '[]'::jsonb;

-- Add version field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add is_template field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Add template_category field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS template_category TEXT;

-- Add usage_count field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Add rating field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2);

-- Add feedback field (JSONB)
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS feedback JSONB;

-- Add last_activity field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE;

-- Add completion_date field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;

-- Add archived field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Add archive_date field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS archive_date TIMESTAMP WITH TIME ZONE;

-- Add archive_reason field
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS archive_reason TEXT;

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can view their own thoughts" ON thoughts;
CREATE POLICY "Users can view their own thoughts" ON thoughts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own thoughts" ON thoughts;
CREATE POLICY "Users can insert their own thoughts" ON thoughts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own thoughts" ON thoughts;
CREATE POLICY "Users can update their own thoughts" ON thoughts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own thoughts" ON thoughts;
CREATE POLICY "Users can delete their own thoughts" ON thoughts
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_category ON thoughts(category);
CREATE INDEX IF NOT EXISTS idx_thoughts_status ON thoughts(status);
CREATE INDEX IF NOT EXISTS idx_thoughts_workflow_stage ON thoughts(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_thoughts_company_id ON thoughts(company_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_parent_idea_id ON thoughts(parent_idea_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at);
CREATE INDEX IF NOT EXISTS idx_thoughts_updated_at ON thoughts(updated_at);
CREATE INDEX IF NOT EXISTS idx_thoughts_archived ON thoughts(archived);

-- Create GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_thoughts_mainsubcategories ON thoughts USING GIN (mainsubcategories);
CREATE INDEX IF NOT EXISTS idx_thoughts_tags ON thoughts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_thoughts_attachments ON thoughts USING GIN (attachments);
CREATE INDEX IF NOT EXISTS idx_thoughts_dependencies ON thoughts USING GIN (dependencies);
CREATE INDEX IF NOT EXISTS idx_thoughts_related_thoughts ON thoughts USING GIN (related_thoughts);
