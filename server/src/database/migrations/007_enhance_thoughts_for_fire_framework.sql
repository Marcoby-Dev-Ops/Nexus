-- Migration: Enhance Thoughts Table for FIRE Framework Initiative Management
-- Adds FIRE framework assessment fields and initiative management capabilities

-- Add FIRE framework fields to thoughts table
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS fire_phase VARCHAR(20) DEFAULT 'focus' CHECK (fire_phase IN ('focus', 'insight', 'roadmap', 'execute')),
ADD COLUMN IF NOT EXISTS fire_assessment JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS initiative_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS estimated_completion DATE,
ADD COLUMN IF NOT EXISTS actual_completion DATE,
ADD COLUMN IF NOT EXISTS blockers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS next_steps TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS success_metrics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS business_impact TEXT,
ADD COLUMN IF NOT EXISTS risk_assessment TEXT,
ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS timeline_estimate VARCHAR(100),
ADD COLUMN IF NOT EXISTS stakeholder_analysis JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resource_requirements JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dependencies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS related_initiatives TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
ADD COLUMN IF NOT EXISTS velocity_score DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS last_assessment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assessment_version INTEGER DEFAULT 1;

-- Add indexes for FIRE framework fields
CREATE INDEX IF NOT EXISTS idx_thoughts_fire_phase ON thoughts(fire_phase);
CREATE INDEX IF NOT EXISTS idx_thoughts_initiative_type ON thoughts(initiative_type);
CREATE INDEX IF NOT EXISTS idx_thoughts_progress_percentage ON thoughts(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_thoughts_confidence_score ON thoughts(confidence_score);
CREATE INDEX IF NOT EXISTS idx_thoughts_estimated_completion ON thoughts(estimated_completion);
CREATE INDEX IF NOT EXISTS idx_thoughts_last_assessment_date ON thoughts(last_assessment_date);

-- Create FIRE assessment history table
CREATE TABLE IF NOT EXISTS fire_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fire_phase VARCHAR(20) NOT NULL CHECK (fire_phase IN ('focus', 'insight', 'roadmap', 'execute')),
    
    -- FIRE framework scores (0-100)
    focus_clarity INTEGER CHECK (focus_clarity >= 0 AND focus_clarity <= 100),
    focus_specificity INTEGER CHECK (focus_specificity >= 0 AND focus_specificity <= 100),
    focus_alignment INTEGER CHECK (focus_alignment >= 0 AND focus_alignment <= 100),
    focus_overall INTEGER CHECK (focus_overall >= 0 AND focus_overall <= 100),
    
    insight_understanding INTEGER CHECK (insight_understanding >= 0 AND insight_understanding <= 100),
    insight_context INTEGER CHECK (insight_context >= 0 AND insight_context <= 100),
    insight_analysis INTEGER CHECK (insight_analysis >= 0 AND insight_analysis <= 100),
    insight_overall INTEGER CHECK (insight_overall >= 0 AND insight_overall <= 100),
    
    roadmap_planning INTEGER CHECK (roadmap_planning >= 0 AND roadmap_planning <= 100),
    roadmap_milestones INTEGER CHECK (roadmap_milestones >= 0 AND roadmap_milestones <= 100),
    roadmap_timeline INTEGER CHECK (roadmap_timeline >= 0 AND roadmap_timeline <= 100),
    roadmap_overall INTEGER CHECK (roadmap_overall >= 0 AND roadmap_overall <= 100),
    
    execution_progress INTEGER CHECK (execution_progress >= 0 AND execution_progress <= 100),
    execution_velocity INTEGER CHECK (execution_velocity >= 0 AND execution_velocity <= 100),
    execution_quality INTEGER CHECK (execution_quality >= 0 AND execution_quality <= 100),
    execution_overall INTEGER CHECK (execution_overall >= 0 AND execution_overall <= 100),
    
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Assessment metadata
    assessment_notes TEXT,
    recommendations TEXT[] DEFAULT '{}',
    questions TEXT[] DEFAULT '{}',
    blockers TEXT[] DEFAULT '{}',
    next_steps TEXT[] DEFAULT '{}',
    
    -- Assessment context
    assessment_context JSONB DEFAULT '{}',
    trigger_event VARCHAR(100),
    conversation_context TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create initiative updates table for tracking changes
CREATE TABLE IF NOT EXISTS initiative_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thought_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN (
        'progress_update', 'phase_change', 'blocker_added', 'blocker_resolved', 
        'next_step_added', 'next_step_completed', 'completion', 'priority_change',
        'deadline_change', 'stakeholder_update', 'resource_update'
    )),
    
    previous_value JSONB,
    new_value JSONB,
    update_description TEXT NOT NULL,
    
    -- FIRE framework context
    fire_phase_before VARCHAR(20),
    fire_phase_after VARCHAR(20),
    progress_before INTEGER,
    progress_after INTEGER,
    
    -- Update metadata
    update_source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'conversation', 'system', 'ai'
    conversation_id UUID REFERENCES ai_conversations(id),
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create initiative relationships table
CREATE TABLE IF NOT EXISTS initiative_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_initiative_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    target_initiative_id UUID NOT NULL REFERENCES thoughts(id) ON DELETE CASCADE,
    
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
        'depends_on', 'blocks', 'enables', 'related_to', 'part_of', 'spawns', 'implements'
    )),
    
    relationship_strength DECIMAL(3,2) DEFAULT 0.5 CHECK (relationship_strength >= 0 AND relationship_strength <= 1),
    relationship_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no duplicate relationships
    UNIQUE(source_initiative_id, target_initiative_id, relationship_type)
);

-- Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_fire_assessments_thought_id ON fire_assessments(thought_id);
CREATE INDEX IF NOT EXISTS idx_fire_assessments_user_id ON fire_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_fire_assessments_fire_phase ON fire_assessments(fire_phase);
CREATE INDEX IF NOT EXISTS idx_fire_assessments_overall_score ON fire_assessments(overall_score);
CREATE INDEX IF NOT EXISTS idx_fire_assessments_created_at ON fire_assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_initiative_updates_thought_id ON initiative_updates(thought_id);
CREATE INDEX IF NOT EXISTS idx_initiative_updates_user_id ON initiative_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_initiative_updates_update_type ON initiative_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_initiative_updates_created_at ON initiative_updates(created_at);

CREATE INDEX IF NOT EXISTS idx_initiative_relationships_source ON initiative_relationships(source_initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_relationships_target ON initiative_relationships(target_initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_relationships_type ON initiative_relationships(relationship_type);

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_fire_assessments_updated_at ON fire_assessments;
CREATE TRIGGER update_fire_assessments_updated_at 
    BEFORE UPDATE ON fire_assessments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_initiative_relationships_updated_at ON initiative_relationships;
CREATE TRIGGER update_initiative_relationships_updated_at 
    BEFORE UPDATE ON initiative_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically calculate FIRE overall scores
CREATE OR REPLACE FUNCTION calculate_fire_overall_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate focus overall
    IF NEW.focus_clarity IS NOT NULL AND NEW.focus_specificity IS NOT NULL AND NEW.focus_alignment IS NOT NULL THEN
        NEW.focus_overall := ROUND((NEW.focus_clarity + NEW.focus_specificity + NEW.focus_alignment) / 3.0);
    END IF;
    
    -- Calculate insight overall
    IF NEW.insight_understanding IS NOT NULL AND NEW.insight_context IS NOT NULL AND NEW.insight_analysis IS NOT NULL THEN
        NEW.insight_overall := ROUND((NEW.insight_understanding + NEW.insight_context + NEW.insight_analysis) / 3.0);
    END IF;
    
    -- Calculate roadmap overall
    IF NEW.roadmap_planning IS NOT NULL AND NEW.roadmap_milestones IS NOT NULL AND NEW.roadmap_timeline IS NOT NULL THEN
        NEW.roadmap_overall := ROUND((NEW.roadmap_planning + NEW.roadmap_milestones + NEW.roadmap_timeline) / 3.0);
    END IF;
    
    -- Calculate execution overall
    IF NEW.execution_progress IS NOT NULL AND NEW.execution_velocity IS NOT NULL AND NEW.execution_quality IS NOT NULL THEN
        NEW.execution_overall := ROUND((NEW.execution_progress + NEW.execution_velocity + NEW.execution_quality) / 3.0);
    END IF;
    
    -- Calculate overall score
    IF NEW.focus_overall IS NOT NULL AND NEW.insight_overall IS NOT NULL AND NEW.roadmap_overall IS NOT NULL AND NEW.execution_overall IS NOT NULL THEN
        NEW.overall_score := ROUND((NEW.focus_overall + NEW.insight_overall + NEW.roadmap_overall + NEW.execution_overall) / 4.0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically calculate FIRE scores
DROP TRIGGER IF EXISTS trigger_calculate_fire_scores ON fire_assessments;
CREATE TRIGGER trigger_calculate_fire_scores
    BEFORE INSERT OR UPDATE ON fire_assessments
    FOR EACH ROW EXECUTE FUNCTION calculate_fire_overall_scores();

-- Create function to update thought's FIRE assessment when new assessment is added
CREATE OR REPLACE FUNCTION update_thought_fire_assessment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the thought's fire_assessment JSONB with the latest assessment
    UPDATE thoughts 
    SET 
        fire_assessment = jsonb_build_object(
            'focus', jsonb_build_object(
                'clarity', NEW.focus_clarity,
                'specificity', NEW.focus_specificity,
                'alignment', NEW.focus_alignment,
                'overall', NEW.focus_overall
            ),
            'insight', jsonb_build_object(
                'understanding', NEW.insight_understanding,
                'context', NEW.insight_context,
                'analysis', NEW.insight_analysis,
                'overall', NEW.insight_overall
            ),
            'roadmap', jsonb_build_object(
                'planning', NEW.roadmap_planning,
                'milestones', NEW.roadmap_milestones,
                'timeline', NEW.roadmap_timeline,
                'overall', NEW.roadmap_overall
            ),
            'execution', jsonb_build_object(
                'progress', NEW.execution_progress,
                'velocity', NEW.execution_velocity,
                'quality', NEW.execution_quality,
                'overall', NEW.execution_overall
            ),
            'overall', NEW.overall_score,
            'confidence', NEW.confidence_score,
            'assessed_at', NEW.created_at
        ),
        fire_phase = NEW.fire_phase,
        confidence_score = NEW.confidence_score,
        progress_percentage = COALESCE(NEW.execution_progress, 0),
        velocity_score = COALESCE(NEW.execution_velocity / 100.0, 0.5),
        quality_score = COALESCE(NEW.execution_quality / 100.0, 0.5),
        last_assessment_date = NEW.created_at,
        assessment_version = thoughts.assessment_version + 1
    WHERE id = NEW.thought_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update thought when new FIRE assessment is added
DROP TRIGGER IF EXISTS trigger_update_thought_fire_assessment ON fire_assessments;
CREATE TRIGGER trigger_update_thought_fire_assessment
    AFTER INSERT OR UPDATE ON fire_assessments
    FOR EACH ROW EXECUTE FUNCTION update_thought_fire_assessment();

-- Add comments for documentation
COMMENT ON TABLE thoughts IS 'Enhanced thoughts table with FIRE framework initiative management capabilities';
COMMENT ON COLUMN thoughts.fire_phase IS 'Current FIRE framework phase: focus, insight, roadmap, execute';
COMMENT ON COLUMN thoughts.fire_assessment IS 'JSONB containing latest FIRE framework assessment scores';
COMMENT ON COLUMN thoughts.progress_percentage IS 'Overall progress percentage (0-100)';
COMMENT ON COLUMN thoughts.confidence_score IS 'Confidence in current assessment (0-1)';

COMMENT ON TABLE fire_assessments IS 'Historical FIRE framework assessments for thoughts/initiatives';
COMMENT ON TABLE initiative_updates IS 'Track changes and updates to initiatives';
COMMENT ON TABLE initiative_relationships IS 'Relationships between different initiatives';
